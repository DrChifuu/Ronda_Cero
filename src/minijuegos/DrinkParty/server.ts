import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GameLogic } from './game-logic';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const server = http.createServer(app);
const io = new Server(server, {
  path: '/drinkparty/socket.io',
  cors: { origin: '*' }
});

const gameLogic = new GameLogic();

app.use('/drinkparty', express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`[DrinkParty] Cliente conectado: ${socket.id}`);

  socket.on('join_game', (data: { roomCode: string; playerName: string; avatar: string }) => {
    const { roomCode, playerName, avatar } = data;
    socket.join(roomCode);
    gameLogic.addPlayer(roomCode, {
      id: socket.id,
      nombre: playerName,
      avatar,
      puntaje: 0,
      tragos: 0
    });
    const players = gameLogic.getPlayers(roomCode);
    io.to(roomCode).emit('player_list', players);
    socket.emit('joined', { playerId: socket.id, roomCode });
  });

  socket.on('start_round', (data: { roomCode: string; mode: string }) => {
    const { roomCode, mode } = data;
    const result = gameLogic.startRound(roomCode, mode);
    io.to(roomCode).emit('round_started', result);
  });

  socket.on('trivia_answer', (data: { roomCode: string; playerId: string; answer: number; questionId: string }) => {
    const { roomCode, playerId, answer, questionId } = data;
    const result = gameLogic.processTriviaAnswer(roomCode, playerId, answer, questionId);
    socket.emit('trivia_result', result);
    if (result.todosBeben) {
      io.to(roomCode).emit('todos_beben', { reason: 'trivia_timeout' });
    }
    const players = gameLogic.getPlayers(roomCode);
    io.to(roomCode).emit('scores_update', { scores: players, barraColectiva: result.barraColectiva });
  });

  socket.on('challenge_action', (data: { roomCode: string; playerId: string; accepted: boolean }) => {
    const { roomCode, playerId, accepted } = data;
    const result = gameLogic.processReto(roomCode, playerId, accepted);
    io.to(roomCode).emit('challenge_result', result);
    const players = gameLogic.getPlayers(roomCode);
    io.to(roomCode).emit('scores_update', { scores: players, barraColectiva: gameLogic.getBarraColectiva(roomCode) });
  });

  socket.on('vote', (data: { roomCode: string; playerId: string; vote: boolean }) => {
    const { roomCode, playerId, vote } = data;
    const result = gameLogic.processVote(roomCode, playerId, vote);
    if (result.completa) {
      io.to(roomCode).emit('vote_result', result);
    } else {
      socket.emit('vote_received', { playerId });
    }
  });

  socket.on('respuesta_yonunca', (data: { roomCode: string; playerId: string; hizoAccion: boolean }) => {
    const { roomCode, playerId, hizoAccion } = data;
    const result = gameLogic.processYoNunca(roomCode, playerId, hizoAccion);
    io.to(roomCode).emit('yonunca_result', result);
    const players = gameLogic.getPlayers(roomCode);
    io.to(roomCode).emit('scores_update', { scores: players, barraColectiva: gameLogic.getBarraColectiva(roomCode) });
  });

  socket.on('seleccion_verdadoroto', (data: { roomCode: string; playerId: string; eleccion: string }) => {
    const { roomCode, playerId, eleccion } = data;
    const result = gameLogic.processVerdadOReto(roomCode, playerId, eleccion);
    io.to(roomCode).emit('verdadoroto_result', result);
  });

  socket.on('chat_message', (data: { roomCode: string; msg: string; playerName: string }) => {
    const { roomCode, msg, playerName } = data;
    const sanitized = msg.replace(/<[^>]*>/g, '').substring(0, 200);
    io.to(roomCode).emit('chat_message', {
      playerName,
      msg: sanitized,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`[DrinkParty] Cliente desconectado: ${socket.id}`);
    const roomCode = gameLogic.findRoomByPlayer(socket.id);
    if (roomCode) {
      gameLogic.removePlayer(roomCode, socket.id);
      const players = gameLogic.getPlayers(roomCode);
      io.to(roomCode).emit('player_list', players);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[DrinkParty] Servidor escuchando en puerto ${PORT}`);
  if (process.send) {
    process.send('ready');
  }
});
