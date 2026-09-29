/**
 * NINJA Security Audit Logger
 * Records security-sensitive events with structured timestamps and context.
 * Never logs passwords, API keys, tokens, or raw secrets.
 */

export type SecurityEventType =
  | 'HTTPS_REDIRECT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_LOCKOUT'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PASSWORD_RESET_FAILED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED_ACCESS'
  | 'FORBIDDEN_ADMIN_ACCESS'
  | 'ADMIN_ACTION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_INPUT'
  | 'SUSPICIOUS_COMMAND'
  | 'DANGEROUS_URL_BLOCKED'
  | 'PATH_TRAVERSAL_BLOCKED'
  | 'FILE_UPLOAD_REJECTED';

export interface SecurityLogEntry {
  timestamp: string;
  eventType: SecurityEventType;
  ip: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  details?: Record<string, any>;
}

class SecurityLogger {
  private logs: SecurityLogEntry[] = [];
  private maxLogsInMemory = 500;

  /**
   * Log a security audit event
   */
  log(entry: Omit<SecurityLogEntry, 'timestamp'>) {
    const record: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Sanitize any accidental sensitive fields in details
    if (record.details) {
      const sanitizedDetails = { ...record.details };
      delete sanitizedDetails.password;
      delete sanitizedDetails.passwordHash;
      delete sanitizedDetails.token;
      delete sanitizedDetails.secret;
      delete sanitizedDetails.apiKey;
      record.details = sanitizedDetails;
    }

    this.logs.unshift(record);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.pop();
    }

    // Format safe console log for server log streams
    const prefix = `[SECURITY ${record.eventType}]`;
    const userMeta = record.email || record.userId || 'anonymous';
    console.info(`${prefix} [${record.timestamp}] IP=${record.ip} User=${userMeta}`, record.details ? JSON.stringify(record.details) : '');
  }

  /**
   * Retrieve recent security audit events (Admin only)
   */
  getRecentLogs(limit = 100): SecurityLogEntry[] {
    return this.logs.slice(0, limit);
  }
}

export const securityLogger = new SecurityLogger();
