import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../models/user.model.js';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

  if (!token) {
    response.status(401).json({ success: false, message: 'Authentication token is required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (
      typeof payload === 'string' ||
      typeof payload.id !== 'string' ||
      typeof payload.email !== 'string' ||
      !isUserRole(payload.role)
    ) {
      response.status(401).json({ success: false, message: 'Authentication token is invalid or expired.' });
      return;
    }

    request.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    response.status(401).json({ success: false, message: 'Authentication token is invalid or expired.' });
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      response.status(401).json({ success: false, message: 'Authentication token is required.' });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      response.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
      return;
    }

    next();
  };
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'].includes(value);
}
