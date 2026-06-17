import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database';
import config from '../config';
import { verifyToken } from './middleware';

const router = Router();

const SALT_ROUNDS = 10;

function generateToken(payload: { userId: string; email?: string; isGuest: boolean }): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
}

router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, nombre } = req.body;

    if (!email || !password || !nombre) {
      res.status(400).json({ error: 'Email, password, and nombre are required' });
      return;
    }

    const existingUser = await pool.query(
      'SELECT id_usuario FROM usuario WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const id = uuidv4();

    await pool.query(
      'INSERT INTO usuario (id_usuario, nombre_jugador, email, password_hash, fecha_registro) VALUES ($1, $2, $3, $4, NOW())',
      [id, nombre, email, hashedPassword]
    );

    const token = generateToken({ userId: id, email, isGuest: false });

    res.status(201).json({
      token,
      user: { id, nombre, email },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
});

router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await pool.query(
      'SELECT id_usuario, nombre_jugador, email, password_hash FROM usuario WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash || '');

    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ userId: user.id_usuario, email: user.email, isGuest: false });

    res.json({
      token,
      user: { id: user.id_usuario, nombre: user.nombre_jugador, email: user.email },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
});

router.post('/auth/guest', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, avatar } = req.body;

    if (!nombre) {
      res.status(400).json({ error: 'Nombre is required' });
      return;
    }

    const id = uuidv4();

    await pool.query(
      'INSERT INTO usuario (id_usuario, nombre_jugador, fecha_registro) VALUES ($1, $2, NOW())',
      [id, nombre]
    );

    const token = generateToken({ userId: id, isGuest: true });

    res.status(201).json({
      token,
      user: { id, nombre, avatar: avatar || null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
});

router.get('/auth/me', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await pool.query(
      'SELECT id_usuario, nombre_jugador, email, fecha_registro FROM usuario WHERE id_usuario = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    res.json({
      id: user.id_usuario,
      nombre: user.nombre_jugador,
      email: user.email,
      fechaRegistro: user.fecha_registro,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
});

export default router;
