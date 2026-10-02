// =====================================================================
//  panel.js — La interfaz: pinta lo que manda el Arduino y le envía
//  las órdenes. Todo texto que viene del Arduino se escribe con
//  textContent, nunca como HTML.
// =====================================================================
(function () {
  'use strict';
  const MOSK = globalThis.MOSK;
  const P = MOSK.protocolo, G = MOSK.graficos, C = MOSK.conexion, M = MOSK.medicion;
  const $ = (id) => document.getElementById(id);
  const todos = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

  const MAX_MUESTRAS = 60000, MAX_EVENTOS = 2000, MAX_CONSOLA_DOM = 600, MAX_CONSOLA = 5000;
  const DIEZ_MIN = 600000;
  const NOMBRE_RIEGO = { reposo: 'En reposo', regando: 'Regando', espera: 'Esperando que se absorba', bloqueado: 'Detenido por alarma' };
  const CODIGOS_FALLA = [6, 7, 8, 11, 14, 16, 23];
  const CAMPOS = ['suelo_min', 'suelo_obj', 'pulso', 'espera', 'ciclos', 'bomba_hora', 'temp_min', 'temp_max', 'hum_aire_max', 'sensor_ph', 'ph_min', 'ph_max', 'sensor_ldr', 'luz_min'];

  const est = {
    con: null, fase: 'libre', tipoHistorial: null, hola: null, config: null, datos: null, tDatos: null,
    muestras: [], eventos: [], versionEventos: 0, dibujadoEventos: -1, consola: [],
    ventana: DIEZ_MIN, pestana: 'tablero', pendiente: null, cola: [], raras: 0, avisoRaras: false,
    ultimaLinea: 0, sucios: new Set(), recientesHsc: [], recientesMv: [], dibujoPedido: false,
    ultimoGrafico: 0, graficoPendiente: null, modeloSim: null, temporizadores: [], ultimaSim: 0, secoHasta: 0,
    dibujadoRegistro: -1, puertoRecordado: null,
  };

  // ---- Avisos breves ----------------------------------------------------------
  function avisar(texto, tono) {
    const a = document.createElement('div');
    a.className = 'aviso';
    if (tono) a.dataset.tono = tono;
    a.textContent = texto;
    $('avisos').appendChild(a);
    setTimeout(() => a.remove(), tono === 'error' ? 9000 : 4500);
    while ($('avisos').children.length > 3) $('avisos').firstChild.remove();
  }

  function confirmar(texto, boton) {
    const d = $('dialogoConfirmar');
    $('confirmarTexto').textContent = texto;
    $('confirmarSi').textContent = boton || 'Sí, continuar';
    return new Promise((resolver) => {
      const alCerrar = () => { d.removeEventListener('close', alCerrar); resolver(d.returnValue === 'si'); };
      d.addEventListener('close', alCerrar);
      d.returnValue = 'no';
      d.showModal();
    });
  }

  function descargar(nombre, contenido, tipo) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const marcaArchivo = () => P.fechaHora(Date.now()).replace(/[: ]/g, '-');

  // ---- Conexión ----------------------------------------------------------------------
  const serieDisponible = C.ConexionSerie.disponible();

  function prepararConexion(con) {
    if (est.tipoHistorial && est.tipoHistorial !== con.tipo) {     // no mezclar datos simulados con reales
      est.muestras = [];
      est.eventos = [];
      est.versionEventos++;
    }
    est.tipoHistorial = con.tipo;
    est.con = con;
    $('formAjustes').hidden = true;
    $('ajustesVacio').hidden = false;
    $('franjaSimulacion').hidden = con.tipo !== 'simulacion';
    est.hola = null;
    est.config = null;
    est.datos = null;
    est.raras = 0;
    est.avisoRaras = false;
    est.sucios.clear();
    con.on('linea', (l, t) => { if (est.con === con) alLinea(l, t); });
    con.on('estado', (e, motivo) => {
      if (e === 'perdida' && est.con === con) {
        est.con = null;
        rechazarPendientes('Se perdió la conexión.');
        fijarFase('perdida');
        avisar(motivo || 'Se perdió la conexión con el Arduino.', 'error');
        revisarPuertoRecordado();
      }
    });
    con.on('tick', () => { if (est.con === con) actualizarSimulacion(); });
  }

  function limpiarTemporizadores() {
    est.temporizadores.forEach(clearTimeout);
    est.temporizadores = [];
  }

  async function cerrarConexion() {
    limpiarTemporizadores();
    if (!est.con) return;
    const con = est.con;
    est.con = null;
    rechazarPendientes('Se cerró la conexión.');
    try { await con.desconectar(); } catch (e) { /* ya estaba cerrada */ }
  }

  async function conectarSerie(puerto) {
    if (!serieDisponible) { avisar('Este navegador no puede usar el puerto USB. Usa Chrome o Edge en un computador.', 'error'); return; }
    if (!puerto) {
      try { puerto = await navigator.serial.requestPort(); }
      catch (e) { if (!(e && e.name === 'NotFoundError')) avisar(C.mensajeError(e), 'error'); return; }
    }
    await cerrarConexion();
    const con = new C.ConexionSerie();
    prepararConexion(con);
    fijarFase('abriendo');
    try {
      await con.conectar(puerto);
    } catch (e) {
      est.con = null;
      fijarFase('libre');
      avisar(C.mensajeError(e), 'error');
      return;
    }
    fijarFase('esperando');
    est.ultimaLinea = performance.now();
    // El Arduino se reinicia al abrir el puerto y saluda solo. Si no saluda, se le pregunta.
    est.temporizadores.push(setTimeout(() => { if (est.fase === 'esperando') enviarCruda('CONFIG'); }, 3500));
    est.temporizadores.push(setTimeout(() => {
      if (est.fase === 'esperando') avisar('El puerto está abierto, pero el Arduino no responde. ¿Tiene cargado el programa InvernaderoMOSK? ¿Es el puerto correcto?', 'error');
    }, 8000));
  }

  async function conectarSimulacion() {
    await cerrarConexion();
    const con = new C.ConexionSimulada({ modelo: est.modeloSim });
    prepararConexion(con);
    fijarFase('esperando');
    con.conectar();
    est.modeloSim = con.modelo;
    $('franjaSimulacion').hidden = false;
    if (!est.simAbierta) { est.simAbierta = true; $('simDetalles').open = window.matchMedia('(min-width: 681px)').matches; }
    reflejarControlesSimulacion();
    actualizarSimulacion(true);
  }

  async function desconectar() {
    const eraSim = est.con && est.con.tipo === 'simulacion';
    await cerrarConexion();
    fijarFase('libre');
    if (eraSim) $('franjaSimulacion').hidden = true;
    revisarPuertoRecordado();
  }

  async function revisarPuertoRecordado() {
    const p = await C.ConexionSerie.puertoRecordado();
    est.puertoRecordado = p;
    actualizarBotones();
  }

  function fijarFase(fase, conExtra) {
    est.fase = fase;
    const con = conExtra || est.con;
    const sim = con && con.tipo === 'simulacion';
    let chip = fase, texto;
    if (fase === 'libre') texto = 'Sin conexión';
    else if (fase === 'abriendo') texto = 'Abriendo el puerto…';
    else if (fase === 'esperando') texto = sim ? 'Arrancando la simulación…' : 'Esperando al Arduino…';
    else if (fase === 'conectado') {
      chip = sim ? 'simulacion' : 'conectado';
      texto = sim ? 'Simulación en marcha' : `Conectado · programa ${est.hola && est.hola.version ? est.hola.version : ''}`.trim();
    } else if (fase === 'silencio') texto = 'Sin datos del Arduino';
    else texto = 'Se perdió la conexión';
    $('chipConexion').dataset.estado = chip;
    $('textoConexion').textContent = texto;
    actualizarBotones();
    pedirDibujo();
  }

  function actualizarBotones() {
    const con = est.con;
    const serie = con && con.tipo === 'serie';
    const sim = con && con.tipo === 'simulacion';
    $('btnConectar').hidden = !!serie || est.fase === 'abriendo';
    $('btnConectar').disabled = !serieDisponible;
    $('btnReconectar').hidden = !(serieDisponible && !serie && est.puertoRecordado && est.fase !== 'abriendo');
    $('btnSimular').hidden = !!serie || !!sim || est.fase === 'abriendo';
    $('btnDesconectar').hidden = !con;
    $('btnDesconectar').textContent = sim ? 'Detener simulación' : 'Desconectar';
    const activo = !!(con && est.fase !== 'libre' && est.fase !== 'perdida');
    todos('.salida button, #grupoModo button, [data-cal], #btnGuardar, #btnFabrica').forEach((b) => { b.disabled = !activo; });
  }

  // Si el Arduino real se queda callado, se avisa
  setInterval(() => {
    if (!est.con || est.con.tipo !== 'serie') return;
    const silencio = performance.now() - est.ultimaLinea;
    if (est.fase === 'conectado' && silencio > 7000) fijarFase('silencio');
    if (est.fase === 'silencio') $('textoConexion').textContent = `Sin datos hace ${Math.round(silencio / 1000)} s`;
  }, 1000);

  // ---- Lo que llega -------------------------------------------------------------------
  function alLinea(texto, t) {
    est.ultimaLinea = performance.now();
    const r = P.interpretarLinea(texto);
    if (r.clase === 'vacia') return;
    agregarConsola('entrada', texto, t, r);
    if (r.clase === 'mensaje') manejarMensaje(r.msg, t);
    else if (r.clase === 'ayuda') resolverPendiente('ayuda', null);
    else {
      est.raras++;
      if (est.raras >= 4 && est.fase === 'esperando' && !est.avisoRaras) {
        est.avisoRaras = true;
        avisar('Llegan datos que no se entienden. Revisa que el Arduino tenga cargado InvernaderoMOSK y que nada más use el puerto.', 'error');
      }
    }
  }

  function manejarMensaje(m, t) {
    switch (m.tipo) {
      case 'hola':
        est.hola = m;
        break;
      case 'config':
        est.config = m;
        ajustesDesdeConfig();
        break;
      case 'datos':
        est.datos = m;
        est.tDatos = t;
        if (!m.ini) agregarMuestra(P.muestraDe(m, t));
        recordar(est.recientesHsc, P.valor(m.hsc));
        recordar(est.recientesMv, P.valor(m.phmv));
        break;
      case 'evento':
        est.eventos.push({ t, cod: m.cod, msg: typeof m.msg === 'string' ? m.msg : '' });
        if (est.eventos.length > MAX_EVENTOS) est.eventos.splice(0, est.eventos.length - MAX_EVENTOS);
        est.versionEventos++;
        if (m.tipo === 'evento' && [6, 8, 14, 16].includes(m.cod)) avisar(m.msg, 'error');
        break;
      default:
        break;
    }
    if (est.fase !== 'conectado') {
      const antes = est.fase;
      fijarFase('conectado');
      if (antes === 'esperando' && !est.config && m.tipo !== 'hola') enviarCruda('CONFIG');
    } else if (m.tipo === 'hola') fijarFase('conectado');      // para mostrar la versión del programa
    resolverPendiente(m.tipo, m);
    pedirDibujo();
  }

  function recordar(lista, v) {
    if (v == null) return;
    lista.push(v);
    if (lista.length > 6) lista.shift();
  }

  function agregarMuestra(m) {
    est.muestras.push(m);
    if (est.muestras.length > MAX_MUESTRAS) est.muestras.splice(0, 10000);
  }

  // ---- Órdenes: una a la vez, esperando la respuesta (con un reintento) ---------------
  function enviarCruda(orden) {
    if (!est.con) return;
    agregarConsola('salida', orden, est.con.ahora());
    est.con.enviar(orden);
  }

  function ordenar(orden) {
    if (!est.con || est.fase === 'perdida' || est.fase === 'libre') return Promise.reject(new Error('No hay conexión con el Arduino.'));
    return new Promise((resolve, reject) => {
      est.cola.push({ orden, espera: P.respuestaEsperada(orden), resolve, reject, intentos: 0 });
      siguienteOrden();
    });
  }

  function siguienteOrden() {
    if (est.pendiente || !est.cola.length) return;
    est.pendiente = est.cola.shift();
    despachar(est.pendiente);
  }

  function despachar(p) {
    if (!est.con) { rechazarPendientes('No hay conexión con el Arduino.'); return; }
    p.intentos++;
    enviarCruda(p.orden);
    p.timer = setTimeout(() => {
      if (est.pendiente !== p) return;
      if (p.intentos < 2) despachar(p);
      else {
        est.pendiente = null;
        p.reject(new Error(`El Arduino no respondió a «${p.orden}».`));
        siguienteOrden();
      }
    }, est.con.tipo === 'simulacion' ? 1500 : 2500);
  }

  function resolverPendiente(tipo, msg) {
    const p = est.pendiente;
    if (!p || !p.espera.includes(tipo)) return;
    clearTimeout(p.timer);
    est.pendiente = null;
    p.resolve({ tipo, msg });
    siguienteOrden();
  }

  function rechazarPendientes(motivo) {
    const todas = (est.pendiente ? [est.pendiente] : []).concat(est.cola);
    est.pendiente = null;
    est.cola = [];
    for (const p of todas) { clearTimeout(p.timer); p.reject(new Error(motivo)); }
  }

  async function accion(orden, textoOk) {
    try {
      const r = await ordenar(orden);
      if (r.tipo === 'error') avisar(r.msg.msg, 'error');
      else if (textoOk) avisar(textoOk);
      return r;
    } catch (e) {
      avisar(e.message, 'error');
      return null;
    }
  }

  // ---- Dibujo ----------------------------------------------------------------------------
  function pedirDibujo() {
    if (est.dibujoPedido) return;
    est.dibujoPedido = true;
    requestAnimationFrame(() => { est.dibujoPedido = false; dibujar(); });
  }

  function dibujar() {
    const d = est.datos, c = est.config;
    $('primerosPasos').hidden = !!(est.con || est.muestras.length);
    dibujarFrase(d, c);
    dibujarLecturas(d, c);
    dibujarSalidas(d);
    dibujarRiego(d, c);
    dibujarAlarmas(d);
    if (est.dibujadoEventos !== est.versionEventos) dibujarEventos();
    if (est.pestana === 'calibrar') dibujarCalibrar(d, c);
    if (est.pestana === 'graficos') dibujarGraficos(false);
  }

  function dibujarFrase(d, c) {
    let f = P.describirEstado(d, c);
    if (!est.con && !d) f = { tono: 'neutro', titulo: 'Sin conexión', detalle: 'Conecta el Arduino por USB o prueba la simulación.' };
    else if (est.con && !d) f = { tono: 'neutro', titulo: est.con.tipo === 'simulacion' ? 'Arrancando la simulación' : 'Esperando al Arduino', detalle: 'Las primeras lecturas llegan en unos segundos.' };
    else if (est.fase === 'perdida') f = { tono: 'critico', titulo: 'Se perdió la conexión', detalle: 'Revisa el cable USB y presiona «Reconectar» o «Conectar Arduino». Mientras tanto, el Arduino sigue funcionando solo.' };
    const caja = $('frase');
    caja.dataset.tono = f.tono;
    $('fraseTitulo').textContent = f.titulo;
    $('fraseDetalle').textContent = f.detalle;
    $('fraseIconoUso').setAttribute('href', f.tono === 'ok' ? '#i-ok' : f.tono === 'aviso' || f.tono === 'critico' ? '#i-alerta' : '#i-info');
    $('fraseHora').textContent = est.tDatos ? `${est.con && est.con.tipo === 'simulacion' ? 'Hora simulada' : 'Último dato'} ${P.hora(est.tDatos)}` : '';
  }

  function ponerLectura(clave, idValor, valor, decimales, idRef, ref) {
    const tarjeta = document.querySelector(`.lectura[data-clave="${clave}"]`);
    tarjeta.classList.toggle('sin-dato', valor == null);
    $(idValor).textContent = valor == null ? '—' : P.numero(valor, decimales);
    $(idRef).textContent = ref;
  }

  function dibujarLecturas(d, c) {
    const al = d && Array.isArray(d.al) ? d.al : [];
    const t = d ? P.valor(d.t) : null, ha = d ? P.valor(d.ha) : null, hs = d ? P.valor(d.hs) : null;
    const ph = d ? P.valor(d.ph) : null, luz = d ? P.valor(d.luz) : null;
    ponerLectura('temp', 'vTemp', t, 1, 'rTemp', al.includes('dht') ? 'Sin señal del DHT: revisa D2.'
      : c ? `Extractor con ${P.numeroCorto(c.temp_max)} °C · luz térmica con ${P.numeroCorto(c.temp_min)} °C` : 'Del aire, medida por el DHT.');
    ponerLectura('ha', 'vHa', ha, 0, 'rHa', al.includes('dht') ? 'Sin señal del DHT.' : c ? `El extractor ventila desde ${c.hum_aire_max} %` : 'También la mide el DHT.');
    ponerLectura('hs', 'vHs', hs, 0, 'rHs', al.includes('suelo') ? 'Sensor fuera de la tierra o desconectado.'
      : c ? `Riega bajo ${c.suelo_min} % · objetivo ${c.suelo_obj} %` : 'Sensor FC-28 enterrado en la maceta.');
    $('bHs').style.width = (hs == null ? 0 : hs) + '%';
    $('bHsMin').style.left = (c ? c.suelo_min : 0) + '%';
    $('bHsObj').style.left = (c ? c.suelo_obj : 0) + '%';
    $('bHsMin').hidden = $('bHsObj').hidden = !c;
    const phApagado = c && !c.sensor_ph;
    ponerLectura('ph', 'vPh', ph, 1, 'rPh', phApagado ? 'Sensor de pH apagado en Ajustes.' : al.includes('ph_falla') ? 'La sonda no entrega una lectura válida.'
      : c ? `Recomendado: ${P.numeroCorto(c.ph_min)} a ${P.numeroCorto(c.ph_max)}` : 'Sonda de pH en A1.');
    $('tPh').hidden = !(ph != null && c && c.ph_cal !== 3);
    const sinLdr = c && !c.sensor_ldr;
    ponerLectura('luz', 'vLuz', luz, 0, 'rLuz', sinLdr ? 'Sin fotorresistencia (se activa en Ajustes).' : c ? `Luz térmica bajo ${c.luz_min} % de luz` : 'Fotorresistencia en A2 (opcional).');
    $('uLuz').hidden = luz == null;
    G.minilinea($('mTemp'), est.muestras, 'temp', DIEZ_MIN, 2);
    G.minilinea($('mHa'), est.muestras, 'ha', DIEZ_MIN, 10);
    G.minilinea($('mPh'), est.muestras, 'ph', DIEZ_MIN, 0.5);
    G.minilinea($('mLuz'), est.muestras, 'luz', DIEZ_MIN, 10);
  }

  function dibujarSalidas(d) {
    const nombres = { bomba: ['Encendida', 'Apagada'], vent: ['Encendido', 'Apagado'], lamp: ['Encendida', 'Apagada'] };
    for (const [clave, id] of [['bomba', 'eBomba'], ['vent', 'eVent'], ['lamp', 'eLamp']]) {
      const li = document.querySelector(`.salida[data-salida="${clave}"]`);
      const on = d ? !!d[clave] : false;
      li.classList.toggle('encendida', on);
      $(id).textContent = d ? nombres[clave][on ? 0 : 1] : '—';
    }
    const modo = d ? d.modo : null;
    todos('#grupoModo button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === (modo || 'auto'))));
  }

  function dibujarRiego(d, c) {
    if (!d) {
      $('riegoEstado').textContent = $('riegoCiclo').textContent = $('riegoFase').textContent = '—';
      $('bombaHoraTexto').textContent = '—';
      return;
    }
    const manualBomba = d.modo === 'manual' && d.bomba;
    $('riegoEstado').textContent = manualBomba ? 'Bomba a mano' : d.modo === 'manual' ? 'En pausa (manual)' : NOMBRE_RIEGO[d.riego] || '—';
    $('riegoCiclo').textContent = d.riego === 'regando' || d.riego === 'espera' ? `${d.ciclo} de ${c ? c.ciclos : '?'}` : '—';
    $('riegoFase').textContent = manualBomba ? `se apaga en ${d.fase} s` : d.riego === 'regando' ? `bomba ${d.fase} s` : d.riego === 'espera' ? `mide en ${d.fase} s` : '—';
    const max = c ? c.bomba_hora : 120;
    $('bombaHora').max = max;
    $('bombaHora').value = Math.min(max, P.valor(d.bh) || 0);
    $('bombaHora').high = max * 0.8;
    $('bombaHoraTexto').textContent = `${P.valor(d.bh) || 0} de ${max} s`;
  }

  function dibujarAlarmas(d) {
    const lista = $('listaAlarmas');
    const alarmas = d ? P.alarmasOrdenadas(d.al) : [];
    const firma = alarmas.map((a) => a.clave).join(',');
    if (lista.dataset.firma === firma) return;
    lista.dataset.firma = firma;
    lista.textContent = '';
    for (const a of alarmas) {
      const li = document.createElement('li');
      li.className = 'alarma';
      li.dataset.tono = a.tono;
      li.innerHTML = '<svg aria-hidden="true"><use href="#i-alerta"/></svg>';
      if (a.tono === 'info') li.firstChild.firstChild.setAttribute('href', '#i-info');
      const h = document.createElement('h3');
      h.textContent = (a.tono === 'critico' ? 'Falla: ' : a.tono === 'aviso' ? 'Aviso: ' : '') + a.titulo;
      const que = document.createElement('p');
      que.textContent = a.que;
      const hacer = document.createElement('p');
      hacer.className = 'hacer';
      hacer.textContent = a.hacer;
      li.append(h, que, hacer);
      if (a.reiniciar) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-chico btn-borde';
        b.textContent = 'Reiniciar alarma';
        b.addEventListener('click', () => accion('ALARMAS RESET', 'Alarmas reiniciadas.'));
        li.appendChild(b);
      }
      lista.appendChild(li);
    }
    $('sinAlarmas').hidden = alarmas.length > 0;
  }

  function itemEvento(e) {
    const li = document.createElement('li');
    li.className = 'evento';
    if (CODIGOS_FALLA.includes(e.cod)) li.dataset.tipo = 'falla';
    const tm = document.createElement('time');
    tm.dateTime = new Date(e.t).toISOString();
    tm.textContent = P.hora(e.t);
    const sp = document.createElement('span');
    sp.textContent = e.msg;
    li.append(tm, sp);
    return li;
  }

  function dibujarEventos() {
    est.dibujadoEventos = est.versionEventos;
    const lista = $('listaEventos');
    lista.textContent = '';
    for (const e of est.eventos.slice(-8).reverse()) lista.appendChild(itemEvento(e));
    $('sinEventos').hidden = est.eventos.length > 0;
    if (est.pestana === 'graficos') dibujarRegistro();
  }

  function dibujarRegistro() {
    const lista = $('registroEventos');
    lista.textContent = '';
    for (const e of est.eventos.slice(-300).reverse()) lista.appendChild(itemEvento(e));
    $('sinRegistro').hidden = est.eventos.length > 0;
  }

  // ---- Gráficos ---------------------------------------------------------------------------
  function dibujarGraficos(forzar) {
    if (est.pestana !== 'graficos') return;
    const ahora = performance.now();
    if (!forzar && ahora - est.ultimoGrafico < 800) {
      if (!est.graficoPendiente) est.graficoPendiente = setTimeout(() => { est.graficoPendiente = null; dibujarGraficos(true); }, 850);
      return;
    }
    est.ultimoGrafico = ahora;
    const hay = est.muestras.length > 0;
    $('graficosVacio').hidden = hay;
    $('graficos').hidden = !hay;
    if (hay) est.graficos.dibujar(est.muestras, est.config, est.ventana);
    const cuerpo = $('tablaDatos');
    cuerpo.textContent = '';
    for (const m of est.muestras.slice(-60).reverse()) {
      const tr = document.createElement('tr');
      const celdas = [P.hora(m.t), m.temp == null ? '—' : P.numero(m.temp, 1), m.ha == null ? '—' : P.numero(m.ha), m.hs == null ? '—' : P.numero(m.hs),
        m.ph == null ? '—' : P.numero(m.ph, 2), m.luz == null ? '—' : P.numero(m.luz), m.bomba ? 'sí' : 'no', m.vent ? 'sí' : 'no', m.lamp ? 'sí' : 'no'];
      celdas.forEach((x, i) => {
        const td = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) td.scope = 'row';
        td.textContent = x;
        tr.appendChild(td);
      });
      cuerpo.appendChild(tr);
    }
    if (est.dibujadoRegistro !== est.versionEventos) { est.dibujadoRegistro = est.versionEventos; dibujarRegistro(); }
  }

  // ---- Ajustes -----------------------------------------------------------------------------
  function ajustesDesdeConfig() {
    const c = est.config;
    if (!c) return;
    $('formAjustes').hidden = false;
    $('ajustesVacio').hidden = true;
    for (const k of CAMPOS) {
      if (est.sucios.has(k)) continue;
      const inp = $('a-' + k);
      if (inp.type === 'checkbox') inp.checked = !!c[k];
      else inp.value = c[k];
      inp.classList.remove('cambiado');
    }
    dibujarReglas();
  }

  function dibujarReglas() {
    const reglas = P.explicarReglas(est.config);
    for (const [idLista, idVacio] of [['reglas', 'reglasVacio'], ['reglasGuia', 'reglasGuiaVacio']]) {
      const dl = $(idLista);
      dl.textContent = '';
      for (const r of reglas) {
        const dt = document.createElement('dt');
        dt.textContent = r.titulo;
        const dd = document.createElement('dd');
        dd.textContent = r.texto;
        dl.append(dt, dd);
      }
      $(idVacio).hidden = reglas.length > 0;
    }
  }

  function leerFormulario() {
    const v = {};
    for (const k of CAMPOS) {
      const inp = $('a-' + k);
      if (inp.type === 'checkbox') v[k] = inp.checked;
      else v[k] = inp.value === '' || !Number.isFinite(inp.valueAsNumber) ? null : inp.valueAsNumber;
    }
    return v;
  }

  function mostrarErrores(errores) {
    let primero = null;
    for (const k of CAMPOS) {
      const inp = $('a-' + k);
      const e = $('e-' + k);
      if (!e) continue;
      e.textContent = errores[k] || '';
      inp.setAttribute('aria-invalid', errores[k] ? 'true' : 'false');
      if (errores[k] && !primero) primero = inp;
    }
    return primero;
  }

  async function guardarAjustes(ev) {
    ev.preventDefault();
    const res = $('resultadoAjustes');
    const { ordenes, errores } = P.ordenesAjustes(leerFormulario(), est.config);
    const primero = mostrarErrores(errores);
    if (primero) {
      res.dataset.tono = 'error';
      res.textContent = 'Revisa los campos marcados.';
      primero.focus();
      return;
    }
    if (!ordenes.length) {
      res.dataset.tono = '';
      res.textContent = 'No hay cambios que guardar.';
      return;
    }
    $('btnGuardar').disabled = true;
    res.dataset.tono = '';
    res.textContent = 'Guardando…';
    try {
      for (const o of ordenes) {
        const r = await ordenar(o);
        if (r.tipo === 'error') { res.dataset.tono = 'error'; res.textContent = `El Arduino no aceptó «${o}»: ${r.msg.msg}`; return; }
      }
      est.sucios.clear();
      ajustesDesdeConfig();
      res.dataset.tono = 'ok';
      res.textContent = `Guardado en el Arduino (${ordenes.length === 1 ? '1 cambio' : ordenes.length + ' cambios'}).`;
    } catch (e) {
      res.dataset.tono = 'error';
      res.textContent = e.message;
    } finally {
      $('btnGuardar').disabled = false;
    }
  }

  // ---- Calibrar --------------------------------------------------------------------------
  function estabilidad(lista, umbral) {
    if (lista.length < 4) return { estable: false, texto: 'midiendo…' };
    const r = P.rango(lista.slice(-4));
    return r <= umbral ? { estable: true, texto: 'estable' } : { estable: false, texto: 'todavía cambia' };
  }

  function dibujarCalibrar(d, c) {
    const hay = !!(c && est.con);
    $('calibrarContenido').hidden = !hay;
    $('calibrarVacio').hidden = hay;
    if (!hay) return;
    const hsc = d ? P.valor(d.hsc) : null;
    $('calSueloCrudo').textContent = hsc == null ? '—' : String(hsc);
    const es = estabilidad(est.recientesHsc, 8);
    $('calSueloEstable').textContent = es.texto;
    $('calSueloEstable').dataset.estable = es.estable ? 'si' : 'no';
    $('calSueloPct').textContent = hsc == null ? '—' : (M.sueloValido(hsc) ? `${M.porcentajeSuelo(hsc, c.suelo_seco, c.suelo_mojado)} %` : 'fuera de rango');
    $('calSeco').textContent = String(c.suelo_seco);
    $('calMojado').textContent = String(c.suelo_mojado);
    const mv = d ? P.valor(d.phmv) : null;
    $('calPhMv').textContent = !c.sensor_ph ? 'apagado' : mv == null ? '—' : `${mv} mV`;
    const ep = estabilidad(est.recientesMv, 6);
    $('calPhEstable').textContent = !c.sensor_ph ? 'sensor apagado' : ep.texto;
    $('calPhEstable').dataset.estable = ep.estable && c.sensor_ph ? 'si' : 'no';
    const a = Array.isArray(c.ph_a) ? c.ph_a : [7, 2500], b = Array.isArray(c.ph_b) ? c.ph_b : [4, 3030];
    $('calPhValor').textContent = mv == null || !c.sensor_ph ? '—' : P.numero(M.ph100Desde(mv, a[1], Math.round(a[0] * 100), b[1], Math.round(b[0] * 100)) / 100, 2);
    $('calPhEstado').textContent = c.ph_cal === 3 ? `calibrado con pH ${P.numeroCorto(a[0])} y pH ${P.numeroCorto(b[0])}` : c.ph_cal === 1 ? 'falta el segundo punto' : c.ph_cal === 2 ? 'falta el punto pH 7' : 'sin calibrar (valores de fábrica)';
    $('calPhA').textContent = c.ph_cal & 1 ? `${a[1]} mV` : 'no';
    $('calPhB').textContent = c.ph_cal & 2 ? `pH ${P.numeroCorto(b[0])} en ${b[1]} mV` : 'no';
  }

  async function calibrar(orden, idResultado) {
    const res = $(idResultado);
    res.dataset.tono = '';
    res.textContent = 'Midiendo…';
    try {
      const r = await ordenar(orden);
      res.dataset.tono = r.tipo === 'ok' ? 'ok' : 'error';
      res.textContent = r.msg.msg;
    } catch (e) {
      res.dataset.tono = 'error';
      res.textContent = e.message;
    }
  }

  // ---- Consola -----------------------------------------------------------------------------
  function agregarConsola(dir, texto, t, r) {
    est.consola.push(`${P.fechaHora(t)} ${dir === 'salida' ? '>' : '<'} ${texto}`);
    if (est.consola.length > MAX_CONSOLA) est.consola.splice(0, est.consola.length - MAX_CONSOLA);
    const lista = $('consola');
    const abajo = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 40;
    const li = document.createElement('li');
    if (dir === 'salida') li.className = 'salida-c';
    else if (r && r.clase === 'mensaje') li.className = r.msg.tipo === 'datos' ? 'es-datos' : r.msg.tipo === 'error' ? 'err' : r.msg.tipo === 'ok' ? 'ok-c' : '';
    else if (r) li.className = r.clase;
    const tm = document.createElement('time');
    tm.textContent = P.hora(t);
    const flecha = document.createElement('span');
    flecha.className = 'dir';
    flecha.textContent = dir === 'salida' ? '→' : '←';
    flecha.title = dir === 'salida' ? 'enviado al Arduino' : 'recibido del Arduino';
    const tx = document.createElement('span');
    tx.className = 'texto';
    tx.textContent = texto;
    li.append(tm, flecha, tx);
    lista.appendChild(li);
    while (lista.children.length > MAX_CONSOLA_DOM) lista.firstChild.remove();
    if (abajo) lista.scrollTop = lista.scrollHeight;
  }

  // ---- Simulación ----------------------------------------------------------------------------
  function actualizarSimulacion(forzar) {
    const con = est.con;
    if (!con || con.tipo !== 'simulacion' || !con.placa) return;
    const ahora = performance.now();
    if (!forzar && ahora - est.ultimaSim < 100) return;
    est.ultimaSim = ahora;
    const placa = con.placa, modelo = con.modelo;
    const filas = placa.lcdFilas.map((f) => (f || '').replace(/\xdf/g, '°').padEnd(16, ' '));
    $('lcd0').textContent = filas[0];
    $('lcd1').textContent = filas[1];
    $('lcdVirtual').setAttribute('aria-label', `Pantalla LCD virtual: ${filas[0].trim()} / ${filas[1].trim()}`);
    const reles = placa.reles();
    const textos = { bomba: ['encendida', 'apagada'], vent: ['encendido', 'apagado'], lampara: ['encendida', 'apagada'] };
    for (const k of ['bomba', 'vent', 'lampara']) {
      const li = document.querySelector(`.sim-reles li[data-rele="${k}"]`);
      li.classList.toggle('encendido', reles[k]);
      li.querySelector('b').textContent = textos[k][reles[k] ? 0 : 1];
    }
    $('simHora').textContent = P.hora(con.ahora());
    $('simResumen').textContent = `${P.hora(con.ahora())} · ×${con.velocidad}`;
    $('simEstanque').value = modelo.estanque;
    $('simEstanqueTexto').textContent = `${P.numero(modelo.estanque)} ml`;
    if (modelo.bombaEnSeco) est.secoHasta = ahora + 2500;
    $('simSeco').hidden = ahora > est.secoHasta;
  }

  function reflejarControlesSimulacion() {
    const con = est.con;
    if (!con || con.tipo !== 'simulacion') return;
    const m = con.modelo;
    todos('[data-velocidad]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.velocidad) === con.velocidad)));
    todos('[data-escenario]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.escenario === m.escenario)));
    $('simAcida').setAttribute('aria-pressed', String(m.phBase < 6));
    $('simDht').setAttribute('aria-pressed', String(m.dhtFalla));
    $('simDht').textContent = m.dhtFalla ? 'Reconectar el DHT' : 'Desconectar el DHT';
    $('simSuelo').value = m.sensorSuelo;
    $('simSonda').value = m.sondaPh;
  }

  function enSimulacion(fn) {
    return () => {
      const con = est.con;
      if (!con || con.tipo !== 'simulacion') return;
      fn(con.modelo, con);
      reflejarControlesSimulacion();
      actualizarSimulacion(true);
    };
  }

  // ---- Pestañas ------------------------------------------------------------------------------
  const PESTANAS = ['tablero', 'graficos', 'ajustes', 'calibrar', 'consola', 'guia'];

  function irA(nombre, enfocar) {
    if (!PESTANAS.includes(nombre)) nombre = 'tablero';
    est.pestana = nombre;
    for (const p of PESTANAS) {
      const tab = $('tab-' + p);
      const activo = p === nombre;
      tab.setAttribute('aria-selected', String(activo));
      tab.tabIndex = activo ? 0 : -1;
      $('panel-' + p).hidden = !activo;
    }
    if (enfocar) $('tab-' + nombre).focus();
    try { history.replaceState(null, '', '#' + nombre); } catch (e) { /* file:// sin historial */ }
    if (nombre === 'graficos') dibujarGraficos(true);
    pedirDibujo();
  }

  function iniciarPestanas() {
    const lista = $('listaPestanas');
    lista.addEventListener('click', (ev) => {
      const b = ev.target.closest('[role="tab"]');
      if (b) irA(b.id.replace('tab-', ''));
    });
    lista.addEventListener('keydown', (ev) => {
      const i = PESTANAS.indexOf(est.pestana);
      let j = null;
      if (ev.key === 'ArrowRight') j = (i + 1) % PESTANAS.length;
      else if (ev.key === 'ArrowLeft') j = (i - 1 + PESTANAS.length) % PESTANAS.length;
      else if (ev.key === 'Home') j = 0;
      else if (ev.key === 'End') j = PESTANAS.length - 1;
      if (j == null) return;
      ev.preventDefault();
      irA(PESTANAS[j], true);
    });
    document.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-ir]');
      if (!a) return;
      ev.preventDefault();
      irA(a.dataset.ir);
      const destino = a.getAttribute('href') && document.querySelector(a.getAttribute('href'));
      if (destino) setTimeout(() => destino.scrollIntoView({ block: 'start' }), 30);
    });
  }

  // ---- Presentar proyecto (guía de 3 pasos para el stand) -----------------------------------
  const PASOS_FERIA = [
    ['tablero', 'Muestra lo que mide', 'En el Tablero están las lecturas en vivo. Cuenta que el Arduino mide cada segundo y decide solo: el computador solo mira y da órdenes.'],
    ['tablero', 'Provoca una decisión', 'Presiona «Regar ahora» y muestra cómo se apaga sola. O sopla suave y de cerca sobre el DHT: la humedad del aire sube y, si pasa del máximo, parte el extractor. Pruébenlo antes de la feria.'],
    ['graficos', 'Muestra la historia y la seguridad', 'En Gráficos se ve cómo sube la humedad del suelo con cada pulso de bomba. Explica qué pasa si el estanque está vacío: la alarma «riego sin efecto» detiene la bomba.'],
  ];

  function iniciarFeria() {
    const dlg = $('feria-dialog');
    $('feria-launch').addEventListener('click', () => dlg.showModal());
    $('feria-close').addEventListener('click', () => dlg.close());
    PASOS_FERIA.forEach((paso, i) => {
      const fila = document.createElement('div');
      fila.className = 'feria-step';
      const num = document.createElement('b');
      num.textContent = String(i + 1).padStart(2, '0');
      const caja = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = paso[1];
      const p = document.createElement('p');
      p.textContent = paso[2];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'feria-go';
      b.textContent = 'Ir a la herramienta →';
      b.addEventListener('click', () => { dlg.close(); irA(paso[0], true); });
      caja.append(h, p, b);
      fila.append(num, caja);
      $('feria-steps').appendChild(fila);
    });
    $('feria-font').addEventListener('click', function () {
      const grande = document.documentElement.classList.toggle('feria-large');
      this.setAttribute('aria-pressed', String(grande));
    });
    $('feria-check').addEventListener('click', () => {
      const r = MOSK.correrPruebas();
      $('feria-result').textContent = r.fallas ? `${r.fallas} de ${r.total} pruebas fallaron. Revisa la lista al final de la página.` : `${r.total} de ${r.total} pruebas correctas: el motor responde igual que el programa del Arduino.`;
      mostrarPruebas(r);
    });
  }

  // ---- Verificar el motor --------------------------------------------------------------------
  function mostrarPruebas(r) {
    const sec = $('seccionPruebas');
    sec.hidden = false;
    $('resumenPruebas').textContent = r.fallas ? `${r.total - r.fallas} de ${r.total} pruebas correctas. Revisa las marcadas.` : `${r.total} de ${r.total} pruebas correctas.`;
    $('resumenPruebas').dataset.ok = r.fallas ? 'no' : 'si';
    const lista = $('listaPruebas');
    lista.textContent = '';
    for (const p of r.resultados) {
      const li = document.createElement('li');
      li.dataset.ok = p.ok ? 'si' : 'no';
      li.textContent = (p.ok ? '✓ ' : '✗ ') + p.nombre + (p.ok || !p.detalle ? '' : ` — ${p.detalle}`);
      lista.appendChild(li);
    }
  }

  // ---- Arranque ---------------------------------------------------------------------------------
  function iniciar() {
    est.graficos = new G.Graficos($('graficos'), $('tip'));
    iniciarPestanas();
    iniciarFeria();

    if (!serieDisponible) {
      $('avisoNavegador').hidden = false;
      if (window.self !== window.top) $('textoAvisoNavegador').textContent = 'Dentro de esta página no se puede usar el puerto USB. Abre el archivo PanelInvernadero.html directamente en Chrome o Edge para conectar el Arduino. La simulación sí funciona aquí.';
    }

    $('btnConectar').addEventListener('click', () => conectarSerie());
    if (serieDisponible) {
      // Si se soltó el cable y se vuelve a enchufar, el panel se reconecta solo
      navigator.serial.addEventListener('connect', (ev) => {
        const puerto = ev.port || ev.target;
        revisarPuertoRecordado();
        if (est.fase === 'perdida' && puerto && puerto !== navigator.serial) {
          avisar('Se volvió a enchufar el Arduino: reconectando…');
          conectarSerie(puerto);
        }
      });
    }
    $('btnReconectar').addEventListener('click', () => conectarSerie(est.puertoRecordado));
    $('btnSimular').addEventListener('click', conectarSimulacion);
    $('btnDesconectar').addEventListener('click', desconectar);

    // Tablero
    todos('#grupoModo button').forEach((b) => b.addEventListener('click', () => accion(b.dataset.modo === 'auto' ? 'MODO AUTO' : 'MODO MANUAL')));
    $('btnRegar').addEventListener('click', () => accion(`REGAR ${$('segRegar').value}`));
    $('btnBombaOff').addEventListener('click', () => accion('BOMBA OFF'));
    todos('.salida [data-orden]').forEach((b) => b.addEventListener('click', () => accion(b.dataset.orden)));

    // Gráficos
    todos('#grupoVentana button').forEach((b) => b.addEventListener('click', () => {
      est.ventana = Number(b.dataset.ventana);
      todos('#grupoVentana button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      dibujarGraficos(true);
    }));
    $('btnCsvDatos').addEventListener('click', () => {
      if (!est.muestras.length) { avisar('Todavía no hay datos para descargar.'); return; }
      descargar(`invernadero-datos-${marcaArchivo()}.csv`, P.csvMuestras(est.muestras), 'text/csv;charset=utf-8');
    });
    $('btnCsvEventos').addEventListener('click', () => {
      if (!est.eventos.length) { avisar('Todavía no hay eventos para descargar.'); return; }
      descargar(`invernadero-eventos-${marcaArchivo()}.csv`, P.csvEventos(est.eventos), 'text/csv;charset=utf-8');
    });
    if ('ResizeObserver' in window) {
      let ancho = 0;
      new ResizeObserver((entradas) => {
        const w = Math.round(entradas[0].contentRect.width);
        if (w && w !== ancho) { ancho = w; dibujarGraficos(true); }
      }).observe($('graficos'));
    }

    // Ajustes
    $('formAjustes').addEventListener('submit', guardarAjustes);
    $('formAjustes').addEventListener('input', (ev) => {
      const k = ev.target.name;
      if (!k || !est.config) return;
      est.sucios.add(k);
      const inp = ev.target;
      const cambiado = inp.type === 'checkbox' ? inp.checked !== !!est.config[k] : Number(inp.value) !== est.config[k];
      inp.classList.toggle('cambiado', cambiado);
      if ($('e-' + k)) { $('e-' + k).textContent = ''; inp.setAttribute('aria-invalid', 'false'); }
    });
    $('btnDeshacer').addEventListener('click', () => {
      est.sucios.clear();
      mostrarErrores({});
      ajustesDesdeConfig();
      $('resultadoAjustes').textContent = 'Se volvió a los valores del Arduino.';
      $('resultadoAjustes').dataset.tono = '';
    });
    $('btnFabrica').addEventListener('click', async () => {
      if (!(await confirmar('Se restauran los ajustes de fábrica y se borra la calibración del suelo y del pH. Habrá que volver a calibrar.', 'Restaurar'))) return;
      est.sucios.clear();
      accion('FABRICA', 'Valores de fábrica restaurados. Hay que volver a calibrar.');
    });

    // Calibrar
    todos('[data-cal]').forEach((b) => b.addEventListener('click', () => calibrar(b.dataset.cal, b.dataset.cal.includes('SUELO') ? 'resCalSuelo' : 'resCalPh')));

    // Consola
    const historial = [];
    let posHistorial = 0;
    $('formConsola').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const inp = $('ordenConsola');
      const texto = inp.value.trim();
      if (!texto) return;
      historial.push(texto);
      posHistorial = historial.length;
      inp.value = '';
      ordenar(texto).catch((e) => avisar(e.message, 'error'));
    });
    $('ordenConsola').addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
      ev.preventDefault();
      posHistorial = Math.max(0, Math.min(historial.length, posHistorial + (ev.key === 'ArrowUp' ? -1 : 1)));
      ev.target.value = historial[posHistorial] || '';
    });
    todos('[data-consola]').forEach((b) => b.addEventListener('click', () => ordenar(b.dataset.consola).catch((e) => avisar(e.message, 'error'))));
    $('ocultarDatos').addEventListener('change', (ev) => $('consola').classList.toggle('oculta-datos', ev.target.checked));
    $('btnLimpiarConsola').addEventListener('click', () => { $('consola').textContent = ''; est.consola = []; });
    $('btnDescargarConsola').addEventListener('click', () => descargar(`invernadero-consola-${marcaArchivo()}.txt`, est.consola.join('\r\n') + '\r\n', 'text/plain;charset=utf-8'));

    // Simulación
    todos('[data-velocidad]').forEach((b) => b.addEventListener('click', enSimulacion((m, con) => { con.velocidad = Number(b.dataset.velocidad); })));
    todos('[data-escenario]').forEach((b) => b.addEventListener('click', enSimulacion((m) => m.aplicarEscenario(b.dataset.escenario))));
    $('simSecar').addEventListener('click', enSimulacion((m) => m.secarTierra()));
    $('simVaciar').addEventListener('click', enSimulacion((m) => m.vaciarEstanque()));
    $('simRellenar').addEventListener('click', enSimulacion((m) => m.rellenarEstanque()));
    $('simAcida').addEventListener('click', enSimulacion((m) => m.tierraAcida(!(m.phBase < 6))));
    $('simDht').addEventListener('click', enSimulacion((m) => { m.dhtFalla = !m.dhtFalla; }));
    $('simSuelo').addEventListener('change', enSimulacion((m) => { m.sensorSuelo = $('simSuelo').value; }));
    $('simSonda').addEventListener('change', enSimulacion((m) => { m.sondaPh = $('simSonda').value; }));
    $('simBoton').addEventListener('click', enSimulacion((m, con) => con.presionarBoton()));
    $('simNormal').addEventListener('click', enSimulacion((m) => m.normal()));

    $('btnPruebas').addEventListener('click', () => { mostrarPruebas(MOSK.correrPruebas()); $('seccionPruebas').scrollIntoView(); });

    const alto = () => document.documentElement.style.setProperty('--alto-barra', document.querySelector('.barra').offsetHeight + 'px');
    alto();
    window.addEventListener('resize', alto);

    const inicial = (location.hash || '').replace('#', '');
    irA(PESTANAS.includes(inicial) ? inicial : 'tablero');
    fijarFase('libre');
    revisarPuertoRecordado();
    if (/[?&]pruebas=1/.test(location.search)) { mostrarPruebas(MOSK.correrPruebas()); $('seccionPruebas').scrollIntoView(); }
    if (/[?&]simular=1/.test(location.search)) conectarSimulacion();
  }

  MOSK.panel = { estado: est, ordenar, irA };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
