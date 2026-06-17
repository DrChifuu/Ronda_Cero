import { Server, Socket } from "socket.io";
import {
  Room,
  RoomPlayer,
  rooms,
  getRoom,
  addPlayer,
  removePlayer,
  getPlayers,
  setPlayerReady,
  setRoomState,
  deleteRoom,
} from "./rooms";
import { GameEngine, PlayerState } from "../game-engine";

interface JoinRoomData {
  roomCode: string;
  playerName: string;
  avatar: string;
}

interface TriviaAnswerData {
  roomCode: string;
  respuesta: number;
  preguntaId: string;
}

interface ChallengeActionData {
  roomCode: string;
  aceptado: boolean;
  votacionAprobada: boolean;
}

interface VoteData {
  roomCode: string;
  votoId: string;
  valor: boolean;
}

interface RespuestaYonuncaData {
  roomCode: string;
  hizoAccion: boolean;
}

interface SeleccionVerdadORetoData {
  roomCode: string;
  eleccion: "verdad" | "reto";
}

interface ChatMessageData {
  roomCode: string;
  msg: string;
}

interface SkipRoundVoteData {
  roomCode: string;
  votar: boolean;
}

const chatRateLimits: Map<string, number[]> = new Map();
const activeVotes: Map<string, Map<string, boolean>> = new Map();
const skipVotes: Map<string, Map<string, boolean>> = new Map();

function sanitizeMessage(msg: string): string {
  return msg.replace(/<[^>]*>/g, "").slice(0, 200);
}

function checkRateLimit(playerId: string): boolean {
  const now = Date.now();
  const timestamps = chatRateLimits.get(playerId) || [];
  const recent = timestamps.filter((t) => now - t < 10000);
  if (recent.length >= 5) {
    return false;
  }
  recent.push(now);
  chatRateLimits.set(playerId, recent);
  return true;
}

function findPlayerRoom(socketId: string): { codigo: string; playerId: string } | null {
  for (const [codigo, room] of rooms) {
    for (const [playerId, player] of room.jugadores) {
      if (player.socketId === socketId) {
        return { codigo, playerId };
      }
    }
  }
  return null;
}

function registerHandlers(io: Server, socket: Socket): void {
  socket.on("join_room", (data: JoinRoomData) => {
    const { roomCode, playerName, avatar } = data;

    if (!roomCode || !playerName || !avatar) {
      socket.emit("error_msg", { message: "Datos incompletos" });
      return;
    }

    const room = getRoom(roomCode);
    if (!room) {
      socket.emit("error_msg", { message: "Sala no encontrada" });
      return;
    }

    const playerId = socket.id;
    const player: RoomPlayer = {
      id: playerId,
      nombre: playerName,
      avatar,
      esAnfitrion: room.jugadores.size === 0,
      listo: false,
      socketId: socket.id,
    };

    const added = addPlayer(roomCode, player);
    if (!added) {
      socket.emit("error_msg", { message: "Sala llena o no disponible" });
      return;
    }

    socket.join(roomCode);

    const players = getPlayers(roomCode);
    io.to(roomCode).emit("player_joined", { players });
    socket.emit("room_state", {
      codigo: room.codigo,
      nombre: room.nombre,
      configuracion: room.configuracion,
      estado: room.estado,
      players,
    });
  });

  socket.on("leave_room", (data: { roomCode: string }) => {
    const { roomCode } = data;
    const remaining = removePlayer(roomCode, socket.id);
    socket.leave(roomCode);
    io.to(roomCode).emit("player_left", { players: remaining, playerId: socket.id });

    if (remaining.length === 0) {
      deleteRoom(roomCode);
    }
  });

  socket.on("player_ready", (data: { roomCode: string; ready: boolean }) => {
    const { roomCode, ready } = data;
    setPlayerReady(roomCode, socket.id, ready);
    const players = getPlayers(roomCode);
    io.to(roomCode).emit("player_ready_update", { players });
  });

  socket.on("start_game", (data: { roomCode: string }) => {
    const { roomCode } = data;
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit("error_msg", { message: "Sala no encontrada" });
      return;
    }

    const anfitrion = room.jugadores.get(socket.id);
    if (!anfitrion || !anfitrion.esAnfitrion) {
      socket.emit("error_msg", { message: "Solo el anfitrion puede iniciar" });
      return;
    }

    if (room.jugadores.size < 2) {
      socket.emit("error_msg", { message: "Se necesitan al menos 2 jugadores" });
      return;
    }

    const playerStates: PlayerState[] = Array.from(room.jugadores.values()).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      avatar: p.avatar,
      puntaje: 0,
      tragos: 0,
      respuestasCorrectas: 0,
      monedasGanadas: 0,
    }));

    const engine = new GameEngine(room.configuracion, playerStates);
    room.gameEngine = engine;
    setRoomState(roomCode, "jugando");

    const primeraRonda = engine.siguienteRonda();
    io.to(roomCode).emit("game_started", {
      configuracion: room.configuracion,
      jugadores: playerStates,
      ronda: primeraRonda,
    });
  });

  socket.on("trivia_answer", (data: TriviaAnswerData) => {
    const { roomCode, respuesta, preguntaId } = data;
    const room = getRoom(roomCode);
    if (!room || !room.gameEngine) {
      return;
    }

    const engine = room.gameEngine as GameEngine;
    const resultado = engine.procesarRespuestaTrivia(socket.id, respuesta, preguntaId);
    io.to(roomCode).emit("trivia_results", resultado);

    if (engine.estaFinalizado()) {
      setRoomState(roomCode, "finalizada");
      io.to(roomCode).emit("game_over", {
        resultados: engine.getResultados(),
        podio: engine.getPodio(),
      });
    } else {
      const siguiente = engine.siguienteRonda();
      io.to(roomCode).emit("next_round", siguiente);
    }
  });

  socket.on("challenge_action", (data: ChallengeActionData) => {
    const { roomCode, aceptado, votacionAprobada } = data;
    const room = getRoom(roomCode);
    if (!room || !room.gameEngine) {
      return;
    }

    const engine = room.gameEngine as GameEngine;
    const resultado = engine.procesarReto(socket.id, aceptado, votacionAprobada);
    io.to(roomCode).emit("challenge_results", resultado);

    if (engine.estaFinalizado()) {
      setRoomState(roomCode, "finalizada");
      io.to(roomCode).emit("game_over", {
        resultados: engine.getResultados(),
        podio: engine.getPodio(),
      });
    } else {
      const siguiente = engine.siguienteRonda();
      io.to(roomCode).emit("next_round", siguiente);
    }
  });

  socket.on("vote", (data: VoteData) => {
    const { roomCode, votoId, valor } = data;
    const room = getRoom(roomCode);
    if (!room) {
      return;
    }

    if (!activeVotes.has(roomCode)) {
      activeVotes.set(roomCode, new Map());
    }

    const roomVotes = activeVotes.get(roomCode)!;
    roomVotes.set(socket.id, valor);

    const totalPlayers = room.jugadores.size;
    const totalVotes = roomVotes.size;

    if (totalVotes >= totalPlayers) {
      const votosAprobados = Array.from(roomVotes.values()).filter((v) => v).length;
      const aprobado = votosAprobados > totalPlayers / 2;
      io.to(roomCode).emit("vote_results", {
        votoId,
        aprobado,
        votosAprobados,
        votosTotales: totalPlayers,
      });
      activeVotes.delete(roomCode);
    }
  });

  socket.on("respuesta_yonunca", (data: RespuestaYonuncaData) => {
    const { roomCode, hizoAccion } = data;
    const room = getRoom(roomCode);
    if (!room || !room.gameEngine) {
      return;
    }

    const engine = room.gameEngine as GameEngine;
    const resultado = engine.procesarYoNunca(socket.id, hizoAccion);
    io.to(roomCode).emit("yonunca_results", resultado);

    if (engine.estaFinalizado()) {
      setRoomState(roomCode, "finalizada");
      io.to(roomCode).emit("game_over", {
        resultados: engine.getResultados(),
        podio: engine.getPodio(),
      });
    } else {
      const siguiente = engine.siguienteRonda();
      io.to(roomCode).emit("next_round", siguiente);
    }
  });

  socket.on("seleccion_verdadoroto", (data: SeleccionVerdadORetoData) => {
    const { roomCode, eleccion } = data;
    const room = getRoom(roomCode);
    if (!room || !room.gameEngine) {
      return;
    }

    const engine = room.gameEngine as GameEngine;
    const resultado = engine.procesarVerdadOReto(socket.id, eleccion);
    io.to(roomCode).emit("verdadoroto_results", resultado);

    if (engine.estaFinalizado()) {
      setRoomState(roomCode, "finalizada");
      io.to(roomCode).emit("game_over", {
        resultados: engine.getResultados(),
        podio: engine.getPodio(),
      });
    } else {
      const siguiente = engine.siguienteRonda();
      io.to(roomCode).emit("next_round", siguiente);
    }
  });

  socket.on("chat_message", (data: ChatMessageData) => {
    const { roomCode, msg } = data;
    const room = getRoom(roomCode);
    if (!room) {
      return;
    }

    const player = room.jugadores.get(socket.id);
    if (!player) {
      return;
    }

    if (!checkRateLimit(socket.id)) {
      socket.emit("error_msg", { message: "Limite de mensajes alcanzado" });
      return;
    }

    const sanitized = sanitizeMessage(msg);
    if (sanitized.length === 0) {
      return;
    }

    io.to(roomCode).emit("chat_message", {
      nombre: player.nombre,
      avatar: player.avatar,
      msg: sanitized,
      timestamp: Date.now(),
    });
  });

  socket.on("skip_round_vote", (data: SkipRoundVoteData) => {
    const { roomCode, votar } = data;
    const room = getRoom(roomCode);
    if (!room) {
      return;
    }

    if (!skipVotes.has(roomCode)) {
      skipVotes.set(roomCode, new Map());
    }

    const roomSkipVotes = skipVotes.get(roomCode)!;
    roomSkipVotes.set(socket.id, votar);

    const totalPlayers = room.jugadores.size;
    const totalVotos = roomSkipVotes.size;

    if (totalVotos >= totalPlayers) {
      const votosSi = Array.from(roomSkipVotes.values()).filter((v) => v).length;
      const saltar = votosSi > totalPlayers / 2;
      skipVotes.delete(roomCode);

      if (saltar && room.gameEngine) {
        const engine = room.gameEngine as GameEngine;
        const siguiente = engine.siguienteRonda();
        io.to(roomCode).emit("next_round", siguiente);
      }

      io.to(roomCode).emit("skip_vote_results", {
        saltar,
        votosSi,
        votosTotales: totalPlayers,
      });
    }
  });

  socket.on("disconnect", () => {
    const location = findPlayerRoom(socket.id);
    if (location) {
      const remaining = removePlayer(location.codigo, location.playerId);
      io.to(location.codigo).emit("player_left", {
        players: remaining,
        playerId: location.playerId,
      });

      if (remaining.length === 0) {
        deleteRoom(location.codigo);
      }
    }

    chatRateLimits.delete(socket.id);
  });
}

export { registerHandlers };
