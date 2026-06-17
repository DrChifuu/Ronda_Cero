interface Player {
  id: string;
  nombre: string;
  avatar: string;
  puntaje: number;
  tragos: number;
}

interface TriviaQuestion {
  id: string;
  pregunta: string;
  opciones: string[];
  correcta: number;
}

interface Reto {
  id: string;
  descripcion: string;
  dificultad: 'facil' | 'medio' | 'dificil';
}

interface AfirmacionYoNunca {
  id: string;
  texto: string;
}

interface PreguntaVerdad {
  id: string;
  texto: string;
}

interface RetoVerdad {
  id: string;
  descripcion: string;
}

interface RoomState {
  players: Map<string, Player>;
  rondaActual: number;
  modoActual: string;
  barraColectiva: number;
  preguntasUsadas: Set<string>;
  retosUsados: Set<string>;
  afirmacionesUsadas: Set<string>;
  votos: Map<string, boolean>;
  preguntaActual: TriviaQuestion | null;
  retoActual: Reto | null;
  afirmacionActual: AfirmacionYoNunca | null;
  verdadORetoActual: { tipo: string; data: PreguntaVerdad | RetoVerdad } | null;
}

const TRIVIA_BANK: TriviaQuestion[] = [
  { id: 't1', pregunta: '¿Cuál es el país más grande del mundo?', opciones: ['China', 'Estados Unidos', 'Rusia', 'Canadá'], correcta: 2 },
  { id: 't2', pregunta: '¿En qué año llegó el hombre a la Luna?', opciones: ['1965', '1969', '1971', '1973'], correcta: 1 },
  { id: 't3', pregunta: '¿Cuál es el elemento químico con símbolo "Au"?', opciones: ['Plata', 'Aluminio', 'Oro', 'Argón'], correcta: 2 },
  { id: 't4', pregunta: '¿Quién pintó la Mona Lisa?', opciones: ['Miguel Ángel', 'Leonardo da Vinci', 'Rafael', 'Botticelli'], correcta: 1 },
  { id: 't5', pregunta: '¿Cuál es el océano más grande?', opciones: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], correcta: 3 },
  { id: 't6', pregunta: '¿Cuántos huesos tiene el cuerpo humano adulto?', opciones: ['186', '206', '226', '256'], correcta: 1 },
  { id: 't7', pregunta: '¿Cuál es la capital de Australia?', opciones: ['Sídney', 'Melbourne', 'Canberra', 'Brisbane'], correcta: 2 },
  { id: 't8', pregunta: '¿Qué gas respiramos principalmente?', opciones: ['Oxígeno', 'Nitrógeno', 'CO2', 'Hidrógeno'], correcta: 1 },
  { id: 't9', pregunta: '¿En qué país se inventó la pizza?', opciones: ['Francia', 'Grecia', 'Italia', 'España'], correcta: 2 },
  { id: 't10', pregunta: '¿Cuál es el río más largo del mundo?', opciones: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'], correcta: 1 },
  { id: 't11', pregunta: '¿Qué planeta es conocido como el planeta rojo?', opciones: ['Venus', 'Júpiter', 'Marte', 'Saturno'], correcta: 2 },
  { id: 't12', pregunta: '¿Cuántos continentes hay?', opciones: ['5', '6', '7', '8'], correcta: 2 },
  { id: 't13', pregunta: '¿Quién escribió "Cien años de soledad"?', opciones: ['Mario Vargas Llosa', 'Gabriel García Márquez', 'Julio Cortázar', 'Pablo Neruda'], correcta: 1 },
  { id: 't14', pregunta: '¿Cuál es el metal más ligero?', opciones: ['Aluminio', 'Litio', 'Titanio', 'Magnesio'], correcta: 1 },
  { id: 't15', pregunta: '¿En qué año cayó el Muro de Berlín?', opciones: ['1987', '1988', '1989', '1990'], correcta: 2 },
  { id: 't16', pregunta: '¿Cuál es el animal terrestre más rápido?', opciones: ['León', 'Guepardo', 'Gacela', 'Caballo'], correcta: 1 },
  { id: 't17', pregunta: '¿Qué instrumento tiene 88 teclas?', opciones: ['Órgano', 'Acordeón', 'Piano', 'Clavicordio'], correcta: 2 },
  { id: 't18', pregunta: '¿Cuál es la moneda de Japón?', opciones: ['Yuan', 'Won', 'Yen', 'Ringgit'], correcta: 2 },
  { id: 't19', pregunta: '¿Qué vitamina produce el sol en nuestra piel?', opciones: ['Vitamina A', 'Vitamina C', 'Vitamina D', 'Vitamina K'], correcta: 2 },
  { id: 't20', pregunta: '¿Cuántos jugadores tiene un equipo de fútbol?', opciones: ['9', '10', '11', '12'], correcta: 2 },
  { id: 't21', pregunta: '¿Qué país tiene forma de bota?', opciones: ['España', 'Grecia', 'Italia', 'Portugal'], correcta: 2 },
  { id: 't22', pregunta: '¿Cuál es el hueso más largo del cuerpo?', opciones: ['Tibia', 'Húmero', 'Fémur', 'Radio'], correcta: 2 }
];

const RETOS_BANK: Reto[] = [
  { id: 'r1', descripcion: 'Imita a otro jugador durante 30 segundos', dificultad: 'facil' },
  { id: 'r2', descripcion: 'Canta el coro de tu canción favorita', dificultad: 'facil' },
  { id: 'r3', descripcion: 'Haz 10 sentadillas ahora mismo', dificultad: 'facil' },
  { id: 'r4', descripcion: 'Cuenta un chiste y haz reír al grupo', dificultad: 'medio' },
  { id: 'r5', descripcion: 'Baila sin música durante 20 segundos', dificultad: 'medio' },
  { id: 'r6', descripcion: 'Imita a un animal elegido por el grupo', dificultad: 'facil' },
  { id: 'r7', descripcion: 'Di un trabalenguas sin equivocarte', dificultad: 'medio' },
  { id: 'r8', descripcion: 'Haz tu mejor imitación de un famoso', dificultad: 'medio' },
  { id: 'r9', descripcion: 'Llama a un contacto y canta feliz cumpleaños', dificultad: 'dificil' },
  { id: 'r10', descripcion: 'Actúa una escena de película dramática', dificultad: 'medio' },
  { id: 'r11', descripcion: 'Haz una declaración dramática mirando a los ojos de otro jugador', dificultad: 'facil' },
  { id: 'r12', descripcion: 'Inventa un rap sobre la persona a tu derecha', dificultad: 'dificil' },
  { id: 'r13', descripcion: 'Haz 15 flexiones de pecho', dificultad: 'dificil' },
  { id: 'r14', descripcion: 'Habla con acento extranjero por 2 rondas', dificultad: 'medio' },
  { id: 'r15', descripcion: 'Muestra tu mejor cara de modelo por 10 segundos', dificultad: 'facil' },
  { id: 'r16', descripcion: 'Recita el abecedario al revés sin equivocarte', dificultad: 'dificil' }
];

const YONUNCA_BANK: AfirmacionYoNunca[] = [
  { id: 'yn1', texto: 'Yo nunca nunca me he quedado dormido en clase' },
  { id: 'yn2', texto: 'Yo nunca nunca he mentido sobre mi edad' },
  { id: 'yn3', texto: 'Yo nunca nunca he viajado solo a otro país' },
  { id: 'yn4', texto: 'Yo nunca nunca he comido algo del suelo' },
  { id: 'yn5', texto: 'Yo nunca nunca he fingido estar enfermo para no trabajar' },
  { id: 'yn6', texto: 'Yo nunca nunca he llorado viendo una película' },
  { id: 'yn7', texto: 'Yo nunca nunca he enviado un mensaje a la persona equivocada' },
  { id: 'yn8', texto: 'Yo nunca nunca he bailado en público estando sobrio' },
  { id: 'yn9', texto: 'Yo nunca nunca he robado algo, aunque sea pequeño' },
  { id: 'yn10', texto: 'Yo nunca nunca he tenido un crush con un profesor' },
  { id: 'yn11', texto: 'Yo nunca nunca he cantado en karaoke' },
  { id: 'yn12', texto: 'Yo nunca nunca he espiado el celular de alguien' },
  { id: 'yn13', texto: 'Yo nunca nunca he mentido en este juego' },
  { id: 'yn14', texto: 'Yo nunca nunca me he enamorado a primera vista' },
  { id: 'yn15', texto: 'Yo nunca nunca he hecho algo ilegal' },
  { id: 'yn16', texto: 'Yo nunca nunca he rechazado a alguien en público' }
];

const VERDAD_BANK: PreguntaVerdad[] = [
  { id: 'v1', texto: '¿Cuál es tu mayor vergüenza?' },
  { id: 'v2', texto: '¿A quién del grupo le contarías un secreto?' },
  { id: 'v3', texto: '¿Cuál ha sido tu peor cita?' },
  { id: 'v4', texto: '¿Qué es lo más loco que has hecho por amor?' },
  { id: 'v5', texto: '¿Cuál es tu guilty pleasure más grande?' },
  { id: 'v6', texto: '¿Mentirías para proteger a un amigo? ¿En qué caso?' },
  { id: 'v7', texto: '¿Qué opinas realmente del outfit de alguien aquí?' },
  { id: 'v8', texto: '¿Cuál es la mentira más grande que has dicho?' },
  { id: 'v9', texto: '¿Si pudieras borrar un recuerdo, cuál sería?' },
  { id: 'v10', texto: '¿Qué harías si ganaras la lotería mañana?' },
  { id: 'v11', texto: '¿A quién del grupo invitarías a una isla desierta?' },
  { id: 'v12', texto: '¿Cuál es tu mayor miedo irracional?' }
];

const RETOS_VERDAD_BANK: RetoVerdad[] = [
  { id: 'rv1', descripcion: 'Deja que el grupo publique algo en tus redes sociales' },
  { id: 'rv2', descripcion: 'Imita al jugador de tu izquierda por 1 minuto' },
  { id: 'rv3', descripcion: 'Muestra las últimas 5 fotos de tu galería' },
  { id: 'rv4', descripcion: 'Envía un audio cantando al último contacto de WhatsApp' },
  { id: 'rv5', descripcion: 'Haz una serenata al jugador de tu derecha' },
  { id: 'rv6', descripcion: 'Deja que alguien del grupo te maquille o despeine' },
  { id: 'rv7', descripcion: 'Cuenta tu anécdota más vergonzosa con actuación' },
  { id: 'rv8', descripcion: 'Haz 20 abdominales mientras cantas' },
  { id: 'rv9', descripcion: 'Llama a tu ex o crush y dile algo bonito (o finge)' },
  { id: 'rv10', descripcion: 'Intercambia una prenda con el jugador de tu derecha' },
  { id: 'rv11', descripcion: 'Actúa como si fueras un presentador de noticias por 30 segundos' }
];

export class GameLogic {
  rooms: Map<string, RoomState>;

  constructor() {
    this.rooms = new Map();
  }

  private getOrCreateRoom(roomCode: string): RoomState {
    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, {
        players: new Map(),
        rondaActual: 0,
        modoActual: '',
        barraColectiva: 0,
        preguntasUsadas: new Set(),
        retosUsados: new Set(),
        afirmacionesUsadas: new Set(),
        votos: new Map(),
        preguntaActual: null,
        retoActual: null,
        afirmacionActual: null,
        verdadORetoActual: null
      });
    }
    return this.rooms.get(roomCode)!;
  }

  addPlayer(roomCode: string, player: Player): void {
    const room = this.getOrCreateRoom(roomCode);
    room.players.set(player.id, player);
  }

  removePlayer(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.players.delete(playerId);
      if (room.players.size === 0) {
        this.rooms.delete(roomCode);
      }
    }
  }

  getPlayers(roomCode: string): Player[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.players.values());
  }

  findRoomByPlayer(playerId: string): string | null {
    for (const [roomCode, room] of this.rooms) {
      if (room.players.has(playerId)) {
        return roomCode;
      }
    }
    return null;
  }

  getBarraColectiva(roomCode: string): number {
    const room = this.rooms.get(roomCode);
    return room ? room.barraColectiva : 0;
  }

  private getRandomFromBank<T extends { id: string }>(bank: T[], used: Set<string>): T | null {
    const available = bank.filter(item => !used.has(item.id));
    if (available.length === 0) {
      used.clear();
      return bank[Math.floor(Math.random() * bank.length)];
    }
    const chosen = available[Math.floor(Math.random() * available.length)];
    used.add(chosen.id);
    return chosen;
  }

  startRound(roomCode: string, mode: string): { type: string; data: unknown } {
    const room = this.getOrCreateRoom(roomCode);
    room.rondaActual += 1;
    room.modoActual = mode;
    room.votos.clear();

    switch (mode) {
      case 'trivia': {
        const pregunta = this.getRandomFromBank(TRIVIA_BANK, room.preguntasUsadas);
        room.preguntaActual = pregunta;
        return {
          type: 'trivia',
          data: {
            pregunta: pregunta?.pregunta,
            opciones: pregunta?.opciones,
            questionId: pregunta?.id,
            ronda: room.rondaActual
          }
        };
      }
      case 'reto': {
        const reto = this.getRandomFromBank(RETOS_BANK, room.retosUsados);
        room.retoActual = reto;
        const playerIds = Array.from(room.players.keys());
        const assignedPlayer = playerIds[Math.floor(Math.random() * playerIds.length)];
        return {
          type: 'reto',
          data: {
            reto: reto?.descripcion,
            dificultad: reto?.dificultad,
            jugadorAsignado: assignedPlayer,
            ronda: room.rondaActual
          }
        };
      }
      case 'verdadero_falso': {
        const afirmacion = this.getRandomFromBank(YONUNCA_BANK, room.afirmacionesUsadas);
        room.afirmacionActual = afirmacion;
        return {
          type: 'verdadero_falso',
          data: {
            afirmacion: afirmacion?.texto,
            ronda: room.rondaActual
          }
        };
      }
      case 'yonunca': {
        const afirmacion = this.getRandomFromBank(YONUNCA_BANK, room.afirmacionesUsadas);
        room.afirmacionActual = afirmacion;
        return {
          type: 'yonunca',
          data: {
            afirmacion: afirmacion?.texto,
            ronda: room.rondaActual
          }
        };
      }
      case 'verdadoroto': {
        const playerIds = Array.from(room.players.keys());
        const assignedPlayer = playerIds[Math.floor(Math.random() * playerIds.length)];
        return {
          type: 'verdadoroto',
          data: {
            jugadorAsignado: assignedPlayer,
            ronda: room.rondaActual
          }
        };
      }
      default:
        return { type: 'unknown', data: null };
    }
  }

  processTriviaAnswer(roomCode: string, playerId: string, answer: number, questionId: string): { correct: boolean; correctAnswer: number; scores: Player[]; barraColectiva: number; todosBeben: boolean } {
    const room = this.rooms.get(roomCode);
    if (!room || !room.preguntaActual) {
      return { correct: false, correctAnswer: -1, scores: [], barraColectiva: 0, todosBeben: false };
    }

    const correct = answer === room.preguntaActual.correcta;
    const player = room.players.get(playerId);

    if (player) {
      if (correct) {
        player.puntaje += 10;
      } else {
        player.tragos += 1;
        room.barraColectiva += 5;
      }
    }

    const todosBeben = room.barraColectiva >= 100;
    if (todosBeben) {
      room.barraColectiva = 0;
      for (const p of room.players.values()) {
        p.tragos += 1;
      }
    }

    return {
      correct,
      correctAnswer: room.preguntaActual.correcta,
      scores: Array.from(room.players.values()),
      barraColectiva: room.barraColectiva,
      todosBeben
    };
  }

  processReto(roomCode: string, playerId: string, accepted: boolean): { reto: string; resultado: unknown } {
    const room = this.rooms.get(roomCode);
    if (!room || !room.retoActual) {
      return { reto: '', resultado: null };
    }

    const player = room.players.get(playerId);
    if (!player) {
      return { reto: room.retoActual.descripcion, resultado: null };
    }

    if (accepted) {
      const puntos = room.retoActual.dificultad === 'facil' ? 5 : room.retoActual.dificultad === 'medio' ? 10 : 20;
      player.puntaje += puntos;
      return {
        reto: room.retoActual.descripcion,
        resultado: { aceptado: true, jugador: player.nombre, puntosGanados: puntos }
      };
    } else {
      player.tragos += 2;
      room.barraColectiva += 10;
      return {
        reto: room.retoActual.descripcion,
        resultado: { aceptado: false, jugador: player.nombre, tragos: 2 }
      };
    }
  }

  processVote(roomCode: string, playerId: string, vote: boolean): { completa: boolean; aprobada: boolean; resultado: unknown } {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { completa: false, aprobada: false, resultado: null };
    }

    room.votos.set(playerId, vote);
    const totalPlayers = room.players.size;
    const totalVotes = room.votos.size;

    if (totalVotes >= totalPlayers) {
      const approvedVotes = Array.from(room.votos.values()).filter(v => v).length;
      const aprobada = approvedVotes > totalPlayers / 2;

      if (aprobada) {
        for (const p of room.players.values()) {
          p.puntaje += 3;
        }
      }

      const resultado = {
        votosTotales: totalVotes,
        votosAprobados: approvedVotes,
        aprobada
      };

      room.votos.clear();
      return { completa: true, aprobada, resultado };
    }

    return { completa: false, aprobada: false, resultado: null };
  }

  processYoNunca(roomCode: string, playerId: string, hizoAccion: boolean): { resultados: unknown } {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { resultados: null };
    }

    const player = room.players.get(playerId);
    if (player && hizoAccion) {
      player.tragos += 1;
      room.barraColectiva += 3;
    } else if (player) {
      player.puntaje += 2;
    }

    const respuestas: Array<{ nombre: string; hizoAccion: boolean }> = [];
    respuestas.push({ nombre: player?.nombre || '', hizoAccion });

    const todosRespondieron = respuestas.length === room.players.size;

    return {
      resultados: {
        jugador: player?.nombre,
        hizoAccion,
        todosRespondieron,
        jugadoresQueBeben: hizoAccion ? [player?.nombre] : []
      }
    };
  }

  processVerdadOReto(roomCode: string, playerId: string, eleccion: string): { data: unknown } {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { data: null };
    }

    const player = room.players.get(playerId);

    if (eleccion === 'verdad') {
      const pregunta = VERDAD_BANK[Math.floor(Math.random() * VERDAD_BANK.length)];
      room.verdadORetoActual = { tipo: 'verdad', data: pregunta };
      if (player) player.puntaje += 5;
      return {
        data: {
          tipo: 'verdad',
          pregunta: pregunta.texto,
          jugador: player?.nombre
        }
      };
    } else {
      const reto = RETOS_VERDAD_BANK[Math.floor(Math.random() * RETOS_VERDAD_BANK.length)];
      room.verdadORetoActual = { tipo: 'reto', data: reto };
      if (player) player.puntaje += 10;
      return {
        data: {
          tipo: 'reto',
          reto: reto.descripcion,
          jugador: player?.nombre
        }
      };
    }
  }

  getResults(roomCode: string): Player[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.players.values()).sort((a, b) => b.puntaje - a.puntaje);
  }
}
