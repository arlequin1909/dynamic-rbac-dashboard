import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

const _VALIDATION_STATUS = 400;
const _UNAUTHORIZED_STATUS = 401;
const _FORBIDDEN_STATUS = 403;
const _NOT_FOUND_STATUS = 404;
const _CONFLICT_STATUS = 409;
const _RATE_LIMITED_STATUS = 429;
const _INTERNAL_ERROR_STATUS = 500;

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = _VALIDATION_STATUS;
  readonly code = 'validation_error';

  constructor(message = 'Validation failed') {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = _UNAUTHORIZED_STATUS;
  readonly code = 'unauthorized';

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = _FORBIDDEN_STATUS;
  readonly code = 'forbidden';

  constructor(message = 'Forbidden') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = _NOT_FOUND_STATUS;
  readonly code = 'not_found';

  constructor(message = 'Not found') {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = _CONFLICT_STATUS;
  readonly code = 'conflict';

  constructor(message = 'Conflict') {
    super(message);
  }
}

export class RateLimitedError extends AppError {
  readonly statusCode = _RATE_LIMITED_STATUS;
  readonly code = 'rate_limited';

  constructor(message = 'Rate limit exceeded') {
    super(message);
  }
}

interface ErrorLogPayload {
  timestamp: string;
  path: string;
  method: string;
  message: string;
  stack?: string;
}

function logUnexpectedError(error: Error, req: Request): void {
  const payload: ErrorLogPayload = {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    message: error.message,
    stack: error.stack,
  };

  console.error(JSON.stringify(payload));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  let result: Response;

  if (err instanceof ZodError) {
    result = res.status(_VALIDATION_STATUS).json({ error: 'validation_error', issues: err.issues });
  } else if (err instanceof AppError) {
    result = res.status(err.statusCode).json({ error: err.code, message: err.message });
  } else {
    logUnexpectedError(err instanceof Error ? err : new Error(String(err)), req);
    result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
  }

  return result;
}
