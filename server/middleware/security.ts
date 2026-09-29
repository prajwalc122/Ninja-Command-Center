import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { securityLogger } from '../services/securityLogger';

// Generate or retrieve persistent JWT secret at runtime
let runtimeSecret = process.env.JWT_SECRET;
if (!runtimeSecret || runtimeSecret.length < 32) {
  // If not provided or too short, generate a 64-character high-entropy secret
  runtimeSecret = crypto.randomBytes(32).toString('hex');
  if (process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY WARNING] JWT_SECRET was not provided in environment. Generated dynamic ephemeral secret.');
  }
}
export const JWT_SECRET_KEY = runtimeSecret;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// -------------------------------------------------------------
// 1. HTTPS ENFORCER MIDDLEWARE
// -------------------------------------------------------------
export function enforceHttps(req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  const proto = req.headers['x-forwarded-proto'];

  if (
    isProduction &&
    proto === 'http' &&
    req.headers.host &&
    !req.headers.host.includes('localhost') &&
    !req.headers.host.includes('127.0.0.1')
  ) {
    securityLogger.log({
      eventType: 'HTTPS_REDIRECT',
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      details: { url: req.originalUrl },
    });
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  // Set HSTS header on secure requests
  if (req.secure || proto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}

// -------------------------------------------------------------
// 2. SLIDING-WINDOW RATE LIMITER
// -------------------------------------------------------------
interface RateLimitRecord {
  timestamps: number[];
  blockedUntil?: number;
}

class SlidingWindowRateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private maxRequests: number;
  private windowMs: number;
  private blockDurationMs: number;

  constructor(maxRequests: number, windowMs: number, blockDurationMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;

    // Periodic sweep every 5 minutes to prevent memory leaks
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (record.blockedUntil && record.blockedUntil > now) continue;
      const validTimestamps = record.timestamps.filter((t) => now - t < this.windowMs);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        record.timestamps = validTimestamps;
      }
    }
  }

  check(key: string): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
    const now = Date.now();
    let record = this.requests.get(key);

    if (!record) {
      record = { timestamps: [now] };
      this.requests.set(key, record);
      return { allowed: true, retryAfterSeconds: 0, remaining: this.maxRequests - 1 };
    }

    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, retryAfterSeconds: retryAfter, remaining: 0 };
    }

    record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);

    if (record.timestamps.length >= this.maxRequests) {
      record.blockedUntil = now + this.blockDurationMs;
      const retryAfter = Math.ceil(this.blockDurationMs / 1000);
      return { allowed: false, retryAfterSeconds: retryAfter, remaining: 0 };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, this.maxRequests - record.timestamps.length),
    };
  }
}

// Global Limiter Instances
export const authLimiter = new SlidingWindowRateLimiter(10, 15 * 60 * 1000, 15 * 60 * 1000); // 10 attempts per 15 min
export const aiLimiter = new SlidingWindowRateLimiter(30, 60 * 1000, 30 * 1000); // 30 requests per minute
export const fileLimiter = new SlidingWindowRateLimiter(20, 60 * 1000, 60 * 1000); // 20 uploads per minute
export const adminLimiter = new SlidingWindowRateLimiter(40, 60 * 1000, 30 * 1000); // 40 requests per minute
export const generalLimiter = new SlidingWindowRateLimiter(150, 60 * 1000, 30 * 1000); // 150 requests per minute

export function createRateLimitMiddleware(limiter: SlidingWindowRateLimiter, category: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown';
    const checkKey = `${category}:${clientIp}`;

    const { allowed, retryAfterSeconds, remaining } = limiter.check(checkKey);

    res.setHeader('X-RateLimit-Limit', limiter['maxRequests']);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (!allowed) {
      res.setHeader('Retry-After', retryAfterSeconds);
      securityLogger.log({
        eventType: 'RATE_LIMIT_EXCEEDED',
        ip: clientIp,
        details: { category, path: req.originalUrl, retryAfterSeconds },
      });

      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSeconds,
      });
    }

    next();
  };
}

// -------------------------------------------------------------
// 3. INPUT VALIDATION & SANITIZATION (ANTI-XSS & ANTI-NOSQL INJECTION)
// -------------------------------------------------------------
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  const cleanObject = (obj: any, depth = 0): any => {
    if (depth > 10 || !obj) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => cleanObject(item, depth + 1));
    }

    if (typeof obj === 'object') {
      const cleaned: Record<string, any> = {};
      for (const [key, val] of Object.entries(obj)) {
        // Strip NoSQL query selector injection like $gt, $where, $ne
        if (key.startsWith('$') || key.includes('.')) {
          securityLogger.log({
            eventType: 'SUSPICIOUS_INPUT',
            ip: clientIp,
            details: { rejectedKey: key, path: req.originalUrl },
          });
          continue;
        }

        cleaned[key] = cleanObject(val, depth + 1);
      }
      return cleaned;
    }

    if (typeof obj === 'string') {
      // Disallow dangerous script tags and javascript: links
      let str = obj;
      if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(str)) {
        securityLogger.log({
          eventType: 'SUSPICIOUS_INPUT',
          ip: clientIp,
          details: { reason: 'script tag stripped', path: req.originalUrl },
        });
        str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }

      // Disallow javascript: URL vectors in user strings
      if (/javascript:/i.test(str)) {
        str = str.replace(/javascript:/gi, 'about:blank#blocked_');
      }

      return str;
    }

    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = cleanObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = cleanObject(req.query);
  }

  next();
}

// -------------------------------------------------------------
// 4. JWT TOKEN ISSUANCE & VERIFICATION
// -------------------------------------------------------------
export function signJwtToken(payload: { id: string; email: string; role: string }, expiresInSeconds = 86400): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const nowSeconds = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: nowSeconds,
      exp: nowSeconds + expiresInSeconds,
    })
  ).toString('base64url');

  const signature = crypto.createHmac('sha256', JWT_SECRET_KEY).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyJwtToken(token: string): AuthenticatedUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET_KEY).update(`${header}.${body}`).digest('base64url');

    // Constant-time signature comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < nowSeconds) {
      return null; // Expired
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'user',
    };
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// 5. AUTHENTICATION & AUTHORIZATION MIDDLEWARES
// -------------------------------------------------------------
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in.',
    });
  }

  const token = authHeader.substring(7).trim();
  const user = verifyJwtToken(token);

  if (!user) {
    securityLogger.log({
      eventType: 'TOKEN_INVALID',
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      details: { path: req.originalUrl },
    });

    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid. Please sign in again.',
    });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = verifyJwtToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function requireRole(requiredRole: 'admin' | 'user') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      securityLogger.log({
        eventType: 'FORBIDDEN_ADMIN_ACCESS',
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userId: req.user.id,
        email: req.user.email,
        details: { attemptedRole: requiredRole, userRole: req.user.role, path: req.originalUrl },
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied: Insufficient privileges.',
      });
    }

    next();
  };
}

// -------------------------------------------------------------
// 6. SAFE GLOBAL ERROR HANDLER
// -------------------------------------------------------------
export function safeErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // Securely log the internal stack trace server-side only
  console.error(`[SERVER_ERROR] [${new Date().toISOString()}] IP=${clientIp} Path=${req.originalUrl}:`, err);

  // Send generic sanitized response to client without leaking internal details
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'An unexpected internal error occurred. Please try again.' : err.message || 'Request failed.',
  });
}
