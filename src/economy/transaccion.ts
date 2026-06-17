import pool from '../database';

interface ResultadoCanje {
  success: boolean;
  nuevoSaldo: number;
  premioNombre: string;
  mensaje: string;
}

export async function ejecutarCanje(usuarioId: string, premioId: string): Promise<ResultadoCanje> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const premioResult = await client.query(
      'SELECT costo_monedas, stock, nombre_premio, id_local FROM premio WHERE id_premio = $1 FOR UPDATE',
      [premioId]
    );

    if (premioResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('Premio no encontrado');
    }

    const premio = premioResult.rows[0];

    const billeteraResult = await client.query(
      `SELECT bl.id_billetera, bl.saldo_actual
       FROM billetera_local bl
       JOIN tipo_moneda_local tml ON bl.id_moneda = tml.id_moneda
       WHERE bl.id_usuario = $1 AND tml.id_local = $2
       FOR UPDATE`,
      [usuarioId, premio.id_local]
    );

    if (billeteraResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('Billetera no encontrada para el local del premio');
    }

    const billetera = billeteraResult.rows[0];

    if (billetera.saldo_actual < premio.costo_monedas) {
      await client.query('ROLLBACK');
      throw new Error('Saldo insuficiente');
    }

    if (premio.stock <= 0) {
      await client.query('ROLLBACK');
      throw new Error('Stock agotado');
    }

    const nuevoSaldo = billetera.saldo_actual - premio.costo_monedas;

    await client.query(
      'UPDATE billetera_local SET saldo_actual = saldo_actual - $1 WHERE id_billetera = $2',
      [premio.costo_monedas, billetera.id_billetera]
    );

    await client.query(
      'UPDATE premio SET stock = stock - 1 WHERE id_premio = $1',
      [premioId]
    );

    await client.query(
      'INSERT INTO transaccion (id_billetera, monto_descontado, tipo_transaccion, tipo_movimiento, descripcion, referencia_id, fecha) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [billetera.id_billetera, premio.costo_monedas, 'canje', 'debito', `Canje: ${premio.nombre_premio}`, premioId]
    );

    await client.query(
      `UPDATE canje_premio SET estado = 'completado', fecha_confirmacion = NOW()
       WHERE id_canje = (
         SELECT id_canje FROM canje_premio
         WHERE id_usuario = $1 AND id_premio = $2 AND estado = 'pendiente'
         ORDER BY fecha_canje DESC
         LIMIT 1
       )`,
      [usuarioId, premioId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      nuevoSaldo,
      premioNombre: premio.nombre_premio,
      mensaje: 'Canje realizado exitosamente',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
