import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import { registerUser, loginUser, getCurrentUser } from './auth.service';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = registerSchema.parse({ body: req.body });
    const result   = await registerUser(body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = loginSchema.parse({ body: req.body });
    const result   = await loginUser(body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getCurrentUser(req.user!.userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
