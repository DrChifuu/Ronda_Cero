import { Router, Request, Response } from 'express';
import pool from '../database';
import { verifyToken } from '../auth/middleware';

const router = Router();

router.get('/stats/mine', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const totalPartidasResult = await pool.query(
      `SELECT COUNT(*) AS total_partidas
       FROM participacion_sesion ps
       JOIN sesion_juego sj ON sj.id_sesion = ps.id_sesion
       WHERE ps.id_usuario = $1`,
      [userId]
    );

    const victoriasResult = await pool.query(
      `SELECT COUNT(*) AS victorias
       FROM participacion_sesion ps
       WHERE ps.id_usuario = $1
         AND ps.puntaje_final = (
           SELECT MAX(ps2.puntaje_final)
           FROM participacion_sesion ps2
           WHERE ps2.id_sesion = ps.id_sesion
         )`,
      [userId]
    );

    const totalesResult = await pool.query(
      `SELECT
         COALESCE(SUM(ps.monedas_ganadas), 0) AS total_monedas,
         COALESCE(SUM(ps.tragos), 0) AS total_tragos,
         COALESCE(SUM(ps.respuestas_correctas), 0) AS total_respuestas_correctas
       FROM participacion_sesion ps
       WHERE ps.id_usuario = $1`,
      [userId]
    );

    const perGameResult = await pool.query(
      `SELECT
         sj.codigo_sala,
         sj.estado,
         COUNT(*) OVER (PARTITION BY sj.id_sesion) AS jugadores_en_sesion,
         ps.monedas_ganadas,
         ps.puntaje_final,
         ps.tragos,
         ps.respuestas_correctas,
         sj.fecha_creacion
       FROM participacion_sesion ps
       JOIN sesion_juego sj ON sj.id_sesion = ps.id_sesion
       WHERE ps.id_usuario = $1
       ORDER BY sj.fecha_creacion DESC`,
      [userId]
    );

    res.json({
      total_partidas: parseInt(totalPartidasResult.rows[0].total_partidas, 10),
      victorias: parseInt(victoriasResult.rows[0].victorias, 10),
      total_monedas: parseInt(totalesResult.rows[0].total_monedas, 10),
      total_tragos: parseInt(totalesResult.rows[0].total_tragos, 10),
      total_respuestas_correctas: parseInt(totalesResult.rows[0].total_respuestas_correctas, 10),
      per_game: perGameResult.rows,
    });
  } catch (err) {
    console.error('GET /stats/mine error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats/history', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await pool.query(
      `SELECT
         ps.id_participacion,
         ps.monedas_ganadas,
         ps.puntaje_final,
         ps.tragos,
         ps.respuestas_correctas,
         sj.id_sesion,
         sj.codigo_sala,
         sj.estado,
         sj.fecha_creacion
       FROM participacion_sesion ps
       JOIN sesion_juego sj ON sj.id_sesion = ps.id_sesion
       WHERE ps.id_usuario = $1
       ORDER BY sj.fecha_creacion DESC
       LIMIT 20`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET /stats/history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
