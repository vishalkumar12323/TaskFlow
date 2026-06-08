import { Request, Response, NextFunction } from 'express';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from './tasks.schema';
import { getTasks, getTaskById, createTask, updateTask, deleteTask } from './tasks.service';

export const listTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = taskQuerySchema.parse({ query: req.query });
    const result    = await getTasks(req.user!.userId, req.user!.role, query);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await getTaskById(req.params.id, req.user!.userId, req.user!.role);
    res.status(200).json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = createTaskSchema.parse({ body: req.body });
    const task     = await createTask(req.user!.userId, body);
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = updateTaskSchema.parse({ body: req.body });
    const task     = await updateTask(req.params.id, req.user!.userId, req.user!.role, body);
    res.status(200).json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteTask(req.params.id, req.user!.userId, req.user!.role);
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (err) { next(err); }
};
