// =====================================================================
//  guion.js — Corre un guion de prueba sobre el Arduino virtual, con las
//  mismas órdenes y la misma salida que pruebas/simulador/banco.cpp:
//    inicio · avanzar ms · suelo n · ph n · ldr n · dht T H | dht nan
//    serie TEXTO · boton 0|1 · sinlcd · pines · lcd · eeprom
//  Lo usan pruebas/banco.js (en node) y «Verificar el motor» del panel.
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});

  function bytesDe(texto, latin1) {
    const r = [];
    if (latin1) { for (let i = 0; i < texto.length; i++) r.push(texto.charCodeAt(i) & 0xff); }
    else for (const b of new TextEncoder().encode(texto)) r.push(b);
    return r;
  }

  // Devuelve { salida: Uint8Array, eeprom: Uint8Array }
  function correrGuion(guion, opciones = {}) {
    const { crearArduino, PIN, A0, A1, A2, HIGH, LOW } = MOSK.arduino;
    const eeprom = opciones.eeprom ? Uint8Array.from(opciones.eeprom) : new Uint8Array(1024).fill(0xff);
    const sim = { analog: new Array(20).fill(0), temp: Math.fround(22), hum: Math.fround(60), lcd: 0x27 };
    sim.analog[A0] = 500;
    sim.analog[A1] = 512;
    sim.analog[A2] = 700;

    const placa = crearArduino({
      tipoDht: opciones.dht22 ? 'DHT22' : 'DHT11',
      get direccionLcd() { return sim.lcd; },
      eeprom,
      analogRead: (p) => sim.analog[p],
      leerHumedad: () => sim.hum,
      leerTemperatura: () => sim.temp,
    });

    const salida = [];
    let pendiente = [];
    const escribir = (texto, latin1 = true) => { for (const b of bytesDe(texto, latin1)) salida.push(b); };

    function vaciarSerie() {
      const nuevos = placa.tomarSalida();
      if (!nuevos.length) return;
      pendiente = pendiente.length ? pendiente.concat(nuevos) : nuevos;
      let pos;
      while ((pos = pendiente.indexOf(10)) >= 0) {
        let l = pendiente.slice(0, pos);
        if (l.length && l[l.length - 1] === 13) l = l.slice(0, -1);
        escribir(`S ${placa.ms >>> 0} `);
        for (const b of l) salida.push(b);
        escribir('\n');
        pendiente = pendiente.slice(pos + 1);
      }
    }

    const entero = (t) => parseInt(t, 10) || 0;
    for (const cruda of guion.split('\n')) {
      const m = /^\s*(\S+)\s*(.*)$/.exec(cruda);
      if (!m) continue;
      const orden = m[1].slice(0, 31);
      const resto = m[2];
      if (orden[0] === '#') continue;
      if (orden === 'inicio') { placa.setup(); vaciarSerie(); }
      else if (orden === 'avanzar') {
        const fin = (placa.ms + entero(resto)) >>> 0;
        while (placa.ms < fin) { placa.loop(); vaciarSerie(); placa.ms += 10; }
      }
      else if (orden === 'suelo') sim.analog[A0] = entero(resto);
      else if (orden === 'ph') sim.analog[A1] = entero(resto);
      else if (orden === 'ldr') sim.analog[A2] = entero(resto);
      else if (orden === 'dht') {
        if (resto.startsWith('nan')) { sim.temp = NaN; sim.hum = NaN; }
        else {
          const n = resto.trim().split(/\s+/).map(Number);
          if (n.length > 0 && !Number.isNaN(n[0])) sim.temp = Math.fround(n[0]);
          if (n.length > 1 && !Number.isNaN(n[1])) sim.hum = Math.fround(n[1]);
        }
      }
      else if (orden === 'serie') placa.escribirSerie(bytesDe(resto + '\n', false));
      else if (orden === 'boton') placa.pin[PIN.BOTON] = entero(resto) ? HIGH : LOW;
      else if (orden === 'sinlcd') sim.lcd = 0;
      else if (orden === 'pines') escribir(`P ${placa.ms >>> 0} ${placa.pin[PIN.BOMBA]} ${placa.pin[PIN.VENT]} ${placa.pin[PIN.LAMPARA]} ${placa.modo[PIN.BOMBA]}\n`);
      else if (orden === 'lcd') escribir(`L ${placa.ms >>> 0} |${placa.lcdFilas[0]}|${placa.lcdFilas[1]}|\n`);
      else if (orden === 'eeprom') escribir(`E ${placa.ms >>> 0} ${placa.escriturasEeprom}\n`);
      else throw new Error('orden desconocida: ' + orden);
    }
    return { salida: Uint8Array.from(salida), eeprom };
  }

  // Huella FNV-1a de 32 bits: sirve para comparar salidas largas sin guardarlas.
  function huella(bytes) {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  // Guion de referencia: el panel comprueba que su Arduino virtual produce
  // exactamente la misma salida que el programa real compilado en C++.
  const GUION_REFERENCIA = [
    'inicio', 'pines', 'avanzar 4000', 'lcd',
    'suelo 850', 'avanzar 6000', 'pines', 'lcd', 'suelo 700', 'avanzar 61000', 'suelo 600', 'avanzar 70000', 'pines',
    'dht 29 60', 'avanzar 3000', 'pines', 'dht 26.5 60', 'avanzar 35000', 'pines',
    'dht 14 60', 'avanzar 3000', 'dht 29 60', 'avanzar 3000', 'pines',
    'dht nan', 'avanzar 9000', 'pines', 'lcd', 'dht 22 60', 'avanzar 3000',
    'serie SET SUELO 60 50', 'serie set suelo 40 60', 'serie SET TEMP 12,5 30', 'serie SET RIEGO 4 20 3',
    'serie ' + 'X'.repeat(70), 'serie BAILAR', 'serie AYUDA', 'avanzar 100',
    'serie REGAR 3', 'avanzar 4000', 'serie EXTRACTOR ON', 'avanzar 1000', 'pines', 'serie MODO AUTO', 'avanzar 1000',
    'suelo 980', 'serie CAL SUELO SECO', 'avanzar 100', 'suelo 320', 'serie CAL SUELO MOJADO', 'avanzar 100',
    'ph 512', 'avanzar 2500', 'serie CAL PH 7', 'avanzar 100', 'ph 620', 'avanzar 2500', 'serie CAL PH 4', 'avanzar 2000',
    'ph 0', 'avanzar 4500',
    'serie SENSOR LDR ON', 'ldr 100', 'avanzar 3000', 'pines', 'ldr 600', 'avanzar 35000', 'pines',
    'suelo 900', 'avanzar 100000', 'lcd', 'serie ALARMAS RESET', 'avanzar 3000', 'pines', 'lcd',
    'boton 0', 'avanzar 100', 'boton 1', 'avanzar 6000', 'pines',
    'serie FABRICA', 'avanzar 100', 'serie ESTADO', 'avanzar 100',
  ].join('\n') + '\n';

  MOSK.guion = { correrGuion, huella, GUION_REFERENCIA };
})();
