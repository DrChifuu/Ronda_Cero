interface Reto {
  id: string;
  descripcion: string;
  tipo: "accion" | "bebida" | "efecto";
  dificultad: string;
}

const BANCO_RETOS: Reto[] = [
  { id: "r1", descripcion: "Imita a otro jugador hasta la próxima ronda", tipo: "accion", dificultad: "facil" },
  { id: "r2", descripcion: "Bebe dos tragos seguidos sin parar", tipo: "bebida", dificultad: "facil" },
  { id: "r3", descripcion: "Canta el coro de tu canción favorita a todo pulmón", tipo: "accion", dificultad: "media" },
  { id: "r4", descripcion: "Deja que el grupo publique algo en tu red social", tipo: "accion", dificultad: "dificil" },
  { id: "r5", descripcion: "Habla con acento extranjero hasta la próxima ronda", tipo: "efecto", dificultad: "facil" },
  { id: "r6", descripcion: "Haz 10 sentadillas mientras cantas", tipo: "accion", dificultad: "media" },
  { id: "r7", descripcion: "Bebe un trago por cada jugador que señale que hiciste algo vergonzoso", tipo: "bebida", dificultad: "media" },
  { id: "r8", descripcion: "Cuenta tu momento más vergonzoso en público", tipo: "accion", dificultad: "media" },
  { id: "r9", descripcion: "Intercambia una prenda con el jugador de tu derecha", tipo: "accion", dificultad: "dificil" },
  { id: "r10", descripcion: "Haz una llamada a un contacto random y dile que lo extrañas", tipo: "accion", dificultad: "dificil" },
  { id: "r11", descripcion: "Baila sin música durante 30 segundos", tipo: "accion", dificultad: "media" },
  { id: "r12", descripcion: "Bebe tres tragos: uno por cada ex que recuerdes", tipo: "bebida", dificultad: "media" },
  { id: "r13", descripcion: "No puedes decir 'sí' ni 'no' hasta la próxima ronda", tipo: "efecto", dificultad: "media" },
  { id: "r14", descripcion: "Imita a un animal elegido por el grupo durante 20 segundos", tipo: "accion", dificultad: "facil" },
  { id: "r15", descripcion: "Repite todo lo que diga el jugador de tu izquierda hasta la próxima ronda", tipo: "efecto", dificultad: "media" },
  { id: "r16", descripcion: "Bebe un trago por cada país que no puedas nombrar en 10 segundos", tipo: "bebida", dificultad: "facil" },
  { id: "r17", descripcion: "Haz tu mejor imitación de un famoso y que el grupo lo adivine", tipo: "accion", dificultad: "media" },
  { id: "r18", descripcion: "Muestra la última foto de tu galería al grupo", tipo: "accion", dificultad: "dificil" },
  { id: "r19", descripcion: "Todos beben un trago excepto tú si logras hacer 20 flexiones", tipo: "bebida", dificultad: "dificil" },
  { id: "r20", descripcion: "Cuenta un chiste: si nadie se ríe, bebes dos tragos", tipo: "accion", dificultad: "facil" },
  { id: "r21", descripcion: "Deja que otro jugador envíe un mensaje desde tu celular", tipo: "accion", dificultad: "dificil" },
  { id: "r22", descripcion: "Bebe un trago por cada letra de tu nombre", tipo: "bebida", dificultad: "facil" },
  { id: "r23", descripcion: "Habla en tercera persona hasta la próxima ronda", tipo: "efecto", dificultad: "media" },
  { id: "r24", descripcion: "Haz una declaración dramática mirando a los ojos al jugador de enfrente", tipo: "accion", dificultad: "media" },
  { id: "r25", descripcion: "Si no puedes tocar tu nariz con la lengua, bebes dos tragos", tipo: "bebida", dificultad: "facil" },
];

export function seleccionarReto(dificultad: string): Reto {
  const filtrados = BANCO_RETOS.filter((r) => r.dificultad === dificultad);
  const pool = filtrados.length > 0 ? filtrados : BANCO_RETOS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function calcularResultadoReto(
  aceptado: boolean,
  votacionAprobada: boolean
): { puntos: number; tragos: number } {
  if (!aceptado) {
    return { puntos: 0, tragos: 2 };
  }

  if (votacionAprobada) {
    return { puntos: 15, tragos: 0 };
  }

  return { puntos: 0, tragos: 2 };
}

export function seleccionarJugadorAleatorio(
  jugadores: string[],
  ultimoSeleccionado: string | null
): string {
  if (jugadores.length === 0) {
    return "";
  }

  if (jugadores.length === 1) {
    return jugadores[0];
  }

  const candidatos = ultimoSeleccionado
    ? jugadores.filter((j) => j !== ultimoSeleccionado)
    : jugadores;

  return candidatos[Math.floor(Math.random() * candidatos.length)];
}

export { Reto };
