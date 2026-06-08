import { db } from '../../db';
import { tasks } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AppError } from '../../middleware/error.middleware';
import { CreateTaskInput, UpdateTaskInput, TaskQuery } from './tasks.schema';

export const getTasks = async (userId: string, role: 'USER' | 'ADMIN', query: TaskQuery) => {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];
  if (role !== 'ADMIN') conditions.push(eq(tasks.userId, userId));
  if (query.status)     conditions.push(eq(tasks.status, query.status));
  if (query.priority)   conditions.push(eq(tasks.priority, query.priority));

  const rows = await db
    .select()
    .from(tasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset);

  return { tasks: rows, page, limit };
};

export const getTaskById = async (id: string, userId: string, role: 'USER' | 'ADMIN') => {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) throw new AppError('Task not found', 404);
  if (role !== 'ADMIN' && task.userId !== userId) throw new AppError('Forbidden', 403);
  return task;
};

export const createTask = async (userId: string, input: CreateTaskInput) => {
  const [task] = await db
    .insert(tasks)
    .values({
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      userId,
    })
    .returning();
  return task;
};

export const updateTask = async (id: string, userId: string, role: 'USER' | 'ADMIN', input: UpdateTaskInput) => {
  // Verify ownership first
  await getTaskById(id, userId, role);

  const [updated] = await db
    .update(tasks)
    .set({
      ...input,
      dueDate:   input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();

  return updated;
};

export const deleteTask = async (id: string, userId: string, role: 'USER' | 'ADMIN') => {
  // Verify ownership first
  await getTaskById(id, userId, role);
  await db.delete(tasks).where(eq(tasks.id, id));
};
