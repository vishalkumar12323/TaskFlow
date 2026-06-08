import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error:   'Validation Error',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error:   err.message,
    });
    return;
  }

  // Postgres unique constraint
  if ((err as any).code === '23505') {
    res.status(409).json({
      success: false,
      error:   'Conflict',
      message: 'A record with that value already exists',
    });
    return;
  }

  // Fallback — unknown error
  logger.error('Unhandled error', { message: err.message, stack: err.stack, url: req.url });
  res.status(500).json({
    success: false,
    error:   'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};
