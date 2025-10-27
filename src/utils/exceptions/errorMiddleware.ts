import { Request, Response, NextFunction } from 'express';
import { HttpException } from './httpException';

export function errorMiddleware(err: Error,req: Request,res: Response,next: NextFunction) {
  
  console.error(err);
  if (err instanceof HttpException) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}