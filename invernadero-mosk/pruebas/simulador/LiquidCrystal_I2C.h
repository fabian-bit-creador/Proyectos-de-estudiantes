#pragma once
#include "Arduino.h"
extern char sim_lcd[2][17];
class LiquidCrystal_I2C : public Print {
  uint8_t fila = 0, col = 0;
 public:
  LiquidCrystal_I2C(uint8_t, uint8_t, uint8_t) { memset(sim_lcd, ' ', sizeof(sim_lcd)); sim_lcd[0][16] = sim_lcd[1][16] = 0; }
  void init() {}
  void backlight() {}
  void clear() { memset(sim_lcd, ' ', sizeof(sim_lcd)); sim_lcd[0][16] = sim_lcd[1][16] = 0; }
  void setCursor(uint8_t c, uint8_t f) { col = c; fila = f; }
  size_t write(uint8_t ch) override { if (fila < 2 && col < 16) sim_lcd[fila][col++] = (char)ch; return 1; }
  using Print::write;
};
