// =====================================================================
//  logica.js — Copia en JavaScript de InvernaderoMOSK/logica.cpp.
//  Mismas reglas, mismos tiempos y mismos eventos que en el Arduino.
//  Los tiempos son milisegundos de 32 bits sin signo, como millis().
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});

  const u32 = (x) => x >>> 0;
  const i16 = (x) => (x << 16) >> 16;
  const u16 = (x) => x & 0xffff;

  const RIEGO_REPOSO = 0, RIEGO_REGANDO = 1, RIEGO_ESPERA = 2, RIEGO_BLOQUEADO = 3;

  const AL = {
    DHT: 1 << 0, SUELO: 1 << 1, SIN_EFECTO: 1 << 2, LIMITE_BOMBA: 1 << 3, PH_SIN_CALIBRAR: 1 << 4,
    PH_FALLA: 1 << 5, PH_FUERA: 1 << 6, TEMP_ALTA: 1 << 7, TEMP_BAJA: 1 << 8,
  };

  const EV = {
    RIEGO_INICIO: 1, RIEGO_PULSO: 2, RIEGO_ESPERA: 3, RIEGO_LISTO: 4, RIEGO_CICLOS: 5, RIEGO_SIN_EFECTO: 6,
    RIEGO_CORTADO: 7, LIMITE_BOMBA: 8, VENT_ON: 9, VENT_OFF: 10, VENT_SEGURIDAD: 11, LAMP_ON: 12, LAMP_OFF: 13,
    FALLA_DHT: 14, DHT_OK: 15, FALLA_SUELO: 16, SUELO_OK: 17, MODO_MANUAL: 18, MODO_AUTO: 19,
    MANUAL_VENCIDO: 20, BOMBA_MANUAL_FIN: 21, ALARMAS_REINICIADAS: 22, LAMP_SEGURIDAD: 23,
  };

  const MIN_CAMBIO_MS = 30000;
  const MANUAL_VENCE_MS = 600000;
  const HORA_MS = 3600000;
  const BOMBA_MANUAL_MAX_SEG = 30;
  const MARGEN_TEMP_ALARMA10 = 30;

  function ajustesVacios() {
    return {
      sueloMin: 0, sueloObjetivo: 0, tempMax10: 0, tempMin10: 0, humAireMax: 0, luzMin: 0, pulsoSeg: 0,
      esperaSeg: 0, maxCiclos: 0, bombaHoraSeg: 0, phMin100: 0, phMax100: 0, phActivo: false, ldrActivo: false,
    };
  }

  function ajustesDeFabrica(a) {
    a.sueloMin = 35;
    a.sueloObjetivo = 55;
    a.tempMax10 = 280;
    a.tempMin10 = 150;
    a.humAireMax = 85;
    a.luzMin = 30;
    a.pulsoSeg = 5;
    a.esperaSeg = 60;
    a.maxCiclos = 6;
    a.bombaHoraSeg = 120;
    a.phMin100 = 550;
    a.phMax100 = 750;
    a.phActivo = true;
    a.ldrActivo = false;
    return a;
  }

  class Controlador {
    constructor() {
      // Igual que una variable global en C++: todo parte en cero.
      this.aj = ajustesVacios();
      this.sal = { bomba: false, vent: false, lampara: false };
      this.riego = RIEGO_REPOSO;
      this.ciclo = 0;
      this.alarmas = 0;
      this.manual = false;
      this.tFase = this.tVent = this.tLamp = this.tManual = 0;
      this.bombaManualHasta = this.bombaManualDesde = 0;
      this.ventanaInicio = this.ultimoMs = this.bombaMsVentana = 0;
      this.ventMovido = this.lampMovida = this.primerPaso = this.pulsoUnico = false;
      this.sueloInicio = 0;
      this.cola = [];
    }

    iniciar(ms) {
      this.sal.bomba = this.sal.vent = this.sal.lampara = false;
      this.riego = RIEGO_REPOSO;
      this.ciclo = 0;
      this.alarmas = 0;
      this.manual = false;
      this.pulsoUnico = false;
      this.tFase = this.tVent = this.tLamp = this.tManual = ms;
      this.bombaManualHasta = this.bombaManualDesde = ms;
      this.ventanaInicio = this.ultimoMs = ms;
      this.bombaMsVentana = 0;
      this.ventMovido = this.lampMovida = false;
      this.primerPaso = true;
      this.sueloInicio = 0;
      this.cola = [];
    }

    emitir(codigo, a = 0, b = 0) {
      if (this.cola.length === 8) this.cola.shift();   // cola llena: se pierde el más antiguo
      this.cola.push({ codigo, a: i16(a), b: i16(b) });
    }

    sacarEvento() {
      return this.cola.length ? this.cola.shift() : null;
    }

    revisarAlarmasSensores(l) {
      if (!l.dhtOk && !(this.alarmas & AL.DHT)) { this.alarmas |= AL.DHT; this.emitir(EV.FALLA_DHT); }
      else if (l.dhtOk && this.alarmas & AL.DHT) { this.alarmas &= u16(~AL.DHT); this.emitir(EV.DHT_OK); }

      if (!l.sueloOk && !(this.alarmas & AL.SUELO)) { this.alarmas |= AL.SUELO; this.emitir(EV.FALLA_SUELO); }
      else if (l.sueloOk && this.alarmas & AL.SUELO) { this.alarmas &= u16(~AL.SUELO); this.emitir(EV.SUELO_OK); }

      let ph = 0;
      if (this.aj.phActivo) {
        if (!l.phCalibrado) ph |= AL.PH_SIN_CALIBRAR;
        if (!l.phOk) ph |= AL.PH_FALLA;
        else if (l.phCalibrado && (l.ph100 < this.aj.phMin100 || l.ph100 > this.aj.phMax100)) ph |= AL.PH_FUERA;
      }
      this.alarmas = u16((this.alarmas & ~(AL.PH_SIN_CALIBRAR | AL.PH_FALLA | AL.PH_FUERA)) | ph);

      let t = 0;
      if (l.dhtOk) {
        if (l.temp10 >= this.aj.tempMax10 + MARGEN_TEMP_ALARMA10) t |= AL.TEMP_ALTA;
        if (l.temp10 <= this.aj.tempMin10 - MARGEN_TEMP_ALARMA10) t |= AL.TEMP_BAJA;
      }
      this.alarmas = u16((this.alarmas & ~(AL.TEMP_ALTA | AL.TEMP_BAJA)) | t);
    }

    detenerRiego() {
      this.sal.bomba = false;
      this.riego = RIEGO_REPOSO;
    }

    paso(ms, l) {
      const dt = this.primerPaso ? 0 : u32(ms - this.ultimoMs);
      this.primerPaso = false;
      this.ultimoMs = ms;
      if (this.sal.bomba) this.bombaMsVentana = u32(this.bombaMsVentana + dt);
      if (u32(ms - this.ventanaInicio) >= HORA_MS) {     // nueva hora: se renueva el tiempo de bomba
        this.ventanaInicio = ms;
        this.bombaMsVentana = 0;
        this.alarmas &= u16(~AL.LIMITE_BOMBA);
      }
      this.revisarAlarmasSensores(l);

      if (this.sal.bomba && this.bombaMsVentana >= this.aj.bombaHoraSeg * 1000) {
        this.sal.bomba = false;
        this.alarmas |= AL.LIMITE_BOMBA;
        this.emitir(EV.LIMITE_BOMBA, this.segundosBombaEstaHora());
        if (!this.manual && this.riego !== RIEGO_BLOQUEADO) this.riego = RIEGO_REPOSO;
        if (this.manual && this.pulsoUnico) { this.pulsoUnico = false; this.modoAutomatico(ms); return; }
      }

      if (this.manual) {
        if (this.sal.bomba && ((ms - this.bombaManualHasta) | 0) >= 0) {
          this.sal.bomba = false;
          this.emitir(EV.BOMBA_MANUAL_FIN, Math.floor(u32(ms - this.bombaManualDesde) / 1000));
          if (this.pulsoUnico) { this.pulsoUnico = false; this.modoAutomatico(ms); return; }
        }
        if (this.sal.lampara && (!l.dhtOk || this.alarmas & AL.TEMP_ALTA)) {
          this.sal.lampara = false;
          this.tLamp = ms;
          this.emitir(EV.LAMP_SEGURIDAD, l.dhtOk ? l.temp10 : 0);
        }
        if (u32(ms - this.tManual) >= MANUAL_VENCE_MS) {
          this.emitir(EV.MANUAL_VENCIDO);
          this.modoAutomatico(ms);
        }
        return;
      }

      switch (this.riego) {
        case RIEGO_REPOSO:
          if (l.sueloOk && l.sueloPct < this.aj.sueloMin && !(this.alarmas & AL.LIMITE_BOMBA)) {
            this.riego = RIEGO_REGANDO;
            this.ciclo = 1;
            this.sueloInicio = l.sueloPct;
            this.tFase = ms;
            this.sal.bomba = true;
            this.emitir(EV.RIEGO_INICIO, l.sueloPct, this.aj.sueloMin);
          }
          break;

        case RIEGO_REGANDO:
          if (!l.sueloOk) {
            this.detenerRiego();
            this.emitir(EV.RIEGO_CORTADO);
          } else if (u32(ms - this.tFase) >= this.aj.pulsoSeg * 1000) {
            this.sal.bomba = false;
            this.riego = RIEGO_ESPERA;
            this.tFase = ms;
            this.emitir(EV.RIEGO_ESPERA, this.ciclo, this.aj.esperaSeg);
          }
          break;

        case RIEGO_ESPERA:
          if (!l.sueloOk) {
            this.detenerRiego();
            this.emitir(EV.RIEGO_CORTADO);
          } else if (u32(ms - this.tFase) >= this.aj.esperaSeg * 1000) {
            if (l.sueloPct >= this.aj.sueloObjetivo) {
              this.riego = RIEGO_REPOSO;
              this.emitir(EV.RIEGO_LISTO, l.sueloPct, this.aj.sueloObjetivo);
            } else if (this.ciclo >= this.aj.maxCiclos) {
              if (l.sueloPct < this.sueloInicio + 5) {
                this.riego = RIEGO_BLOQUEADO;
                this.alarmas |= AL.SIN_EFECTO;
                this.emitir(EV.RIEGO_SIN_EFECTO, this.sueloInicio, l.sueloPct);
              } else {
                this.riego = RIEGO_REPOSO;
                this.emitir(EV.RIEGO_CICLOS, l.sueloPct, this.ciclo);
              }
            } else if (this.alarmas & AL.LIMITE_BOMBA) {
              this.riego = RIEGO_REPOSO;
            } else {
              this.ciclo = (this.ciclo + 1) & 0xff;
              this.riego = RIEGO_REGANDO;
              this.tFase = ms;
              this.sal.bomba = true;
              this.emitir(EV.RIEGO_PULSO, this.ciclo, l.sueloPct);
            }
          }
          break;

        case RIEGO_BLOQUEADO:
          this.sal.bomba = false;
          break;
      }

      this.controlarVentilador(ms, l);
      this.controlarLampara(ms, l);
    }

    controlarVentilador(ms, l) {
      let quiere, urgente = false;
      if (!l.dhtOk) {
        quiere = true;
        urgente = true;
      } else if (this.sal.vent) {
        quiere = !(l.temp10 <= this.aj.tempMax10 - 15 && l.humAire + 5 <= this.aj.humAireMax);
      } else {
        quiere = l.temp10 >= this.aj.tempMax10 || l.humAire >= this.aj.humAireMax;
      }
      if (quiere === this.sal.vent) return;
      if (!urgente && this.ventMovido && u32(ms - this.tVent) < MIN_CAMBIO_MS) return;
      this.sal.vent = quiere;
      this.tVent = ms;
      this.ventMovido = true;
      if (!l.dhtOk) this.emitir(EV.VENT_SEGURIDAD);
      else this.emitir(quiere ? EV.VENT_ON : EV.VENT_OFF, l.temp10, l.humAire);
    }

    controlarLampara(ms, l) {
      let quiere, urgente = false, porLuz = false;
      if (!l.dhtOk || l.temp10 >= this.aj.tempMax10) {
        quiere = false;
        urgente = true;
      } else {
        const faltaLuz = this.aj.ldrActivo && l.ldrOk &&
          (this.sal.lampara ? l.luzPct < this.aj.luzMin + 10 : l.luzPct < this.aj.luzMin);
        const frio = this.sal.lampara ? l.temp10 < this.aj.tempMin10 + 20 : l.temp10 <= this.aj.tempMin10;
        quiere = frio || faltaLuz;
        porLuz = faltaLuz && !frio;
      }
      if (quiere === this.sal.lampara) return;
      if (!urgente && this.lampMovida && u32(ms - this.tLamp) < MIN_CAMBIO_MS) return;
      this.sal.lampara = quiere;
      this.tLamp = ms;
      this.lampMovida = true;
      if (quiere) this.emitir(EV.LAMP_ON, l.temp10, porLuz ? 1 : 0);
      else if (urgente) this.emitir(EV.LAMP_SEGURIDAD, l.dhtOk ? l.temp10 : 0);
      else this.emitir(EV.LAMP_OFF, l.temp10);
    }

    entrarManual(ms) {
      if (!this.manual) {
        this.manual = true;
        if (this.riego === RIEGO_REGANDO || this.riego === RIEGO_ESPERA) this.riego = RIEGO_REPOSO;
        this.sal.bomba = false;
        this.emitir(EV.MODO_MANUAL);
      }
      this.tManual = ms;
    }

    bombaManual(ms, seg, soloPulso = false) {
      if (this.alarmas & AL.LIMITE_BOMBA) return false;
      const estabaEnAuto = !this.manual;
      this.entrarManual(ms);
      if (seg < 1) seg = 1;
      if (seg > BOMBA_MANUAL_MAX_SEG) seg = BOMBA_MANUAL_MAX_SEG;
      this.sal.bomba = true;
      this.bombaManualDesde = ms;
      this.bombaManualHasta = u32(ms + seg * 1000);
      this.pulsoUnico = soloPulso && (estabaEnAuto || this.pulsoUnico);
      return true;
    }

    apagarBombaManual(ms) {
      this.entrarManual(ms);
      this.pulsoUnico = false;
      if (this.sal.bomba) {
        this.sal.bomba = false;
        this.emitir(EV.BOMBA_MANUAL_FIN, Math.floor(u32(ms - this.bombaManualDesde) / 1000));
      }
    }

    ventManual(ms, encendido) {
      this.entrarManual(ms);
      this.pulsoUnico = false;
      this.sal.vent = encendido;
      this.tVent = ms;
      this.ventMovido = true;
    }

    lamparaManual(ms, encendido) {
      this.entrarManual(ms);
      this.pulsoUnico = false;
      this.sal.lampara = encendido;
      this.tLamp = ms;
      this.lampMovida = true;
    }

    modoAutomatico() {
      if (!this.manual) return;
      this.manual = false;
      this.pulsoUnico = false;
      this.sal.bomba = false;
      this.riego = this.alarmas & AL.SIN_EFECTO ? RIEGO_BLOQUEADO : RIEGO_REPOSO;
      this.ventMovido = false;
      this.lampMovida = false;
      this.emitir(EV.MODO_AUTO);
    }

    reiniciarAlarmas(ms) {
      this.alarmas &= u16(~(AL.SIN_EFECTO | AL.LIMITE_BOMBA));
      this.bombaMsVentana = 0;
      this.ventanaInicio = ms;
      if (this.riego === RIEGO_BLOQUEADO) this.riego = RIEGO_REPOSO;
      this.emitir(EV.ALARMAS_REINICIADAS);
    }

    segundosRestantesFase(ms) {
      if (this.manual) {
        if (!this.sal.bomba) return 0;
        const r = (this.bombaManualHasta - ms) | 0;
        return r > 0 ? u16(Math.trunc((r + 999) / 1000)) : 0;
      }
      let dur;
      if (this.riego === RIEGO_REGANDO) dur = this.aj.pulsoSeg * 1000;
      else if (this.riego === RIEGO_ESPERA) dur = this.aj.esperaSeg * 1000;
      else return 0;
      const pasado = u32(ms - this.tFase);
      return pasado >= dur ? 0 : u16(Math.floor((dur - pasado + 999) / 1000));
    }

    segundosBombaEstaHora() {
      return u16(Math.floor(this.bombaMsVentana / 1000));
    }

    sueloAlIniciar() {
      return this.sueloInicio;
    }
  }

  MOSK.logica = {
    RIEGO_REPOSO, RIEGO_REGANDO, RIEGO_ESPERA, RIEGO_BLOQUEADO, AL, EV,
    MIN_CAMBIO_MS, MANUAL_VENCE_MS, HORA_MS, BOMBA_MANUAL_MAX_SEG, MARGEN_TEMP_ALARMA10,
    ajustesVacios, ajustesDeFabrica, Controlador,
  };
})();
