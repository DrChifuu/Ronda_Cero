import { seleccionarPregunta, calcularResultado, verificarBarraLlena, reiniciarBarra } from '../src/game-engine/trivia';

describe('seleccionarPregunta', () => {
  it('returns a valid question with pregunta, opciones (length 4), respuestaCorrecta (0-3)', () => {
    const usadas = new Set<string>();
    const pregunta = seleccionarPregunta('facil', usadas);

    expect(pregunta).toHaveProperty('pregunta');
    expect(typeof pregunta.pregunta).toBe('string');
    expect(pregunta.opciones).toHaveLength(4);
    expect(pregunta.respuestaCorrecta).toBeGreaterThanOrEqual(0);
    expect(pregunta.respuestaCorrecta).toBeLessThanOrEqual(3);
  });

  it('returns questions for different difficulties', () => {
    const faciles = new Set<string>();
    const medias = new Set<string>();
    const dificiles = new Set<string>();

    const facil = seleccionarPregunta('facil', faciles);
    const media = seleccionarPregunta('media', medias);
    const dificil = seleccionarPregunta('dificil', dificiles);

    expect(facil.dificultad).toBe('facil');
    expect(media.dificultad).toBe('media');
    expect(dificil.dificultad).toBe('dificil');
  });

  it('does not repeat questions when passing used Set', () => {
    const usadas = new Set<string>();
    const ids = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const pregunta = seleccionarPregunta('facil', usadas);
      expect(usadas.has(pregunta.id)).toBe(false);
      ids.add(pregunta.id);
      usadas.add(pregunta.id);
    }

    expect(ids.size).toBe(10);
  });
});

describe('calcularResultado', () => {
  it('returns correct result for correct answer', () => {
    const resultado = calcularResultado(true, 25);

    expect(resultado.correcta).toBe(true);
    expect(resultado.puntosGanados).toBe(10);
    expect(resultado.tragos).toBe(0);
  });

  it('returns correct result for incorrect answer', () => {
    const resultado = calcularResultado(false, 25);

    expect(resultado.correcta).toBe(false);
    expect(resultado.puntosGanados).toBe(0);
    expect(resultado.tragos).toBe(1);
    expect(resultado.barraIncremento).toBeGreaterThan(0);
  });
});

describe('verificarBarraLlena', () => {
  it('returns true when barra >= 100', () => {
    expect(verificarBarraLlena(100)).toBe(true);
    expect(verificarBarraLlena(150)).toBe(true);
  });

  it('returns false when barra < 100', () => {
    expect(verificarBarraLlena(99)).toBe(false);
    expect(verificarBarraLlena(0)).toBe(false);
  });
});

describe('reiniciarBarra', () => {
  it('returns 0', () => {
    expect(reiniciarBarra()).toBe(0);
  });
});
