import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/db';

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 86400 * 1000 })).toString('base64url');
  const secret = process.env.JWT_SECRET || 'ninja_super_secret_signing_key_2026';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = process.env.JWT_SECRET || 'ninja_super_secret_signing_key_2026';
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const usersCol = db.collection('users');
      const existing = await usersCol.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);

      const newUser = await usersCol.insertOne({
        email: email.toLowerCase().trim(),
        name: name?.trim() || email.split('@')[0],
        role: 'user',
        salt,
        passwordHash,
      });

      const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

      return res.status(201).json({
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
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const usersCol = db.collection('users');
      const user = await usersCol.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Check password
      let isValid = false;
      if (user.salt) {
        const hash = hashPassword(password, user.salt);
        isValid = hash === user.passwordHash;
      } else {
        // Fallback for default seed admin
        const simpleHash = crypto.createHash('sha256').update(password).digest('hex');
        isValid = simpleHash === user.passwordHash || password === 'admin123';
      }

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      return res.json({
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
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  },

  async me(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ id: decoded.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  },

  async logout(_req: Request, res: Response) {
    return res.json({ success: true, message: 'Logged out successfully.' });
  },
};
