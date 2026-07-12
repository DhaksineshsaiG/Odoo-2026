import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

  if (!token) {
    response.status(401).json({ message: 'Authentication token is required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthenticatedRequest['user'];
    request.user = payload;
    next();
  } catch {
    response.status(401).json({ message: 'Authentication token is invalid or expired.' });
  }
}
