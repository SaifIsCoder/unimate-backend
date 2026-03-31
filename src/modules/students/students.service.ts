import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase';
import { AppError } from '../../shared/errors';
import type {
  CreateStudentInput,
  CsvStudentRow,
  ListStudentsInput,
  UpdateStudentInput,
} from './students.schema';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface StudentRow {
  id: string;
  user_id: string;
  roll_number: string;
  program: string;
  semester: number;
  session_type: string;
  batch_year: number;
  cgpa: number;
  cgpa_status: string;
  target_gpa: number | null;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
  // joined from users
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

export interface CsvImportReport {
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: { row: number; roll_number: string; error: string }[];
}

// -------------------------------------------------------------------
// LIST students with search + filters + pagination
// -------------------------------------------------------------------

export async function listStudents(input: ListStudentsInput): Promise<{
  data: StudentRow[];
  total: number;
  page: number;
  limit: number;
}> {
  const { search, program, semester, session_type, page, limit } = input;
  const offset = (page - 1) * limit;

  // We join users into students using Supabase's select syntax
  let query = supabase
    .from('students')
    .select(
      `
      id,
      user_id,
      roll_number,
      program,
      semester,
      session_type,
      batch_year,
      cgpa,
      cgpa_status,
      target_gpa,
      fcm_token,
      created_at,
      updated_at,
      users!inner (
        name,
        email,
        phone,
        is_active
      )
    `,
      { count: 'exact' }
    )
    .eq('users.is_active', true); // only active students

  // Filters
  if (program) {
    query = query.ilike('program', `%${program}%`);
  }
  if (semester !== undefined) {
    query = query.eq('semester', semester);
  }
  if (session_type) {
    query = query.eq('session_type', session_type);
  }

  // Search across name, email, roll_number
  if (search) {
    query = query.or(
      `roll_number.ilike.%${search}%,users.name.ilike.%${search}%,users.email.ilike.%${search}%`
    );
  }

  // Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new AppError(error.message, 500);

  // Flatten the nested users join into a flat object
  const flattened: StudentRow[] = (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    roll_number: row.roll_number,
    program: row.program,
    semester: row.semester,
    session_type: row.session_type,
    batch_year: row.batch_year,
    cgpa: row.cgpa,
    cgpa_status: row.cgpa_status,
    target_gpa: row.target_gpa,
    fcm_token: row.fcm_token,
    created_at: row.created_at,
    updated_at: row.updated_at,
    name: row.users.name,
    email: row.users.email,
    phone: row.users.phone ?? null,
    is_active: row.users.is_active,
  }));

  return {
    data: flattened,
    total: count ?? 0,
    page,
    limit,
  };
}

// -------------------------------------------------------------------
// CREATE a single student
// 1. Check duplicate email in users
// 2. Check duplicate roll_number in students
// 3. Insert into users (role = student, password = hashed roll_number)
// 4. Insert into students
// -------------------------------------------------------------------

export async function createStudent(
  input: CreateStudentInput,
  adminUserId: string
): Promise<StudentRow> {
  const { name, email, roll_number, program, semester, session_type, batch_year } =
    input;

  // 1. Check duplicate email
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new AppError(`Email ${email} is already registered`, 409);
  }

  // 2. Check duplicate roll_number
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('roll_number', roll_number)
    .single();

  if (existingStudent) {
    throw new AppError(`Roll number ${roll_number} already exists`, 409);
  }

  // 3. Hash password = roll_number
  const password_hash = await bcrypt.hash(roll_number, 12);

  // 4. Insert into users
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      name,
      email,
      password_hash,
      role: 'student',
      is_active: true,
    })
    .select('id')
    .single();

  if (userError || !newUser) {
    throw new AppError(`Failed to create user: ${userError?.message}`, 500);
  }

  // 5. Insert into students
  const { data: newStudent, error: studentError } = await supabase
    .from('students')
    .insert({
      user_id: newUser.id,
      roll_number,
      program,
      semester,
      session_type,
      batch_year,
    })
    .select('*')
    .single();

  if (studentError || !newStudent) {
    // Rollback: delete the user we just created
    await supabase.from('users').delete().eq('id', newUser.id);
    throw new AppError(`Failed to create student: ${studentError?.message}`, 500);
  }

  return {
    ...newStudent,
    name,
    email,
    phone: null,
    is_active: true,
  };
}

// -------------------------------------------------------------------
// BULK CSV IMPORT
// Validates each row individually.
// Valid rows are inserted; invalid rows are reported with row number.
// Already-existing emails/roll_numbers are treated as errors per row.
// -------------------------------------------------------------------

export async function importStudentsFromCsv(
  rows: CsvStudentRow[],
  adminUserId: string
): Promise<CsvImportReport> {
  if (rows.length === 0) {
    throw new AppError('CSV file is empty', 400);
  }

  const report: CsvImportReport = {
    total_rows: rows.length,
    success_count: 0,
    error_count: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // +1 for 0-based index, +1 for header row in file
    const rowNumberInFile = i + 2;

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', row.email)
        .single();

      if (existingUser) throw new Error(`Email ${row.email} is already registered`);

      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('roll_number', row.roll_number)
        .single();

      if (existingStudent) throw new Error(`Roll number ${row.roll_number} already exists`);

      const password_hash = await bcrypt.hash(row.roll_number, 12);

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          name: row.name,
          email: row.email,
          password_hash,
          role: 'student',
        })
        .select('id')
        .single();

      if (userError || !newUser) throw new Error(`Failed to create user: ${userError?.message}`);

      const { error: studentError } = await supabase.from('students').insert({
        user_id: newUser.id,
        roll_number: row.roll_number,
        program: row.program,
        semester: row.semester,
        session_type: row.session_type,
        batch_year: row.batch_year,
      });

      if (studentError) {
        await supabase.from('users').delete().eq('id', newUser.id);
        throw new Error(`Failed to create student: ${studentError.message}`);
      }

      report.success_count++;
    } catch (err: any) {
      report.error_count++;
      report.errors.push({
        row: rowNumberInFile,
        roll_number: row.roll_number,
        error: err.message ?? 'Unexpected error',
      });
    }
  }

  return report;
}

// -------------------------------------------------------------------
// UPDATE student — email, phone, password only (users table)
// :id is students.id
// -------------------------------------------------------------------

export async function updateStudent(
  studentId: string,
  input: UpdateStudentInput
): Promise<{ message: string }> {
  // Resolve user_id from student id
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .single();

  if (fetchError || !student) {
    throw new AppError('Student not found', 404);
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (input.email) {
    // Check email not taken by another user
    const { data: taken } = await supabase
      .from('users')
      .select('id')
      .eq('email', input.email)
      .neq('id', student.user_id)
      .single();

    if (taken) throw new AppError(`Email ${input.email} is already in use`, 409);

    updates.email = input.email;
  }

  if (input.phone !== undefined) {
    updates.phone = input.phone;
  }

  if (input.password) {
    updates.password_hash = await bcrypt.hash(input.password, 12);
  }

  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', student.user_id);

  if (updateError) {
    throw new AppError(`Failed to update student: ${updateError.message}`, 500);
  }

  return { message: 'Student updated successfully' };
}

// -------------------------------------------------------------------
// DEACTIVATE student — soft delete via users.is_active = false
// :id is students.id
// -------------------------------------------------------------------

export async function deactivateStudent(
  studentId: string
): Promise<{ message: string }> {
  // Resolve user_id
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .single();

  if (fetchError || !student) {
    throw new AppError('Student not found', 404);
  }

  // Check not already deactivated
  const { data: user } = await supabase
    .from('users')
    .select('is_active')
    .eq('id', student.user_id)
    .single();

  if (user && !user.is_active) {
    throw new AppError('Student is already deactivated', 409);
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', student.user_id);

  if (updateError) {
    throw new AppError(`Failed to deactivate student: ${updateError.message}`, 500);
  }

  return { message: 'Student deactivated successfully' };
}
