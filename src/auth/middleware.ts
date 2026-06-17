import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

interface TokenPayload {
  userId: string;
  email?: string;
  isGuest: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      req.user = decoded;
      next();
      return;
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  }

  if (req.session && (req.session as unknown as Record<string, unknown>).userId) {
    next();
    return;
  }

  res.status(401).json({ error: 'Authentication required' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      req.user = decoded;
      next();
      return;
    } catch {
      res.redirect('/login');
      return;
    }
  }

  if (req.session && (req.session as unknown as Record<string, unknown>).userId) {
    next();
    return;
  }

  res.redirect('/login');
}
