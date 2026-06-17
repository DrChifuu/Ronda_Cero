import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import pool from '../database';
import config from '../config';
import { verifyToken } from '../auth/middleware';

const router = Router();

router.post('/canje', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { premioId } = req.body;
    if (!premioId) {
      res.status(400).json({ error: 'premioId is required' });
      return;
    }

    const premioResult = await pool.query(
      'SELECT * FROM premio WHERE id_premio = $1 AND activo = true',
      [premioId]
    );

    if (premioResult.rowCount === 0) {
      res.status(404).json({ error: 'Premio not found or inactive' });
      return;
    }

    const premio = premioResult.rows[0];

    if (premio.stock <= 0) {
      res.status(409).json({ error: 'Premio out of stock' });
      return;
    }

    const billeteraResult = await pool.query(
      `SELECT b.* FROM billetera_local b
       JOIN premio p ON p.id_local = b.id_local
       WHERE b.id_usuario = $1 AND p.id_premio = $2`,
      [userId, premioId]
    );

    if (billeteraResult.rowCount === 0) {
      res.status(400).json({ error: 'No wallet found for this local' });
      return;
    }

    const billetera = billeteraResult.rows[0];

    if (billetera.saldo_actual < premio.costo_monedas) {
      res.status(402).json({ error: 'Insufficient balance' });
      return;
    }

    const tokenPayload = {
      userId,
      premioId: premio.id_premio,
      localId: premio.id_local,
    };

    const signOptions: jwt.SignOptions = {
      expiresIn: config.jwt.qrExpiresIn as unknown as number,
    };
    const token = jwt.sign(tokenPayload, config.jwt.secret, signOptions);

    const qrData = await QRCode.toDataURL(token);

    const canjeResult = await pool.query(
      `INSERT INTO canje_premio (id_billetera, id_premio, fecha_canje, qr_code, estado)
       VALUES ($1, $2, NOW(), $3, 'pendiente')
       RETURNING *`,
      [billetera.id_billetera, premioId, token]
    );

    res.status(201).json({
      qrData,
      jwt: token,
      premio,
      canje: canjeResult.rows[0],
    });
  } catch (err) {
    console.error('POST /canje error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface CanjeTokenPayload {
  userId: string;
  premioId: string;
  localId: string;
}

router.post('/canje/validate', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { jwt: token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'jwt is required' });
      return;
    }

    let decoded: CanjeTokenPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as CanjeTokenPayload;
    } catch {
      res.status(401).json({ error: 'Invalid or expired QR code' });
      return;
    }

    const { userId, premioId } = decoded;

    const canjeResult = await pool.query(
      `SELECT cp.*, p.*, u.nombre_jugador, u.email
       FROM canje_premio cp
       JOIN premio p ON p.id_premio = cp.id_premio
       JOIN billetera_local b ON b.id_billetera = cp.id_billetera
       JOIN usuario u ON u.id_usuario = b.id_usuario
       WHERE cp.qr_code = $1 AND cp.id_premio = $2`,
      [token, premioId]
    );

    if (canjeResult.rowCount === 0) {
      res.status(404).json({ error: 'Canje not found' });
      return;
    }

    const canje = canjeResult.rows[0];

    if (canje.estado !== 'pendiente') {
      res.status(409).json({ error: `Canje already ${canje.estado}` });
      return;
    }

    await client.query('BEGIN');

    const billeteraResult = await client.query(
      `SELECT b.* FROM billetera_local b
       JOIN canje_premio cp ON cp.id_billetera = b.id_billetera
       WHERE cp.qr_code = $1
       FOR UPDATE`,
      [token]
    );

    const billetera = billeteraResult.rows[0];

    const premioResult = await client.query(
      'SELECT * FROM premio WHERE id_premio = $1 FOR UPDATE',
      [premioId]
    );
    const premio = premioResult.rows[0];

    if (billetera.saldo_actual < premio.costo_monedas) {
      await client.query('ROLLBACK');
      res.status(402).json({ error: 'Insufficient balance at validation time' });
      return;
    }

    if (premio.stock <= 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Premio out of stock' });
      return;
    }

    await client.query(
      'UPDATE billetera_local SET saldo_actual = saldo_actual - $1 WHERE id_billetera = $2',
      [premio.costo_monedas, billetera.id_billetera]
    );

    await client.query(
      'UPDATE premio SET stock = stock - 1 WHERE id_premio = $1',
      [premioId]
    );

    await client.query(
      "UPDATE canje_premio SET estado = 'completado' WHERE id_canje = $1",
      [canje.id_canje]
    );

    await client.query(
      `INSERT INTO transaccion (id_billetera, monto_descontado, tipo_transaccion, fecha, id_sesion)
       VALUES ($1, $2, 'canje', NOW(), NULL)`,
      [billetera.id_billetera, premio.costo_monedas]
    );

    await client.query('COMMIT');

    const usuarioResult = await pool.query(
      `SELECT u.id_usuario, u.nombre_jugador, u.email
       FROM usuario u
       JOIN billetera_local b ON b.id_usuario = u.id_usuario
       WHERE b.id_billetera = $1`,
      [billetera.id_billetera]
    );

    res.json({
      ok: true,
      premio: {
        id_premio: premio.id_premio,
        nombre: premio.nombre,
        costo_monedas: premio.costo_monedas,
      },
      usuario: usuarioResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /canje/validate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
