// =====================================================================
//  protocolo.js — Lo que el panel entiende del Arduino y lo que le pide.
//  Funciones puras (sin pantalla): se prueban con «Verificar el motor».
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});

  // ---- Formato chileno: coma decimal ---------------------------------------
  function numero(x, decimales = 0) {
    if (x == null || !Number.isFinite(Number(x))) return '—';
    return Number(x).toLocaleString('es-CL', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  }
  // Sin decimales de más: 13,5 · 0,5 · 35
  function numeroCorto(x) {
    if (x == null || !Number.isFinite(Number(x))) return '—';
    return Number(x).toLocaleString('es-CL', { maximumFractionDigits: 2 });
  }
  const dos = (n) => String(n).padStart(2, '0');
  function hora(t) {
    const d = new Date(t);
    return `${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;
  }
  function fechaHora(t) {
    const d = new Date(t);
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())} ${hora(t)}`;
  }
  function duracion(seg) {
    seg = Math.max(0, Math.round(seg));
    if (seg < 60) return `${seg} s`;
    const m = Math.floor(seg / 60), s = seg % 60;
    if (m < 60) return s ? `${m} min ${s} s` : `${m} min`;
    const h = Math.floor(m / 60), mm = m % 60;
    return mm ? `${h} h ${mm} min` : `${h} h`;
  }
  // Valor numérico confiable desde el JSON (null si viene vacío o raro)
  const valor = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

  // ---- Lectura de líneas por el puerto serie -------------------------------
  class Separador {
    constructor() { this.dec = new TextDecoder('utf-8'); this.resto = ''; }
    agregar(bytes) {
      this.resto += this.dec.decode(bytes, { stream: true });
      const partes = this.resto.split('\n');
      this.resto = partes.pop();
      if (this.resto.length > 2000) { partes.push(this.resto); this.resto = ''; }   // basura sin saltos de línea
      return partes.map((l) => l.replace(/\r$/, ''));
    }
  }

  function interpretarLinea(l) {
    if (!l || !l.trim()) return { clase: 'vacia', texto: '' };
    if (l[0] === '{') {
      try {
        const msg = JSON.parse(l);
        if (msg && typeof msg === 'object' && typeof msg.tipo === 'string') return { clase: 'mensaje', msg, texto: l };
      } catch (e) { /* línea cortada o velocidad equivocada */ }
      return { clase: 'ilegible', texto: l };
    }
    if (l[0] === '#') return { clase: 'ayuda', texto: l.slice(1).trim() };
    return { clase: 'otro', texto: l };
  }

  // Qué respuesta indica que el Arduino recibió una orden
  function respuestaEsperada(orden) {
    const p = String(orden).trim().toUpperCase().split(/\s+/)[0];
    if (['SET', 'SENSOR', 'CAL', 'FABRICA'].includes(p)) return ['ok', 'error'];
    if (['MODO', 'REGAR', 'BOMBA', 'EXTRACTOR', 'VENT', 'LUZ', 'ALARMAS', 'RESET', 'ESTADO'].includes(p)) return ['datos', 'error'];
    if (p === 'CONFIG') return ['config'];
    if (p === 'AYUDA' || p === '?') return ['ayuda'];
    return ['error', 'ok', 'datos'];
  }

  // ---- Ajustes: mismas reglas que el Arduino (InvernaderoMOSK.ino) ----------
  const LIMITES = {
    suelo_min: { min: 5, max: 90, paso: 1, unidad: '%' },
    suelo_obj: { min: 10, max: 100, paso: 1, unidad: '%' },
    temp_min: { min: 0, max: 35, paso: 0.1, unidad: '°C' },
    temp_max: { min: 10, max: 45, paso: 0.1, unidad: '°C' },
    hum_aire_max: { min: 40, max: 99, paso: 1, unidad: '%' },
    luz_min: { min: 0, max: 90, paso: 1, unidad: '%' },
    pulso: { min: 1, max: 30, paso: 1, unidad: 's' },
    espera: { min: 10, max: 600, paso: 1, unidad: 's' },
    ciclos: { min: 1, max: 20, paso: 1, unidad: '' },
    bomba_hora: { min: 10, max: 900, paso: 1, unidad: 's' },
    ph_min: { min: 0, max: 13.5, paso: 0.01, unidad: '' },
    ph_max: { min: 0.5, max: 14, paso: 0.01, unidad: '' },
  };

  const GRUPOS = [
    { campos: ['suelo_min', 'suelo_obj'], orden: (v) => `SET SUELO ${v.suelo_min} ${v.suelo_obj}` },
    { campos: ['temp_min', 'temp_max'], orden: (v) => `SET TEMP ${texto1(v.temp_min)} ${texto1(v.temp_max)}` },
    { campos: ['hum_aire_max'], orden: (v) => `SET HUM_AIRE ${v.hum_aire_max}` },
    { campos: ['pulso', 'espera', 'ciclos'], orden: (v) => `SET RIEGO ${v.pulso} ${v.espera} ${v.ciclos}` },
    { campos: ['bomba_hora'], orden: (v) => `SET BOMBA_HORA ${v.bomba_hora}` },
    { campos: ['sensor_ph'], orden: (v) => `SENSOR PH ${v.sensor_ph ? 'ON' : 'OFF'}` },
    { campos: ['ph_min', 'ph_max'], orden: (v) => `SET PH ${texto2(v.ph_min)} ${texto2(v.ph_max)}` },
    { campos: ['sensor_ldr'], orden: (v) => `SENSOR LDR ${v.sensor_ldr ? 'ON' : 'OFF'}` },
    { campos: ['luz_min'], orden: (v) => `SET LUZ ${v.luz_min}` },
  ];
  const texto1 = (x) => String(Math.round(x * 10) / 10);
  const texto2 = (x) => String(Math.round(x * 100) / 100);

  // Normaliza como lo haría el Arduino (redondea a su resolución)
  function normalizar(campo, x) {
    if (x == null || x === '' || !Number.isFinite(Number(x))) return null;
    const p = LIMITES[campo] ? LIMITES[campo].paso : 1;
    const n = Number(x);
    return p === 1 ? Math.round(n) : p === 0.1 ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100;
  }

  function validarAjustes(v) {
    const e = {};
    for (const [campo, l] of Object.entries(LIMITES)) {
      if (!(campo in v)) continue;
      const x = v[campo];
      if (x == null) e[campo] = 'Escribe un número.';
      else if (x < l.min || x > l.max) e[campo] = `Debe estar entre ${numeroCorto(l.min)} y ${numeroCorto(l.max)}${l.unidad ? ' ' + l.unidad : ''}.`;
    }
    if (!e.suelo_min && !e.suelo_obj && v.suelo_obj != null && v.suelo_min != null && v.suelo_obj < v.suelo_min + 5)
      e.suelo_obj = 'El objetivo debe quedar al menos 5 puntos sobre el mínimo.';
    if (!e.temp_min && !e.temp_max && v.temp_max != null && v.temp_min != null && v.temp_max < v.temp_min + 3)
      e.temp_max = 'La máxima debe quedar al menos 3 °C sobre la mínima.';
    if (!e.ph_min && !e.ph_max && v.ph_max != null && v.ph_min != null && Math.round(v.ph_max * 100) < Math.round(v.ph_min * 100) + 50)
      e.ph_max = 'El máximo debe quedar al menos 0,5 sobre el mínimo.';
    return e;
  }

  // Órdenes necesarias para pasar de la configuración actual a la nueva
  function ordenesAjustes(nuevos, config) {
    const v = {};
    for (const k of Object.keys(nuevos)) v[k] = k.startsWith('sensor_') ? !!nuevos[k] : normalizar(k, nuevos[k]);
    const errores = validarAjustes(v);
    const ordenes = [];
    for (const g of GRUPOS) {
      if (!g.campos.every((c) => c in v)) continue;
      const cambia = !config || g.campos.some((c) => (c.startsWith('sensor_') ? !!config[c] !== v[c] : normalizar(c, config[c]) !== v[c]));
      if (!cambia || g.campos.some((c) => errores[c])) continue;
      ordenes.push(g.orden(v));
    }
    return { ordenes, errores, valores: v };
  }

  // ---- Alarmas en palabras ----------------------------------------------------
  const ALARMAS = {
    riego_sin_efecto: { tono: 'critico', titulo: 'Riego sin efecto', que: 'Se hicieron todos los ciclos de riego y la humedad del suelo no subió.', hacer: 'Revisa que el estanque tenga agua, que la manguera llegue a la maceta y que la bomba funcione. Después presiona «Reiniciar alarma».', reiniciar: true },
    dht: { tono: 'critico', titulo: 'Sensor de temperatura sin señal', que: 'El DHT no respondió en tres lecturas seguidas. Por precaución el extractor queda encendido y la luz térmica apagada.', hacer: 'Revisa el cable de datos en D2, el 5V y el GND. Un DHT suelto (sin placa) necesita una resistencia de 10 kΩ entre DATA y 5V. Confirma en config.h si es DHT11 o DHT22.' },
    suelo: { tono: 'critico', titulo: 'Sensor de suelo sin lectura', que: 'La lectura está en el extremo: el sensor está fuera de la tierra, desconectado o en cortocircuito. Mientras tanto no se riega.', hacer: 'Entierra las patas del sensor. Revisa el cable a A0, el VCC del módulo en D4 y el GND.' },
    limite_bomba: { tono: 'aviso', titulo: 'Tope de bomba por hora', que: 'La bomba funcionó el máximo de segundos permitido en esta hora y quedó detenida.', hacer: 'Se renueva sola al cumplirse la hora. Si revisaste el estanque y la manguera, puedes reiniciar la alarma ahora.', reiniciar: true },
    temp_alta: { tono: 'aviso', titulo: 'Temperatura muy alta', que: 'Está 3 °C o más sobre la máxima. El extractor no puede enfriar por debajo de la temperatura de afuera.', hacer: 'Da sombra al invernadero o ábrelo. La luz térmica se mantiene apagada.' },
    temp_baja: { tono: 'aviso', titulo: 'Temperatura muy baja', que: 'Está 3 °C o más bajo la mínima.', hacer: 'La luz térmica debería estar encendida. Cierra el invernadero y revisa la lámpara.' },
    ph_falla: { tono: 'aviso', titulo: 'Sonda de pH sin lectura', que: 'El voltaje del módulo de pH está fuera de lo posible.', hacer: 'Revisa el cable Po a A1, el 5V y el GND del módulo, y que la sonda esté atornillada al conector. Si no tienen sonda, apaga el sensor de pH en Ajustes.' },
    ph_fuera: { tono: 'aviso', titulo: 'pH fuera del rango', que: 'El pH medido está fuera del rango configurado.', hacer: 'El riego no corrige el pH. Revisen el agua de riego y la tierra con el profesor.' },
    ph_sin_calibrar: { tono: 'info', titulo: 'pH sin calibrar', que: 'Los valores de pH son aproximados: la sonda todavía no se calibra.', hacer: 'Calibra con soluciones pH 7 y pH 4 en la pestaña Calibrar.' },
  };
  const ORDEN_ALARMAS = ['riego_sin_efecto', 'dht', 'suelo', 'limite_bomba', 'temp_alta', 'temp_baja', 'ph_falla', 'ph_fuera', 'ph_sin_calibrar'];

  function alarmasOrdenadas(lista) {
    const activas = Array.isArray(lista) ? lista : [];
    return ORDEN_ALARMAS.filter((k) => activas.includes(k)).map((k) => Object.assign({ clave: k }, ALARMAS[k]));
  }

  // ---- El estado del invernadero en una frase ---------------------------------
  function describirEstado(d, c) {
    if (!d) return { tono: 'neutro', titulo: 'Sin datos todavía', detalle: 'Conecta el Arduino o prueba la simulación.' };
    if (d.ini) return { tono: 'neutro', titulo: 'El Arduino está partiendo', detalle: 'Lee los sensores unos segundos antes de tomar decisiones.' };
    const al = Array.isArray(d.al) ? d.al : [];
    const cfg = c || {};
    const t = valor(d.t), ha = valor(d.ha), hs = valor(d.hs);
    if (al.includes('riego_sin_efecto')) return { tono: 'critico', titulo: 'Riego detenido: la tierra no se humedeció', detalle: `Se regó ${cfg.ciclos || 'varias'} veces y la humedad del suelo no subió. Revisa el estanque, la manguera y la bomba; después presiona «Reiniciar alarma».` };
    if (al.includes('dht')) return { tono: 'critico', titulo: 'El sensor de temperatura no responde', detalle: 'Por precaución el extractor quedó encendido y la luz térmica apagada. Revisa el cable de datos en D2.' };
    if (al.includes('suelo')) return { tono: 'critico', titulo: 'El sensor de suelo no está midiendo', detalle: 'Está fuera de la tierra o desconectado (A0). Mientras tanto no se riega.' };
    if (al.includes('limite_bomba')) return { tono: 'aviso', titulo: 'Se alcanzó el tope de bomba de esta hora', detalle: `La bomba ya funcionó ${cfg.bomba_hora || ''} s en esta hora. Si el estanque y la manguera están bien, puedes reiniciar la alarma.`.replace('  ', ' ') };
    if (d.modo === 'manual' && d.bomba) return { tono: 'info', titulo: 'Bomba encendida a mano', detalle: `Se apaga sola en ${d.fase} s.` };
    if (d.riego === 'regando') return { tono: 'info', titulo: `Regando · ciclo ${d.ciclo} de ${cfg.ciclos || '?'}`, detalle: `El suelo está en ${numero(hs)} % y se riega hasta ${cfg.suelo_obj || '?'} %. Quedan ${d.fase} s de bomba.` };
    if (d.riego === 'espera') return { tono: 'info', titulo: 'Esperando que el agua se absorba', detalle: `Vuelve a medir en ${d.fase} s (ciclo ${d.ciclo} de ${cfg.ciclos || '?'}). El suelo va en ${numero(hs)} %.` };
    if (al.includes('temp_alta')) return { tono: 'aviso', titulo: 'Hace demasiado calor', detalle: `Hay ${numero(t, 1)} °C. El extractor está encendido, pero no enfría por debajo de la temperatura de afuera: da sombra o abre el invernadero.` };
    if (al.includes('temp_baja')) return { tono: 'aviso', titulo: 'Hace demasiado frío', detalle: `Hay ${numero(t, 1)} °C. La luz térmica debería estar encendida: cierra el invernadero.` };
    if (al.includes('ph_fuera')) return { tono: 'aviso', titulo: 'El pH está fuera del rango', detalle: `Mide ${numero(valor(d.ph), 1)} y lo recomendado es de ${numero(cfg.ph_min, 1)} a ${numero(cfg.ph_max, 1)}. El riego no corrige el pH: revisen el agua y la tierra.` };
    if (al.includes('ph_falla')) return { tono: 'aviso', titulo: 'La sonda de pH no entrega datos', detalle: 'Revisa la conexión en A1, o apaga el sensor de pH en Ajustes si no lo usan.' };
    if (d.modo === 'manual') return { tono: 'info', titulo: 'Modo manual', detalle: 'El riego automático está en pausa. Vuelve solo después de 10 minutos sin órdenes.' };
    let detalle = `Suelo al ${numero(hs)} % (se riega bajo ${cfg.suelo_min ?? '?'} %), ${numero(t, 1)} °C y aire al ${numero(ha)} %.`;
    if (d.vent) {
      const porCalor = t != null && cfg.temp_max != null && t >= cfg.temp_max - 1.5;
      detalle += porCalor ? ' El extractor está sacando el aire caliente.' : ' El extractor está sacando el aire húmedo.';
    }
    if (d.lamp) {
      const porFrio = t != null && cfg.temp_min != null && t < cfg.temp_min + 2;
      detalle += porFrio ? ' La luz térmica está calentando.' : ' La luz térmica está encendida porque falta luz.';
    }
    return { tono: 'ok', titulo: 'Todo en orden', detalle };
  }

  // Reglas del programa, con los valores que tiene el Arduino ahora
  function explicarReglas(c) {
    if (!c) return [];
    const n1 = (x) => numero(x, 1), n2 = numeroCorto;
    return [
      { titulo: 'Riego por ciclos', texto: `Si la humedad del suelo baja de ${c.suelo_min} %, la bomba funciona ${c.pulso} s, espera ${c.espera} s a que el agua se absorba y vuelve a medir. Repite hasta llegar a ${c.suelo_obj} % o hasta ${c.ciclos} ciclos.` },
      { titulo: 'Si el agua no llega', texto: `Si después de los ${c.ciclos} ciclos la humedad no subió al menos 5 puntos, se detiene el riego y avisa «riego sin efecto». Así un estanque vacío o una manguera suelta no dejan la bomba funcionando.` },
      { titulo: 'Tope de bomba', texto: `La bomba no funciona más de ${c.bomba_hora} s por hora, ni en automático ni a mano.` },
      { titulo: 'Extractor', texto: `Se enciende con ${n1(c.temp_max)} °C o más, o con ${c.hum_aire_max} % de humedad del aire o más. Se apaga recién cuando baja a ${n1(c.temp_max - 1.5)} °C y a ${c.hum_aire_max - 5} %, para no prender y apagar a cada rato.` },
      { titulo: 'Luz térmica', texto: `Se enciende con ${n1(c.temp_min)} °C o menos y se apaga al llegar a ${n1(c.temp_min + 2)} °C.` + (c.sensor_ldr ? ` También se enciende si la luz baja de ${c.luz_min} % y se apaga al volver a ${c.luz_min + 10} %.` : '') + ` Nunca se enciende con ${n1(c.temp_max)} °C o más, ni si el sensor de temperatura falla.` },
      { titulo: 'Relés tranquilos', texto: 'El extractor y la luz no cambian antes de 30 s desde el último cambio, salvo por seguridad.' },
      { titulo: 'pH', texto: c.sensor_ph ? `Solo se mide y avisa si sale del rango ${n2(c.ph_min)} a ${n2(c.ph_max)}. El riego no corrige el pH.` : 'El sensor de pH está apagado en los ajustes.' },
      { titulo: 'Modo manual', texto: 'Cualquier orden a mano pausa el automático. Vuelve solo después de 10 minutos sin órdenes. «Regar ahora» vuelve al automático apenas termina.' },
    ];
  }

  // ---- Exportar --------------------------------------------------------------
  function celda(x, dec) {
    if (x == null || x === '') return '';
    if (typeof x === 'number') return dec == null ? String(x).replace('.', ',') : x.toFixed(dec).replace('.', ',');
    const s = String(x);
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function csvMuestras(muestras) {
    const filas = ['fecha_hora;temperatura_C;humedad_aire_pct;humedad_suelo_pct;suelo_lectura_cruda;pH;pH_mV;luz_pct;bomba;extractor;luz_termica;modo;riego;alarmas'];
    for (const m of muestras) {
      filas.push([fechaHora(m.t), celda(m.temp, 1), celda(m.ha), celda(m.hs), celda(m.hsc), celda(m.ph, 2), celda(m.phmv), celda(m.luz),
        m.bomba ? 1 : 0, m.vent ? 1 : 0, m.lamp ? 1 : 0, celda(m.modo), celda(m.riego), celda((m.al || []).join(' '))].join(';'));
    }
    return '﻿' + filas.join('\r\n') + '\r\n';
  }

  function csvEventos(eventos) {
    const filas = ['fecha_hora;codigo;mensaje'];
    for (const e of eventos) filas.push([fechaHora(e.t), celda(String(e.cod)), celda(e.msg)].join(';'));
    return '﻿' + filas.join('\r\n') + '\r\n';
  }

  // Muestra a partir de un mensaje «datos»
  function muestraDe(d, t) {
    return {
      t, temp: valor(d.t), ha: valor(d.ha), hs: valor(d.hs), hsc: valor(d.hsc), ph: valor(d.ph), phmv: valor(d.phmv),
      luz: valor(d.luz), bomba: d.bomba ? 1 : 0, vent: d.vent ? 1 : 0, lamp: d.lamp ? 1 : 0,
      modo: d.modo === 'manual' ? 'manual' : 'auto', riego: typeof d.riego === 'string' ? d.riego : '', al: Array.isArray(d.al) ? d.al.slice() : [],
    };
  }

  // Estabilidad de una lectura (para calibrar): diferencia entre la mayor y la menor
  function rango(valores) {
    const v = valores.filter((x) => Number.isFinite(x));
    return v.length ? Math.max(...v) - Math.min(...v) : null;
  }

  MOSK.protocolo = {
    numero, numeroCorto, hora, fechaHora, duracion, valor, Separador, interpretarLinea, respuestaEsperada,
    LIMITES, GRUPOS, normalizar, validarAjustes, ordenesAjustes, ALARMAS, ORDEN_ALARMAS, alarmasOrdenadas,
    describirEstado, explicarReglas, csvMuestras, csvEventos, muestraDe, rango,
  };
})();
