import { z } from 'zod';

// -------------------------------------------------------------------
// Shared enums
// -------------------------------------------------------------------

export const sessionTypeEnum = z.enum(['regular', 'self_support', 'intake']);

// -------------------------------------------------------------------
// GET /dept/students — query params for list + search + filter
// -------------------------------------------------------------------

export const listStudentsSchema = z.object({
  search: z.string().optional(),        // searches name, email, roll_number
  program: z.string().optional(),       // e.g. BSIT
  semester: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(8).optional()),
  session_type: sessionTypeEnum.optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

export type ListStudentsInput = z.infer<typeof listStudentsSchema>;

// -------------------------------------------------------------------
// POST /dept/students — create a single student
// Creates a user row + students row in one transaction
// Initial password = roll_number (auto-hashed in service)
// -------------------------------------------------------------------

export const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  roll_number: z.string().min(3, 'Roll number is required').max(50),
  program: z.string().min(2).max(50),
  semester: z.number().int().min(1).max(8),
  session_type: sessionTypeEnum,
  batch_year: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear() + 1),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

// -------------------------------------------------------------------
// POST /dept/students/import — bulk CSV import
// CSV columns: name, email, roll_number, program, semester,
//              session_type, batch_year
// Each row is validated individually; errors reported per row
// -------------------------------------------------------------------

export const csvStudentRowSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email('Invalid email'),
  roll_number: z.string().min(3).max(50),
  program: z.string().min(2).max(50),
  semester: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(8)),
  session_type: sessionTypeEnum,
  batch_year: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2000).max(new Date().getFullYear() + 1)),
});

export type CsvStudentRow = z.infer<typeof csvStudentRowSchema>;

// -------------------------------------------------------------------
// PUT /dept/students/:id — edit student
// Only email, phone, password are updatable (on users table)
// roll_number, program, semester etc are NOT editable here
// -------------------------------------------------------------------

export const updateStudentSchema = z
  .object({
    email: z.string().email('Invalid email address').optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
      .optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional(),
  })
  .refine(
    (data) =>
      data.email !== undefined ||
      data.phone !== undefined ||
      data.password !== undefined,
    { message: 'At least one field (email, phone, password) must be provided' }
  );

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// -------------------------------------------------------------------
// PATCH /dept/students/:id/deactivate — soft delete
// No body required — just the :id param
// Sets users.is_active = false
// -------------------------------------------------------------------

export const studentIdParamSchema = z.object({
  id: z.string().uuid('Invalid student ID'),
});

export type StudentIdParam = z.infer<typeof studentIdParamSchema>;
