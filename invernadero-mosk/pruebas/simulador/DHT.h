#pragma once
#include "Arduino.h"
#define DHT11 11
#define DHT22 22
extern float sim_temp, sim_hum;
class DHT {
 public:
  DHT(uint8_t, uint8_t) {}
  void begin() {}
  float readTemperature() { return sim_temp; }
  float readHumidity() { return sim_hum; }
};
