// =====================================================================
//  medicion.h — De lo que lee el Arduino (0 a 1023) a unidades útiles.
//  Sin hardware: se prueba en el computador.
// =====================================================================
#pragma once
#include <stdint.h>

// El FC-28 marca cerca de 1023 en el aire o desconectado y cerca de 0 en corto.
const int SUELO_CRUDO_MIN_VALIDO = 6;
const int SUELO_CRUDO_MAX_VALIDO = 1014;
bool    sueloValido(int crudo);

// Humedad del suelo (%) entre los dos puntos calibrados: seco = 0 %, mojado = 100 %.
// Sirve aunque el sensor esté al revés (más agua = número más alto).
uint8_t porcentajeSuelo(int crudo, int seco, int mojado);

// Milivoltios en la entrada analógica (referencia de 5 V, 10 bits).
int16_t milivoltiosDe(int crudo);

// pH en centésimas a partir de dos puntos de calibración (mV medidos en dos soluciones).
int16_t ph100Desde(int16_t mV, int16_t mvA, int16_t ph100A, int16_t mvB, int16_t ph100B);
bool    phValido(int16_t mV, int16_t ph100);

// Fotorresistencia: 0 % oscuro, 100 % mucha luz.
uint8_t porcentajeLuz(int crudo);

// Mediana de hasta 16 lecturas: descarta los picos de ruido.
int     medianaDe(const int* v, uint8_t n);

// Lee un número con decimales («28», «28.5» o «28,5») multiplicado por escala (10 o 100).
bool    leerDecimal(const char* s, int16_t escala, int16_t& salida);
