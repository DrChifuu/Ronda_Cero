interface PreguntaVerdad {
  id: string;
  pregunta: string;
}

interface RetoVerdad {
  id: string;
  descripcion: string;
}

const BANCO_PREGUNTAS_VERDAD: PreguntaVerdad[] = [
  { id: "v1", pregunta: "¿Cuál ha sido tu peor cita?" },
  { id: "v2", pregunta: "¿Alguna vez has mentido a tu mejor amigo? ¿Sobre qué?" },
  { id: "v3", pregunta: "¿Qué es lo más vergonzoso que has hecho en público?" },
  { id: "v4", pregunta: "¿Quién en este grupo te parece más atractivo?" },
  { id: "v5", pregunta: "¿Cuál es tu mayor miedo irracional?" },
  { id: "v6", pregunta: "¿Alguna vez has robado algo? ¿Qué fue?" },
  { id: "v7", pregunta: "¿Cuál es la mentira más grande que has dicho?" },
  { id: "v8", pregunta: "¿Qué es lo más loco que has hecho por amor?" },
  { id: "v9", pregunta: "¿Alguna vez has sido infiel o te han sido infiel?" },
  { id: "v10", pregunta: "¿Cuál es tu secreto más oscuro que nadie aquí sabe?" },
  { id: "v11", pregunta: "¿Qué opinas realmente del último mensaje que enviaste?" },
  { id: "v12", pregunta: "¿Alguna vez has fingido que te gustaba alguien?" },
  { id: "v13", pregunta: "¿Cuál es tu peor hábito?" },
  { id: "v14", pregunta: "¿Qué es lo más ilegal que has hecho sin que te pillaran?" },
  { id: "v15", pregunta: "¿A quién de este grupo le confiarías un secreto?" },
  { id: "v16", pregunta: "¿Cuál fue tu peor borrachera?" },
  { id: "v17", pregunta: "¿Alguna vez has espiado el celular de alguien?" },
  { id: "v18", pregunta: "¿Qué es lo más tonto por lo que has llorado?" },
];

const BANCO_RETOS_VERDAD: RetoVerdad[] = [
  { id: "rv1", descripcion: "Imita al jugador de tu derecha durante 30 segundos" },
  { id: "rv2", descripcion: "Bebe un trago por cada ex que recuerdes ahora mismo" },
  { id: "rv3", descripcion: "Muestra la última foto de tu galería al grupo" },
  { id: "rv4", descripcion: "Envía un 'te extraño' al último contacto de tu WhatsApp" },
  { id: "rv5", descripcion: "Haz tu mejor cara seductora al jugador de tu izquierda" },
  { id: "rv6", descripcion: "Canta una canción de reggaetón a capela" },
  { id: "rv7", descripcion: "Deja que el grupo elija tu estado de WhatsApp por 24 horas" },
  { id: "rv8", descripcion: "Llama a tu crush o ex y dile algo bonito" },
  { id: "rv9", descripcion: "Baila tu mejor movimiento durante 20 segundos" },
  { id: "rv10", descripcion: "Intercambia una prenda con el jugador que elija el grupo" },
  { id: "rv11", descripcion: "Publica una selfie sin filtro en tu historia ahora mismo" },
  { id: "rv12", descripcion: "Bebe dos tragos sin usar las manos" },
  { id: "rv13", descripcion: "Haz una confesión dramática mirando a los ojos a cada jugador" },
  { id: "rv14", descripcion: "Deja que alguien revise tu historial de búsqueda" },
  { id: "rv15", descripcion: "Haz 15 flexiones mientras el grupo cuenta en voz alta" },
  { id: "rv16", descripcion: "Imita a un famoso hasta que alguien adivine quién es" },
  { id: "rv17", descripcion: "Bebe un trago por cada jugador que haya visto tu peor foto" },
];

export function seleccionarPreguntaVerdad(usadas?: Set<string>): PreguntaVerdad {
  let pool = BANCO_PREGUNTAS_VERDAD;

  if (usadas && usadas.size > 0) {
    const sinUsar = pool.filter((p) => !usadas.has(p.id));
    if (sinUsar.length > 0) {
      pool = sinUsar;
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function seleccionarRetoVerdad(usados?: Set<string>): RetoVerdad {
  let pool = BANCO_RETOS_VERDAD;

  if (usados && usados.size > 0) {
    const sinUsar = pool.filter((r) => !usados.has(r.id));
    if (sinUsar.length > 0) {
      pool = sinUsar;
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export { PreguntaVerdad, RetoVerdad };
