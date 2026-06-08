import { Request, Response, NextFunction } from 'express';
import { getAllUsers, updateUserRole } from './admin.service';

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allUsers = await getAllUsers();
    res.status(200).json({ success: true, data: allUsers });
  } catch (err) { next(err); }
};

export const changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await updateUserRole(req.params.id, req.user!.userId, req.body);
    res.status(200).json({ success: true, data: updated, message: 'User role updated successfully' });
  } catch (err) { next(err); }
};
