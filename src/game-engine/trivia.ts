interface TriviaPregunta {
  id: string;
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  dificultad: string;
}

interface TriviaResultado {
  correcta: boolean;
  puntosGanados: number;
  tragos: number;
  barraIncremento: number;
}

interface GameState {
  preguntasUsadas: Set<string>;
  rondaActual: number;
  totalRondas: number;
  barraColectiva: number;
  barraPorcentaje: number;
  tiempoPorPregunta: number;
}

const BANCO_PREGUNTAS: TriviaPregunta[] = [
  {
    id: "t1",
    pregunta: "¿Cuál es el planeta más grande del sistema solar?",
    opciones: ["Saturno", "Júpiter", "Neptuno", "Urano"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t2",
    pregunta: "¿En qué año llegó el hombre a la Luna?",
    opciones: ["1965", "1969", "1971", "1973"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t3",
    pregunta: "¿Cuál es el río más largo del mundo?",
    opciones: ["Nilo", "Amazonas", "Yangtsé", "Misisipi"],
    respuestaCorrecta: 1,
    dificultad: "media",
  },
  {
    id: "t4",
    pregunta: "¿Quién pintó la Mona Lisa?",
    opciones: ["Miguel Ángel", "Rafael", "Leonardo da Vinci", "Botticelli"],
    respuestaCorrecta: 2,
    dificultad: "facil",
  },
  {
    id: "t5",
    pregunta: "¿Cuál es el elemento químico con símbolo 'Au'?",
    opciones: ["Plata", "Oro", "Aluminio", "Argón"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t6",
    pregunta: "¿En qué país se encuentra Machu Picchu?",
    opciones: ["Bolivia", "Colombia", "Perú", "Ecuador"],
    respuestaCorrecta: 2,
    dificultad: "facil",
  },
  {
    id: "t7",
    pregunta: "¿Cuántos huesos tiene el cuerpo humano adulto?",
    opciones: ["196", "206", "216", "226"],
    respuestaCorrecta: 1,
    dificultad: "media",
  },
  {
    id: "t8",
    pregunta: "¿Cuál es la capital de Australia?",
    opciones: ["Sídney", "Melbourne", "Canberra", "Brisbane"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t9",
    pregunta: "¿Quién escribió 'Cien años de soledad'?",
    opciones: ["Mario Vargas Llosa", "Gabriel García Márquez", "Julio Cortázar", "Pablo Neruda"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t10",
    pregunta: "¿Cuál es el océano más grande del mundo?",
    opciones: ["Atlántico", "Índico", "Ártico", "Pacífico"],
    respuestaCorrecta: 3,
    dificultad: "facil",
  },
  {
    id: "t11",
    pregunta: "¿En qué año comenzó la Segunda Guerra Mundial?",
    opciones: ["1935", "1937", "1939", "1941"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t12",
    pregunta: "¿Cuál es el metal más abundante en la corteza terrestre?",
    opciones: ["Hierro", "Aluminio", "Cobre", "Calcio"],
    respuestaCorrecta: 1,
    dificultad: "dificil",
  },
  {
    id: "t13",
    pregunta: "¿Qué país ganó el Mundial de Fútbol 2022?",
    opciones: ["Francia", "Brasil", "Argentina", "Croacia"],
    respuestaCorrecta: 2,
    dificultad: "facil",
  },
  {
    id: "t14",
    pregunta: "¿Cuál es la fórmula química del agua?",
    opciones: ["CO2", "H2O", "NaCl", "O2"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t15",
    pregunta: "¿Quién desarrolló la teoría de la relatividad?",
    opciones: ["Newton", "Einstein", "Hawking", "Bohr"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t16",
    pregunta: "¿Cuál es el país más pequeño del mundo?",
    opciones: ["Mónaco", "San Marino", "Vaticano", "Liechtenstein"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t17",
    pregunta: "¿Cuántos continentes hay en el mundo?",
    opciones: ["5", "6", "7", "8"],
    respuestaCorrecta: 2,
    dificultad: "facil",
  },
  {
    id: "t18",
    pregunta: "¿Qué instrumento musical tiene 88 teclas?",
    opciones: ["Órgano", "Piano", "Clavicordio", "Acordeón"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t19",
    pregunta: "¿En qué ciudad se celebraron los Juegos Olímpicos de 2020?",
    opciones: ["Pekín", "Londres", "Tokio", "París"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t20",
    pregunta: "¿Cuál es el hueso más largo del cuerpo humano?",
    opciones: ["Tibia", "Húmero", "Fémur", "Radio"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t21",
    pregunta: "¿Qué gas es esencial para la respiración humana?",
    opciones: ["Nitrógeno", "Oxígeno", "Dióxido de carbono", "Hidrógeno"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t22",
    pregunta: "¿Cuál es la montaña más alta del mundo?",
    opciones: ["K2", "Kangchenjunga", "Everest", "Lhotse"],
    respuestaCorrecta: 2,
    dificultad: "facil",
  },
  {
    id: "t23",
    pregunta: "¿Quién compuso la 'Novena Sinfonía'?",
    opciones: ["Mozart", "Bach", "Beethoven", "Vivaldi"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t24",
    pregunta: "¿En qué año cayó el Muro de Berlín?",
    opciones: ["1987", "1988", "1989", "1990"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t25",
    pregunta: "¿Cuál es el desierto más grande del mundo?",
    opciones: ["Sahara", "Gobi", "Antártico", "Arábigo"],
    respuestaCorrecta: 2,
    dificultad: "dificil",
  },
  {
    id: "t26",
    pregunta: "¿Qué vitamina produce el cuerpo al exponerse al sol?",
    opciones: ["Vitamina A", "Vitamina C", "Vitamina D", "Vitamina B12"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t27",
    pregunta: "¿Cuál es la moneda oficial de Japón?",
    opciones: ["Yuan", "Won", "Yen", "Rupia"],
    respuestaCorrecta: 2,
    dificultad: "facil",
  },
  {
    id: "t28",
    pregunta: "¿Quién dirigió la película 'Titanic'?",
    opciones: ["Steven Spielberg", "James Cameron", "Ridley Scott", "Martin Scorsese"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t29",
    pregunta: "¿Cuál es el animal terrestre más rápido?",
    opciones: ["León", "Guepardo", "Gacela", "Caballo"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
  {
    id: "t30",
    pregunta: "¿Cuántos jugadores tiene un equipo de voleibol en cancha?",
    opciones: ["5", "6", "7", "8"],
    respuestaCorrecta: 1,
    dificultad: "media",
  },
  {
    id: "t31",
    pregunta: "¿Qué país tiene forma de bota?",
    opciones: ["Grecia", "España", "Italia", "Portugal"],
    respuestaCorrecta: 2,
    dificultad: "facil",
  },
  {
    id: "t32",
    pregunta: "¿Cuál es el símbolo químico del sodio?",
    opciones: ["So", "Sd", "Na", "S"],
    respuestaCorrecta: 2,
    dificultad: "media",
  },
  {
    id: "t33",
    pregunta: "¿En qué deporte se usa un shuttlecock?",
    opciones: ["Tenis", "Bádminton", "Squash", "Ping pong"],
    respuestaCorrecta: 1,
    dificultad: "dificil",
  },
  {
    id: "t34",
    pregunta: "¿Cuál es la estrella más cercana a la Tierra?",
    opciones: ["Sirio", "Alfa Centauri", "El Sol", "Betelgeuse"],
    respuestaCorrecta: 2,
    dificultad: "facil",
  },
  {
    id: "t35",
    pregunta: "¿Qué actor interpretó a Jack Sparrow?",
    opciones: ["Brad Pitt", "Johnny Depp", "Tom Cruise", "Orlando Bloom"],
    respuestaCorrecta: 1,
    dificultad: "facil",
  },
];

export function seleccionarPregunta(dificultad: string, usadas: Set<string>): TriviaPregunta {
  const disponibles = BANCO_PREGUNTAS.filter(
    (p) => p.dificultad === dificultad && !usadas.has(p.id)
  );

  if (disponibles.length === 0) {
    const sinUsar = BANCO_PREGUNTAS.filter((p) => !usadas.has(p.id));
    if (sinUsar.length === 0) {
      usadas.clear();
      return BANCO_PREGUNTAS[Math.floor(Math.random() * BANCO_PREGUNTAS.length)];
    }
    return sinUsar[Math.floor(Math.random() * sinUsar.length)];
  }

  return disponibles[Math.floor(Math.random() * disponibles.length)];
}

export function calcularResultado(esCorrecta: boolean, barraPorcentaje: number): TriviaResultado {
  if (esCorrecta) {
    return {
      correcta: true,
      puntosGanados: 10,
      tragos: 0,
      barraIncremento: 0,
    };
  }

  return {
    correcta: false,
    puntosGanados: 0,
    tragos: 1,
    barraIncremento: barraPorcentaje,
  };
}

export function verificarBarraLlena(barra: number): boolean {
  return barra >= 100;
}

export function reiniciarBarra(): number {
  return 0;
}

export { TriviaPregunta, TriviaResultado, GameState };
