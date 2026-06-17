import {
  seleccionarPregunta,
  calcularResultado,
  verificarBarraLlena,
  reiniciarBarra,
  TriviaPregunta,
} from "./trivia";
import {
  seleccionarReto,
  calcularResultadoReto,
  Reto,
} from "./retos";
import {
  seleccionarAfirmacion,
  calcularResultadoYoNunca,
  AfirmacionYonunca,
} from "./yonunca";
import {
  seleccionarPreguntaVerdad,
  seleccionarRetoVerdad,
  PreguntaVerdad,
  RetoVerdad,
} from "./verdadoroto";

interface GameConfig {
  modos: string[];
  rondas: number;
  tiempo: number;
  dificultad: string;
  barraPorcentaje: number;
}

interface PlayerState {
  id: string;
  nombre: string;
  avatar: string;
  puntaje: number;
  tragos: number;
  respuestasCorrectas: number;
  monedasGanadas: number;
}

interface RoundResult {
  tipo: string;
  jugadores: PlayerState[];
  barraColectiva: number;
  todosBeben: boolean;
}

export class GameEngine {
  private config: GameConfig;
  private jugadores: PlayerState[];
  private rondaActual: number;
  private barraColectiva: number;
  private preguntasUsadas: Set<string>;
  private retosUsados: Set<string>;
  private afirmacionesUsadas: Set<string>;
  private verdadesUsadas: Set<string>;
  private retosVerdadUsados: Set<string>;

  constructor(config: GameConfig, jugadores: PlayerState[]) {
    this.config = config;
    this.jugadores = jugadores;
    this.rondaActual = 0;
    this.barraColectiva = 0;
    this.preguntasUsadas = new Set();
    this.retosUsados = new Set();
    this.afirmacionesUsadas = new Set();
    this.verdadesUsadas = new Set();
    this.retosVerdadUsados = new Set();
  }

  siguienteRonda(): { tipo: string; data: unknown } {
    this.rondaActual++;
    const modo = this.config.modos[Math.floor(Math.random() * this.config.modos.length)];

    switch (modo) {
      case "trivia": {
        const pregunta = seleccionarPregunta(this.config.dificultad, this.preguntasUsadas);
        this.preguntasUsadas.add(pregunta.id);
        return { tipo: "trivia", data: pregunta };
      }
      case "retos": {
        const reto = seleccionarReto(this.config.dificultad);
        this.retosUsados.add(reto.id);
        return { tipo: "retos", data: reto };
      }
      case "yonunca": {
        const afirmacion = seleccionarAfirmacion(undefined, this.afirmacionesUsadas);
        this.afirmacionesUsadas.add(afirmacion.id);
        return { tipo: "yonunca", data: afirmacion };
      }
      case "verdadoroto": {
        const eleccion = Math.random() < 0.5 ? "verdad" : "reto";
        if (eleccion === "verdad") {
          const pregunta = seleccionarPreguntaVerdad(this.verdadesUsadas);
          this.verdadesUsadas.add(pregunta.id);
          return { tipo: "verdadoroto", data: { eleccion: "verdad", contenido: pregunta } };
        }
        const reto = seleccionarRetoVerdad(this.retosVerdadUsados);
        this.retosVerdadUsados.add(reto.id);
        return { tipo: "verdadoroto", data: { eleccion: "reto", contenido: reto } };
      }
      default: {
        const pregunta = seleccionarPregunta(this.config.dificultad, this.preguntasUsadas);
        this.preguntasUsadas.add(pregunta.id);
        return { tipo: "trivia", data: pregunta };
      }
    }
  }

  procesarRespuestaTrivia(jugadorId: string, respuesta: number, preguntaId: string): RoundResult {
    const pregunta = seleccionarPregunta(this.config.dificultad, new Set());
    const esCorrecta = respuesta === pregunta.respuestaCorrecta;
    const resultado = calcularResultado(esCorrecta, this.config.barraPorcentaje);

    const jugador = this.jugadores.find((j) => j.id === jugadorId);
    if (jugador) {
      jugador.puntaje += resultado.puntosGanados;
      jugador.tragos += resultado.tragos;
      if (esCorrecta) {
        jugador.respuestasCorrectas++;
        jugador.monedasGanadas += resultado.puntosGanados;
      }
    }

    this.barraColectiva += resultado.barraIncremento;
    const todosBeben = verificarBarraLlena(this.barraColectiva);
    if (todosBeben) {
      this.jugadores.forEach((j) => {
        j.tragos += 1;
      });
      this.barraColectiva = reiniciarBarra();
    }

    return {
      tipo: "trivia",
      jugadores: [...this.jugadores],
      barraColectiva: this.barraColectiva,
      todosBeben,
    };
  }

  procesarReto(jugadorId: string, aceptado: boolean, votacionAprobada: boolean): RoundResult {
    const resultado = calcularResultadoReto(aceptado, votacionAprobada);

    const jugador = this.jugadores.find((j) => j.id === jugadorId);
    if (jugador) {
      jugador.puntaje += resultado.puntos;
      jugador.tragos += resultado.tragos;
      if (resultado.puntos > 0) {
        jugador.monedasGanadas += resultado.puntos;
      }
    }

    return {
      tipo: "retos",
      jugadores: [...this.jugadores],
      barraColectiva: this.barraColectiva,
      todosBeben: false,
    };
  }

  procesarYoNunca(jugadorId: string, hizoAccion: boolean): RoundResult {
    const resultado = calcularResultadoYoNunca(hizoAccion);

    const jugador = this.jugadores.find((j) => j.id === jugadorId);
    if (jugador) {
      jugador.tragos += resultado.tragos;
    }

    return {
      tipo: "yonunca",
      jugadores: [...this.jugadores],
      barraColectiva: this.barraColectiva,
      todosBeben: false,
    };
  }

  procesarVerdadOReto(jugadorId: string, eleccion: "verdad" | "reto"): RoundResult {
    const jugador = this.jugadores.find((j) => j.id === jugadorId);
    if (jugador) {
      jugador.puntaje += 5;
      jugador.monedasGanadas += 5;
    }

    return {
      tipo: "verdadoroto",
      jugadores: [...this.jugadores],
      barraColectiva: this.barraColectiva,
      todosBeben: false,
    };
  }

  estaFinalizado(): boolean {
    return this.rondaActual >= this.config.rondas;
  }

  getResultados(): PlayerState[] {
    return [...this.jugadores].sort((a, b) => b.puntaje - a.puntaje);
  }

  getPodio(): PlayerState[] {
    return this.getResultados().slice(0, 3);
  }
}

export { GameConfig, PlayerState, RoundResult };
