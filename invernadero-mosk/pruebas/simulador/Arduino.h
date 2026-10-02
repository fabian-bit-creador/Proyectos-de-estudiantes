// Simulación mínima del entorno Arduino para probar el programa en el computador.
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <cmath>
#include <string>
using std::isnan;

typedef uint8_t byte;
#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
#define HEX 16
#define DEC 10
#define PROGMEM
#define PSTR(s) (s)
#define strcmp_P strcmp
#define pgm_read_byte(p) (*(const uint8_t*)(p))
static const uint8_t A0 = 14, A1 = 15, A2 = 16, A3 = 17, A4 = 18, A5 = 19;

class __FlashStringHelper;
#define F(s) (reinterpret_cast<const __FlashStringHelper*>(s))

extern uint32_t sim_ms;
extern int sim_analog[20];
extern int sim_pin[20];
extern int sim_modo[20];
inline uint32_t millis() { return sim_ms; }
inline void delay(uint32_t ms) { sim_ms += ms; }
inline void pinMode(uint8_t p, uint8_t m) { sim_modo[p] = m; if (m == INPUT_PULLUP && sim_pin[p] < 0) sim_pin[p] = HIGH; }
inline void digitalWrite(uint8_t p, uint8_t v) { sim_pin[p] = v ? HIGH : LOW; }
inline int digitalRead(uint8_t p) { return sim_pin[p] < 0 ? LOW : sim_pin[p]; }
inline int analogRead(uint8_t p) { return sim_analog[p]; }
inline char* ltoa(long v, char* buf, int base) { (void)base; sprintf(buf, "%ld", v); return buf; }

class Print {
 public:
  virtual ~Print() {}
  virtual size_t write(uint8_t c) = 0;
  size_t write(const char* s) { size_t n = 0; while (*s) n += write((uint8_t)*s++); return n; }
  size_t print(const char* s) { return write(s); }
  size_t print(const __FlashStringHelper* s) { return write(reinterpret_cast<const char*>(s)); }
  size_t print(char c) { return write((uint8_t)c); }
  size_t print(long v, int base = DEC) { char b[24]; if (base == HEX) sprintf(b, "%lX", v); else sprintf(b, "%ld", v); return write(b); }
  size_t print(int v, int base = DEC) { return print((long)v, base); }
  size_t print(unsigned int v, int base = DEC) { return print((long)v, base); }
  size_t print(unsigned long v, int base = DEC) { char b[24]; if (base == HEX) sprintf(b, "%lX", v); else sprintf(b, "%lu", v); return write(b); }
  size_t print(unsigned char v, int base = DEC) { return print((long)v, base); }
  size_t print(double v, int dig = 2) { char b[40]; sprintf(b, "%.*f", dig, v); return write(b); }
  template <typename T> size_t println(T v) { size_t n = print(v); return n + write("\r\n"); }
  template <typename T> size_t println(T v, int base) { size_t n = print(v, base); return n + write("\r\n"); }
  size_t println() { return write("\r\n"); }
};

class SerieSimulada : public Print {
 public:
  std::string entrada, salida;
  void begin(long) {}
  int available() { return (int)entrada.size(); }
  int read() { if (entrada.empty()) return -1; int c = (unsigned char)entrada[0]; entrada.erase(0, 1); return c; }
  size_t write(uint8_t c) override { salida.push_back((char)c); return 1; }
  using Print::write;
};
extern SerieSimulada Serial;
