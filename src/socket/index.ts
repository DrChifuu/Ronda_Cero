import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { registerHandlers } from "./handlers";
import { rooms, deleteRoom } from "./rooms";

const STALE_ROOM_TIMEOUT_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function setupSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket conectado: ${socket.id}`);
    registerHandlers(io, socket);
  });

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [codigo, room] of rooms) {
      const elapsed = now - room.createdAt.getTime();
      if (elapsed > STALE_ROOM_TIMEOUT_MS && room.estado === "lobby") {
        deleteRoom(codigo);
        console.log(`Sala eliminada por inactividad: ${codigo}`);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  return io;
}

function cleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

export { setupSocketIO, cleanup };
