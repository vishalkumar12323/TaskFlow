import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email:    z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput    = z.infer<typeof loginSchema>['body'];
