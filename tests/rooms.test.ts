import { createRoom, getRoom, deleteRoom, addPlayer, removePlayer, getPlayers, generateRoomCode, setPlayerReady, setRoomState, rooms, RoomPlayer } from '../src/socket/rooms';

function makePlayer(id: string, esAnfitrion = false): RoomPlayer {
  return {
    id,
    nombre: `Player ${id}`,
    avatar: 'avatar1',
    esAnfitrion,
    listo: false,
    socketId: `socket-${id}`,
  };
}

const defaultConfig = {
  modos: ['trivia'],
  rondas: 5,
  tiempo: 30,
  dificultad: 'facil',
  barraPorcentaje: 25,
};

beforeEach(() => {
  rooms.clear();
});

describe('generateRoomCode', () => {
  it('returns 5-char alphanumeric uppercase string', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]{5}$/);
  });

  it('generates unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    expect(codes.size).toBe(100);
  });
});

describe('createRoom', () => {
  it('creates a room with correct config', () => {
    const anfitrion = makePlayer('p1', true);
    const room = createRoom('ABC12', defaultConfig, anfitrion);

    expect(room.codigo).toBe('ABC12');
    expect(room.configuracion).toEqual(defaultConfig);
    expect(room.estado).toBe('lobby');
    expect(room.jugadores.size).toBe(1);
  });
});

describe('getRoom', () => {
  it('returns the created room', () => {
    const anfitrion = makePlayer('p1', true);
    createRoom('ABC12', defaultConfig, anfitrion);

    const room = getRoom('ABC12');
    expect(room).toBeDefined();
    expect(room!.codigo).toBe('ABC12');
  });

  it('returns undefined for non-existent room', () => {
    expect(getRoom('ZZZZZ')).toBeUndefined();
  });
});

describe('addPlayer', () => {
  it('adds player to room', () => {
    const anfitrion = makePlayer('p1', true);
    createRoom('ABC12', defaultConfig, anfitrion);

    const result = addPlayer('ABC12', makePlayer('p2'));
    expect(result).toBe(true);
    expect(getRoom('ABC12')!.jugadores.size).toBe(2);
  });

  it('returns false when room is full', () => {
    const anfitrion = makePlayer('p0', true);
    createRoom('FULL1', defaultConfig, anfitrion);

    for (let i = 1; i <= 11; i++) {
      const result = addPlayer('FULL1', makePlayer(`p${i}`));
      expect(result).toBe(true);
    }

    expect(getRoom('FULL1')!.jugadores.size).toBe(12);

    const result = addPlayer('FULL1', makePlayer('p12'));
    expect(result).toBe(false);
  });
});

describe('removePlayer', () => {
  it('removes player and returns remaining', () => {
    const anfitrion = makePlayer('p1', true);
    createRoom('ABC12', defaultConfig, anfitrion);
    addPlayer('ABC12', makePlayer('p2'));

    const remaining = removePlayer('ABC12', 'p2');

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('p1');
  });
});

describe('getPlayers', () => {
  it('returns correct player list', () => {
    const anfitrion = makePlayer('p1', true);
    createRoom('ABC12', defaultConfig, anfitrion);
    addPlayer('ABC12', makePlayer('p2'));
    addPlayer('ABC12', makePlayer('p3'));

    const players = getPlayers('ABC12');
    expect(players).toHaveLength(3);
  });
});

describe('setPlayerReady', () => {
  it('updates player ready state', () => {
    const anfitrion = makePlayer('p1', true);
    createRoom('ABC12', defaultConfig, anfitrion);

    setPlayerReady('ABC12', 'p1', true);

    const player = getRoom('ABC12')!.jugadores.get('p1');
    expect(player!.listo).toBe(true);
  });
});

describe('setRoomState', () => {
  it('updates room estado', () => {
    const anfitrion = makePlayer('p1', true);
    createRoom('ABC12', defaultConfig, anfitrion);

    setRoomState('ABC12', 'jugando');
    expect(getRoom('ABC12')!.estado).toBe('jugando');

    setRoomState('ABC12', 'finalizada');
    expect(getRoom('ABC12')!.estado).toBe('finalizada');
  });
});

describe('deleteRoom', () => {
  it('removes the room', () => {
    const anfitrion = makePlayer('p1', true);
    createRoom('ABC12', defaultConfig, anfitrion);

    deleteRoom('ABC12');
    expect(getRoom('ABC12')).toBeUndefined();
  });
});
