import { Router, Request, Response } from 'express';
import pool from '../database';
import { verifyToken } from '../auth/middleware';

const router = Router();

router.get('/premios', async (req: Request, res: Response) => {
  try {
    const { localId } = req.query;

    let query = 'SELECT * FROM premio WHERE activo = true';
    const params: (string | number)[] = [];

    if (localId) {
      params.push(Number(localId));
      query += ` AND id_local = $${params.length}`;
    }

    query += ' ORDER BY nombre ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /premios error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/premios', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id_local, nombre, descripcion, costo_monedas, stock } = req.body;

    if (!id_local || !nombre || costo_monedas === undefined || stock === undefined) {
      res.status(400).json({ error: 'id_local, nombre, costo_monedas, and stock are required' });
      return;
    }

    if (costo_monedas < 0 || stock < 0) {
      res.status(400).json({ error: 'costo_monedas and stock must be non-negative' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO premio (id_local, nombre, descripcion, costo_monedas, stock, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [id_local, nombre, descripcion || null, costo_monedas, stock]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /premios error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/premios/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { costo_monedas, stock, activo } = req.body;

    const existing = await pool.query('SELECT * FROM premio WHERE id_premio = $1', [id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'Premio not found' });
      return;
    }

    const current = existing.rows[0];
    const updates: string[] = [];
    const params: (string | number | boolean)[] = [];

    if (costo_monedas !== undefined) {
      if (costo_monedas < 0) {
        res.status(400).json({ error: 'costo_monedas must be non-negative' });
        return;
      }
      params.push(costo_monedas);
      updates.push(`costo_monedas = $${params.length}`);
    }

    if (stock !== undefined) {
      if (stock < 0) {
        res.status(400).json({ error: 'stock must be non-negative' });
        return;
      }
      params.push(stock);
      updates.push(`stock = $${params.length}`);
    }

    if (activo !== undefined) {
      params.push(activo);
      updates.push(`activo = $${params.length}`);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    params.push(id);
    const query = `UPDATE premio SET ${updates.join(', ')} WHERE id_premio = $${params.length} RETURNING *`;

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /premios/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/premios/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM premio WHERE id_premio = $1', [id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'Premio not found' });
      return;
    }

    const pendingCanjes = await pool.query(
      "SELECT id_canje FROM canje_premio WHERE id_premio = $1 AND estado = 'pendiente'",
      [id]
    );

    if (pendingCanjes.rowCount && pendingCanjes.rowCount > 0) {
      res.status(409).json({ error: 'Cannot delete premio with pending canjes' });
      return;
    }

    await pool.query('UPDATE premio SET activo = false WHERE id_premio = $1', [id]);

    res.json({ message: 'Premio deactivated successfully' });
  } catch (err) {
    console.error('DELETE /premios/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
