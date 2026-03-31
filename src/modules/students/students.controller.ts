import type { Request, Response, NextFunction } from 'express';
import { parse as csvParse } from 'csv-parse/sync';
import { sendSuccess, sendError } from '../../shared/response';
import {
  listStudentsSchema,
  createStudentSchema,
  csvStudentRowSchema,
  updateStudentSchema,
  studentIdParamSchema,
} from './students.schema';
import type { CsvStudentRow } from './students.schema';
import {
  listStudents,
  createStudent,
  importStudentsFromCsv,
  updateStudent,
  deactivateStudent,
} from './students.service';

// -------------------------------------------------------------------
// GET /dept/students
// -------------------------------------------------------------------

export async function handleListStudents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listStudentsSchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, 'Invalid query parameters', 400);
      return;
    }

    const result = await listStudents(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------------
// POST /dept/students
// -------------------------------------------------------------------

export async function handleCreateStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.issues[0].message, 400);
      return;
    }

    const adminUserId = (req as any).user.userId;
    const student = await createStudent(parsed.data, adminUserId);
    sendSuccess(res, student, 201);
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------------
// POST /dept/students/import
// Accepts multipart/form-data with field name "file" (CSV)
// OR raw CSV text in req.body.csv
// -------------------------------------------------------------------

export async function handleImportStudents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let csvText: string;

    if (req.file) {
      csvText = req.file.buffer.toString('utf-8');
    } else if (req.body?.csv) {
      csvText = req.body.csv;
    } else {
      sendError(res, 'No CSV data provided. Send a file field named "file" or a csv text field.', 400);
      return;
    }

    // Parse CSV
    let rawRows: Record<string, string>[];
    try {
      rawRows = csvParse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr: any) {
      sendError(res, `CSV parse error: ${parseErr.message}`, 400);
      return;
    }

    if (rawRows.length === 0) {
      sendError(res, 'CSV file is empty', 400);
      return;
    }

    // Validate each row individually with Zod
    const validRows: CsvStudentRow[] = [];
    const validationErrors: { row: number; roll_number: string; error: string }[] = [];

    rawRows.forEach((raw, index) => {
      const rowNumber = index + 1;
      const result = csvStudentRowSchema.safeParse(raw);
      if (result.success) {
        validRows.push(result.data);
      } else {
        validationErrors.push({
          row: rowNumber,
          roll_number: raw.roll_number ?? 'unknown',
          error: result.error.issues.map((e) => e.message).join(', '),
        });
      }
    });

    const adminUserId = (req as any).user.userId;
    const importResult = await importStudentsFromCsv(validRows, adminUserId);

    const allErrors = [
      ...validationErrors,
      ...importResult.errors,
    ];

    sendSuccess(res, {
      total_rows: rawRows.length,
      success_count: importResult.success_count,
      error_count: importResult.error_count + validationErrors.length,
      errors: allErrors,
    }, 207);
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------------
// PUT /dept/students/:id
// -------------------------------------------------------------------

export async function handleUpdateStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paramParsed = studentIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      sendError(res, 'Invalid student ID', 400);
      return;
    }

    const bodyParsed = updateStudentSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendError(res, bodyParsed.error.issues[0].message, 400);
      return;
    }

    const result = await updateStudent(paramParsed.data.id, bodyParsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------------
// PATCH /dept/students/:id/deactivate
// -------------------------------------------------------------------

export async function handleDeactivateStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = studentIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendError(res, 'Invalid student ID', 400);
      return;
    }

    const result = await deactivateStudent(parsed.data.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
