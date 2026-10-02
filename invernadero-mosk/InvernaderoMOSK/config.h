// =====================================================================
//  config.h — Lo que el equipo puede cambiar sin tocar el resto.
//  MOS-K Green Tech · Invernadero inteligente · IV°C Electrónica
// =====================================================================
#pragma once

// ---- Sensor ambiental -------------------------------------------------
// DHT11 (el azul de la presentación) o DHT22 (el blanco, más preciso).
#ifndef TIPO_DHT
#define TIPO_DHT DHT11
#endif

// ---- Pines del Arduino UNO ----------------------------------------------
const uint8_t PIN_DHT       = 2;   // DATA del DHT11 / DHT22
const uint8_t PIN_BOTON     = 3;   // botón «Regar ahora» entre D3 y GND (opcional)
const uint8_t PIN_SUELO_VCC = 4;   // VCC del FC-28: se enciende solo al medir
const uint8_t PIN_BOMBA     = 7;   // relé 1: bomba de agua
const uint8_t PIN_VENT      = 8;   // relé 2: extractor
const uint8_t PIN_LAMPARA   = 9;   // relé 3: luz térmica
const uint8_t PIN_SUELO     = A0;  // salida A0 del FC-28
const uint8_t PIN_PH        = A1;  // salida Po del módulo de pH (PH-4502C u otro)
const uint8_t PIN_LDR       = A2;  // fotorresistencia (opcional)
// Pantalla LCD I2C: SDA en A4 y SCL en A5 (fijos en el Arduino UNO).

// ---- Módulo de relés ----------------------------------------------------
// Casi todos los módulos de relé para Arduino se activan con LOW.
// Si al encender el Arduino la bomba parte sola, cambia esto a false.
const bool RELE_ACTIVO_EN_BAJO = true;

// ---- Botón «Regar ahora» ---------------------------------------------------
// true si conectaron un pulsador entre D3 y GND. Riega 5 segundos.
const bool USA_BOTON = true;

// ---- Comunicación con el computador ------------------------------------------
// El panel web y el Monitor Serie deben usar esta misma velocidad.
const long VELOCIDAD_SERIE = 115200;
