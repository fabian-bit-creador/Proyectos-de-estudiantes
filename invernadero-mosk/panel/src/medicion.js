// =====================================================================
//  medicion.js — Copia en JavaScript de InvernaderoMOSK/medicion.cpp.
//  La usa el modo simulación del panel: debe dar exactamente los mismos
//  números que el Arduino (división entera que corta hacia cero, etc.).
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});

  const SUELO_CRUDO_MIN_VALIDO = 6;
  const SUELO_CRUDO_MAX_VALIDO = 1014;

  const trunc = Math.trunc;

  function sueloValido(crudo) {
    return crudo >= SUELO_CRUDO_MIN_VALIDO && crudo <= SUELO_CRUDO_MAX_VALIDO;
  }

  function porcentajeSuelo(crudo, seco, mojado) {
    if (mojado === seco) return 0;
    const num = trunc(((crudo - seco) * 1000) / (mojado - seco));   // décimas de %
    if (num <= 0) return 0;
    if (num >= 1000) return 100;
    return trunc((num + 5) / 10);
  }

  function milivoltiosDe(crudo) {
    if (crudo < 0) crudo = 0;
    if (crudo > 1023) crudo = 1023;
    return trunc((crudo * 5000 + 511) / 1023);
  }

  function ph100Desde(mV, mvA, ph100A, mvB, ph100B) {
    if (mvB === mvA) return ph100A;
    const num = (mV - mvA) * (ph100B - ph100A);
    const den = mvB - mvA;
    let q = trunc(num / den);
    const resto = num % den;                       // mismo signo que en C
    if (2 * Math.abs(resto) >= Math.abs(den)) q += (num < 0) !== (den < 0) ? -1 : 1;
    let r = ph100A + q;
    if (r < -2000) r = -2000;
    if (r > 3000) r = 3000;
    return r;
  }

  function phValido(mV, ph100) {
    return mV >= 100 && mV <= 4900 && ph100 >= 0 && ph100 <= 1400;
  }

  function porcentajeLuz(crudo) {
    if (crudo < 0) crudo = 0;
    if (crudo > 1023) crudo = 1023;
    return trunc((crudo * 100 + 511) / 1023);
  }

  function medianaDe(v, n) {
    if (n === 0) return 0;
    if (n > 16) n = 16;
    const c = [];
    for (let i = 0; i < n; i++) {                  // inserción ordenada
      const x = v[i];
      let j = i - 1;
      while (j >= 0 && c[j] > x) { c[j + 1] = c[j]; j--; }
      c[j + 1] = x;
    }
    return n % 2 ? c[(n - 1) / 2] : trunc((c[n / 2 - 1] + c[n / 2]) / 2);
  }

  // Devuelve el número multiplicado por escala, o null si el texto no es válido.
  function leerDecimal(s, escala) {
    if (s == null || s.length === 0) return null;
    let i = 0;
    let negativo = false;
    if (s[0] === '-') { negativo = true; i = 1; }
    let entero = 0, frac = 0, divisor = 1;
    let hayDigito = false, enDecimal = false;
    for (; i < s.length; i++) {
      const ch = s[i];
      if (ch >= '0' && ch <= '9') {
        hayDigito = true;
        const d = ch.charCodeAt(0) - 48;
        if (enDecimal) {
          if (divisor < 1000) { frac = frac * 10 + d; divisor *= 10; }
        } else {
          entero = entero * 10 + d;
          if (entero > 30000) return null;
        }
      } else if ((ch === '.' || ch === ',') && !enDecimal) {
        enDecimal = true;
      } else {
        return null;
      }
    }
    if (!hayDigito) return null;
    const v = entero * escala + trunc((frac * escala + trunc(divisor / 2)) / divisor);
    if (v > 32767) return null;
    return negativo && v ? -v : v;
  }

  MOSK.medicion = {
    SUELO_CRUDO_MIN_VALIDO, SUELO_CRUDO_MAX_VALIDO,
    sueloValido, porcentajeSuelo, milivoltiosDe, ph100Desde, phValido, porcentajeLuz, medianaDe, leerDecimal,
  };
})();
