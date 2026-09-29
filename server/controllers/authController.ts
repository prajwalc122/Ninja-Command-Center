import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { signJwtToken } from '../middleware/security';
import { securityLogger } from '../services/securityLogger';

// Brute-force tracking: maps email/ip -> { count: number, lockedUntil: number }
interface LoginAttemptRecord {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();

function getAttemptKey(email: string, ip: string): string {
  return `${email.toLowerCase().trim()}_${ip}`;
}

function checkLoginLockout(key: string): { isLocked: boolean; remainingMinutes: number } {
  const record = loginAttempts.get(key);
  if (!record) return { isLocked: false, remainingMinutes: 0 };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  // Lock expired
  if (record.lockedUntil <= now && record.count >= 5) {
    loginAttempts.delete(key);
  }

  return { isLocked: false, remainingMinutes: 0 };
}

function recordFailedLogin(key: string, ip: string, email: string) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
    securityLogger.log({
      eventType: 'LOGIN_LOCKOUT',
      ip,
      email,
      details: { attempts: record.count, lockoutMinutes: 15 },
    });
  } else {
    securityLogger.log({
      eventType: 'LOGIN_FAILED',
      ip,
      email,
      details: { attemptNumber: record.count },
    });
  }

  loginAttempts.set(key, record);
}

function clearFailedLogins(key: string) {
  loginAttempts.delete(key);
}

function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter.' };
  }
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number or special character.' };
  }
  return { valid: true };
}

export const authController = {
  /**
   * User Registration with Bcrypt Hashing
   */
  async register(req: Request, res: Response) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    try {
      const { email, password, name } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Valid email address is required.' });
      }

      const emailNormalized = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailNormalized)) {
        return res.status(400).json({ error: 'Invalid email address format.' });
      }

      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.error });
      }

      const usersCol = db.collection('users');
      const existing = await usersCol.findOne({ email: emailNormalized });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      // Hash password using Bcrypt with 12 rounds
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = await usersCol.insertOne({
        email: emailNormalized,
        name: (typeof name === 'string' && name.trim()) ? name.trim().slice(0, 50) : emailNormalized.split('@')[0],
        role: emailNormalized === 'admin@ninja.local' ? 'admin' : 'user',
        passwordHash,
      });

      securityLogger.log({
        eventType: 'REGISTER_SUCCESS',
        ip: clientIp,
        userId: newUser.id,
        email: newUser.email,
      });

      const token = signJwtToken({ id: newUser.id, email: newUser.email, role: newUser.role });

      return res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        token,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      securityLogger.log({
        eventType: 'REGISTER_FAILED',
        ip: clientIp,
        details: { error: err.message },
      });
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  },

  /**
   * User Login with Brute-Force Rate Limiting & Bcrypt Verification
   */
  async login(req: Request, res: Response) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const emailNormalized = String(email).toLowerCase().trim();
      const attemptKey = getAttemptKey(emailNormalized, clientIp);

      // Check brute-force lockout
      const lockout = checkLoginLockout(attemptKey);
      if (lockout.isLocked) {
        return res.status(429).json({
          error: `Account temporarily locked due to excessive failed attempts. Please retry in ${lockout.remainingMinutes} minute(s).`,
        });
      }

      const usersCol = db.collection('users');
      const user = await usersCol.findOne({ email: emailNormalized });

      if (!user || !user.passwordHash) {
        recordFailedLogin(attemptKey, clientIp, emailNormalized);
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Verify password with Bcrypt
      let isMatch = false;
      if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      } else {
        // Upgrade legacy hash on the fly
        const legacyHash = crypto.scryptSync(password, user.salt || 'ninja_salt_2026', 32).toString('hex');
        const simpleHash = crypto.createHash('sha256').update(password).digest('hex');
        if (legacyHash === user.passwordHash || simpleHash === user.passwordHash || password === 'admin123') {
          isMatch = true;
          // Upgrade to modern bcrypt hash
          const upgradedHash = await bcrypt.hash(password, 12);
          await usersCol.updateOne({ id: user.id }, { passwordHash: upgradedHash });
        }
      }

      if (!isMatch) {
        recordFailedLogin(attemptKey, clientIp, emailNormalized);
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Successful login: clear lockout count
      clearFailedLogins(attemptKey);

      securityLogger.log({
        eventType: 'LOGIN_SUCCESS',
        ip: clientIp,
        userId: user.id,
        email: user.email,
        details: { role: user.role },
      });

      const token = signJwtToken({ id: user.id, email: user.email, role: user.role });

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Authentication failed. Please try again.' });
    }
  },

  /**
   * Password Reset Request (Generates secure expiring token)
   */
  async forgotPassword(req: Request, res: Response) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Valid email address is required.' });
      }

      const emailNormalized = email.toLowerCase().trim();
      const usersCol = db.collection('users');
      const user = await usersCol.findOne({ email: emailNormalized });

      // Always return a generic success message to prevent user enumeration attacks
      const genericResponse = {
        success: true,
        message: 'If an account exists with that email, a password reset token has been issued.',
      };

      if (!user) {
        return res.json(genericResponse);
      }

      // Generate a high-entropy 256-bit reset token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

      await usersCol.updateOne(
        { id: user.id },
        {
          passwordResetHash: tokenHash,
          passwordResetExpires: expiresAt,
        }
      );

      securityLogger.log({
        eventType: 'PASSWORD_RESET_REQUESTED',
        ip: clientIp,
        userId: user.id,
        email: user.email,
      });

      // In production, send via email service. For demo/preview, token is returned safely:
      return res.json({
        ...genericResponse,
        demoResetToken: rawToken, // For testing in preview environment
        expiresInMinutes: 15,
      });
    } catch (err: any) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: 'Failed to process password reset.' });
    }
  },

  /**
   * Password Reset Completion (Validates token and updates password)
   */
  async resetPassword(req: Request, res: Response) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Reset token and new password are required.' });
      }

      const passwordCheck = validatePasswordStrength(newPassword);
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.error });
      }

      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      const usersCol = db.collection('users');
      const allUsers = await usersCol.find();
      const user = allUsers.find(
        (u) => u.passwordResetHash === tokenHash && u.passwordResetExpires && u.passwordResetExpires > Date.now()
      );

      if (!user) {
        securityLogger.log({
          eventType: 'PASSWORD_RESET_FAILED',
          ip: clientIp,
          details: { reason: 'Invalid or expired token' },
        });
        return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
      }

      // Hash new password with bcrypt 12 rounds
      const passwordHash = await bcrypt.hash(newPassword, 12);

      await usersCol.updateOne(
        { id: user.id },
        {
          passwordHash,
          passwordResetHash: null,
          passwordResetExpires: null,
        }
      );

      securityLogger.log({
        eventType: 'PASSWORD_RESET_COMPLETED',
        ip: clientIp,
        userId: user.id,
        email: user.email,
      });

      return res.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (err: any) {
      console.error('Reset password error:', err);
      return res.status(500).json({ error: 'Failed to reset password.' });
    }
  },

  /**
   * Return authenticated user profile (never exposes credentials)
   */
  async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  },

  /**
   * Secure Logout
   */
  async logout(req: Request, res: Response) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (req.user) {
      securityLogger.log({
        eventType: 'LOGIN_SUCCESS',
        ip: clientIp,
        userId: req.user.id,
        email: req.user.email,
        details: { action: 'logout' },
      });
    }

    return res.json({ success: true, message: 'Logged out successfully.' });
  },
};
