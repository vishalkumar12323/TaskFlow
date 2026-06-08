import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../../middleware/error.middleware';
import { z } from 'zod';

export const getAllUsers = async () => {
  return db
    .select({ id: users.id, email: users.email, username: users.username, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(users.createdAt);
};

const roleUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export const updateUserRole = async (targetUserId: string, requesterId: string, body: unknown) => {
  if (targetUserId === requesterId) throw new AppError('Admins cannot change their own role', 400);

  const { role } = roleUpdateSchema.parse(body);

  const [existing] = await db.select().from(users).where(eq(users.id, targetUserId));
  if (!existing) throw new AppError('User not found', 404);

  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, targetUserId))
    .returning({ id: users.id, email: users.email, username: users.username, role: users.role });

  return updated;
};
