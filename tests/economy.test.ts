jest.mock('../src/database', () => ({
  default: {
    connect: jest.fn(),
    query: jest.fn(),
  },
  __esModule: true,
}));

import pool from '../src/database';
import { obtenerBilletera, acreditarMonedas, debitarMonedas, obtenerSaldoTotal } from '../src/economy/billetera';
import { ejecutarCanje } from '../src/economy/transaccion';

const mockPool = pool as jest.Mocked<typeof pool>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('obtenerBilletera', () => {
  it('returns billetera when exists', async () => {
    const mockBilletera = {
      id_billetera: 'b1',
      id_usuario: 'u1',
      id_moneda: 'm1',
      saldo_actual: 500,
    };

    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockBilletera] });

    const result = await obtenerBilletera('u1', 'm1');

    expect(result).toEqual(mockBilletera);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      ['u1', 'm1']
    );
  });

  it('returns null when not exists', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const result = await obtenerBilletera('u1', 'm1');

    expect(result).toBeNull();
  });
});

describe('acreditarMonedas', () => {
  it('calls UPDATE with correct params', async () => {
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await acreditarMonedas('b1', 100, 'premio trivia');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE billetera_local SET saldo_actual = saldo_actual + $1'),
      [100, 'b1']
    );
  });
});

describe('debitarMonedas', () => {
  it('throws when saldo insufficient', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ saldo_actual: 50 }],
    });

    await expect(debitarMonedas('b1', 100, 'canje')).rejects.toThrow('Saldo insuficiente');
  });
});

describe('obtenerSaldoTotal', () => {
  it('returns array of balances', async () => {
    const mockRows = [
      { moneda: 'Tokens', saldo: 500 },
      { moneda: 'Coins', saldo: 200 },
    ];

    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

    const result = await obtenerSaldoTotal('u1');

    expect(result).toEqual([
      { moneda: 'Tokens', saldo: 500 },
      { moneda: 'Coins', saldo: 200 },
    ]);
  });
});

describe('ejecutarCanje', () => {
  it('performs ACID transaction correctly', async () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    (mockPool.connect as jest.Mock).mockResolvedValueOnce(mockClient);

    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ costo_monedas: 100, stock: 5, nombre_premio: 'Cerveza', id_local: 'l1' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id_billetera: 'b1', saldo_actual: 500 }],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await ejecutarCanje('u1', 'p1');

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      ['p1']
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(result.success).toBe(true);
    expect(result.nuevoSaldo).toBe(400);
    expect(result.premioNombre).toBe('Cerveza');
  });

  it('rolls back on error', async () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    (mockPool.connect as jest.Mock).mockResolvedValueOnce(mockClient);

    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] });

    await expect(ejecutarCanje('u1', 'p999')).rejects.toThrow('Premio no encontrado');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
