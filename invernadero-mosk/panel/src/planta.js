// =====================================================================
//  planta.js — Un invernadero de mentira para el modo simulación.
//
//  El Arduino virtual corre el mismo programa que el real; lo que se
//  inventa aquí es el mundo físico: cuánto se calienta el aire con la luz
//  térmica, cuánto enfría el extractor, cuánto se humedece la tierra con
//  cada pulso de la bomba y cuánto se seca. Los números son aproximados y
//  el secado está acelerado para que el riego se alcance a ver.
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});

  const FISICA = {
    tauAire: 600,          // s: el aire interior sigue al exterior con el invernadero cerrado
    tauAireVent: 90,       // s: con el extractor, el aire se renueva mucho más rápido
    calorLampara: 12,      // °C extra en equilibrio con la luz térmica y sin extractor
    calorSol: 4,           // °C extra de día (efecto invernadero)
    tauHum: 900,           // s
    tauHumVent: 100,       // s
    caudalBomba: 25,       // ml/s (bomba sumergible de 3 a 6 V)
    tauInfiltracion: 12,   // s: el agua tarda en llegar a la zona del sensor
    pctPorMl: 0.075,       // % de humedad del suelo por cada ml que se infiltra
    secadoBase: 0.0048,    // %/s con el suelo al 50 % y 22 °C (acelerado)
    estanqueMax: 2000,     // ml
    phAgua: 7.2,           // pH del agua de la llave
    mvPh7: 2542,           // la sonda simulada no es ideal: 42 mV corrida...
    mvPorPh: 171,          // ...y 171 mV por unidad de pH (por eso hay que calibrar)
    tauSonda: 6,           // s: la sonda de pH tarda en estabilizarse
  };

  const ESCENARIOS = {
    templado: { nombre: 'Día templado', ext: { temp: 19, hum: 55, luz: 70 }, dia: true },
    calor: { nombre: 'Ola de calor', ext: { temp: 31, hum: 35, luz: 92 }, dia: true },
    frio: { nombre: 'Noche fría', ext: { temp: 6, hum: 78, luz: 3 }, dia: false },
    nublado: { nombre: 'Día nublado', ext: { temp: 16, hum: 68, luz: 18 }, dia: true },
    humedo: { nombre: 'Aire muy húmedo', ext: { temp: 20, hum: 93, luz: 45 }, dia: true },
  };

  const PH_SOLUCIONES = { ph7: 7.0, ph4: 4.01, ph10: 10.01 };

  function generador(semilla) {           // mulberry32: ruido repetible
    let a = semilla >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const limitar = (x, a, b) => Math.min(b, Math.max(a, x));

  class Invernadero {
    constructor(opciones = {}) {
      this.azar = generador(opciones.semilla == null ? 2026 : opciones.semilla);
      this.tipoDht = opciones.tipoDht === 'DHT22' ? 'DHT22' : 'DHT11';
      this.normal();
    }

    normal() {
      this.escenario = 'templado';
      this.ext = Object.assign({}, ESCENARIOS.templado.ext);
      this.dia = true;
      this.temp = 21.5;
      this.hum = 58;
      this.suelo = 46;
      this.agua = 0;
      this.estanque = 1500;
      this.phBase = 6.4;
      this.phMaceta = 6.4;
      this.sondaPh = 'maceta';      // maceta | ph7 | ph4 | ph10 | desconectada
      this.mvSonda = this.mvDePh(6.4);
      this.sensorSuelo = 'tierra';  // tierra | agua | aire
      this.dhtFalla = false;
      this.reles = { bomba: false, vent: false, lampara: false };
      this.bombaEnSeco = false;
      this.aguaUsada = 0;
    }

    ruido(sigma) {                  // normal (Box-Muller)
      const u = Math.max(1e-12, this.azar());
      const v = this.azar();
      return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    mvDePh(ph) { return FISICA.mvPh7 + (7 - ph) * FISICA.mvPorPh; }

    equilibrio(reles) {
      const calor = (this.dia ? FISICA.calorSol : 0) + (reles.lampara ? FISICA.calorLampara : 0);
      const k = 1 / FISICA.tauAire + (reles.vent ? 1 / FISICA.tauAireVent : 0);
      return this.ext.temp + calor / FISICA.tauAire / k;
    }

    aplicarEscenario(clave) {
      const e = ESCENARIOS[clave];
      if (!e) return;
      this.escenario = clave;
      this.ext = Object.assign({}, e.ext);
      this.dia = e.dia;
      // El clima cambia «de golpe» para no tener que esperar minutos reales.
      this.temp += (this.equilibrio(this.reles) - this.temp) * 0.8;
      this.hum += (limitar(this.ext.hum + 12, 15, 99) - this.hum) * 0.7;
    }

    secarTierra() { this.suelo = Math.min(this.suelo, 24); this.agua = 0; }
    vaciarEstanque() { this.estanque = 0; }
    rellenarEstanque() { this.estanque = FISICA.estanqueMax; }
    tierraAcida(activa) { this.phBase = activa ? 4.8 : 6.4; this.phMaceta = this.phBase; }

    // dtMs: milisegundos simulados · reles: lo que el Arduino tiene encendido
    avanzar(dtMs, reles) {
      const dt = dtMs / 1000;
      this.reles = { bomba: !!reles.bomba, vent: !!reles.vent, lampara: !!reles.lampara };

      // Aire: temperatura
      const k = 1 / FISICA.tauAire + (reles.vent ? 1 / FISICA.tauAireVent : 0);
      const calor = ((this.dia ? FISICA.calorSol : 0) + (reles.lampara ? FISICA.calorLampara : 0)) / FISICA.tauAire;
      this.temp += ((this.ext.temp - this.temp) * k + calor) * dt;

      // Aire: humedad (la tierra húmeda aporta; el extractor la saca; el calor la baja)
      const aporte = ((reles.vent ? 3 : 25) * this.suelo) / 100 + Math.min(8, this.agua / 25);
      const objetivo = limitar(this.ext.hum + aporte - 1.2 * (this.temp - this.ext.temp), 15, 99);
      this.hum += ((objetivo - this.hum) * dt) / (reles.vent ? FISICA.tauHumVent : FISICA.tauHum);

      // Tierra: bomba, infiltración, secado y drenaje
      this.bombaEnSeco = false;
      if (reles.bomba) {
        const pedido = FISICA.caudalBomba * dt;
        const ml = Math.min(this.estanque, pedido);
        this.estanque -= ml;
        this.agua += ml;
        this.aguaUsada += ml;
        if (ml < pedido * 0.5) this.bombaEnSeco = true;
      }
      const infiltra = this.agua * Math.min(1, dt / FISICA.tauInfiltracion);
      this.agua -= infiltra;
      this.suelo += infiltra * FISICA.pctPorMl;
      const factor = Math.max(0.2, 1 + 0.05 * (this.temp - 22)) * (reles.vent ? 1.25 : 1) * (this.dia ? 1.2 : 0.7);
      this.suelo -= FISICA.secadoBase * factor * (this.suelo / 50) * dt;
      if (this.suelo > 90) this.suelo -= ((this.suelo - 90) * dt) / 60;
      this.suelo = limitar(this.suelo, 0, 100);

      // pH de la maceta: vuelve lento a su valor y el riego lo acerca al del agua
      this.phMaceta += ((this.phBase - this.phMaceta) * dt) / 3600 + (FISICA.phAgua - this.phMaceta) * infiltra * 0.0004;

      // Sonda de pH: sigue a la solución donde está, con retardo
      const phMedio = this.sondaPh === 'maceta' ? this.phMaceta : PH_SOLUCIONES[this.sondaPh];
      if (phMedio != null) this.mvSonda += (this.mvDePh(phMedio) - this.mvSonda) * Math.min(1, dt / FISICA.tauSonda);
    }

    // ---- Lo que leen los pines del Arduino -------------------------------------
    lecturaSuelo(alimentado) {
      if (!alimentado) return Math.round(this.azar() * 2);
      if (this.sensorSuelo === 'aire') return 1023;
      const base = this.sensorSuelo === 'agua' ? 330 : 1000 - 6.5 * this.suelo;
      return limitar(Math.round(base + this.ruido(2)), 0, 1023);
    }

    lecturaPh() {
      if (this.sondaPh === 'desconectada') return 0;
      return limitar(Math.round((this.mvSonda * 1023) / 5000 + this.ruido(0.6)), 0, 1023);
    }

    lecturaLuz() {
      const luz = this.ext.luz + (this.reles.lampara ? 6 : 0) + this.ruido(1);
      return limitar(Math.round(luz * 10.23), 0, 1023);
    }

    lecturaTemperatura() {
      if (this.dhtFalla) return NaN;
      return Math.fround(Math.round((this.temp + this.ruido(0.05)) * 10) / 10);
    }

    lecturaHumedad() {
      if (this.dhtFalla) return NaN;
      const h = limitar(this.hum + this.ruido(0.3), 5, 99.9);
      return Math.fround(this.tipoDht === 'DHT22' ? Math.round(h * 10) / 10 : Math.round(h));
    }
  }

  // Conecta el invernadero de mentira con los pines del Arduino virtual.
  function crearHardware(modelo, opciones = {}) {
    const { A0, A1, A2, PIN, HIGH } = MOSK.arduino;
    return {
      tipoDht: modelo.tipoDht,
      direccionLcd: opciones.direccionLcd == null ? 0x27 : opciones.direccionLcd,
      eeprom: opciones.eeprom,
      alEscribirEeprom: opciones.alEscribirEeprom,
      analogRead(p, placa) {
        if (p === A0) return modelo.lecturaSuelo(placa.pin[PIN.SUELO_VCC] === HIGH);
        if (p === A1) return modelo.lecturaPh();
        if (p === A2) return modelo.lecturaLuz();
        return 0;
      },
      leerHumedad: () => modelo.lecturaHumedad(),
      leerTemperatura: () => modelo.lecturaTemperatura(),
    };
  }

  MOSK.planta = { FISICA, ESCENARIOS, PH_SOLUCIONES, Invernadero, crearHardware, generador };
})();
