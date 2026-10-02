#pragma once
#include "Arduino.h"
extern uint8_t sim_eeprom[1024];
extern int sim_escrituras_eeprom;
struct EEPROMSimulada {
  template <typename T> T& get(int dir, T& v) { memcpy(&v, sim_eeprom + dir, sizeof(T)); return v; }
  template <typename T> const T& put(int dir, const T& v) {
    const uint8_t* p = (const uint8_t*)&v;
    for (size_t i = 0; i < sizeof(T); i++) if (sim_eeprom[dir + i] != p[i]) { sim_eeprom[dir + i] = p[i]; sim_escrituras_eeprom++; }
    return v;
  }
};
extern EEPROMSimulada EEPROM;
