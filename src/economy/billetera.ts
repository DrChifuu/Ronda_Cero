import pool from '../database';

interface Billetera {
  id_billetera: string;
  id_usuario: string;
  id_moneda: string;
  saldo_actual: number;
}

export async function obtenerBilletera(usuarioId: string, monedaId: string): Promise<Billetera | null> {
  const result = await pool.query(
    'SELECT id_billetera, id_usuario, id_moneda, saldo_actual FROM billetera_local WHERE id_usuario = $1 AND id_moneda = $2',
    [usuarioId, monedaId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function crearBilletera(usuarioId: string, monedaId: string): Promise<Billetera> {
  const result = await pool.query(
    'INSERT INTO billetera_local (id_usuario, id_moneda, saldo_actual) VALUES ($1, $2, 0) RETURNING id_billetera, id_usuario, id_moneda, saldo_actual',
    [usuarioId, monedaId]
  );
  return result.rows[0];
}

export async function obtenerOCrearBilletera(usuarioId: string, monedaId: string): Promise<Billetera> {
  const existente = await obtenerBilletera(usuarioId, monedaId);
  if (existente) return existente;
  return crearBilletera(usuarioId, monedaId);
}

export async function acreditarMonedas(billeteraId: string, monto: number, descripcion: string, referenciaId?: string): Promise<void> {
  if (monto <= 0) throw new Error('El monto debe ser positivo');

  await pool.query(
    'UPDATE billetera_local SET saldo_actual = saldo_actual + $1 WHERE id_billetera = $2',
    [monto, billeteraId]
  );

  await pool.query(
    'INSERT INTO transaccion (id_billetera, monto_descontado, tipo_transaccion, tipo_movimiento, descripcion, referencia_id, fecha) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [billeteraId, monto, 'acreditacion', 'credito', descripcion, referenciaId ?? null]
  );
}

export async function debitarMonedas(billeteraId: string, monto: number, descripcion: string, referenciaId?: string): Promise<void> {
  if (monto <= 0) throw new Error('El monto debe ser positivo');

  const result = await pool.query(
    'SELECT saldo_actual FROM billetera_local WHERE id_billetera = $1',
    [billeteraId]
  );

  if (result.rows.length === 0) throw new Error('Billetera no encontrada');
  if (result.rows[0].saldo_actual < monto) throw new Error('Saldo insuficiente');

  await pool.query(
    'UPDATE billetera_local SET saldo_actual = saldo_actual - $1 WHERE id_billetera = $2',
    [monto, billeteraId]
  );

  await pool.query(
    'INSERT INTO transaccion (id_billetera, monto_descontado, tipo_transaccion, tipo_movimiento, descripcion, referencia_id, fecha) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [billeteraId, monto, 'debito', 'debito', descripcion, referenciaId ?? null]
  );
}

export async function obtenerSaldoTotal(usuarioId: string): Promise<{ moneda: string; saldo: number }[]> {
  const result = await pool.query(
    `SELECT tml.nombre_moneda AS moneda, bl.saldo_actual AS saldo
     FROM billetera_local bl
     JOIN tipo_moneda_local tml ON bl.id_moneda = tml.id_moneda
     WHERE bl.id_usuario = $1`,
    [usuarioId]
  );
  return result.rows.map((row: { moneda: string; saldo: number }) => ({ moneda: row.moneda, saldo: row.saldo }));
}

export async function obtenerHistorial(billeteraId: string, limit: number = 50): Promise<unknown[]> {
  const result = await pool.query(
    'SELECT * FROM transaccion WHERE id_billetera = $1 ORDER BY fecha DESC LIMIT $2',
    [billeteraId, limit]
  );
  return result.rows;
}
