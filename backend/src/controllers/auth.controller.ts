import type { Request, Response } from 'express';
import { getCurrentUser, loginUser } from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function login(request: Request, response: Response) {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim() : '';
  const password = typeof request.body?.password === 'string' ? request.body.password : '';

  if (!isValidEmail(email) || password.length === 0) {
    response.status(400).json({ message: 'Please provide a valid email address and password.' });
    return;
  }

  try {
    const session = await loginUser(email, password);
    response.status(200).json(session);
  } catch (error) {
    const statusCode = getStatusCode(error);
    response.status(statusCode).json({ message: getSafeMessage(error, statusCode) });
  }
}

export async function getMe(request: AuthenticatedRequest, response: Response) {
  try {
    const user = await getCurrentUser(request.user!.id);
    response.status(200).json({ user });
  } catch (error) {
    const statusCode = getStatusCode(error);
    response.status(statusCode).json({ message: getSafeMessage(error, statusCode) });
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStatusCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number'
    ? error.statusCode
    : 500;
}

function getSafeMessage(error: unknown, statusCode: number) {
  if (statusCode === 500) {
    return 'Unable to process your request right now.';
  }

  return error instanceof Error ? error.message : 'Unable to process your request.';
}
