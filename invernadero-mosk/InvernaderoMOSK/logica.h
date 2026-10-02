// =====================================================================
//  logica.h — Las decisiones del invernadero, sin nada de hardware.
//  Recibe lecturas y la hora (millis) y decide bomba, extractor y luz.
//  Por no depender del Arduino, se puede probar en el computador.
// =====================================================================
#pragma once
#include <stdint.h>

// Valores que el panel puede cambiar y que se guardan en la EEPROM.
struct Ajustes {
  uint8_t  sueloMin;        // % de humedad del suelo bajo el cual se riega
  uint8_t  sueloObjetivo;   // % al que se quiere llegar
  int16_t  tempMax10;       // décimas de °C: sobre esto se enciende el extractor
  int16_t  tempMin10;       // décimas de °C: bajo esto se enciende la luz térmica
  uint8_t  humAireMax;      // % de humedad del aire sobre el cual se ventila
  uint8_t  luzMin;          // % de luz bajo el cual se enciende la lámpara (si hay LDR)
  uint8_t  pulsoSeg;        // segundos de bomba por ciclo de riego
  uint16_t esperaSeg;       // segundos de espera para que el agua se absorba
  uint8_t  maxCiclos;       // ciclos de riego seguidos como máximo
  uint16_t bombaHoraSeg;    // segundos de bomba permitidos por hora
  int16_t  phMin100;        // centésimas de pH: rango recomendado
  int16_t  phMax100;
  bool     phActivo;        // hay sensor de pH conectado
  bool     ldrActivo;       // hay fotorresistencia conectada
};
void ajustesDeFabrica(Ajustes& a);

struct Lecturas {
  bool     dhtOk;      int16_t temp10;  uint8_t humAire;
  bool     sueloOk;    uint8_t sueloPct;
  bool     phCalibrado; bool phOk;      int16_t ph100;
  bool     ldrOk;      uint8_t luzPct;
};

struct Salidas { bool bomba; bool vent; bool lampara; };

enum EstadoRiego : uint8_t { RIEGO_REPOSO, RIEGO_REGANDO, RIEGO_ESPERA, RIEGO_BLOQUEADO };

enum Alarma : uint16_t {
  AL_DHT            = 1 << 0,  // el DHT no responde
  AL_SUELO          = 1 << 1,  // el FC-28 fuera de la tierra o desconectado
  AL_SIN_EFECTO     = 1 << 2,  // se regó y la humedad no subió: estanque vacío, bomba o sensor
  AL_LIMITE_BOMBA   = 1 << 3,  // se usó todo el tiempo de bomba de esta hora
  AL_PH_SIN_CALIBRAR= 1 << 4,
  AL_PH_FALLA       = 1 << 5,  // voltaje imposible: sonda desconectada
  AL_PH_FUERA       = 1 << 6,  // pH fuera del rango recomendado
  AL_TEMP_ALTA      = 1 << 7,  // 3 °C sobre el máximo
  AL_TEMP_BAJA      = 1 << 8   // 3 °C bajo el mínimo
};

enum Evento : uint8_t {
  EV_RIEGO_INICIO = 1,   // a = % suelo, b = mínimo
  EV_RIEGO_PULSO,        // a = ciclo, b = % suelo
  EV_RIEGO_ESPERA,       // a = ciclo, b = segundos de espera
  EV_RIEGO_LISTO,        // a = % suelo, b = objetivo
  EV_RIEGO_CICLOS,       // a = % suelo, b = ciclos
  EV_RIEGO_SIN_EFECTO,   // a = % inicial, b = % final
  EV_RIEGO_CORTADO,      // el sensor de suelo falló durante el riego
  EV_LIMITE_BOMBA,       // a = segundos usados
  EV_VENT_ON,            // a = temp10, b = humedad del aire
  EV_VENT_OFF,           // a = temp10, b = humedad del aire
  EV_VENT_SEGURIDAD,     // DHT caído: extractor encendido por precaución
  EV_LAMP_ON,            // a = temp10, b = 1 si es por falta de luz
  EV_LAMP_OFF,           // a = temp10
  EV_FALLA_DHT,
  EV_DHT_OK,
  EV_FALLA_SUELO,        // a = 0
  EV_SUELO_OK,
  EV_MODO_MANUAL,
  EV_MODO_AUTO,
  EV_MANUAL_VENCIDO,     // 10 minutos sin órdenes: vuelve a automático
  EV_BOMBA_MANUAL_FIN,   // a = segundos que funcionó
  EV_ALARMAS_REINICIADAS,
  EV_LAMP_SEGURIDAD      // luz apagada por temperatura alta
};
struct RegistroEvento { uint8_t codigo; int16_t a; int16_t b; };

const uint32_t MIN_CAMBIO_MS   = 30000UL;   // un relé no cambia antes de 30 s
const uint32_t MANUAL_VENCE_MS = 600000UL;  // 10 minutos
const uint32_t HORA_MS         = 3600000UL;
const uint8_t  BOMBA_MANUAL_MAX_SEG = 30;
const int16_t  MARGEN_TEMP_ALARMA10 = 30;   // 3 °C

class Controlador {
 public:
  Ajustes     aj;
  Salidas     sal;
  EstadoRiego riego;
  uint8_t     ciclo;
  uint16_t    alarmas;
  bool        manual;

  void iniciar(uint32_t ms);
  void paso(uint32_t ms, const Lecturas& l);           // llamar cada ~0,5 s
  void reiniciarAlarmas(uint32_t ms);
  // soloPulso: riego puntual («Regar ahora» o el botón) que vuelve solo a automático
  bool bombaManual(uint32_t ms, uint8_t seg, bool soloPulso = false);  // false si el tope por hora lo impide
  void apagarBombaManual(uint32_t ms);
  void ventManual(uint32_t ms, bool encendido);
  void lamparaManual(uint32_t ms, bool encendido);
  void modoAutomatico(uint32_t ms);
  uint16_t segundosRestantesFase(uint32_t ms) const;   // cuenta regresiva de riego o espera
  uint16_t segundosBombaEstaHora() const { return (uint16_t)(bombaMsVentana / 1000UL); }
  uint8_t  sueloAlIniciar() const { return sueloInicio; }
  bool sacarEvento(RegistroEvento& e);

 private:
  uint32_t tFase, tVent, tLamp, tManual, bombaManualHasta, bombaManualDesde;
  uint32_t ventanaInicio, ultimoMs, bombaMsVentana;
  bool     ventMovido, lampMovida, primerPaso, pulsoUnico;
  uint8_t  sueloInicio;
  RegistroEvento cola[8];
  uint8_t  colaInicio, colaCantidad;

  void emitir(uint8_t codigo, int16_t a = 0, int16_t b = 0);
  void entrarManual(uint32_t ms);
  void detenerRiego();
  void controlarVentilador(uint32_t ms, const Lecturas& l);
  void controlarLampara(uint32_t ms, const Lecturas& l);
  void revisarAlarmasSensores(const Lecturas& l);
};
