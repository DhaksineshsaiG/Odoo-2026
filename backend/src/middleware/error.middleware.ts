import type { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;

  response.status(statusCode).json({
    message: statusCode === 500 ? 'Internal server error' : error.message,
  });
};
