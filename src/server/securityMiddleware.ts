import { Request, Response, NextFunction } from 'express';
import { apmTracker } from './apmTracker.js';

// Configurable Admin Token
export const ADMIN_AUTH_TOKEN = process.env.HEALTH_ADMIN_TOKEN;

/**
 * Admin Authentication Middleware
 * Enforces strict bearer token or x-admin-key validation on sensitive endpoints like /api/health/deep
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-admin-key'];

  let providedToken = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.substring(7).trim();
  } else if (typeof customHeader === 'string') {
    providedToken = customHeader.trim();
  }

  const isValid = Boolean(ADMIN_AUTH_TOKEN) && providedToken === ADMIN_AUTH_TOKEN;

  if (!isValid) {
    res.status(401).json({
      error: 'Unauthorized Access',
      message: 'Admin authentication required to access deep diagnostic telemetry.',
      required_auth: 'Provide a valid Bearer token or X-Admin-Key header.',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}


/**
 * Row-Level Security (RLS) & IDOR Protection Middleware
 * Verifies that a student can only query/modify their own records,
 * and only teachers/advisors can access multiple student records.
 */
export function enforceRowLevelSecurity(req: Request, res: Response, next: NextFunction): void {
  const targetStudentId = req.params.studentId || req.query.studentId || req.body?.studentId;
  const userRole = req.headers['x-user-role'] as string | undefined;
  const authenticatedUserId = req.headers['x-authenticated-id'] as string | undefined;

  if (!targetStudentId) {
    return next();
  }

  if (userRole === 'teacher' || userRole === 'admin') {
    return next();
  }

  if (userRole === 'student') {
    if (!authenticatedUserId || authenticatedUserId !== targetStudentId) {
      res.status(403).json({
        error: 'Forbidden - IDOR Violation Prevented',
        message: 'Access denied: Students are restricted by Row-Level Security to their own academic records.',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    return next();
  }

  res.status(403).json({
    error: 'Forbidden - Missing Role Context',
    message: 'Access denied: Student-scoped requests require a verified role and authenticated identity.',
    timestamp: new Date().toISOString(),
  });
}


/**
 * Maximum HTTP Security Headers Middleware
 * Implements HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
 */
export function applySecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Strict-Transport-Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Content-Security-Policy
  // Note: We allow 'self' and preview container host so the app functions within Google AI Studio preview iframe,
  // while blocking arbitrary untrusted script injection.
  // Vite injects a React refresh preamble only in development; keep production CSP strict.
  const scriptSources = [
    "script-src 'self'",
    ...(process.env.NODE_ENV === 'production' ? [] : ["'unsafe-inline'"]),
    'https://apis.google.com',
    'https://accounts.google.com',
  ];
  const cspDirectives = [
    "default-src 'self'",
    scriptSources.join(' '),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss: ws:",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // Cross-Origin-Opener-Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  next();
}

/**
 * Global Exception Handling & Error Tracking Middleware
 * Captures failed queries, unhandled errors, logs to APM, and sanitizes output
 */
export function globalErrorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const isDbError = err.message.toLowerCase().includes('sql') ||
                    err.message.toLowerCase().includes('database') ||
                    err.message.toLowerCase().includes('connection');

  // Record error in APM Tracker
  apmTracker.triggerAlert({
    type: isDbError ? 'DB_TIMEOUT_SPIKE' : 'CIRCUIT_BREAKER',
    severity: 'critical',
    message: `Unhandled exception in ${req.method} ${req.path}: ${err.message}`,
    details: {
      path: req.path,
      method: req.method,
      errorName: err.name,
      isDbError,
    },
  });

  console.error(`[CRITICAL ERROR] [${req.method} ${req.path}]:`, err);

  const statusCode = (res.statusCode && res.statusCode >= 400) ? res.statusCode : 500;

  // Sanitize error response: never leak internal stack traces or database connection strings
  res.status(statusCode).json({
    error: isDbError ? 'Database Operation Failed' : 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. The incident has been recorded in the APM audit log.'
      : err.message,
    statusCode,
    incidentId: `inc_${Date.now()}`,
    timestamp: new Date().toISOString(),
  });
}
