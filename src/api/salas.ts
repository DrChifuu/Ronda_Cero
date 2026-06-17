import { Router, Request, Response } from 'express';
import pool from '../database';
import { verifyToken } from '../auth/middleware';

const router = Router();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

router.post('/salas', async (req: Request, res: Response) => {
  try {
    const { nombre, modos, rondas, tiempo, dificultad, barraPorcentaje } = req.body;

    if (!modos || !Array.isArray(modos) || modos.length === 0) {
      res.status(400).json({ error: 'modos must be a non-empty array' });
      return;
    }
    if (!rondas || !tiempo) {
      res.status(400).json({ error: 'rondas and tiempo are required' });
      return;
    }

    let codigo = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      codigo = generateRoomCode();
      const existing = await pool.query(
        'SELECT id_sesion FROM sesion_juego WHERE codigo_sala = $1 AND estado = $2',
        [codigo, 'activa']
      );
      if (existing.rowCount === 0) break;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      res.status(500).json({ error: 'Failed to generate unique room code' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO sesion_juego (codigo_sala, fecha_creacion, estado, nombre, modos, rondas, tiempo, dificultad, barra_porcentaje)
       VALUES ($1, NOW(), 'activa', $2, $3, $4, $5, $6, $7)
       RETURNING id_sesion, codigo_sala`,
      [codigo, nombre || null, JSON.stringify(modos), rondas, tiempo, dificultad || null, barraPorcentaje || null]
    );

    const sala = result.rows[0];
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
    const qrData = `${baseUrl}/salas/${sala.codigo_sala}/join`;

    res.status(201).json({ roomCode: sala.codigo_sala, qrData });
  } catch (err) {
    console.error('POST /salas error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/salas/:codigo', async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;

    const salaResult = await pool.query(
      'SELECT * FROM sesion_juego WHERE codigo_sala = $1',
      [codigo]
    );

    if (salaResult.rowCount === 0) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const sala = salaResult.rows[0];

    const jugadoresResult = await pool.query(
      `SELECT ps.id_participacion, ps.monedas_ganadas, u.id_usuario, u.nombre_jugador, u.email
       FROM participacion_sesion ps
       JOIN usuario u ON u.id_usuario = ps.id_usuario
       WHERE ps.id_sesion = $1`,
      [sala.id_sesion]
    );

    res.json({ sala, jugadores: jugadoresResult.rows });
  } catch (err) {
    console.error('GET /salas/:codigo error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/salas/:codigo', verifyToken, async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const userId = req.user?.userId;

    const salaResult = await pool.query(
      'SELECT * FROM sesion_juego WHERE codigo_sala = $1',
      [codigo]
    );

    if (salaResult.rowCount === 0) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const sala = salaResult.rows[0];

    if (sala.id_anfitrion !== userId) {
      res.status(403).json({ error: 'Only the host can close the room' });
      return;
    }

    await pool.query(
      "UPDATE sesion_juego SET estado = 'cancelada' WHERE codigo_sala = $1",
      [codigo]
    );

    res.json({ message: 'Room closed successfully' });
  } catch (err) {
    console.error('DELETE /salas/:codigo error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
