#pragma once
#include "Arduino.h"
extern uint8_t sim_direccion_lcd;
class TwoWire {
  uint8_t dir = 0;
 public:
  void begin() {}
  void setWireTimeout(uint32_t, bool) {}
  void beginTransmission(uint8_t d) { dir = d; }
  uint8_t endTransmission() { return (sim_direccion_lcd && dir == sim_direccion_lcd) ? 0 : 2; }
};
extern TwoWire Wire;
