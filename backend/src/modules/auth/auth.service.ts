import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput } from './auth.schema';

export const registerUser = async (input: RegisterInput) => {
  // Check for existing email or username
  const [existingEmail] = await db.select().from(users).where(eq(users.email, input.email));
  if (existingEmail) throw new AppError('Email is already registered', 409);

  const [existingUsername] = await db.select().from(users).where(eq(users.username, input.username));
  if (existingUsername) throw new AppError('Username is already taken', 409);

  const hashedPassword = await hashPassword(input.password);

  const [newUser] = await db
    .insert(users)
    .values({ email: input.email, username: input.username, password: hashedPassword })
    .returning({ id: users.id, email: users.email, username: users.username, role: users.role, createdAt: users.createdAt });

  const token = signToken({ userId: newUser.id, role: newUser.role });
  return { user: newUser, token };
};

export const loginUser = async (input: LoginInput) => {
  const [user] = await db.select().from(users).where(eq(users.email, input.email));
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await comparePassword(input.password, user.password);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const token = signToken({ userId: user.id, role: user.role });

  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
};

export const getCurrentUser = async (userId: string) => {
  const [user] = await db
    .select({ id: users.id, email: users.email, username: users.username, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) throw new AppError('User not found', 404);
  return user;
};
