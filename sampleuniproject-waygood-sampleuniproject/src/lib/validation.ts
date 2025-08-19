import { z } from 'zod';

// Course validation schemas
export const CourseCreateSchema = z.object({
  course_id: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  instructor: z.string().min(1, 'Instructor is required'),
  duration: z.string().min(1, 'Duration is required'),
  price: z.string().min(1, 'Price is required'),
  rating: z.number().min(0).max(5, 'Rating must be between 0 and 5'),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced'])
});

export const CourseUpdateSchema = CourseCreateSchema.partial();

// Search validation schemas
export const CourseSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  min_rating: z.number().min(0).max(5).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// User validation schemas
export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin']).default('admin')
});

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// File upload validation
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).default(['text/csv'])
});

// API response schemas
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
  timestamp: z.string().optional()
});

export const ApiSuccessSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
  data: z.any().optional(),
  timestamp: z.string().optional()
});

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}
// Function to create error response
export function createErrorResponse(message: string, details?: string, code?: string) {
  return {
    error: message,
    details,
    code,
    timestamp: new Date().toISOString()
  };
}
// Function to create success response
export function createSuccessResponse(data?: any, message?: string) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}
