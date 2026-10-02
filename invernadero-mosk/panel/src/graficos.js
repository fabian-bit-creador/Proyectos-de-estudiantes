// =====================================================================
//  graficos.js — Historial en gráficos pequeños, uno por medida, con el
//  mismo eje de tiempo. Sin librerías: SVG armado con el DOM.
//  Las funciones de cálculo (escalas, reducción de puntos) no tocan la
//  pantalla y se prueban con «Verificar el motor».
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});
  const P = MOSK.protocolo;
  const NS = 'http://www.w3.org/2000/svg';

  // ---- Cálculo puro -------------------------------------------------------------
  function pasoBonito(span, cantidad) {
    const bruto = span / Math.max(1, cantidad);
    const p10 = Math.pow(10, Math.floor(Math.log10(bruto)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p10 >= bruto) return m * p10;
    return 10 * p10;
  }

  function marcasY(lo, hi, cantidad = 4) {
    const paso = pasoBonito(hi - lo, cantidad);
    const r = [];
    for (let v = Math.ceil(lo / paso - 1e-9) * paso; v <= hi + 1e-9; v += paso) r.push(Math.round(v * 1000) / 1000 || 0);   // sin «-0»
    return r;
  }

  const PASOS_TIEMPO = [10e3, 30e3, 60e3, 120e3, 300e3, 600e3, 900e3, 1800e3, 3600e3, 7200e3, 10800e3, 21600e3, 43200e3];
  function marcasTiempo(t0, t1, cantidad = 5) {
    const paso = PASOS_TIEMPO.find((p) => (t1 - t0) / p <= cantidad) || PASOS_TIEMPO[PASOS_TIEMPO.length - 1];
    const desfase = new Date(t0).getTimezoneOffset() * 60000;   // marcas en horas redondas locales
    const r = [];
    for (let t = Math.ceil((t0 - desfase) / paso) * paso + desfase; t <= t1; t += paso) r.push(t);
    return { marcas: r, paso };
  }

  function rangoY(valores, extras, opciones) {
    const v = valores.concat(extras).filter((x) => x != null && Number.isFinite(x));
    if (opciones.fijo) return opciones.fijo.slice();
    let lo = v.length ? Math.min(...v) : opciones.porDefecto[0];
    let hi = v.length ? Math.max(...v) : opciones.porDefecto[1];
    const span = Math.max(hi - lo, opciones.spanMinimo);
    const centro = (hi + lo) / 2;
    lo = centro - span / 2 - span * 0.12;
    hi = centro + span / 2 + span * 0.12;
    if (opciones.limites) { lo = Math.max(opciones.limites[0], lo); hi = Math.min(opciones.limites[1], hi); }
    return [lo, hi];
  }

  // Reduce a lo más 2 puntos por columna de píxeles (mínimo y máximo): no se pierden los picos.
  // Devuelve tramos (arreglos de [t, v]); un hueco o un valor vacío corta la línea.
  function reducir(muestras, clave, t0, t1, columnas, huecoMs) {
    const tramos = [];
    let actual = [];
    let col = -1, cMin = null, cMax = null, ultimoT = null;
    const cerrarColumna = () => {
      if (cMin == null) return;
      if (cMin[0] === cMax[0]) actual.push(cMin);
      else if (cMin[0] < cMax[0]) actual.push(cMin, cMax);
      else actual.push(cMax, cMin);
      cMin = cMax = null;
    };
    const cerrarTramo = () => { cerrarColumna(); if (actual.length) tramos.push(actual); actual = []; };
    for (const m of muestras) {
      if (m.t < t0 || m.t > t1) continue;
      const v = m[clave];
      if (v == null || (ultimoT != null && m.t - ultimoT > huecoMs)) cerrarTramo();
      ultimoT = m.t;
      if (v == null) continue;
      const c = Math.floor(((m.t - t0) / Math.max(1, t1 - t0)) * columnas);
      if (c !== col) { cerrarColumna(); col = c; }
      if (cMin == null || v < cMin[1]) cMin = [m.t, v];
      if (cMax == null || v > cMax[1]) cMax = [m.t, v];
    }
    cerrarTramo();
    return tramos;
  }

  // Intervalos en que una salida estuvo encendida: [[inicio, fin], ...]
  function intervalos(muestras, clave, t0, t1, huecoMs) {
    const r = [];
    let ini = null, previo = null;
    for (const m of muestras) {
      if (m.t < t0 || m.t > t1) { previo = null; continue; }
      if (ini != null && previo != null && m.t - previo > huecoMs) { r.push([ini, previo]); ini = null; }
      if (m[clave] && ini == null) ini = m.t;
      else if (!m[clave] && ini != null) { r.push([ini, m.t]); ini = null; }
      previo = m.t;
    }
    if (ini != null && previo != null) r.push([ini, previo]);
    return r;
  }

  function desde(muestras, t) {         // primera muestra con tiempo >= t (búsqueda binaria)
    let a = 0, b = muestras.length;
    while (a < b) { const m = (a + b) >> 1; if (muestras[m].t < t) a = m + 1; else b = m; }
    return a;
  }

  function cercana(muestras, t) {      // búsqueda binaria de la muestra más cercana
    let a = 0, b = muestras.length - 1;
    if (b < 0) return null;
    while (b - a > 1) { const m = (a + b) >> 1; if (muestras[m].t < t) a = m; else b = m; }
    return Math.abs(muestras[a].t - t) <= Math.abs(muestras[b].t - t) ? muestras[a] : muestras[b];
  }

  // ---- Definición de cada gráfico ---------------------------------------------------
  const SERIES = [
    { clave: 'temp', titulo: 'Temperatura del aire', unidad: '°C', dec: 1, rango: { spanMinimo: 6, porDefecto: [10, 30], limites: [-10, 60] },
      umbrales: (c) => [{ v: c.temp_min, txt: 'luz térmica' }, { v: c.temp_max, txt: 'extractor' }], banda: (c) => [c.temp_min, c.temp_max] },
    { clave: 'ha', titulo: 'Humedad del aire', unidad: '%', dec: 0, rango: { fijo: [0, 100] },
      umbrales: (c) => [{ v: c.hum_aire_max, txt: 'extractor' }] },
    { clave: 'hs', titulo: 'Humedad del suelo', unidad: '%', dec: 0, rango: { fijo: [0, 100] }, sombraBomba: true,
      umbrales: (c) => [{ v: c.suelo_min, txt: 'riega bajo' }, { v: c.suelo_obj, txt: 'objetivo' }] },
    { clave: 'ph', titulo: 'pH', unidad: '', dec: 2, rango: { spanMinimo: 2, porDefecto: [5, 8], limites: [0, 14] },
      banda: (c) => (c.sensor_ph ? [c.ph_min, c.ph_max] : null), umbrales: () => [] },
    { clave: 'luz', titulo: 'Luz', unidad: '%', dec: 0, rango: { fijo: [0, 100] }, opcional: true,
      umbrales: (c) => (c.sensor_ldr ? [{ v: c.luz_min, txt: 'luz mínima' }] : []) },
  ];

  const CARRILES = [
    { clave: 'bomba', titulo: 'Bomba', frase: 'bomba encendida', clase: 'carril-bomba' },
    { clave: 'vent', titulo: 'Extractor', frase: 'extractor encendido', clase: 'carril-vent' },
    { clave: 'lamp', titulo: 'Luz térmica', frase: 'luz térmica encendida', clase: 'carril-lamp' },
  ];

  // ---- Dibujo ------------------------------------------------------------------------
  function el(tag, attrs, padre) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(e);
    return e;
  }
  const limpiar = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };

  class Graficos {
    constructor(contenedor, tooltip) {
      this.cont = contenedor;
      this.tip = tooltip;
      this.figuras = [];
      this.muestras = [];
      this.config = null;
      this.t0 = 0;
      this.t1 = 1;
      for (const s of SERIES.concat([{ clave: '_carriles', titulo: 'Bomba, extractor y luz térmica', carriles: true }])) {
        const fig = document.createElement('figure');
        fig.className = 'grafico';
        const cap = document.createElement('figcaption');
        const h = document.createElement('h2');
        h.textContent = s.titulo;
        const actual = document.createElement('span');
        actual.className = 'grafico-actual';
        cap.append(h, actual);
        const svg = el('svg', { class: 'grafico-svg', role: 'img' });
        fig.append(cap, svg);
        this.cont.appendChild(fig);
        const f = { s, fig, svg, actual, alto: s.carriles ? 112 : 150 };
        const seguir = (ev) => { this.puntero = { ev: { clientX: ev.clientX }, f }; this.mover(ev, f); };
        svg.addEventListener('pointermove', seguir);
        svg.addEventListener('pointerdown', seguir);
        svg.addEventListener('pointerleave', () => { this.puntero = null; this.ocultarCruz(); });
        this.figuras.push(f);
      }
    }

    dibujar(muestras, config, ventanaMs) {
      this.muestras = muestras;
      this.config = config || {};
      const ultimo = muestras.length ? muestras[muestras.length - 1].t : Date.now();
      const primero = muestras.length ? muestras[0].t : ultimo - 60000;
      this.t1 = ultimo;
      this.t0 = ventanaMs ? ultimo - ventanaMs : Math.min(primero, ultimo - 60000);
      this.vis = muestras.slice(desde(muestras, this.t0));
      const ancho = Math.max(280, Math.floor(this.cont.clientWidth || 600));
      for (const f of this.figuras) {
        const hayLuz = muestras.some((m) => m.luz != null);
        f.fig.hidden = !!(f.s.opcional && !hayLuz);
        if (f.fig.hidden) continue;
        if (f.s.carriles) this.dibujarCarriles(f, ancho);
        else this.dibujarSerie(f, ancho);
      }
      // Si el cursor sigue sobre un gráfico, la cruz se mantiene al redibujar
      if (this.puntero && !this.puntero.f.fig.hidden) this.mover(this.puntero.ev, this.puntero.f);
      else this.ocultarCruz();
    }

    marco(f, ancho) {
      const m = { izq: 44, der: 14, arr: 10, aba: 24 };
      f.m = m;
      f.ancho = ancho;
      f.svg.setAttribute('viewBox', `0 0 ${ancho} ${f.alto}`);
      f.svg.setAttribute('width', ancho);
      f.svg.setAttribute('height', f.alto);
      limpiar(f.svg);
      f.x = (t) => m.izq + ((t - this.t0) / Math.max(1, this.t1 - this.t0)) * (ancho - m.izq - m.der);
      // Eje de tiempo
      const { marcas, paso } = marcasTiempo(this.t0, this.t1, ancho < 480 ? 3 : 6);
      const g = el('g', { class: 'eje' }, f.svg);
      for (const t of marcas) {
        const x = f.x(t);
        el('line', { x1: x, x2: x, y1: m.arr, y2: f.alto - m.aba, class: 'reja' }, g);
        const tx = el('text', { x, y: f.alto - 6, 'text-anchor': 'middle' }, g);
        tx.textContent = paso < 60000 ? P.hora(t) : P.hora(t).slice(0, 5);
      }
      return g;
    }

    dibujarSerie(f, ancho) {
      this.marco(f, ancho);
      const s = f.s, c = this.config, m = f.m;
      const visibles = this.vis;
      const valores = visibles.map((x) => x[s.clave]);
      const umbrales = (s.umbrales(c) || []).filter((u) => u.v != null && Number.isFinite(u.v));
      const banda = s.banda ? s.banda(c) : null;
      const extras = umbrales.map((u) => u.v).concat(banda && banda.every(Number.isFinite) ? banda : []);
      const [lo, hi] = rangoY(valores, extras, s.rango);
      const alto = f.alto;
      const y = (v) => m.arr + (1 - (v - lo) / Math.max(1e-9, hi - lo)) * (alto - m.arr - m.aba);
      f.y = y;
      f.lo = lo;
      f.hi = hi;
      const izq = m.izq, der = ancho - m.der;

      // Rejilla y etiquetas del eje vertical
      const g = el('g', { class: 'eje' }, f.svg);
      for (const v of marcasY(lo, hi, 4)) {
        el('line', { x1: izq, x2: der, y1: y(v), y2: y(v), class: 'reja' }, g);
        const tx = el('text', { x: izq - 6, y: y(v) + 4, 'text-anchor': 'end' }, g);
        tx.textContent = P.numeroCorto(v);
      }
      // Banda recomendada y zonas de bomba
      if (banda && banda.every(Number.isFinite)) {
        const y0 = y(Math.min(hi, Math.max(lo, banda[1]))), y1 = y(Math.max(lo, Math.min(hi, banda[0])));
        el('rect', { x: izq, y: y0, width: der - izq, height: Math.max(0, y1 - y0), class: 'banda' }, f.svg);
      }
      if (s.sombraBomba) {
        for (const [a, b] of intervalos(this.vis, 'bomba', this.t0, this.t1, 15000)) {
          const xa = f.x(a), xb = Math.max(f.x(b), xa + 2);
          el('rect', { x: xa, y: m.arr, width: xb - xa, height: alto - m.arr - m.aba, class: 'sombra-bomba' }, f.svg);
        }
      }
      // Umbrales con su nombre escrito
      for (const u of umbrales) {
        if (u.v < lo || u.v > hi) continue;
        el('line', { x1: izq, x2: der, y1: y(u.v), y2: y(u.v), class: 'umbral' }, f.svg);
        const tx = el('text', { x: der - 4, y: y(u.v) - 4, 'text-anchor': 'end', class: 'umbral-texto' }, f.svg);
        tx.textContent = `${u.txt} ${P.numeroCorto(u.v)}${s.unidad === '%' ? ' %' : s.unidad ? ' ' + s.unidad : ''}`;
      }
      // La línea de datos
      for (const tramo of reducir(this.vis, s.clave, this.t0, this.t1, der - izq, 15000)) {
        const d = tramo.map((p, i) => `${i ? 'L' : 'M'}${f.x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('');
        el('path', { d, class: 'linea' + (tramo.length === 1 ? ' punto-solo' : '') }, f.svg);
        if (tramo.length === 1) el('circle', { cx: f.x(tramo[0][0]), cy: y(tramo[0][1]), r: 2.5, class: 'linea-punto' }, f.svg);
      }
      // Valor actual y descripción para lectores de pantalla
      const ult = [...visibles].reverse().find((x) => x[s.clave] != null);
      const unidad = s.unidad ? (s.unidad === '%' ? ' %' : ' ' + s.unidad) : '';
      f.actual.textContent = ult ? `${P.numero(ult[s.clave], s.dec)}${unidad} ahora` : 'sin datos';
      const vs = valores.filter((v) => v != null);
      f.svg.setAttribute('aria-label', vs.length
        ? `${s.titulo}: ahora ${P.numero(ult[s.clave], s.dec)}${unidad}; en el periodo mostrado, mínimo ${P.numero(Math.min(...vs), s.dec)} y máximo ${P.numero(Math.max(...vs), s.dec)}${unidad}.`
        : `${s.titulo}: sin datos en el periodo mostrado.`);
      f.cruz = el('line', { x1: 0, x2: 0, y1: m.arr, y2: alto - m.aba, class: 'cruz', visibility: 'hidden' }, f.svg);
      f.puntoCruz = el('circle', { r: 4.5, class: 'cruz-punto', visibility: 'hidden' }, f.svg);
      el('rect', { x: izq, y: 0, width: der - izq, height: alto, class: 'captura' }, f.svg);
    }

    dibujarCarriles(f, ancho) {
      this.marco(f, ancho);
      const m = f.m, izq = m.izq, der = ancho - m.der;
      const textos = [];
      CARRILES.forEach((c, i) => {
        const y0 = m.arr + i * 26;
        const tx = el('text', { x: izq, y: y0 + 9, class: 'carril-nombre' }, f.svg);
        tx.textContent = c.titulo;
        el('rect', { x: izq, y: y0 + 12, width: der - izq, height: 11, class: 'carril-fondo' }, f.svg);
        let total = 0;
        for (const [a, b] of intervalos(this.vis, c.clave, this.t0, this.t1, 15000)) {
          const xa = f.x(a), xb = Math.max(f.x(b), xa + 2);
          el('rect', { x: xa, y: y0 + 12, width: xb - xa, height: 11, rx: 2, class: c.clase }, f.svg);
          total += b - a;
        }
        textos.push(`${c.frase} ${P.duracion(total / 1000)}`);
      });
      f.actual.textContent = '';
      f.svg.setAttribute('aria-label', 'En el periodo mostrado hubo ' + textos.join('; ') + '.');
      f.cruz = el('line', { x1: 0, x2: 0, y1: m.arr, y2: f.alto - m.aba, class: 'cruz', visibility: 'hidden' }, f.svg);
      el('rect', { x: izq, y: 0, width: der - izq, height: f.alto, class: 'captura' }, f.svg);
    }

    mover(ev, f) {
      if (!f.x || !this.vis || !this.vis.length) return;
      const caja = f.svg.getBoundingClientRect();
      const px = ((ev.clientX - caja.left) / caja.width) * f.ancho;
      const t = this.t0 + ((px - f.m.izq) / (f.ancho - f.m.izq - f.m.der)) * (this.t1 - this.t0);
      if (t < this.t0 || t > this.t1) { this.ocultarCruz(); return; }
      const m = cercana(this.vis, t);
      if (!m || m.t < this.t0) { this.ocultarCruz(); return; }
      for (const g of this.figuras) {
        if (g.fig.hidden || !g.cruz) continue;
        const x = g.x(m.t);
        g.cruz.setAttribute('x1', x); g.cruz.setAttribute('x2', x); g.cruz.setAttribute('visibility', 'visible');
        if (g.puntoCruz) {
          const v = m[g.s.clave];
          if (v != null && v >= g.lo && v <= g.hi) {
            g.puntoCruz.setAttribute('cx', x); g.puntoCruz.setAttribute('cy', g.y(v)); g.puntoCruz.setAttribute('visibility', 'visible');
          } else g.puntoCruz.setAttribute('visibility', 'hidden');
        }
      }
      this.mostrarTip(m, ev, f);
    }

    mostrarTip(m, ev, f) {
      const tip = this.tip;
      limpiar(tip);
      const filas = [
        ['Hora', P.hora(m.t)],
        ['Temperatura', m.temp == null ? '—' : P.numero(m.temp, 1) + ' °C'],
        ['Humedad del aire', m.ha == null ? '—' : P.numero(m.ha) + ' %'],
        ['Humedad del suelo', m.hs == null ? '—' : P.numero(m.hs) + ' %'],
        ['pH', m.ph == null ? '—' : P.numero(m.ph, 2)],
      ];
      if (m.luz != null) filas.push(['Luz', P.numero(m.luz) + ' %']);
      filas.push(['Encendido', [m.bomba && 'bomba', m.vent && 'extractor', m.lamp && 'luz térmica'].filter(Boolean).join(', ') || 'nada']);
      for (const [k, v] of filas) {
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        tip.append(dt, dd);
      }
      tip.hidden = false;
      const caja = this.cont.getBoundingClientRect();
      const ancho = tip.offsetWidth || 200;
      let x = ev.clientX - caja.left + 14;
      if (x + ancho > caja.width) x = ev.clientX - caja.left - ancho - 14;
      tip.style.left = Math.max(0, x) + 'px';
      tip.style.top = (f.fig.offsetTop + 30) + 'px';
    }

    ocultarCruz() {
      for (const g of this.figuras) {
        if (g.cruz) g.cruz.setAttribute('visibility', 'hidden');
        if (g.puntoCruz) g.puntoCruz.setAttribute('visibility', 'hidden');
      }
      if (this.tip) this.tip.hidden = true;
    }
  }

  // Línea mínima para las tarjetas del tablero (sin ejes)
  function minilinea(svg, muestras, clave, ventanaMs, spanMinimo = 1) {
    limpiar(svg);
    if (!muestras.length) return;
    const t1 = muestras[muestras.length - 1].t, t0 = t1 - ventanaMs;
    const ancho = 120, alto = 32;
    svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    muestras = muestras.slice(desde(muestras, t0));
    const vs = muestras.filter((m) => m[clave] != null).map((m) => m[clave]);
    if (vs.length < 2) return;
    let lo = Math.min(...vs), hi = Math.max(...vs);
    if (hi - lo < spanMinimo) { const c = (hi + lo) / 2; lo = c - spanMinimo / 2; hi = c + spanMinimo / 2; }
    const x = (t) => 2 + ((t - t0) / Math.max(1, ventanaMs)) * (ancho - 4);
    const y = (v) => 3 + (1 - (v - lo) / (hi - lo)) * (alto - 6);
    for (const tramo of reducir(muestras, clave, t0, t1, 60, 15000)) {
      el('path', { d: tramo.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(''), class: 'mini-linea' }, svg);
    }
  }

  MOSK.graficos = { pasoBonito, marcasY, marcasTiempo, rangoY, reducir, intervalos, desde, cercana, SERIES, CARRILES, Graficos, minilinea };
})();
