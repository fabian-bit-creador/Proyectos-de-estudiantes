// Banco de pruebas: ejecuta el programa real del invernadero con un Arduino simulado.
// Lee un guion por la entrada estándar y escribe lo que saldría por el puerto serie.
#include "Arduino.h"
#include "Wire.h"
#include "EEPROM.h"
#include "DHT.h"
#include "LiquidCrystal_I2C.h"

uint32_t sim_ms = 0;
int sim_analog[20];
int sim_pin[20];
int sim_modo[20];
float sim_temp = 22.0f, sim_hum = 60.0f;
uint8_t sim_direccion_lcd = 0x27;
uint8_t sim_eeprom[1024];
int sim_escrituras_eeprom = 0;
char sim_lcd[2][17];
SerieSimulada Serial;
TwoWire Wire;
EEPROMSimulada EEPROM;

#include "../../InvernaderoMOSK/InvernaderoMOSK.ino"

static void vaciarSerie() {
  size_t pos;
  while ((pos = Serial.salida.find('\n')) != std::string::npos) {
    std::string l = Serial.salida.substr(0, pos);
    if (!l.empty() && l.back() == '\r') l.pop_back();
    printf("S %u %s\n", sim_ms, l.c_str());
    Serial.salida.erase(0, pos + 1);
  }
}

int main(int argc, char** argv) {
  const char* archivo = argc > 1 ? argv[1] : nullptr;
  memset(sim_eeprom, 0xFF, sizeof(sim_eeprom));
  if (archivo) { FILE* f = fopen(archivo, "rb"); if (f) { size_t n = fread(sim_eeprom, 1, sizeof(sim_eeprom), f); (void)n; fclose(f); } }
  for (int i = 0; i < 20; i++) { sim_pin[i] = -1; sim_analog[i] = 0; sim_modo[i] = -1; }
  sim_analog[A0] = 500; sim_analog[A1] = 512; sim_analog[A2] = 700;
  char buf[512];
  while (fgets(buf, sizeof(buf), stdin)) {
    char* nl = strchr(buf, '\n'); if (nl) *nl = 0;
    char orden[32] = {0}; char resto[480] = {0};
    sscanf(buf, "%31s %479[^\n]", orden, resto);
    std::string o = orden;
    if (o.empty() || o[0] == '#') continue;
    if (o == "inicio") { setup(); vaciarSerie(); }
    else if (o == "avanzar") {
      uint32_t fin = sim_ms + (uint32_t)atol(resto);
      while (sim_ms < fin) { loop(); vaciarSerie(); sim_ms += 10; }
    }
    else if (o == "suelo") sim_analog[A0] = atoi(resto);
    else if (o == "ph") sim_analog[A1] = atoi(resto);
    else if (o == "ldr") sim_analog[A2] = atoi(resto);
    else if (o == "dht") { if (strncmp(resto, "nan", 3) == 0) { sim_temp = NAN; sim_hum = NAN; } else sscanf(resto, "%f %f", &sim_temp, &sim_hum); }
    else if (o == "serie") { Serial.entrada += resto; Serial.entrada += "\n"; }
    else if (o == "boton") sim_pin[PIN_BOTON] = atoi(resto) ? HIGH : LOW;
    else if (o == "sinlcd") sim_direccion_lcd = 0;
    else if (o == "pines") printf("P %u %d %d %d %d\n", sim_ms, sim_pin[PIN_BOMBA], sim_pin[PIN_VENT], sim_pin[PIN_LAMPARA], sim_modo[PIN_BOMBA]);
    else if (o == "lcd") printf("L %u |%s|%s|\n", sim_ms, sim_lcd[0], sim_lcd[1]);
    else if (o == "eeprom") printf("E %u %d\n", sim_ms, sim_escrituras_eeprom);
    else { fprintf(stderr, "orden desconocida: %s\n", o.c_str()); return 2; }
  }
  if (archivo) { FILE* f = fopen(archivo, "wb"); if (f) { fwrite(sim_eeprom, 1, sizeof(sim_eeprom), f); fclose(f); } }
  return 0;
}
