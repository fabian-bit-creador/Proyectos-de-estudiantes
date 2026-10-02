// =====================================================================
//  pruebas.js — «Verificar el motor»: pruebas que trae el propio panel.
//  Se corren con el botón del pie de página o abriendo el archivo con
//  ?pruebas=1 al final de la dirección. No tocan la pantalla.
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});

  function lecturasBase(cambios) {
    return Object.assign({ dhtOk: true, temp10: 220, humAire: 60, sueloOk: true, sueloPct: 50, phCalibrado: true, phOk: true, ph100: 650, ldrOk: false, luzPct: 50 }, cambios || {});
  }

  function controlador() {
    const { Controlador, ajustesDeFabrica } = MOSK.logica;
    const c = new Controlador();
    ajustesDeFabrica(c.aj);
    c.iniciar(0);
    return c;
  }

  function eventos(c) {
    const r = [];
    let e;
    while ((e = c.sacarEvento())) r.push(e.codigo);
    return r;
  }

  // Corre el Arduino virtual y devuelve sus mensajes JSON
  function arduinoCon(ordenes, msAvanzar) {
    const g = MOSK.guion.correrGuion(['inicio', 'avanzar 4000'].concat(ordenes.map((o) => 'serie ' + o), ['avanzar ' + (msAvanzar || 200)]).join('\n'));
    const texto = new TextDecoder().decode(g.salida);
    return texto.split('\n').filter((l) => l.startsWith('S ')).map((l) => JSON.parse(l.slice(l.indexOf(' ', 2) + 1)));
  }

  // Simulación completa: Arduino virtual + planta, sin pantalla
  function simular(preparar, minutos) {
    const { Invernadero, crearHardware } = MOSK.planta;
    const modelo = new Invernadero({ semilla: 7 });
    const placa = MOSK.arduino.crearArduino(crearHardware(modelo, { eeprom: new Uint8Array(1024).fill(0xff) }));
    preparar(modelo);
    placa.setup();
    let fisica = 0;
    const sep = new MOSK.protocolo.Separador();
    const msgs = [];
    while (placa.ms < minutos * 60000) {
      while (placa.ms >= fisica) { modelo.avanzar(100, placa.reles()); fisica += 100; }
      placa.loop();
      const s = placa.tomarSalida();
      if (s.length) for (const l of sep.agregar(Uint8Array.from(s))) if (l.startsWith('{')) msgs.push(JSON.parse(l));
      placa.ms += 10;
    }
    return { msgs, modelo };
  }

  const PRUEBAS = [
    ['Humedad del suelo: la lectura 1000 es 0 %, 350 es 100 % y 675 es 50 %', () => {
      const { porcentajeSuelo } = MOSK.medicion;
      return porcentajeSuelo(1000, 1000, 350) === 0 && porcentajeSuelo(350, 1000, 350) === 100 && porcentajeSuelo(675, 1000, 350) === 50;
    }],
    ['pH con dos puntos: 2500 mV es pH 7,00 y 3030 mV es pH 4,00', () => {
      const { ph100Desde } = MOSK.medicion;
      return ph100Desde(2500, 2500, 700, 3030, 400) === 700 && ph100Desde(3030, 2500, 700, 3030, 400) === 400 && ph100Desde(2765, 2500, 700, 3030, 400) === 550;
    }],
    ['Lee números con coma o con punto, y rechaza los raros', () => {
      const { leerDecimal } = MOSK.medicion;
      return leerDecimal('28,5', 10) === 285 && leerDecimal('28.5', 10) === 285 && leerDecimal('1e3', 1) === null && leerDecimal('-', 1) === null && leerDecimal('5.75', 100) === 575;
    }],
    ['La mediana descarta un pico de ruido', () => MOSK.medicion.medianaDe([500, 502, 1023, 501, 499], 5) === 501],
    ['Con el suelo seco empieza a regar y enciende la bomba', () => {
      const c = controlador();
      c.paso(0, lecturasBase({ sueloPct: 20 }));
      return c.sal.bomba && c.riego === MOSK.logica.RIEGO_REGANDO && eventos(c).includes(MOSK.logica.EV.RIEGO_INICIO);
    }],
    ['Tras el pulso espera, y al llegar al objetivo termina el riego', () => {
      const c = controlador();
      c.paso(0, lecturasBase({ sueloPct: 20 }));
      c.paso(5000, lecturasBase({ sueloPct: 20 }));
      const esperando = !c.sal.bomba && c.riego === MOSK.logica.RIEGO_ESPERA;
      c.paso(65000, lecturasBase({ sueloPct: 60 }));
      return esperando && c.riego === MOSK.logica.RIEGO_REPOSO && eventos(c).includes(MOSK.logica.EV.RIEGO_LISTO);
    }],
    ['Si tras 6 ciclos la tierra no se humedece, se detiene con alarma', () => {
      const c = controlador();
      for (let t = 0; t <= 400000; t += 500) c.paso(t, lecturasBase({ sueloPct: 20 }));
      return c.riego === MOSK.logica.RIEGO_BLOQUEADO && !c.sal.bomba && (c.alarmas & MOSK.logica.AL.SIN_EFECTO) !== 0;
    }],
    ['El extractor enciende con calor y no se apaga antes de 30 segundos', () => {
      const c = controlador();
      c.paso(0, lecturasBase({ temp10: 290 }));
      const encendio = c.sal.vent;
      c.paso(10000, lecturasBase({ temp10: 240 }));
      const sigue = c.sal.vent;
      c.paso(31000, lecturasBase({ temp10: 240 }));
      return encendio && sigue && !c.sal.vent;
    }],
    ['Con calor, la luz térmica se apaga de inmediato', () => {
      const c = controlador();
      c.paso(0, lecturasBase({ temp10: 140 }));
      const encendio = c.sal.lampara;
      c.paso(1000, lecturasBase({ temp10: 290 }));
      return encendio && !c.sal.lampara;
    }],
    ['Sin señal del DHT: extractor encendido y luz térmica apagada', () => {
      const c = controlador();
      c.paso(0, lecturasBase({ temp10: 140 }));
      c.paso(1000, lecturasBase({ dhtOk: false }));
      return c.sal.vent && !c.sal.lampara && (c.alarmas & MOSK.logica.AL.DHT) !== 0;
    }],
    ['La bomba no pasa del tope de segundos por hora', () => {
      const c = controlador();
      c.aj.bombaHoraSeg = 10;
      c.bombaManual(0, 30);
      for (let t = 500; t <= 12000; t += 500) c.paso(t, lecturasBase());
      return !c.sal.bomba && (c.alarmas & MOSK.logica.AL.LIMITE_BOMBA) !== 0 && c.bombaManual(13000, 5) === false;
    }],
    ['El Arduino virtual saluda con mensajes JSON válidos', () => {
      const m = arduinoCon([]);
      return m[0].tipo === 'hola' && m[0].nombre === 'MOS-K Green Tech' && m[1].tipo === 'config' && m[1].suelo_min === 35;
    }],
    ['El Arduino virtual rechaza SET SUELO 60 50 y acepta SET SUELO 40 60', () => {
      const m = arduinoCon(['SET SUELO 60 50', 'SET SUELO 40 60']);
      const err = m.find((x) => x.tipo === 'error'), ok = m.find((x) => x.tipo === 'ok');
      const cfg = m.filter((x) => x.tipo === 'config').pop();
      return err && err.msg.includes('objetivo') && ok && cfg.suelo_min === 40 && cfg.suelo_obj === 60;
    }],
    ['El Arduino virtual responde byte a byte igual que el programa real', () => {
      const ref = MOSK.HUELLA_CPP;
      if (!ref) return 'falta la huella del programa compilado';
      const { salida } = MOSK.guion.correrGuion(MOSK.guion.GUION_REFERENCIA);
      const h = MOSK.guion.huella(salida);
      return h === ref.huella && salida.length === ref.bytes ? true : `huella ${h} (${salida.length} bytes), se esperaba ${ref.huella} (${ref.bytes} bytes)`;
    }],
    ['El panel valida los ajustes con las mismas reglas que el Arduino', () => {
      const { validarAjustes, ordenesAjustes } = MOSK.protocolo;
      const e = validarAjustes({ suelo_min: 40, suelo_obj: 42, temp_min: 20, temp_max: 22, ph_min: 6, ph_max: 6.3 });
      const r = ordenesAjustes({ temp_min: 12.5, temp_max: 30 }, { temp_min: 15, temp_max: 28 });
      return !!(e.suelo_obj && e.temp_max && e.ph_max) && r.ordenes.length === 1 && r.ordenes[0] === 'SET TEMP 12.5 30';
    }],
    ['El panel solo envía las órdenes de lo que cambió', () => {
      const cfg = { suelo_min: 35, suelo_obj: 55, pulso: 5, espera: 60, ciclos: 6, sensor_ph: 1 };
      const r = MOSK.protocolo.ordenesAjustes({ suelo_min: 35, suelo_obj: 55, pulso: 8, espera: 60, ciclos: 6, sensor_ph: true }, cfg);
      return r.ordenes.length === 1 && r.ordenes[0] === 'SET RIEGO 8 60 6';
    }],
    ['La frase de estado trata «riego sin efecto» como falla', () => {
      const f = MOSK.protocolo.describirEstado({ ini: 0, t: 22, ha: 60, hs: 20, riego: 'bloqueado', modo: 'auto', al: ['riego_sin_efecto'] }, { ciclos: 6 });
      return f.tono === 'critico' && f.detalle.includes('estanque');
    }],
    ['El CSV sirve para Excel en español: punto y coma, coma decimal y BOM', () => {
      const csv = MOSK.protocolo.csvMuestras([{ t: Date.UTC(2026, 9, 8, 12), temp: 22.5, ha: 60, hs: 40, hsc: 740, ph: 6.4, phmv: 2600, luz: null, bomba: 1, vent: 0, lamp: 0, modo: 'auto', riego: 'regando', al: [] }]);
      return csv.charCodeAt(0) === 0xfeff && csv.split('\r\n')[1].includes(';22,5;60;40;740;6,40;2600;;1;0;0;auto;regando;');
    }],
    ['Las líneas se arman bien aunque lleguen cortadas en medio de una letra', () => {
      const sep = new MOSK.protocolo.Separador();
      const bytes = new TextEncoder().encode('{"msg":"29.0 °C"}\r\n{"a":1}\n');
      const corte = bytes.indexOf(0xc2) + 1;           // mitad de «°»
      const l = sep.agregar(bytes.slice(0, corte)).concat(sep.agregar(bytes.slice(corte)));
      return l.length === 2 && l[0] === '{"msg":"29.0 °C"}' && l[1] === '{"a":1}';
    }],
    ['Los gráficos no pierden los picos al reducir puntos', () => {
      const m = [];
      for (let i = 0; i < 1000; i++) m.push({ t: i * 1000, v: i === 500 ? 90 : 20 });
      const tramos = MOSK.graficos.reducir(m, 'v', 0, 999000, 50, 15000);
      return tramos.length === 1 && Math.max(...tramos[0].map((p) => p[1])) === 90 && tramos[0].length <= 100;
    }],
    ['Simulación: con el estanque vacío la tierra no se humedece; con agua, sí', () => {
      const { Invernadero } = MOSK.planta;
      const seco = new Invernadero({ semilla: 1 }), mojado = new Invernadero({ semilla: 1 });
      seco.vaciarEstanque();
      const s0 = seco.suelo, m0 = mojado.suelo;
      for (let i = 0; i < 300; i++) { seco.avanzar(100, { bomba: i < 50 }); mojado.avanzar(100, { bomba: i < 50 }); }
      return seco.suelo < s0 && mojado.suelo > m0 + 5;
    }],
    ['Simulación completa: tierra seca, riego por ciclos y objetivo alcanzado', () => {
      const { msgs } = simular((m) => m.secarTierra(), 8);
      const cods = msgs.filter((x) => x.tipo === 'evento').map((x) => x.cod);
      return cods[0] === MOSK.logica.EV.RIEGO_INICIO && cods.includes(MOSK.logica.EV.RIEGO_PULSO) && cods.includes(MOSK.logica.EV.RIEGO_LISTO);
    }],
  ];

  function correrPruebas() {
    const resultados = [];
    for (const [nombre, fn] of PRUEBAS) {
      let ok = false, detalle = '';
      try {
        const r = fn();
        ok = r === true;
        if (!ok) detalle = typeof r === 'string' ? r : 'resultado distinto del esperado';
      } catch (e) {
        detalle = e && e.message ? e.message : String(e);
      }
      resultados.push({ nombre, ok, detalle });
    }
    const fallas = resultados.filter((r) => !r.ok).length;
    return { resultados, fallas, total: resultados.length };
  }

  MOSK.PRUEBAS = PRUEBAS;
  MOSK.correrPruebas = correrPruebas;
})();
