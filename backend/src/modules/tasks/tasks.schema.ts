import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title:       z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    status:      z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    priority:    z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate:     z.string().datetime({ offset: true }).optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title:       z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    status:      z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    priority:    z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate:     z.string().datetime({ offset: true }).optional().nullable(),
  }),
});

export const taskQuerySchema = z.object({
  query: z.object({
    status:   z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    page:     z.coerce.number().int().positive().default(1),
    limit:    z.coerce.number().int().positive().max(100).default(10),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type TaskQuery       = z.infer<typeof taskQuerySchema>['query'];
