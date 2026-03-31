import { Router } from 'express';
import multer from 'multer';
import { authenticate, checkActive, requireRole } from '../../middleware/auth';
import {
  handleCreateStudent,
  handleDeactivateStudent,
  handleImportStudents,
  handleListStudents,
  handleUpdateStudent,
} from './students.controller';
import { validate } from '../../middleware/validate';
import {
  createStudentSchema,
  listStudentsSchema,
  studentIdParamSchema,
  updateStudentSchema,
} from './students.schema';

const router = Router();

// Multer — store CSV in memory (max 2MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// All routes below require: valid JWT + active account + admin role
const adminGuard = [authenticate, checkActive, requireRole('admin')];

// GET  /api/v1/dept/students
router.get('/', ...adminGuard, validate(listStudentsSchema, 'query'), handleListStudents);

// POST /api/v1/dept/students/import  (must be before /:id routes)
router.post('/import', ...adminGuard, upload.single('file'), handleImportStudents);

// POST /api/v1/dept/students
router.post('/', ...adminGuard, validate(createStudentSchema), handleCreateStudent);

// PUT  /api/v1/dept/students/:id
router.put(
  '/:id',
  ...adminGuard,
  validate(studentIdParamSchema, 'params'),
  validate(updateStudentSchema, 'body'),
  handleUpdateStudent
);

// PATCH /api/v1/dept/students/:id/deactivate
router.patch(
  '/:id/deactivate',
  ...adminGuard,
  validate(studentIdParamSchema, 'params'),
  handleDeactivateStudent
);

export default router;
