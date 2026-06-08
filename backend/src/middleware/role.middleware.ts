import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: Array<'USER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized', message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error:   'Forbidden',
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
