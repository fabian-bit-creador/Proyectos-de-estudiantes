// =====================================================================
//  conexion.js — Dos formas de hablar con el invernadero, con la misma
//  interfaz: el Arduino real por USB (Web Serial, Chrome o Edge) o el
//  Arduino virtual con la planta simulada. Ambas entregan líneas de texto.
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});
  const { Separador } = MOSK.protocolo;
  const codificador = new TextEncoder();

  class ConexionBase {
    constructor() {
      this.oyentes = {};
      this.separador = new Separador();
    }
    on(evento, fn) { (this.oyentes[evento] = this.oyentes[evento] || []).push(fn); return this; }
    emitir(evento, ...args) { for (const fn of this.oyentes[evento] || []) fn(...args); }
    procesarBytes(bytes, t) { for (const l of this.separador.agregar(bytes)) this.emitir('linea', l, t); }
  }

  // ---- Arduino real por el puerto USB --------------------------------------------
  class ConexionSerie extends ConexionBase {
    constructor() {
      super();
      this.tipo = 'serie';
      this.puerto = null;
      this.lector = null;
      this.escritor = null;
      this.activa = false;
      this.cola = Promise.resolve();
    }

    static disponible() { return typeof navigator !== 'undefined' && 'serial' in navigator; }

    static async puertoRecordado() {
      if (!ConexionSerie.disponible()) return null;
      try { const p = await navigator.serial.getPorts(); return p.length ? p[0] : null; } catch (e) { return null; }
    }

    async conectar(puerto) {
      this.puerto = puerto || (await navigator.serial.requestPort());
      await this.puerto.open({ baudRate: 115200, bufferSize: 4096 });
      this.activa = true;
      this.separador = new Separador();
      this.escritor = this.puerto.writable.getWriter();
      this.alDesconectar = (ev) => { if (ev.target === this.puerto || ev.port === this.puerto) this.perdida('Se desconectó el cable USB del Arduino.'); };
      navigator.serial.addEventListener('disconnect', this.alDesconectar);
      this.lectura = this.leer();
      this.emitir('estado', 'abierta');
    }

    async leer() {
      while (this.activa && this.puerto && this.puerto.readable) {
        this.lector = this.puerto.readable.getReader();
        try {
          for (;;) {
            const { value, done } = await this.lector.read();
            if (done) break;
            if (value && value.length) this.procesarBytes(value, Date.now());
          }
        } catch (e) {
          // Errores de línea (ruido, velocidad) se recuperan con un lector nuevo; los demás cortan.
          if (!/Break|Framing|Parity|BufferOverrun/.test(e && e.name)) {
            this.perdida(e && e.name === 'NetworkError' ? 'Se perdió la comunicación con el Arduino. Revisa el cable USB.' : mensajeError(e));
            break;
          }
        } finally {
          try { this.lector.releaseLock(); } catch (e) { /* ya liberado */ }
          this.lector = null;
        }
      }
    }

    perdida(motivo) {
      if (!this.activa) return;
      this.activa = false;
      this.cerrar();
      this.emitir('estado', 'perdida', motivo);
    }

    enviar(texto) {
      const bytes = codificador.encode(texto + '\n');
      this.cola = this.cola.then(() => (this.activa && this.escritor ? this.escritor.write(bytes) : null)).catch((e) => this.perdida(mensajeError(e)));
      return this.cola;
    }

    async cerrar() {
      if (this.alDesconectar) navigator.serial.removeEventListener('disconnect', this.alDesconectar);
      try { if (this.lector) await this.lector.cancel(); } catch (e) { /* nada */ }
      try { if (this.lectura) await this.lectura; } catch (e) { /* nada */ }
      try { if (this.escritor) { this.escritor.releaseLock(); this.escritor = null; } } catch (e) { /* nada */ }
      try { if (this.puerto) await this.puerto.close(); } catch (e) { /* nada */ }
    }

    async desconectar() {
      this.activa = false;
      await this.cerrar();
      this.emitir('estado', 'cerrada');
    }

    ahora() { return Date.now(); }
  }

  function mensajeError(e) {
    const n = e && e.name;
    if (n === 'NotFoundError') return 'No se eligió ningún puerto.';
    if (n === 'SecurityError') return 'El navegador no deja usar el puerto desde aquí. Abre el archivo PanelInvernadero.html directamente en Chrome o Edge (no dentro de otra página).';
    if (n === 'InvalidStateError') return 'Ese puerto ya está abierto en esta página.';
    if (n === 'NetworkError') return 'No se pudo usar el puerto: puede que lo tenga ocupado el Monitor Serie del Arduino IDE u otra pestaña, o que se haya desconectado el cable. Cierra el Monitor Serie y vuelve a intentar.';
    return (e && e.message) || 'Error desconocido en el puerto.';
  }

  // ---- Arduino virtual con planta simulada ------------------------------------
  const CLAVE_EEPROM = 'mosk-invernadero-eeprom-simulada';

  function leerEepromGuardada() {
    const e = new Uint8Array(1024).fill(0xff);
    try {
      const hex = localStorage.getItem(CLAVE_EEPROM);
      if (hex && /^[0-9a-f]+$/.test(hex)) for (let i = 0; i < hex.length / 2 && i < 1024; i++) e[i] = parseInt(hex.substr(i * 2, 2), 16);
    } catch (err) { /* sin almacenamiento: parte de fábrica */ }
    return e;
  }

  function guardarEeprom(e) {
    try {
      let hex = '';
      for (let i = 0; i < 64; i++) hex += e[i].toString(16).padStart(2, '0');
      localStorage.setItem(CLAVE_EEPROM, hex);
    } catch (err) { /* sin almacenamiento: no se recuerda */ }
  }

  class ConexionSimulada extends ConexionBase {
    constructor(opciones = {}) {
      super();
      this.tipo = 'simulacion';
      this.velocidad = 1;
      this.modelo = opciones.modelo || null;
      this.recordar = opciones.recordar !== false;
      this.intervalo = null;
    }

    conectar() {
      const { Invernadero, crearHardware } = MOSK.planta;
      const { crearArduino } = MOSK.arduino;
      if (!this.modelo) this.modelo = new Invernadero({ semilla: (Date.now() & 0xffff) + 1 });
      this.eeprom = this.recordar ? leerEepromGuardada() : new Uint8Array(1024).fill(0xff);
      this.placa = crearArduino(crearHardware(this.modelo, {
        eeprom: this.eeprom,
        alEscribirEeprom: () => { if (this.recordar) guardarEeprom(this.eeprom); },
      }));
      this.separador = new Separador();
      this.inicioReal = Date.now();
      this.proximaFisica = 0;
      this.soltarBotonEn = null;
      this.activa = true;
      this.emitir('estado', 'abierta');
      this.placa.setup();
      this.drenar();
      this.ultimo = performance.now();
      this.intervalo = setInterval(() => this.tick(), 50);
    }

    drenar() {
      const s = this.placa.tomarSalida();
      if (s.length) this.procesarBytes(Uint8Array.from(s), this.inicioReal + this.placa.ms);
    }

    // Avanza el reloj del Arduino virtual: lo mismo que hace el banco de pruebas
    avanzar(msSimulados) {
      const fin = this.placa.ms + msSimulados;
      while (this.placa.ms < fin && this.activa) {
        while (this.placa.ms >= this.proximaFisica) {
          this.modelo.avanzar(100, this.placa.reles());
          this.proximaFisica += 100;
        }
        if (this.soltarBotonEn != null && this.placa.ms >= this.soltarBotonEn) {
          this.placa.pin[MOSK.arduino.PIN.BOTON] = MOSK.arduino.HIGH;
          this.soltarBotonEn = null;
        }
        this.placa.loop();
        this.drenar();
        this.placa.ms += 10;
      }
    }

    tick() {
      const ahora = performance.now();
      const dt = Math.min((ahora - this.ultimo) * this.velocidad, 300000);   // máximo 5 min simulados por paso
      this.ultimo = ahora;
      this.avanzar(dt);
      this.emitir('tick');
    }

    presionarBoton() {
      if (!this.placa) return;
      this.placa.pin[MOSK.arduino.PIN.BOTON] = MOSK.arduino.LOW;
      this.soltarBotonEn = this.placa.ms + 300;
    }

    enviar(texto) {
      if (this.activa) this.placa.escribirSerie(codificador.encode(texto + '\n'));
      return Promise.resolve();
    }

    desconectar() {
      this.activa = false;
      clearInterval(this.intervalo);
      this.intervalo = null;
      this.emitir('estado', 'cerrada');
      return Promise.resolve();
    }

    olvidarMemoria() {
      try { localStorage.removeItem(CLAVE_EEPROM); } catch (e) { /* nada */ }
    }

    ahora() { return this.inicioReal + (this.placa ? this.placa.ms : 0); }
  }

  MOSK.conexion = { ConexionSerie, ConexionSimulada, mensajeError };
})();
