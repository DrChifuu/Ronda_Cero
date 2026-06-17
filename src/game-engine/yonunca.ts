interface AfirmacionYonunca {
  id: string;
  afirmacion: string;
  categoria: string;
}

const BANCO_AFIRMACIONES: AfirmacionYonunca[] = [
  { id: "yn1", afirmacion: "Yo nunca he mentido sobre mi edad", categoria: "personal" },
  { id: "yn2", afirmacion: "Yo nunca he cantado en un karaoke frente a desconocidos", categoria: "diversion" },
  { id: "yn3", afirmacion: "Yo nunca he enviado un mensaje al destinatario equivocado", categoria: "tecnologia" },
  { id: "yn4", afirmacion: "Yo nunca he viajado solo a otro país", categoria: "viajes" },
  { id: "yn5", afirmacion: "Yo nunca he llorado viendo una película", categoria: "emocional" },
  { id: "yn6", afirmacion: "Yo nunca he comido algo del suelo", categoria: "diversion" },
  { id: "yn7", afirmacion: "Yo nunca he tenido un apodo vergonzoso", categoria: "personal" },
  { id: "yn8", afirmacion: "Yo nunca he bailado sobre una mesa", categoria: "diversion" },
  { id: "yn9", afirmacion: "Yo nunca he fingido estar enfermo para no ir a trabajar", categoria: "personal" },
  { id: "yn10", afirmacion: "Yo nunca he stalkeado a alguien en redes sociales", categoria: "tecnologia" },
  { id: "yn11", afirmacion: "Yo nunca he besado a alguien cuyo nombre no recordaba", categoria: "diversion" },
  { id: "yn12", afirmacion: "Yo nunca he robado algo, aunque sea pequeño", categoria: "personal" },
  { id: "yn13", afirmacion: "Yo nunca he dormido en un lugar público", categoria: "diversion" },
  { id: "yn14", afirmacion: "Yo nunca he mentido en una cita", categoria: "personal" },
  { id: "yn15", afirmacion: "Yo nunca he hecho trampa en un examen", categoria: "personal" },
  { id: "yn16", afirmacion: "Yo nunca he reído tanto que me hice pis", categoria: "diversion" },
  { id: "yn17", afirmacion: "Yo nunca he visto a alguien famoso en persona", categoria: "viajes" },
  { id: "yn18", afirmacion: "Yo nunca he grabado un video viral o intentado hacerlo", categoria: "tecnologia" },
  { id: "yn19", afirmacion: "Yo nunca he tenido una pelea en público", categoria: "emocional" },
  { id: "yn20", afirmacion: "Yo nunca he gastado más de lo que podía pagar", categoria: "personal" },
  { id: "yn21", afirmacion: "Yo nunca he dicho 'te quiero' sin sentirlo realmente", categoria: "emocional" },
  { id: "yn22", afirmacion: "Yo nunca he comido en un restaurante sin tener cómo pagar", categoria: "diversion" },
  { id: "yn23", afirmacion: "Yo nunca he fingido saber algo para impresionar", categoria: "personal" },
  { id: "yn24", afirmacion: "Yo nunca he perdido el celular en una noche de fiesta", categoria: "diversion" },
  { id: "yn25", afirmacion: "Yo nunca he vuelto a casa caminando descalzo", categoria: "diversion" },
  { id: "yn26", afirmacion: "Yo nunca he mentido sobre con quién estaba", categoria: "emocional" },
  { id: "yn27", afirmacion: "Yo nunca he hecho algo ilegal", categoria: "personal" },
  { id: "yn28", afirmacion: "Yo nunca he visto el amanecer después de una fiesta", categoria: "diversion" },
  { id: "yn29", afirmacion: "Yo nunca he sido expulsado de un lugar", categoria: "diversion" },
  { id: "yn30", afirmacion: "Yo nunca he llorado de risa en un momento inapropiado", categoria: "emocional" },
];

export function seleccionarAfirmacion(
  categoria?: string,
  usadas?: Set<string>
): AfirmacionYonunca {
  let pool = BANCO_AFIRMACIONES;

  if (categoria) {
    const filtradas = pool.filter((a) => a.categoria === categoria);
    if (filtradas.length > 0) {
      pool = filtradas;
    }
  }

  if (usadas && usadas.size > 0) {
    const sinUsar = pool.filter((a) => !usadas.has(a.id));
    if (sinUsar.length > 0) {
      pool = sinUsar;
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function calcularResultadoYoNunca(hizoLaAccion: boolean): { tragos: number } {
  return { tragos: hizoLaAccion ? 1 : 0 };
}

export { AfirmacionYonunca };
