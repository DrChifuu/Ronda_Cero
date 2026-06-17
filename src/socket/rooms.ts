interface RoomPlayer {
  id: string;
  nombre: string;
  avatar: string;
  esAnfitrion: boolean;
  listo: boolean;
  socketId: string;
}

interface Room {
  codigo: string;
  nombre: string;
  jugadores: Map<string, RoomPlayer>;
  configuracion: {
    modos: string[];
    rondas: number;
    tiempo: number;
    dificultad: string;
    barraPorcentaje: number;
  };
  estado: "lobby" | "jugando" | "finalizada";
  gameEngine: unknown;
  createdAt: Date;
}

const rooms: Map<string, Room> = new Map();

function createRoom(codigo: string, config: Room["configuracion"], anfitrion: RoomPlayer): Room {
  const room: Room = {
    codigo,
    nombre: `Sala ${codigo}`,
    jugadores: new Map(),
    configuracion: { ...config },
    estado: "lobby",
    gameEngine: null,
    createdAt: new Date(),
  };
  room.jugadores.set(anfitrion.id, anfitrion);
  rooms.set(codigo, room);
  return room;
}

function getRoom(codigo: string): Room | undefined {
  return rooms.get(codigo);
}

function deleteRoom(codigo: string): void {
  rooms.delete(codigo);
}

function addPlayer(codigo: string, player: RoomPlayer): boolean {
  const room = rooms.get(codigo);
  if (!room) {
    return false;
  }
  if (room.jugadores.size >= 12) {
    return false;
  }
  room.jugadores.set(player.id, player);
  return true;
}

function removePlayer(codigo: string, playerId: string): RoomPlayer[] {
  const room = rooms.get(codigo);
  if (!room) {
    return [];
  }
  room.jugadores.delete(playerId);
  return Array.from(room.jugadores.values());
}

function getPlayers(codigo: string): RoomPlayer[] {
  const room = rooms.get(codigo);
  if (!room) {
    return [];
  }
  return Array.from(room.jugadores.values());
}

function setPlayerReady(codigo: string, playerId: string, ready: boolean): void {
  const room = rooms.get(codigo);
  if (!room) {
    return;
  }
  const player = room.jugadores.get(playerId);
  if (player) {
    player.listo = ready;
  }
}

function updateRoomConfig(codigo: string, config: Partial<Room["configuracion"]>): void {
  const room = rooms.get(codigo);
  if (!room) {
    return;
  }
  room.configuracion = { ...room.configuracion, ...config };
}

function setRoomState(codigo: string, estado: Room["estado"]): void {
  const room = rooms.get(codigo);
  if (!room) {
    return;
  }
  room.estado = estado;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code: string;
  do {
    code = "";
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

export {
  RoomPlayer,
  Room,
  rooms,
  createRoom,
  getRoom,
  deleteRoom,
  addPlayer,
  removePlayer,
  getPlayers,
  setPlayerReady,
  updateRoomConfig,
  setRoomState,
  generateRoomCode,
};
