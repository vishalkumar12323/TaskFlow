import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);
export const taskStatusEnum = pgEnum('task_status', ['TODO', 'IN_PROGRESS', 'DONE']);
export const priorityEnum = pgEnum('priority', ['LOW', 'MEDIUM', 'HIGH']);

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:        uuid('id').defaultRandom().primaryKey(),
  email:     text('email').notNull().unique(),
  username:  text('username').notNull().unique(),
  password:  text('password').notNull(),
  role:      roleEnum('role').default('USER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const tasks = pgTable('tasks', {
  id:          uuid('id').defaultRandom().primaryKey(),
  title:       text('title').notNull(),
  description: text('description'),
  status:      taskStatusEnum('status').default('TODO').notNull(),
  priority:    priorityEnum('priority').default('MEDIUM').notNull(),
  dueDate:     timestamp('due_date'),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
}));

// ─── Type Inference ──────────────────────────────────────────────────────────
export type User        = typeof users.$inferSelect;
export type NewUser     = typeof users.$inferInsert;
export type Task        = typeof tasks.$inferSelect;
export type NewTask     = typeof tasks.$inferInsert;
