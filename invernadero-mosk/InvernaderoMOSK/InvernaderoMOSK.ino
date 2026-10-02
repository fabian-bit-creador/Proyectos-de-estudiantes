// =====================================================================
//  MOS-K Green Tech · Invernadero inteligente
//  Colegio Cardenal José María Caro · IV°C Electrónica · Feria TP 2026
//
//  Placa: Arduino UNO. Librerías (Programa > Incluir librería > Administrar):
//    · «DHT sensor library» de Adafruit (instala también «Adafruit Unified Sensor»)
//    · «LiquidCrystal I2C» de Frank de Brabander
//
//  Qué hace:
//    · Mide temperatura y humedad del aire (DHT11/DHT22), humedad del suelo
//      (FC-28), pH (módulo analógico) y, si se conecta, la luz (LDR).
//    · Riega por ciclos cuando el suelo está seco, enciende el extractor
//      cuando hace calor o hay mucha humedad, y la luz térmica cuando hace frío.
//    · Muestra todo en la pantalla LCD 16x2 I2C.
//    · Conversa por USB con el panel web (PanelInvernadero.html) o con el
//      Monitor Serie (115200 baudios). Escribe AYUDA para ver las órdenes.
//
//  Para cambiar pines, tipo de DHT o relés: abre la pestaña config.h.
// =====================================================================
#include <Wire.h>
#include <EEPROM.h>
#include <stddef.h>
#include <string.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include "config.h"
#include "logica.h"
#include "medicion.h"

#define VERSION_PROGRAMA "1.0"

// ---------------------------------------------------------------------
//  Memoria EEPROM: ajustes y calibración sobreviven al apagar el Arduino
// ---------------------------------------------------------------------
struct Guardado {
  uint16_t marca;
  uint8_t  version;
  Ajustes  aj;
  int16_t  sueloSeco, sueloMojado;    // lectura cruda en tierra seca y en agua
  int16_t  phMvA, phMvB;              // milivoltios medidos en las dos soluciones
  int16_t  ph100A, ph100B;            // pH de esas soluciones (700 y 400 o 1000)
  uint8_t  phCalibrado;               // bit 1: punto pH 7 · bit 2: segundo punto
  uint8_t  suma;
};
const uint16_t MARCA_MEMORIA = 0x4B4D;   // «MK»
const uint8_t  VERSION_MEMORIA = 1;

// ---------------------------------------------------------------------
//  Objetos y estado
// ---------------------------------------------------------------------
DHT dht(PIN_DHT, TIPO_DHT);
LiquidCrystal_I2C* lcd = 0;
uint8_t lcdDireccion = 0;
Controlador ctrl;
Guardado mem;
Lecturas lec;

int16_t temp10 = 0;
uint8_t humAire = 0;
bool    dhtLeido = false;
uint8_t fallasDht = 0;
int     sueloCrudo = 0;
int     luzCrudo = 0;
int     muestrasPh[10];
uint8_t cantidadPh = 0, indicePh = 0;
int16_t phMv = 0;

uint32_t tSuelo = 0, tDht = 0, tPh = 0, tCtrl = 0, tDatos = 0, tLcd = 0, tPantalla = 0, tBoton = 0;
uint8_t  pantalla = 0;
bool     botonAnterior = true;

char    linea[56];
uint8_t largoLinea = 0;
bool    lineaLarga = false;

// Prototipos (el IDE los genera solo; se dejan escritos para mayor claridad)
void escribirRele(uint8_t pin, bool encendido);
void cargarMemoria();
void guardarMemoria();
void valoresDeFabrica();
void iniciarLcd();
void leerSuelo();
void leerDht();
void muestrearPh();
bool phListo();
void armarLecturas();
bool iniciando(uint32_t ahora);
void aplicarSalidas();
void leerSerie(uint32_t ahora);
void ejecutar(char* texto, uint32_t ahora);
void enviarHola();
void enviarConfig();
void enviarDatos(uint32_t ahora);
void enviarEventos(uint32_t ahora);
void mostrarLcd(uint32_t ahora);
void revisarBoton(uint32_t ahora);
void imprimirDecimal(Print& p, long valor, uint8_t decimales);

// ---------------------------------------------------------------------
//  Relés
// ---------------------------------------------------------------------
void escribirRele(uint8_t pin, bool encendido) {
  digitalWrite(pin, (encendido != RELE_ACTIVO_EN_BAJO) ? HIGH : LOW);
}

void aplicarSalidas() {
  escribirRele(PIN_BOMBA, ctrl.sal.bomba);
  escribirRele(PIN_VENT, ctrl.sal.vent);
  escribirRele(PIN_LAMPARA, ctrl.sal.lampara);
}

// ---------------------------------------------------------------------
//  EEPROM
// ---------------------------------------------------------------------
uint8_t sumaDe(const Guardado& g) {
  const uint8_t* p = (const uint8_t*)&g;
  uint8_t s = 0x5A;
  for (size_t i = 0; i < offsetof(Guardado, suma); i++) s = (uint8_t)(s * 31 + p[i]);
  return s;
}

void valoresDeFabrica() {
  memset(&mem, 0, sizeof(mem));
  mem.marca = MARCA_MEMORIA;
  mem.version = VERSION_MEMORIA;
  ajustesDeFabrica(mem.aj);
  mem.sueloSeco = 1000;       // FC-28 típico en tierra seca
  mem.sueloMojado = 350;      // FC-28 típico en agua
  mem.phMvA = 2500;           // PH-4502C típico: 2,50 V en pH 7
  mem.ph100A = 700;
  mem.phMvB = 3030;           // y 3,03 V en pH 4 (hay que calibrar)
  mem.ph100B = 400;
  mem.phCalibrado = 0;
}

void guardarMemoria() {
  mem.aj = ctrl.aj;
  mem.suma = sumaDe(mem);
  EEPROM.put(0, mem);         // put solo escribe los bytes que cambiaron
}

void cargarMemoria() {
  EEPROM.get(0, mem);
  if (mem.marca != MARCA_MEMORIA || mem.version != VERSION_MEMORIA || mem.suma != sumaDe(mem)) {
    valoresDeFabrica();
    ctrl.aj = mem.aj;
    guardarMemoria();
  }
  ctrl.aj = mem.aj;
}

// ---------------------------------------------------------------------
//  Pantalla LCD 16x2 I2C (se busca en 0x27 y en 0x3F)
// ---------------------------------------------------------------------
void escribirFila(uint8_t fila, const char* texto) {
  if (!lcd) return;
  char b[17];
  uint8_t i = 0;
  for (; i < 16 && texto[i]; i++) b[i] = texto[i];
  for (; i < 16; i++) b[i] = ' ';
  b[16] = 0;
  lcd->setCursor(0, fila);
  lcd->print(b);
}

void iniciarLcd() {
  Wire.begin();
  Wire.setWireTimeout(3000, true);    // si la pantalla no está, el programa no se cuelga
  const uint8_t direcciones[2] = {0x27, 0x3F};
  for (uint8_t i = 0; i < 2 && !lcdDireccion; i++) {
    Wire.beginTransmission(direcciones[i]);
    if (Wire.endTransmission() == 0) lcdDireccion = direcciones[i];
  }
  if (!lcdDireccion) return;
  lcd = new LiquidCrystal_I2C(lcdDireccion, 16, 2);
  lcd->init();
  lcd->backlight();
  escribirFila(0, "MOS-K Green Tech");
  escribirFila(1, "Invernadero " VERSION_PROGRAMA);
}

// Pequeños ayudantes para armar las filas de la pantalla
struct Fila {
  char b[17];
  uint8_t n;
  Fila() : n(0) { b[0] = 0; }
  void c(char ch) { if (n < 16) { b[n++] = ch; b[n] = 0; } }
  void t(const char* s) { while (*s) c(*s++); }
  void p(const char* sP) { char ch; while ((ch = (char)pgm_read_byte(sP++))) c(ch); }   // texto en flash
  void num(long v) { char tmp[12]; ltoa(v, tmp, 10); t(tmp); }
  void dec(long v, uint8_t d) {   // 245,1 -> «24.5»
    if (v < 0) { c('-'); v = -v; }
    long div = d == 2 ? 100 : 10;
    num(v / div);
    c('.');
    long f = v % div;
    if (d == 2 && f < 10) c('0');
    num(f);
  }
};

const char* textoAlarma(uint16_t a) {
  if (a & AL_SIN_EFECTO)      return PSTR("Revisa estanque");
  if (a & AL_LIMITE_BOMBA)    return PSTR("Tope bomba/hora");
  if (a & AL_DHT)             return PSTR("DHT sin senal");
  if (a & AL_SUELO)           return PSTR("Sensor suelo?");
  if (a & AL_TEMP_ALTA)       return PSTR("Temp. muy alta");
  if (a & AL_TEMP_BAJA)       return PSTR("Temp. muy baja");
  if (a & AL_PH_FALLA)        return PSTR("Sonda pH falla");
  if (a & AL_PH_FUERA)        return PSTR("pH fuera rango");
  if (a & AL_PH_SIN_CALIBRAR) return PSTR("pH sin calibrar");
  return PSTR("");
}

void mostrarLcd(uint32_t ahora) {
  if (!lcd) return;
  if (iniciando(ahora)) {
    escribirFila(0, "Iniciando...");
    escribirFila(1, "Leyendo sensores");
    pantalla = 0;              // al terminar se parte por las lecturas
    tPantalla = ahora;
    return;
  }
  // Pantallas posibles: 0 lecturas, 1 salidas, 2 riego en curso, 3 alarma
  bool hayRiego = (!ctrl.manual && (ctrl.riego == RIEGO_REGANDO || ctrl.riego == RIEGO_ESPERA)) ||
                  (ctrl.manual && ctrl.sal.bomba);
  bool hayAlarma = ctrl.alarmas != 0;
  if (ahora - tPantalla >= 3000UL) {
    tPantalla = ahora;
    for (uint8_t i = 0; i < 4; i++) {
      pantalla = (uint8_t)((pantalla + 1) % 4);
      if (pantalla == 2 && !hayRiego) continue;
      if (pantalla == 3 && !hayAlarma) continue;
      break;
    }
  }
  if ((pantalla == 2 && !hayRiego) || (pantalla == 3 && !hayAlarma)) pantalla = 0;

  Fila f1, f2;
  if (pantalla == 0) {
    f1.p(PSTR("T:"));
    if (lec.dhtOk) { f1.dec(lec.temp10, 1); f1.c((char)223); f1.c('C'); } else f1.p(PSTR("--"));
    f1.p(PSTR(" HA:"));
    if (lec.dhtOk) { f1.num(lec.humAire); f1.c('%'); } else f1.p(PSTR("--"));
    f2.p(PSTR("Suelo "));
    if (lec.sueloOk) { f2.num(lec.sueloPct); f2.c('%'); } else f2.p(PSTR("--"));
    if (ctrl.aj.phActivo) {
      f2.p(PSTR(" pH"));
      if (lec.phOk) { f2.dec((lec.ph100 + 5) / 10, 1); if (!lec.phCalibrado) f2.c('?'); } else f2.p(PSTR("--"));
    }
  } else if (pantalla == 1) {
    f1.p(PSTR("Bomba ")); f1.p(ctrl.sal.bomba ? PSTR("ON ") : PSTR("OFF"));
    f1.p(ctrl.manual ? PSTR(" MANUAL") : PSTR("  AUTO"));
    f2.p(PSTR("Ext "));   f2.p(ctrl.sal.vent ? PSTR("ON ") : PSTR("OFF"));
    f2.p(PSTR(" Luz "));  f2.p(ctrl.sal.lampara ? PSTR("ON") : PSTR("OFF"));
  } else if (pantalla == 2) {
    uint16_t resta = ctrl.segundosRestantesFase(ahora);
    if (ctrl.manual) { f1.p(PSTR("Bomba manual")); f2.p(PSTR("Faltan ")); }
    else if (ctrl.riego == RIEGO_REGANDO) { f1.p(PSTR("Regando ciclo ")); f1.num(ctrl.ciclo); f2.p(PSTR("Faltan ")); }
    else { f1.p(PSTR("Absorbiendo agua")); f2.p(PSTR("Mide en ")); }
    f2.num(resta); f2.p(PSTR(" s"));
  } else {
    f1.p(PSTR("! ALARMA"));
    f2.p(textoAlarma(ctrl.alarmas));
  }
  escribirFila(0, f1.b);
  escribirFila(1, f2.b);
}

// ---------------------------------------------------------------------
//  Sensores
// ---------------------------------------------------------------------
void leerSuelo() {
  digitalWrite(PIN_SUELO_VCC, HIGH);   // el FC-28 se alimenta solo al medir: se corroe menos
  delay(10);
  int m[5];
  for (uint8_t i = 0; i < 5; i++) m[i] = analogRead(PIN_SUELO);
  digitalWrite(PIN_SUELO_VCC, LOW);
  sueloCrudo = medianaDe(m, 5);
  if (ctrl.aj.ldrActivo) luzCrudo = analogRead(PIN_LDR);
}

void leerDht() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    if (fallasDht < 255) fallasDht++;
    return;
  }
  fallasDht = 0;
  dhtLeido = true;
  temp10 = (int16_t)(t * 10.0f + (t >= 0 ? 0.5f : -0.5f));
  humAire = (uint8_t)(h + 0.5f);
}

void muestrearPh() {
  muestrasPh[indicePh] = analogRead(PIN_PH);
  indicePh = (uint8_t)((indicePh + 1) % 10);
  if (cantidadPh < 10) cantidadPh++;
  if (cantidadPh == 10) phMv = milivoltiosDe(medianaDe(muestrasPh, 10));
}

bool phListo() { return cantidadPh == 10; }

bool iniciando(uint32_t ahora) {
  return ahora < 3000UL || (!dhtLeido && fallasDht < 3);
}

void armarLecturas() {
  lec.dhtOk = dhtLeido && fallasDht < 3;
  lec.temp10 = temp10;
  lec.humAire = humAire;
  lec.sueloOk = sueloValido(sueloCrudo);
  lec.sueloPct = porcentajeSuelo(sueloCrudo, mem.sueloSeco, mem.sueloMojado);
  lec.phCalibrado = (mem.phCalibrado & 3) == 3;
  lec.ph100 = ph100Desde(phMv, mem.phMvA, mem.ph100A, mem.phMvB, mem.ph100B);
  lec.phOk = ctrl.aj.phActivo && phListo() && phValido(phMv, lec.ph100);
  lec.ldrOk = ctrl.aj.ldrActivo;
  lec.luzPct = porcentajeLuz(luzCrudo);
}

// ---------------------------------------------------------------------
//  Botón «Regar ahora» (opcional, D3 a GND)
// ---------------------------------------------------------------------
void revisarBoton(uint32_t ahora) {
  bool v = digitalRead(PIN_BOTON) == HIGH;
  if (v == botonAnterior || ahora - tBoton < 50UL) return;
  tBoton = ahora;
  botonAnterior = v;
  if (v) return;                       // se soltó
  Serial.print(F("{\"tipo\":\"evento\",\"s\":"));
  Serial.print(ahora / 1000UL);
  if (ctrl.bombaManual(ahora, 5, true)) {
    Serial.println(F(",\"cod\":\"boton\",\"msg\":\"Botón: riego de 5 s.\"}"));
  } else {
    Serial.println(F(",\"cod\":\"boton\",\"msg\":\"Botón: no se riega, se alcanzó el tope de bomba de esta hora.\"}"));
  }
  aplicarSalidas();
}

// ---------------------------------------------------------------------
//  Mensajes al computador (una línea JSON por mensaje)
// ---------------------------------------------------------------------
void imprimirDecimal(Print& p, long valor, uint8_t decimales) {
  if (valor < 0) { p.print('-'); valor = -valor; }
  long div = decimales == 2 ? 100 : decimales == 1 ? 10 : 1;
  p.print(valor / div);
  if (decimales) {
    p.print('.');
    long f = valor % div;
    if (decimales == 2 && f < 10) p.print('0');
    p.print(f);
  }
}

void nulo() { Serial.print(F("null")); }

void enviarHola() {
  Serial.print(F("{\"tipo\":\"hola\",\"nombre\":\"MOS-K Green Tech\",\"version\":\"" VERSION_PROGRAMA "\",\"dht\":\""));
  Serial.print(TIPO_DHT == DHT22 ? F("DHT22") : F("DHT11"));
  Serial.print(F("\",\"lcd\":"));
  if (lcdDireccion) { Serial.print(F("\"0x")); Serial.print(lcdDireccion, HEX); Serial.print('"'); } else nulo();
  Serial.print(F(",\"rele_bajo\":"));
  Serial.print(RELE_ACTIVO_EN_BAJO ? 1 : 0);
  Serial.println(F("}"));
}

void enviarConfig() {
  const Ajustes& a = ctrl.aj;
  Serial.print(F("{\"tipo\":\"config\",\"suelo_min\":")); Serial.print(a.sueloMin);
  Serial.print(F(",\"suelo_obj\":"));  Serial.print(a.sueloObjetivo);
  Serial.print(F(",\"temp_min\":"));   imprimirDecimal(Serial, a.tempMin10, 1);
  Serial.print(F(",\"temp_max\":"));   imprimirDecimal(Serial, a.tempMax10, 1);
  Serial.print(F(",\"hum_aire_max\":")); Serial.print(a.humAireMax);
  Serial.print(F(",\"luz_min\":"));    Serial.print(a.luzMin);
  Serial.print(F(",\"pulso\":"));      Serial.print(a.pulsoSeg);
  Serial.print(F(",\"espera\":"));     Serial.print(a.esperaSeg);
  Serial.print(F(",\"ciclos\":"));     Serial.print(a.maxCiclos);
  Serial.print(F(",\"bomba_hora\":")); Serial.print(a.bombaHoraSeg);
  Serial.print(F(",\"ph_min\":"));     imprimirDecimal(Serial, a.phMin100, 2);
  Serial.print(F(",\"ph_max\":"));     imprimirDecimal(Serial, a.phMax100, 2);
  Serial.print(F(",\"sensor_ph\":"));  Serial.print(a.phActivo ? 1 : 0);
  Serial.print(F(",\"sensor_ldr\":")); Serial.print(a.ldrActivo ? 1 : 0);
  Serial.print(F(",\"suelo_seco\":")); Serial.print(mem.sueloSeco);
  Serial.print(F(",\"suelo_mojado\":")); Serial.print(mem.sueloMojado);
  Serial.print(F(",\"ph_cal\":"));     Serial.print(mem.phCalibrado & 3);
  Serial.print(F(",\"ph_a\":["));      imprimirDecimal(Serial, mem.ph100A, 2); Serial.print(','); Serial.print(mem.phMvA);
  Serial.print(F("],\"ph_b\":["));     imprimirDecimal(Serial, mem.ph100B, 2); Serial.print(','); Serial.print(mem.phMvB);
  Serial.println(F("]}"));
}

const __FlashStringHelper* nombreRiego() {
  switch (ctrl.riego) {
    case RIEGO_REGANDO:   return F("regando");
    case RIEGO_ESPERA:    return F("espera");
    case RIEGO_BLOQUEADO: return F("bloqueado");
    default:              return F("reposo");
  }
}

void listarAlarmas(uint16_t a) {
  bool primera = true;
  struct { uint16_t bit; const char* nombre; } const tabla[] = {
    {AL_DHT, PSTR("dht")}, {AL_SUELO, PSTR("suelo")}, {AL_SIN_EFECTO, PSTR("riego_sin_efecto")},
    {AL_LIMITE_BOMBA, PSTR("limite_bomba")}, {AL_PH_SIN_CALIBRAR, PSTR("ph_sin_calibrar")},
    {AL_PH_FALLA, PSTR("ph_falla")}, {AL_PH_FUERA, PSTR("ph_fuera")},
    {AL_TEMP_ALTA, PSTR("temp_alta")}, {AL_TEMP_BAJA, PSTR("temp_baja")}};
  for (uint8_t i = 0; i < sizeof(tabla) / sizeof(tabla[0]); i++) {
    if (!(a & tabla[i].bit)) continue;
    if (!primera) Serial.print(',');
    primera = false;
    Serial.print('"');
    Serial.print((const __FlashStringHelper*)tabla[i].nombre);
    Serial.print('"');
  }
}

void enviarDatos(uint32_t ahora) {
  bool listo = !iniciando(ahora);
  Serial.print(F("{\"tipo\":\"datos\",\"s\":")); Serial.print(ahora / 1000UL);
  Serial.print(F(",\"ini\":")); Serial.print(listo ? 0 : 1);
  Serial.print(F(",\"t\":"));    if (lec.dhtOk) imprimirDecimal(Serial, lec.temp10, 1); else nulo();
  Serial.print(F(",\"ha\":"));   if (lec.dhtOk) Serial.print(lec.humAire); else nulo();
  Serial.print(F(",\"hs\":"));   if (lec.sueloOk) Serial.print(lec.sueloPct); else nulo();
  Serial.print(F(",\"hsc\":"));  Serial.print(sueloCrudo);
  Serial.print(F(",\"ph\":"));   if (lec.phOk) imprimirDecimal(Serial, lec.ph100, 2); else nulo();
  Serial.print(F(",\"phmv\":")); if (ctrl.aj.phActivo && phListo()) Serial.print(phMv); else nulo();
  Serial.print(F(",\"luz\":"));  if (ctrl.aj.ldrActivo) Serial.print(lec.luzPct); else nulo();
  Serial.print(F(",\"bomba\":")); Serial.print(ctrl.sal.bomba ? 1 : 0);
  Serial.print(F(",\"vent\":"));  Serial.print(ctrl.sal.vent ? 1 : 0);
  Serial.print(F(",\"lamp\":"));  Serial.print(ctrl.sal.lampara ? 1 : 0);
  Serial.print(F(",\"modo\":\"")); Serial.print(ctrl.manual ? F("manual") : F("auto"));
  Serial.print(F("\",\"riego\":\"")); Serial.print(nombreRiego());
  Serial.print(F("\",\"ciclo\":")); Serial.print(ctrl.riego == RIEGO_REPOSO ? 0 : ctrl.ciclo);
  Serial.print(F(",\"fase\":"));  Serial.print(ctrl.segundosRestantesFase(ahora));
  Serial.print(F(",\"bh\":"));    Serial.print(ctrl.segundosBombaEstaHora());
  Serial.print(F(",\"al\":["));   listarAlarmas(ctrl.alarmas);
  Serial.println(F("]}"));
}

void inicioMensaje(const __FlashStringHelper* tipo, uint32_t ahora) {
  Serial.print(F("{\"tipo\":\""));
  Serial.print(tipo);
  Serial.print(F("\",\"s\":"));
  Serial.print(ahora / 1000UL);
  Serial.print(F(",\"msg\":\""));
}
void finMensaje() { Serial.println(F("\"}")); }
void error(const __FlashStringHelper* texto, uint32_t ahora) {
  inicioMensaje(F("error"), ahora);
  Serial.print(texto);
  finMensaje();
}

void enviarEventos(uint32_t ahora) {
  RegistroEvento e;
  while (ctrl.sacarEvento(e)) {
    Serial.print(F("{\"tipo\":\"evento\",\"s\":"));
    Serial.print(ahora / 1000UL);
    Serial.print(F(",\"cod\":"));
    Serial.print(e.codigo);
    Serial.print(F(",\"msg\":\""));
    switch (e.codigo) {
      case EV_RIEGO_INICIO:
        Serial.print(F("Riego automático: el suelo está en ")); Serial.print(e.a);
        Serial.print(F(" % y el mínimo es ")); Serial.print(e.b); Serial.print(F(" %."));
        break;
      case EV_RIEGO_PULSO:
        Serial.print(F("Riego, ciclo ")); Serial.print(e.a);
        Serial.print(F(": el suelo va en ")); Serial.print(e.b); Serial.print(F(" %."));
        break;
      case EV_RIEGO_ESPERA:
        Serial.print(F("Ciclo ")); Serial.print(e.a);
        Serial.print(F(" listo: se esperan ")); Serial.print(e.b); Serial.print(F(" s para que el agua se absorba."));
        break;
      case EV_RIEGO_LISTO:
        Serial.print(F("Riego terminado: el suelo llegó a ")); Serial.print(e.a);
        Serial.print(F(" % (objetivo ")); Serial.print(e.b); Serial.print(F(" %)."));
        break;
      case EV_RIEGO_CICLOS:
        Serial.print(F("Riego en pausa tras ")); Serial.print(e.b);
        Serial.print(F(" ciclos: el suelo subió a ")); Serial.print(e.a);
        Serial.print(F(" %. Se volverá a regar si baja del mínimo."));
        break;
      case EV_RIEGO_SIN_EFECTO:
        Serial.print(F("Alarma: se regó y la humedad no subió (de ")); Serial.print(e.a);
        Serial.print(F(" % a ")); Serial.print(e.b);
        Serial.print(F(" %). Revisa el estanque, la bomba y el sensor. El riego automático queda detenido hasta reiniciar la alarma."));
        break;
      case EV_RIEGO_CORTADO:
        Serial.print(F("Riego detenido: el sensor de suelo dejó de medir."));
        break;
      case EV_LIMITE_BOMBA:
        Serial.print(F("Bomba detenida: se usaron ")); Serial.print(e.a);
        Serial.print(F(" s de bomba en esta hora, el máximo permitido."));
        break;
      case EV_VENT_ON:
      case EV_VENT_OFF:
        Serial.print(e.codigo == EV_VENT_ON ? F("Extractor encendido: ") : F("Extractor apagado: "));
        imprimirDecimal(Serial, e.a, 1); Serial.print(F(" °C y ")); Serial.print(e.b);
        Serial.print(F(" % de humedad del aire."));
        break;
      case EV_VENT_SEGURIDAD:
        Serial.print(F("Extractor encendido por precaución: el sensor de temperatura no responde."));
        break;
      case EV_LAMP_ON:
        Serial.print(e.b ? F("Luz térmica encendida por falta de luz (") : F("Luz térmica encendida: hace frío ("));
        imprimirDecimal(Serial, e.a, 1); Serial.print(F(" °C)."));
        break;
      case EV_LAMP_OFF:
        Serial.print(F("Luz térmica apagada (")); imprimirDecimal(Serial, e.a, 1); Serial.print(F(" °C)."));
        break;
      case EV_LAMP_SEGURIDAD:
        Serial.print(F("Luz térmica apagada por seguridad: temperatura alta o sensor sin respuesta."));
        break;
      case EV_FALLA_DHT:
        Serial.print(F("Falla: el sensor DHT no responde. Revisa el cable de datos en D2."));
        break;
      case EV_DHT_OK:
        Serial.print(F("El sensor DHT volvió a responder."));
        break;
      case EV_FALLA_SUELO:
        Serial.print(F("Falla: el sensor de suelo está fuera de la tierra o desconectado (A0). No se regará hasta que vuelva."));
        break;
      case EV_SUELO_OK:
        Serial.print(F("El sensor de suelo volvió a medir."));
        break;
      case EV_MODO_MANUAL:
        Serial.print(F("Modo manual: el automático queda en pausa y vuelve solo tras 10 minutos sin órdenes."));
        break;
      case EV_MODO_AUTO:
        Serial.print(F("Modo automático."));
        break;
      case EV_MANUAL_VENCIDO:
        Serial.print(F("10 minutos sin órdenes: vuelve el modo automático."));
        break;
      case EV_BOMBA_MANUAL_FIN:
        Serial.print(F("Bomba apagada tras ")); Serial.print(e.a); Serial.print(F(" s."));
        break;
      case EV_ALARMAS_REINICIADAS:
        Serial.print(F("Alarmas reiniciadas: el riego automático vuelve a funcionar."));
        break;
      default:
        Serial.print(F("Evento ")); Serial.print(e.codigo);
    }
    Serial.println(F("\"}"));
  }
}

// ---------------------------------------------------------------------
//  Órdenes desde el computador (una por línea)
// ---------------------------------------------------------------------
bool es(const char* a, const char* bP) { return a && strcmp_P(a, bP) == 0; }

bool numeroEn(const char* txt, int16_t escala, int16_t minimo, int16_t maximo, int16_t& v) {
  return leerDecimal(txt, escala, v) && v >= minimo && v <= maximo;
}

void ayuda() {
  Serial.println(F("# MOS-K Green Tech. Ordenes (terminar con Enter, 115200 baudios):"));
  Serial.println(F("# ESTADO | CONFIG | MODO AUTO | MODO MANUAL"));
  Serial.println(F("# REGAR 5 | BOMBA ON 10 | BOMBA OFF | EXTRACTOR ON/OFF | LUZ ON/OFF"));
  Serial.println(F("# SET SUELO 35 55 | SET TEMP 15 28 | SET HUM_AIRE 85 | SET LUZ 30"));
  Serial.println(F("# SET RIEGO 5 60 6 (pulso s, espera s, ciclos) | SET BOMBA_HORA 120 | SET PH 5.5 7.5"));
  Serial.println(F("# SENSOR PH ON/OFF | SENSOR LDR ON/OFF"));
  Serial.println(F("# CAL SUELO SECO | CAL SUELO MOJADO | CAL PH 7 | CAL PH 4 | CAL PH 10"));
  Serial.println(F("# ALARMAS RESET | FABRICA"));
}

void confirmarAjuste(uint32_t ahora) {
  guardarMemoria();
  inicioMensaje(F("ok"), ahora);
  Serial.print(F("Ajuste guardado."));
  finMensaje();
  enviarConfig();
}

void ejecutar(char* texto, uint32_t ahora) {
  for (char* p = texto; *p; p++) if (*p >= 'a' && *p <= 'z') *p = (char)(*p - 32);
  char* tok[6] = {0, 0, 0, 0, 0, 0};
  uint8_t n = 0;
  char* s = strtok(texto, " \t");
  while (s && n < 6) { tok[n++] = s; s = strtok(0, " \t"); }
  if (n == 0) return;
  int16_t a, b, c;

  if (es(tok[0], PSTR("AYUDA")) || es(tok[0], PSTR("?"))) { ayuda(); return; }
  if (es(tok[0], PSTR("ESTADO"))) { enviarDatos(ahora); return; }
  if (es(tok[0], PSTR("CONFIG"))) { enviarHola(); enviarConfig(); return; }

  if (es(tok[0], PSTR("MODO"))) {
    if (es(tok[1], PSTR("AUTO"))) ctrl.modoAutomatico(ahora);
    else if (es(tok[1], PSTR("MANUAL"))) ctrl.ventManual(ahora, ctrl.sal.vent);   // entra a manual sin cambiar nada
    else { error(F("Usa MODO AUTO o MODO MANUAL."), ahora); return; }
    enviarEventos(ahora);
    enviarDatos(ahora);
    return;
  }

  if (es(tok[0], PSTR("REGAR")) || es(tok[0], PSTR("BOMBA"))) {
    bool regar = es(tok[0], PSTR("REGAR"));
    if (!regar && es(tok[1], PSTR("OFF"))) {
      ctrl.apagarBombaManual(ahora);
    } else if (regar || es(tok[1], PSTR("ON"))) {
      const char* segTxt = regar ? tok[1] : tok[2];
      int16_t seg = 5;
      if (segTxt && !numeroEn(segTxt, 1, 1, BOMBA_MANUAL_MAX_SEG, seg)) {
        error(F("Los segundos de bomba van de 1 a 30."), ahora);
        return;
      }
      if (!ctrl.bombaManual(ahora, (uint8_t)seg, regar)) {
        error(F("No se puede: se alcanzó el tope de bomba de esta hora. Usa ALARMAS RESET si revisaste el estanque."), ahora);
        return;
      }
    } else {
      error(F("Usa REGAR 5, BOMBA ON 10 o BOMBA OFF."), ahora);
      return;
    }
    aplicarSalidas();
    enviarEventos(ahora);
    enviarDatos(ahora);
    return;
  }

  if (es(tok[0], PSTR("EXTRACTOR")) || es(tok[0], PSTR("VENT")) || es(tok[0], PSTR("LUZ"))) {
    bool on = es(tok[1], PSTR("ON"));
    if (!on && !es(tok[1], PSTR("OFF"))) { error(F("Usa ON u OFF."), ahora); return; }
    if (es(tok[0], PSTR("LUZ"))) ctrl.lamparaManual(ahora, on); else ctrl.ventManual(ahora, on);
    aplicarSalidas();
    enviarEventos(ahora);
    enviarDatos(ahora);
    return;
  }

  if (es(tok[0], PSTR("SET"))) {
    Ajustes& aj = ctrl.aj;
    if (es(tok[1], PSTR("SUELO"))) {
      if (!numeroEn(tok[2], 1, 5, 90, a) || !numeroEn(tok[3], 1, 10, 100, b) || b < a + 5) {
        error(F("SET SUELO mínimo objetivo: mínimo de 5 a 90 %, objetivo al menos 5 puntos más alto."), ahora); return;
      }
      aj.sueloMin = (uint8_t)a; aj.sueloObjetivo = (uint8_t)b;
    } else if (es(tok[1], PSTR("TEMP"))) {
      if (!numeroEn(tok[2], 10, 0, 350, a) || !numeroEn(tok[3], 10, 100, 450, b) || b < a + 30) {
        error(F("SET TEMP mínima máxima: entre 0 y 45 °C, con al menos 3 °C de diferencia."), ahora); return;
      }
      aj.tempMin10 = a; aj.tempMax10 = b;
    } else if (es(tok[1], PSTR("HUM_AIRE"))) {
      if (!numeroEn(tok[2], 1, 40, 99, a)) { error(F("SET HUM_AIRE va de 40 a 99 %."), ahora); return; }
      aj.humAireMax = (uint8_t)a;
    } else if (es(tok[1], PSTR("LUZ"))) {
      if (!numeroEn(tok[2], 1, 0, 90, a)) { error(F("SET LUZ va de 0 a 90 %."), ahora); return; }
      aj.luzMin = (uint8_t)a;
    } else if (es(tok[1], PSTR("RIEGO"))) {
      if (!numeroEn(tok[2], 1, 1, 30, a) || !numeroEn(tok[3], 1, 10, 600, b) || !numeroEn(tok[4], 1, 1, 20, c)) {
        error(F("SET RIEGO pulso espera ciclos: pulso de 1 a 30 s, espera de 10 a 600 s, de 1 a 20 ciclos."), ahora); return;
      }
      aj.pulsoSeg = (uint8_t)a; aj.esperaSeg = (uint16_t)b; aj.maxCiclos = (uint8_t)c;
    } else if (es(tok[1], PSTR("BOMBA_HORA"))) {
      if (!numeroEn(tok[2], 1, 10, 900, a)) { error(F("SET BOMBA_HORA va de 10 a 900 s."), ahora); return; }
      aj.bombaHoraSeg = (uint16_t)a;
    } else if (es(tok[1], PSTR("PH"))) {
      if (!numeroEn(tok[2], 100, 0, 1350, a) || !numeroEn(tok[3], 100, 50, 1400, b) || b < a + 50) {
        error(F("SET PH mínimo máximo: entre 0 y 14, con al menos 0,5 de diferencia."), ahora); return;
      }
      aj.phMin100 = a; aj.phMax100 = b;
    } else {
      error(F("Ajuste desconocido. Escribe AYUDA."), ahora); return;
    }
    confirmarAjuste(ahora);
    return;
  }

  if (es(tok[0], PSTR("SENSOR"))) {
    bool on = es(tok[2], PSTR("ON"));
    if (!on && !es(tok[2], PSTR("OFF"))) { error(F("Usa SENSOR PH ON/OFF o SENSOR LDR ON/OFF."), ahora); return; }
    if (es(tok[1], PSTR("PH"))) ctrl.aj.phActivo = on;
    else if (es(tok[1], PSTR("LDR"))) ctrl.aj.ldrActivo = on;
    else { error(F("Usa SENSOR PH ON/OFF o SENSOR LDR ON/OFF."), ahora); return; }
    confirmarAjuste(ahora);
    return;
  }

  if (es(tok[0], PSTR("CAL"))) {
    if (es(tok[1], PSTR("SUELO"))) {
      bool seco = es(tok[2], PSTR("SECO"));
      if (!seco && !es(tok[2], PSTR("MOJADO"))) { error(F("Usa CAL SUELO SECO o CAL SUELO MOJADO."), ahora); return; }
      leerSuelo();
      int otro = seco ? mem.sueloMojado : mem.sueloSeco;
      int dif = sueloCrudo > otro ? sueloCrudo - otro : otro - sueloCrudo;
      if (dif < 100) {
        error(F("Esta lectura es casi igual a la del otro punto. Mide en tierra seca y luego con el sensor en un vaso de agua."), ahora);
        return;
      }
      if (seco) mem.sueloSeco = (int16_t)sueloCrudo; else mem.sueloMojado = (int16_t)sueloCrudo;
      guardarMemoria();
      inicioMensaje(F("ok"), ahora);
      Serial.print(seco ? F("Suelo seco calibrado en ") : F("Suelo mojado calibrado en "));
      Serial.print(sueloCrudo);
      finMensaje();
      enviarConfig();
      return;
    }
    if (es(tok[1], PSTR("PH"))) {
      int16_t ph100;
      if (es(tok[2], PSTR("7"))) ph100 = 700;
      else if (es(tok[2], PSTR("4"))) ph100 = 400;
      else if (es(tok[2], PSTR("10"))) ph100 = 1000;
      else { error(F("Usa CAL PH 7, CAL PH 4 o CAL PH 10."), ahora); return; }
      if (!ctrl.aj.phActivo || !phListo() || phMv < 100 || phMv > 4900) {
        error(F("La sonda de pH no entrega una lectura válida. Revisa que esté conectada en A1 y que SENSOR PH esté en ON."), ahora);
        return;
      }
      int16_t otroMv = ph100 == 700 ? mem.phMvB : mem.phMvA;
      bool otroListo = ph100 == 700 ? (mem.phCalibrado & 2) : (mem.phCalibrado & 1);
      if (otroListo && (phMv - otroMv < 80 && otroMv - phMv < 80)) {
        error(F("La lectura es casi igual a la de la otra solución. Enjuaga la sonda y espera que la lectura se estabilice."), ahora);
        return;
      }
      if (ph100 == 700) { mem.phMvA = phMv; mem.ph100A = 700; mem.phCalibrado |= 1; }
      else { mem.phMvB = phMv; mem.ph100B = ph100; mem.phCalibrado |= 2; }
      guardarMemoria();
      inicioMensaje(F("ok"), ahora);
      Serial.print(F("pH "));
      Serial.print(ph100 / 100);
      Serial.print(F(" calibrado en "));
      Serial.print(phMv);
      Serial.print(F(" mV."));
      if ((mem.phCalibrado & 3) == 3) {
        Serial.print(F(" Pendiente: "));
        imprimirDecimal(Serial, (long)(mem.phMvB - mem.phMvA) * 10L / ((mem.ph100B - mem.ph100A) / 100), 1);
        Serial.print(F(" mV por unidad de pH."));
      } else {
        Serial.print(F(" Falta el segundo punto."));
      }
      finMensaje();
      enviarConfig();
      return;
    }
    error(F("Usa CAL SUELO SECO/MOJADO o CAL PH 7/4/10."), ahora);
    return;
  }

  if (es(tok[0], PSTR("ALARMAS")) || es(tok[0], PSTR("RESET"))) {
    ctrl.reiniciarAlarmas(ahora);
    enviarEventos(ahora);
    enviarDatos(ahora);
    return;
  }

  if (es(tok[0], PSTR("FABRICA"))) {
    valoresDeFabrica();
    ctrl.aj = mem.aj;
    guardarMemoria();
    inicioMensaje(F("ok"), ahora);
    Serial.print(F("Valores de fábrica restaurados. Hay que volver a calibrar."));
    finMensaje();
    enviarConfig();
    return;
  }

  error(F("Orden desconocida. Escribe AYUDA."), ahora);
}

void leerSerie(uint32_t ahora) {
  while (Serial.available() > 0) {
    char ch = (char)Serial.read();
    if (ch == '\n' || ch == '\r') {
      if (lineaLarga) error(F("Orden demasiado larga."), ahora);
      else if (largoLinea > 0) { linea[largoLinea] = 0; ejecutar(linea, ahora); }
      largoLinea = 0;
      lineaLarga = false;
    } else if (largoLinea < sizeof(linea) - 1) {
      linea[largoLinea++] = ch;
    } else {
      lineaLarga = true;
    }
  }
}

// ---------------------------------------------------------------------
//  Inicio y ciclo principal (sin delay: todo se reparte en el tiempo)
// ---------------------------------------------------------------------
void setup() {
  // Relés apagados ANTES de declararlos como salida: así no parten al encender.
  escribirRele(PIN_BOMBA, false);
  escribirRele(PIN_VENT, false);
  escribirRele(PIN_LAMPARA, false);
  pinMode(PIN_BOMBA, OUTPUT);
  pinMode(PIN_VENT, OUTPUT);
  pinMode(PIN_LAMPARA, OUTPUT);
  pinMode(PIN_SUELO_VCC, OUTPUT);
  digitalWrite(PIN_SUELO_VCC, LOW);
  if (USA_BOTON) pinMode(PIN_BOTON, INPUT_PULLUP);

  Serial.begin(VELOCIDAD_SERIE);
  cargarMemoria();
  ctrl.iniciar(millis());
  dht.begin();
  iniciarLcd();
  enviarHola();
  enviarConfig();
  leerSuelo();
}

void loop() {
  uint32_t ahora = millis();
  leerSerie(ahora);
  if (ahora - tSuelo >= 1000UL) { tSuelo = ahora; leerSuelo(); }
  if (ahora - tDht >= 2500UL)   { tDht = ahora; leerDht(); }
  if (ahora - tPh >= 200UL)     { tPh = ahora; if (ctrl.aj.phActivo) muestrearPh(); }
  if (USA_BOTON) revisarBoton(ahora);
  if (ahora - tCtrl >= 500UL) {
    tCtrl = ahora;
    armarLecturas();
    if (!iniciando(ahora)) ctrl.paso(ahora, lec);
    aplicarSalidas();
    enviarEventos(ahora);
  }
  if (ahora - tDatos >= 2000UL) { tDatos = ahora; enviarDatos(ahora); }
  if (ahora - tLcd >= 1000UL)   { tLcd = ahora; mostrarLcd(ahora); }
}
