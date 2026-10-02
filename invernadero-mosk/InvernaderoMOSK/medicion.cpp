#include "medicion.h"

bool sueloValido(int crudo) {
  return crudo >= SUELO_CRUDO_MIN_VALIDO && crudo <= SUELO_CRUDO_MAX_VALIDO;
}

uint8_t porcentajeSuelo(int crudo, int seco, int mojado) {
  if (mojado == seco) return 0;
  long num = (long)(crudo - seco) * 1000L / (long)(mojado - seco);   // décimas de %
  if (num <= 0) return 0;
  if (num >= 1000) return 100;
  return (uint8_t)((num + 5) / 10);
}

int16_t milivoltiosDe(int crudo) {
  if (crudo < 0) crudo = 0;
  if (crudo > 1023) crudo = 1023;
  return (int16_t)(((long)crudo * 5000L + 511L) / 1023L);
}

int16_t ph100Desde(int16_t mV, int16_t mvA, int16_t ph100A, int16_t mvB, int16_t ph100B) {
  if (mvB == mvA) return ph100A;
  long num = (long)(mV - mvA) * (long)(ph100B - ph100A);
  long den = (long)(mvB - mvA);
  long q = num / den, resto = num % den;           // la división corta hacia cero
  long absResto = resto < 0 ? -resto : resto, absDen = den < 0 ? -den : den;
  if (2 * absResto >= absDen) q += ((num < 0) != (den < 0)) ? -1 : 1;   // redondeo al más cercano
  long r = ph100A + q;
  if (r < -2000) r = -2000;
  if (r > 3000) r = 3000;
  return (int16_t)r;
}

bool phValido(int16_t mV, int16_t ph100) {
  return mV >= 100 && mV <= 4900 && ph100 >= 0 && ph100 <= 1400;
}

uint8_t porcentajeLuz(int crudo) {
  if (crudo < 0) crudo = 0;
  if (crudo > 1023) crudo = 1023;
  return (uint8_t)(((long)crudo * 100L + 511L) / 1023L);
}

int medianaDe(const int* v, uint8_t n) {
  if (n == 0) return 0;
  if (n > 16) n = 16;
  int c[16];
  for (uint8_t i = 0; i < n; i++) {             // inserción ordenada
    int x = v[i];
    int8_t j = (int8_t)i - 1;
    while (j >= 0 && c[j] > x) { c[j + 1] = c[j]; j--; }
    c[j + 1] = x;
  }
  return (n % 2) ? c[n / 2] : (c[n / 2 - 1] + c[n / 2]) / 2;
}

bool leerDecimal(const char* s, int16_t escala, int16_t& salida) {
  if (!s || !*s) return false;
  bool negativo = false;
  if (*s == '-') { negativo = true; s++; }
  long entero = 0, frac = 0, divisor = 1;
  bool hayDigito = false, enDecimal = false;
  for (; *s; s++) {
    if (*s >= '0' && *s <= '9') {
      hayDigito = true;
      if (enDecimal) {
        if (divisor < 1000) { frac = frac * 10 + (*s - '0'); divisor *= 10; }
      } else {
        entero = entero * 10 + (*s - '0');
        if (entero > 30000) return false;
      }
    } else if ((*s == '.' || *s == ',') && !enDecimal) {
      enDecimal = true;
    } else {
      return false;
    }
  }
  if (!hayDigito) return false;
  long v = entero * escala + (frac * escala + divisor / 2) / divisor;
  if (v > 32767) return false;
  salida = (int16_t)(negativo ? -v : v);
  return true;
}
