// =====================================================================
//  logica.cpp — Reglas del invernadero.
//
//  Riego por ciclos: cuando el suelo baja del mínimo, la bomba funciona
//  unos segundos (pulso), se espera a que el agua se absorba y se vuelve
//  a medir. Se repite hasta llegar al objetivo o al máximo de ciclos.
//  Si después de todos los ciclos la humedad no subió, el riego se
//  detiene con una alarma: así un estanque vacío, una bomba dañada o un
//  sensor suelto no dejan la bomba funcionando sin control.
//
//  Extractor y luz térmica usan histéresis (encienden en un valor y
//  apagan en otro) y no cambian antes de 30 s, para no golpear los relés.
// =====================================================================
#include "logica.h"

void ajustesDeFabrica(Ajustes& a) {
  a.sueloMin      = 35;
  a.sueloObjetivo = 55;
  a.tempMax10     = 280;   // 28,0 °C
  a.tempMin10     = 150;   // 15,0 °C
  a.humAireMax    = 85;
  a.luzMin        = 30;
  a.pulsoSeg      = 5;
  a.esperaSeg     = 60;
  a.maxCiclos     = 6;
  a.bombaHoraSeg  = 120;
  a.phMin100      = 550;   // pH 5,5
  a.phMax100      = 750;   // pH 7,5
  a.phActivo      = true;
  a.ldrActivo     = false;
}

void Controlador::iniciar(uint32_t ms) {
  sal.bomba = sal.vent = sal.lampara = false;
  riego = RIEGO_REPOSO;
  ciclo = 0;
  alarmas = 0;
  manual = false;
  pulsoUnico = false;
  tFase = tVent = tLamp = tManual = ms;
  bombaManualHasta = bombaManualDesde = ms;
  ventanaInicio = ultimoMs = ms;
  bombaMsVentana = 0;
  ventMovido = lampMovida = false;
  primerPaso = true;
  sueloInicio = 0;
  colaInicio = colaCantidad = 0;
}

void Controlador::emitir(uint8_t codigo, int16_t a, int16_t b) {
  if (colaCantidad == 8) {             // cola llena: se pierde el evento más antiguo
    colaInicio = (uint8_t)((colaInicio + 1) % 8);
    colaCantidad = 7;
  }
  RegistroEvento& e = cola[(colaInicio + colaCantidad) % 8];
  e.codigo = codigo;
  e.a = a;
  e.b = b;
  colaCantidad++;
}

bool Controlador::sacarEvento(RegistroEvento& e) {
  if (colaCantidad == 0) return false;
  e = cola[colaInicio];
  colaInicio = (uint8_t)((colaInicio + 1) % 8);
  colaCantidad--;
  return true;
}

void Controlador::revisarAlarmasSensores(const Lecturas& l) {
  if (!l.dhtOk && !(alarmas & AL_DHT)) { alarmas |= AL_DHT; emitir(EV_FALLA_DHT); }
  else if (l.dhtOk && (alarmas & AL_DHT)) { alarmas &= (uint16_t)~AL_DHT; emitir(EV_DHT_OK); }

  if (!l.sueloOk && !(alarmas & AL_SUELO)) { alarmas |= AL_SUELO; emitir(EV_FALLA_SUELO); }
  else if (l.sueloOk && (alarmas & AL_SUELO)) { alarmas &= (uint16_t)~AL_SUELO; emitir(EV_SUELO_OK); }

  uint16_t ph = 0;
  if (aj.phActivo) {
    if (!l.phCalibrado) ph |= AL_PH_SIN_CALIBRAR;
    if (!l.phOk) ph |= AL_PH_FALLA;
    else if (l.phCalibrado && (l.ph100 < aj.phMin100 || l.ph100 > aj.phMax100)) ph |= AL_PH_FUERA;
  }
  alarmas = (uint16_t)((alarmas & ~(AL_PH_SIN_CALIBRAR | AL_PH_FALLA | AL_PH_FUERA)) | ph);

  uint16_t t = 0;
  if (l.dhtOk) {
    if (l.temp10 >= aj.tempMax10 + MARGEN_TEMP_ALARMA10) t |= AL_TEMP_ALTA;
    if (l.temp10 <= aj.tempMin10 - MARGEN_TEMP_ALARMA10) t |= AL_TEMP_BAJA;
  }
  alarmas = (uint16_t)((alarmas & ~(AL_TEMP_ALTA | AL_TEMP_BAJA)) | t);
}

void Controlador::detenerRiego() {
  sal.bomba = false;
  riego = RIEGO_REPOSO;
}

void Controlador::paso(uint32_t ms, const Lecturas& l) {
  uint32_t dt = primerPaso ? 0 : ms - ultimoMs;
  primerPaso = false;
  ultimoMs = ms;
  if (sal.bomba) bombaMsVentana += dt;
  if (ms - ventanaInicio >= HORA_MS) {          // nueva hora: se renueva el tiempo de bomba
    ventanaInicio = ms;
    bombaMsVentana = 0;
    alarmas &= (uint16_t)~AL_LIMITE_BOMBA;
  }
  revisarAlarmasSensores(l);

  // Tope de bomba por hora, en modo manual y automático
  if (sal.bomba && bombaMsVentana >= (uint32_t)aj.bombaHoraSeg * 1000UL) {
    sal.bomba = false;
    alarmas |= AL_LIMITE_BOMBA;
    emitir(EV_LIMITE_BOMBA, (int16_t)segundosBombaEstaHora());
    if (!manual && riego != RIEGO_BLOQUEADO) riego = RIEGO_REPOSO;
    if (manual && pulsoUnico) { pulsoUnico = false; modoAutomatico(ms); return; }
  }

  if (manual) {
    if (sal.bomba && (int32_t)(ms - bombaManualHasta) >= 0) {
      sal.bomba = false;
      emitir(EV_BOMBA_MANUAL_FIN, (int16_t)((ms - bombaManualDesde) / 1000UL));
      if (pulsoUnico) { pulsoUnico = false; modoAutomatico(ms); return; }
    }
    if (sal.lampara && (!l.dhtOk || (alarmas & AL_TEMP_ALTA))) {   // la luz no se queda encendida con calor
      sal.lampara = false;
      tLamp = ms;
      emitir(EV_LAMP_SEGURIDAD, l.dhtOk ? l.temp10 : 0);
    }
    if (ms - tManual >= MANUAL_VENCE_MS) {
      emitir(EV_MANUAL_VENCIDO);
      modoAutomatico(ms);
    }
    return;
  }

  switch (riego) {
    case RIEGO_REPOSO:
      if (l.sueloOk && l.sueloPct < aj.sueloMin && !(alarmas & AL_LIMITE_BOMBA)) {
        riego = RIEGO_REGANDO;
        ciclo = 1;
        sueloInicio = l.sueloPct;
        tFase = ms;
        sal.bomba = true;
        emitir(EV_RIEGO_INICIO, l.sueloPct, aj.sueloMin);
      }
      break;

    case RIEGO_REGANDO:
      if (!l.sueloOk) {
        detenerRiego();
        emitir(EV_RIEGO_CORTADO);
      } else if (ms - tFase >= (uint32_t)aj.pulsoSeg * 1000UL) {
        sal.bomba = false;
        riego = RIEGO_ESPERA;
        tFase = ms;
        emitir(EV_RIEGO_ESPERA, ciclo, (int16_t)aj.esperaSeg);
      }
      break;

    case RIEGO_ESPERA:
      if (!l.sueloOk) {
        detenerRiego();
        emitir(EV_RIEGO_CORTADO);
      } else if (ms - tFase >= (uint32_t)aj.esperaSeg * 1000UL) {
        if (l.sueloPct >= aj.sueloObjetivo) {
          riego = RIEGO_REPOSO;
          emitir(EV_RIEGO_LISTO, l.sueloPct, aj.sueloObjetivo);
        } else if (ciclo >= aj.maxCiclos) {
          if (l.sueloPct < sueloInicio + 5) {
            riego = RIEGO_BLOQUEADO;
            alarmas |= AL_SIN_EFECTO;
            emitir(EV_RIEGO_SIN_EFECTO, sueloInicio, l.sueloPct);
          } else {
            riego = RIEGO_REPOSO;
            emitir(EV_RIEGO_CICLOS, l.sueloPct, ciclo);
          }
        } else if (alarmas & AL_LIMITE_BOMBA) {
          riego = RIEGO_REPOSO;
        } else {
          ciclo++;
          riego = RIEGO_REGANDO;
          tFase = ms;
          sal.bomba = true;
          emitir(EV_RIEGO_PULSO, ciclo, l.sueloPct);
        }
      }
      break;

    case RIEGO_BLOQUEADO:
      sal.bomba = false;
      break;
  }

  controlarVentilador(ms, l);
  controlarLampara(ms, l);
}

void Controlador::controlarVentilador(uint32_t ms, const Lecturas& l) {
  bool quiere, urgente = false;
  if (!l.dhtOk) {
    quiere = true;            // sin sensor no se sabe si hace calor: se ventila por precaución
    urgente = true;
  } else if (sal.vent) {
    quiere = !(l.temp10 <= aj.tempMax10 - 15 && l.humAire + 5 <= aj.humAireMax);
  } else {
    quiere = l.temp10 >= aj.tempMax10 || l.humAire >= aj.humAireMax;
  }
  if (quiere == sal.vent) return;
  if (!urgente && ventMovido && ms - tVent < MIN_CAMBIO_MS) return;
  sal.vent = quiere;
  tVent = ms;
  ventMovido = true;
  if (!l.dhtOk) emitir(EV_VENT_SEGURIDAD);
  else emitir(quiere ? EV_VENT_ON : EV_VENT_OFF, l.temp10, l.humAire);
}

void Controlador::controlarLampara(uint32_t ms, const Lecturas& l) {
  bool quiere, urgente = false, porLuz = false;
  if (!l.dhtOk || l.temp10 >= aj.tempMax10) {
    quiere = false;           // nunca se agrega calor si hace calor o si no se sabe
    urgente = true;
  } else {
    bool faltaLuz = aj.ldrActivo && l.ldrOk &&
                    (sal.lampara ? l.luzPct < aj.luzMin + 10 : l.luzPct < aj.luzMin);
    bool frio = sal.lampara ? l.temp10 < aj.tempMin10 + 20 : l.temp10 <= aj.tempMin10;
    quiere = frio || faltaLuz;
    porLuz = faltaLuz && !frio;
  }
  if (quiere == sal.lampara) return;
  if (!urgente && lampMovida && ms - tLamp < MIN_CAMBIO_MS) return;
  sal.lampara = quiere;
  tLamp = ms;
  lampMovida = true;
  if (quiere) emitir(EV_LAMP_ON, l.temp10, porLuz ? 1 : 0);
  else if (urgente) emitir(EV_LAMP_SEGURIDAD, l.dhtOk ? l.temp10 : 0);
  else emitir(EV_LAMP_OFF, l.temp10);
}

void Controlador::entrarManual(uint32_t ms) {
  if (!manual) {
    manual = true;
    if (riego == RIEGO_REGANDO || riego == RIEGO_ESPERA) riego = RIEGO_REPOSO;
    sal.bomba = false;
    emitir(EV_MODO_MANUAL);
  }
  tManual = ms;
}

bool Controlador::bombaManual(uint32_t ms, uint8_t seg, bool soloPulso) {
  if (alarmas & AL_LIMITE_BOMBA) return false;
  bool estabaEnAuto = !manual;
  entrarManual(ms);
  if (seg < 1) seg = 1;
  if (seg > BOMBA_MANUAL_MAX_SEG) seg = BOMBA_MANUAL_MAX_SEG;
  sal.bomba = true;
  bombaManualDesde = ms;
  bombaManualHasta = ms + (uint32_t)seg * 1000UL;
  // Un riego puntual (botón o «Regar ahora») vuelve solo a automático si venía de ahí
  pulsoUnico = soloPulso && (estabaEnAuto || pulsoUnico);
  return true;
}

void Controlador::apagarBombaManual(uint32_t ms) {
  entrarManual(ms);
  pulsoUnico = false;
  if (sal.bomba) {
    sal.bomba = false;
    emitir(EV_BOMBA_MANUAL_FIN, (int16_t)((ms - bombaManualDesde) / 1000UL));
  }
}

void Controlador::ventManual(uint32_t ms, bool encendido) {
  entrarManual(ms);
  pulsoUnico = false;
  sal.vent = encendido;
  tVent = ms;
  ventMovido = true;
}

void Controlador::lamparaManual(uint32_t ms, bool encendido) {
  entrarManual(ms);
  pulsoUnico = false;
  sal.lampara = encendido;
  tLamp = ms;
  lampMovida = true;
}

void Controlador::modoAutomatico(uint32_t ms) {
  (void)ms;
  if (!manual) return;
  manual = false;
  pulsoUnico = false;
  sal.bomba = false;
  riego = (alarmas & AL_SIN_EFECTO) ? RIEGO_BLOQUEADO : RIEGO_REPOSO;
  ventMovido = false;         // el automático decide de inmediato
  lampMovida = false;
  emitir(EV_MODO_AUTO);
}

void Controlador::reiniciarAlarmas(uint32_t ms) {
  alarmas &= (uint16_t)~(AL_SIN_EFECTO | AL_LIMITE_BOMBA);
  bombaMsVentana = 0;          // quien reinicia revisó el estanque y la bomba
  ventanaInicio = ms;
  if (riego == RIEGO_BLOQUEADO) riego = RIEGO_REPOSO;
  emitir(EV_ALARMAS_REINICIADAS);
}

uint16_t Controlador::segundosRestantesFase(uint32_t ms) const {
  if (manual) {
    if (!sal.bomba) return 0;
    int32_t r = (int32_t)(bombaManualHasta - ms);
    return r > 0 ? (uint16_t)((r + 999) / 1000) : 0;
  }
  uint32_t dur;
  if (riego == RIEGO_REGANDO) dur = (uint32_t)aj.pulsoSeg * 1000UL;
  else if (riego == RIEGO_ESPERA) dur = (uint32_t)aj.esperaSeg * 1000UL;
  else return 0;
  uint32_t pasado = ms - tFase;
  return pasado >= dur ? 0 : (uint16_t)((dur - pasado + 999) / 1000);
}
