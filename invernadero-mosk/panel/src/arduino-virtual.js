// =====================================================================
//  arduino-virtual.js — Copia en JavaScript de InvernaderoMOSK.ino.
//
//  Es un Arduino UNO de mentira para el modo simulación del panel y para
//  las pruebas: recibe y envía bytes por un «puerto serie», escribe los
//  pines de los relés, la pantalla LCD y una EEPROM de 1024 bytes.
//  Debe responder byte a byte igual que el programa real; las pruebas
//  (pruebas/probar_arduino.py --paridad) lo comparan con el código C++.
//
//  hw = {
//    tipoDht: 'DHT11' | 'DHT22',
//    direccionLcd: 0x27 | 0x3F | 0,        // 0: sin pantalla
//    eeprom: Uint8Array(1024),             // se conserva entre reinicios
//    analogRead(pin, placa) -> 0..1023,
//    leerHumedad(placa), leerTemperatura(placa) -> número o NaN,
//    alEscribirEeprom()                    // opcional
//  }
// =====================================================================
(function () {
  'use strict';
  const MOSK = (globalThis.MOSK = globalThis.MOSK || {});
  const M = MOSK.medicion;
  const { Controlador, ajustesVacios, ajustesDeFabrica, AL, EV, BOMBA_MANUAL_MAX_SEG,
    RIEGO_REPOSO, RIEGO_REGANDO, RIEGO_ESPERA, RIEGO_BLOQUEADO } = MOSK.logica;

  const VERSION_PROGRAMA = '1.0';
  const HIGH = 1, LOW = 0, OUTPUT = 1, INPUT_PULLUP = 2;
  const A0 = 14, A1 = 15, A2 = 16;
  const PIN = { DHT: 2, BOTON: 3, SUELO_VCC: 4, BOMBA: 7, VENT: 8, LAMPARA: 9, SUELO: A0, PH: A1, LDR: A2 };
  const RELE_ACTIVO_EN_BAJO = true;
  const USA_BOTON = true;

  const MARCA_MEMORIA = 0x4b4d;
  const VERSION_MEMORIA = 1;
  const TAM_GUARDADO = 37;          // sizeof(Guardado) en el AVR (sin relleno)
  const POS_SUMA = 36;              // offsetof(Guardado, suma)

  const u32 = (x) => x >>> 0;
  const codificador = new TextEncoder();

  // --- EEPROM con el mismo orden de bytes que el Arduino UNO ---------------
  function guardadoABytes(g) {
    const b = new Uint8Array(TAM_GUARDADO);
    const d = new DataView(b.buffer);
    const a = g.aj;
    d.setUint16(0, g.marca, true);
    b[2] = g.version;
    b[3] = a.sueloMin; b[4] = a.sueloObjetivo;
    d.setInt16(5, a.tempMax10, true); d.setInt16(7, a.tempMin10, true);
    b[9] = a.humAireMax; b[10] = a.luzMin; b[11] = a.pulsoSeg;
    d.setUint16(12, a.esperaSeg, true);
    b[14] = a.maxCiclos;
    d.setUint16(15, a.bombaHoraSeg, true);
    d.setInt16(17, a.phMin100, true); d.setInt16(19, a.phMax100, true);
    b[21] = a.phActivo ? 1 : 0; b[22] = a.ldrActivo ? 1 : 0;
    d.setInt16(23, g.sueloSeco, true); d.setInt16(25, g.sueloMojado, true);
    d.setInt16(27, g.phMvA, true); d.setInt16(29, g.phMvB, true);
    d.setInt16(31, g.ph100A, true); d.setInt16(33, g.ph100B, true);
    b[35] = g.phCalibrado;
    b[36] = g.suma;
    return b;
  }

  function bytesAGuardado(b) {
    const d = new DataView(b.buffer, b.byteOffset, TAM_GUARDADO);
    return {
      marca: d.getUint16(0, true),
      version: b[2],
      aj: {
        sueloMin: b[3], sueloObjetivo: b[4], tempMax10: d.getInt16(5, true), tempMin10: d.getInt16(7, true),
        humAireMax: b[9], luzMin: b[10], pulsoSeg: b[11], esperaSeg: d.getUint16(12, true), maxCiclos: b[14],
        bombaHoraSeg: d.getUint16(15, true), phMin100: d.getInt16(17, true), phMax100: d.getInt16(19, true),
        phActivo: b[21] !== 0, ldrActivo: b[22] !== 0,
      },
      sueloSeco: d.getInt16(23, true), sueloMojado: d.getInt16(25, true),
      phMvA: d.getInt16(27, true), phMvB: d.getInt16(29, true),
      ph100A: d.getInt16(31, true), ph100B: d.getInt16(33, true),
      phCalibrado: b[35],
      suma: b[36],
    };
  }

  function sumaDeBytes(b) {
    let s = 0x5a;
    for (let i = 0; i < POS_SUMA; i++) s = (s * 31 + b[i]) & 0xff;
    return s;
  }

  function crearArduino(hw) {
    const tipoDht = hw.tipoDht === 'DHT22' ? 'DHT22' : 'DHT11';
    const eeprom = hw.eeprom || new Uint8Array(1024).fill(0xff);

    // ---- Placa: reloj, pines, puerto serie y pantalla --------------------
    const placa = {
      ms: 0,
      pin: new Array(20).fill(-1),
      modo: new Array(20).fill(-1),
      entrada: [],                   // bytes que llegan desde el computador
      salida: [],                    // bytes que el Arduino envía
      eeprom,
      escriturasEeprom: 0,
      lcdFilas: ['', ''],            // como sim_lcd del banco: vacío si no hay pantalla
      lcdPresente: false,
    };

    const millis = () => u32(placa.ms);
    const delay = (ms) => { placa.ms += ms; };
    const pinMode = (p, m) => {
      placa.modo[p] = m;
      if (m === INPUT_PULLUP && placa.pin[p] < 0) placa.pin[p] = HIGH;
    };
    const digitalWrite = (p, v) => { placa.pin[p] = v ? HIGH : LOW; };
    const digitalRead = (p) => (placa.pin[p] < 0 ? LOW : placa.pin[p]);
    const analogRead = (p) => (hw.analogRead ? hw.analogRead(p, placa) : 0);

    // Serial.print de texto (UTF-8, como las cadenas del .ino) y de números
    function pr(x) {
      if (typeof x === 'number') x = String(x);
      for (let i = 0; i < x.length; i++) {
        const c = x.charCodeAt(i);
        if (c < 128) placa.salida.push(c);
        else { const bytes = codificador.encode(x[i]); for (const by of bytes) placa.salida.push(by); }
      }
    }
    const prln = (x) => { if (x !== undefined) pr(x); pr('\r\n'); };

    // ---- Estado global del programa ----------------------------------------
    let lcdDireccion = 0;
    const ctrl = new Controlador();
    let mem = { marca: 0, version: 0, aj: ajustesVacios(), sueloSeco: 0, sueloMojado: 0, phMvA: 0, phMvB: 0,
      ph100A: 0, ph100B: 0, phCalibrado: 0, suma: 0 };
    const lec = { dhtOk: false, temp10: 0, humAire: 0, sueloOk: false, sueloPct: 0, phCalibrado: false,
      phOk: false, ph100: 0, ldrOk: false, luzPct: 0 };

    let temp10 = 0, humAire = 0, dhtLeido = false, fallasDht = 0;
    let sueloCrudo = 0, luzCrudo = 0;
    const muestrasPh = new Array(10).fill(0);
    let cantidadPh = 0, indicePh = 0, phMv = 0;

    let tSuelo = 0, tDht = 0, tPh = 0, tCtrl = 0, tDatos = 0, tLcd = 0, tPantalla = 0, tBoton = 0;
    let pantalla = 0;
    let botonAnterior = true;

    let linea = '';
    let largoLinea = 0;
    let lineaLarga = false;

    // ---- Relés --------------------------------------------------------------
    function escribirRele(pin, encendido) {
      digitalWrite(pin, encendido !== RELE_ACTIVO_EN_BAJO ? HIGH : LOW);
    }
    function aplicarSalidas() {
      escribirRele(PIN.BOMBA, ctrl.sal.bomba);
      escribirRele(PIN.VENT, ctrl.sal.vent);
      escribirRele(PIN.LAMPARA, ctrl.sal.lampara);
    }

    // ---- EEPROM -------------------------------------------------------------
    const copiaAjustes = (a) => Object.assign({}, a);

    function valoresDeFabrica() {
      mem = { marca: MARCA_MEMORIA, version: VERSION_MEMORIA, aj: ajustesDeFabrica(ajustesVacios()),
        sueloSeco: 1000, sueloMojado: 350, phMvA: 2500, ph100A: 700, phMvB: 3030, ph100B: 400,
        phCalibrado: 0, suma: 0 };
    }

    function guardarMemoria() {
      mem.aj = copiaAjustes(ctrl.aj);
      const b = guardadoABytes(mem);
      mem.suma = sumaDeBytes(b);
      b[POS_SUMA] = mem.suma;
      let cambios = 0;
      for (let i = 0; i < TAM_GUARDADO; i++) {
        if (eeprom[i] !== b[i]) { eeprom[i] = b[i]; cambios++; }
      }
      placa.escriturasEeprom += cambios;
      if (cambios && hw.alEscribirEeprom) hw.alEscribirEeprom();
    }

    function cargarMemoria() {
      const crudo = eeprom.slice(0, TAM_GUARDADO);
      mem = bytesAGuardado(crudo);
      if (mem.marca !== MARCA_MEMORIA || mem.version !== VERSION_MEMORIA || mem.suma !== sumaDeBytes(crudo)) {
        valoresDeFabrica();
        ctrl.aj = copiaAjustes(mem.aj);
        guardarMemoria();
      }
      ctrl.aj = copiaAjustes(mem.aj);
    }

    // ---- Pantalla LCD 16x2 ----------------------------------------------------
    function escribirFila(fila, texto) {
      if (!placa.lcdPresente) return;
      placa.lcdFilas[fila] = (texto + ' '.repeat(16)).slice(0, 16);
    }

    function iniciarLcd() {
      const direcciones = [0x27, 0x3f];
      for (let i = 0; i < 2 && !lcdDireccion; i++) {
        if (hw.direccionLcd && direcciones[i] === hw.direccionLcd) lcdDireccion = direcciones[i];
      }
      if (!lcdDireccion) return;
      placa.lcdPresente = true;
      placa.lcdFilas = [' '.repeat(16), ' '.repeat(16)];
      escribirFila(0, 'MOS-K Green Tech');
      escribirFila(1, 'Invernadero ' + VERSION_PROGRAMA);
    }

    class Fila {
      constructor() { this.b = ''; }
      c(ch) { if (this.b.length < 16) this.b += ch; }
      t(s) { for (const ch of s) this.c(ch); }
      num(v) { this.t(String(v)); }
      dec(v, d) {
        if (v < 0) { this.c('-'); v = -v; }
        const div = d === 2 ? 100 : 10;
        this.num(Math.trunc(v / div));
        this.c('.');
        const f = v % div;
        if (d === 2 && f < 10) this.c('0');
        this.num(f);
      }
    }

    function textoAlarma(a) {
      if (a & AL.SIN_EFECTO) return 'Revisa estanque';
      if (a & AL.LIMITE_BOMBA) return 'Tope bomba/hora';
      if (a & AL.DHT) return 'DHT sin senal';
      if (a & AL.SUELO) return 'Sensor suelo?';
      if (a & AL.TEMP_ALTA) return 'Temp. muy alta';
      if (a & AL.TEMP_BAJA) return 'Temp. muy baja';
      if (a & AL.PH_FALLA) return 'Sonda pH falla';
      if (a & AL.PH_FUERA) return 'pH fuera rango';
      if (a & AL.PH_SIN_CALIBRAR) return 'pH sin calibrar';
      return '';
    }

    function mostrarLcd(ahora) {
      if (!placa.lcdPresente) return;
      if (iniciando(ahora)) {
        escribirFila(0, 'Iniciando...');
        escribirFila(1, 'Leyendo sensores');
        pantalla = 0;
        tPantalla = ahora;
        return;
      }
      const hayRiego = (!ctrl.manual && (ctrl.riego === RIEGO_REGANDO || ctrl.riego === RIEGO_ESPERA)) ||
        (ctrl.manual && ctrl.sal.bomba);
      const hayAlarma = ctrl.alarmas !== 0;
      if (u32(ahora - tPantalla) >= 3000) {
        tPantalla = ahora;
        for (let i = 0; i < 4; i++) {
          pantalla = (pantalla + 1) % 4;
          if (pantalla === 2 && !hayRiego) continue;
          if (pantalla === 3 && !hayAlarma) continue;
          break;
        }
      }
      if ((pantalla === 2 && !hayRiego) || (pantalla === 3 && !hayAlarma)) pantalla = 0;

      const f1 = new Fila(), f2 = new Fila();
      if (pantalla === 0) {
        f1.t('T:');
        if (lec.dhtOk) { f1.dec(lec.temp10, 1); f1.c(String.fromCharCode(223)); f1.c('C'); } else f1.t('--');
        f1.t(' HA:');
        if (lec.dhtOk) { f1.num(lec.humAire); f1.c('%'); } else f1.t('--');
        f2.t('Suelo ');
        if (lec.sueloOk) { f2.num(lec.sueloPct); f2.c('%'); } else f2.t('--');
        if (ctrl.aj.phActivo) {
          f2.t(' pH');
          if (lec.phOk) { f2.dec(Math.trunc((lec.ph100 + 5) / 10), 1); if (!lec.phCalibrado) f2.c('?'); } else f2.t('--');
        }
      } else if (pantalla === 1) {
        f1.t('Bomba '); f1.t(ctrl.sal.bomba ? 'ON ' : 'OFF');
        f1.t(ctrl.manual ? ' MANUAL' : '  AUTO');
        f2.t('Ext '); f2.t(ctrl.sal.vent ? 'ON ' : 'OFF');
        f2.t(' Luz '); f2.t(ctrl.sal.lampara ? 'ON' : 'OFF');
      } else if (pantalla === 2) {
        const resta = ctrl.segundosRestantesFase(ahora);
        if (ctrl.manual) { f1.t('Bomba manual'); f2.t('Faltan '); }
        else if (ctrl.riego === RIEGO_REGANDO) { f1.t('Regando ciclo '); f1.num(ctrl.ciclo); f2.t('Faltan '); }
        else { f1.t('Absorbiendo agua'); f2.t('Mide en '); }
        f2.num(resta); f2.t(' s');
      } else {
        f1.t('! ALARMA');
        f2.t(textoAlarma(ctrl.alarmas));
      }
      escribirFila(0, f1.b);
      escribirFila(1, f2.b);
    }

    // ---- Sensores -------------------------------------------------------------
    function leerSuelo() {
      digitalWrite(PIN.SUELO_VCC, HIGH);
      delay(10);
      const m = [];
      for (let i = 0; i < 5; i++) m[i] = analogRead(PIN.SUELO);
      digitalWrite(PIN.SUELO_VCC, LOW);
      sueloCrudo = M.medianaDe(m, 5);
      if (ctrl.aj.ldrActivo) luzCrudo = analogRead(PIN.LDR);
    }

    function leerDht() {
      const h = hw.leerHumedad ? hw.leerHumedad(placa) : NaN;
      const t = hw.leerTemperatura ? hw.leerTemperatura(placa) : NaN;
      if (Number.isNaN(h) || Number.isNaN(t)) {
        if (fallasDht < 255) fallasDht++;
        return;
      }
      fallasDht = 0;
      dhtLeido = true;
      const f = Math.fround;                         // el Arduino calcula en float de 32 bits
      temp10 = Math.trunc(f(f(f(t) * 10) + (t >= 0 ? 0.5 : -0.5)));
      humAire = Math.trunc(f(f(h) + 0.5)) & 0xff;
    }

    function muestrearPh() {
      muestrasPh[indicePh] = analogRead(PIN.PH);
      indicePh = (indicePh + 1) % 10;
      if (cantidadPh < 10) cantidadPh++;
      if (cantidadPh === 10) phMv = M.milivoltiosDe(M.medianaDe(muestrasPh, 10));
    }

    const phListo = () => cantidadPh === 10;

    function iniciando(ahora) {
      return ahora < 3000 || (!dhtLeido && fallasDht < 3);
    }

    function armarLecturas() {
      lec.dhtOk = dhtLeido && fallasDht < 3;
      lec.temp10 = temp10;
      lec.humAire = humAire;
      lec.sueloOk = M.sueloValido(sueloCrudo);
      lec.sueloPct = M.porcentajeSuelo(sueloCrudo, mem.sueloSeco, mem.sueloMojado);
      lec.phCalibrado = (mem.phCalibrado & 3) === 3;
      lec.ph100 = M.ph100Desde(phMv, mem.phMvA, mem.ph100A, mem.phMvB, mem.ph100B);
      lec.phOk = ctrl.aj.phActivo && phListo() && M.phValido(phMv, lec.ph100);
      lec.ldrOk = ctrl.aj.ldrActivo;
      lec.luzPct = M.porcentajeLuz(luzCrudo);
    }

    // ---- Botón «Regar ahora» --------------------------------------------------
    function revisarBoton(ahora) {
      const v = digitalRead(PIN.BOTON) === HIGH;
      if (v === botonAnterior || u32(ahora - tBoton) < 50) return;
      tBoton = ahora;
      botonAnterior = v;
      if (v) return;
      pr('{"tipo":"evento","s":');
      pr(Math.floor(ahora / 1000));
      if (ctrl.bombaManual(ahora, 5, true)) {
        prln(',"cod":"boton","msg":"Botón: riego de 5 s."}');
      } else {
        prln(',"cod":"boton","msg":"Botón: no se riega, se alcanzó el tope de bomba de esta hora."}');
      }
      aplicarSalidas();
    }

    // ---- Mensajes al computador ------------------------------------------------
    function imprimirDecimal(valor, decimales) {
      if (valor < 0) { pr('-'); valor = -valor; }
      const div = decimales === 2 ? 100 : decimales === 1 ? 10 : 1;
      pr(Math.trunc(valor / div));
      if (decimales) {
        pr('.');
        const f = valor % div;
        if (decimales === 2 && f < 10) pr('0');
        pr(f);
      }
    }

    const nulo = () => pr('null');

    function enviarHola() {
      pr('{"tipo":"hola","nombre":"MOS-K Green Tech","version":"' + VERSION_PROGRAMA + '","dht":"');
      pr(tipoDht);
      pr('","lcd":');
      if (lcdDireccion) { pr('"0x'); pr(lcdDireccion.toString(16).toUpperCase()); pr('"'); } else nulo();
      pr(',"rele_bajo":');
      pr(RELE_ACTIVO_EN_BAJO ? 1 : 0);
      prln('}');
    }

    function enviarConfig() {
      const a = ctrl.aj;
      pr('{"tipo":"config","suelo_min":'); pr(a.sueloMin);
      pr(',"suelo_obj":'); pr(a.sueloObjetivo);
      pr(',"temp_min":'); imprimirDecimal(a.tempMin10, 1);
      pr(',"temp_max":'); imprimirDecimal(a.tempMax10, 1);
      pr(',"hum_aire_max":'); pr(a.humAireMax);
      pr(',"luz_min":'); pr(a.luzMin);
      pr(',"pulso":'); pr(a.pulsoSeg);
      pr(',"espera":'); pr(a.esperaSeg);
      pr(',"ciclos":'); pr(a.maxCiclos);
      pr(',"bomba_hora":'); pr(a.bombaHoraSeg);
      pr(',"ph_min":'); imprimirDecimal(a.phMin100, 2);
      pr(',"ph_max":'); imprimirDecimal(a.phMax100, 2);
      pr(',"sensor_ph":'); pr(a.phActivo ? 1 : 0);
      pr(',"sensor_ldr":'); pr(a.ldrActivo ? 1 : 0);
      pr(',"suelo_seco":'); pr(mem.sueloSeco);
      pr(',"suelo_mojado":'); pr(mem.sueloMojado);
      pr(',"ph_cal":'); pr(mem.phCalibrado & 3);
      pr(',"ph_a":['); imprimirDecimal(mem.ph100A, 2); pr(','); pr(mem.phMvA);
      pr('],"ph_b":['); imprimirDecimal(mem.ph100B, 2); pr(','); pr(mem.phMvB);
      prln(']}');
    }

    function nombreRiego() {
      switch (ctrl.riego) {
        case RIEGO_REGANDO: return 'regando';
        case RIEGO_ESPERA: return 'espera';
        case RIEGO_BLOQUEADO: return 'bloqueado';
        default: return 'reposo';
      }
    }

    const TABLA_ALARMAS = [
      [AL.DHT, 'dht'], [AL.SUELO, 'suelo'], [AL.SIN_EFECTO, 'riego_sin_efecto'], [AL.LIMITE_BOMBA, 'limite_bomba'],
      [AL.PH_SIN_CALIBRAR, 'ph_sin_calibrar'], [AL.PH_FALLA, 'ph_falla'], [AL.PH_FUERA, 'ph_fuera'],
      [AL.TEMP_ALTA, 'temp_alta'], [AL.TEMP_BAJA, 'temp_baja'],
    ];

    function listarAlarmas(a) {
      let primera = true;
      for (const [bit, nombre] of TABLA_ALARMAS) {
        if (!(a & bit)) continue;
        if (!primera) pr(',');
        primera = false;
        pr('"'); pr(nombre); pr('"');
      }
    }

    function enviarDatos(ahora) {
      const listo = !iniciando(ahora);
      pr('{"tipo":"datos","s":'); pr(Math.floor(ahora / 1000));
      pr(',"ini":'); pr(listo ? 0 : 1);
      pr(',"t":'); if (lec.dhtOk) imprimirDecimal(lec.temp10, 1); else nulo();
      pr(',"ha":'); if (lec.dhtOk) pr(lec.humAire); else nulo();
      pr(',"hs":'); if (lec.sueloOk) pr(lec.sueloPct); else nulo();
      pr(',"hsc":'); pr(sueloCrudo);
      pr(',"ph":'); if (lec.phOk) imprimirDecimal(lec.ph100, 2); else nulo();
      pr(',"phmv":'); if (ctrl.aj.phActivo && phListo()) pr(phMv); else nulo();
      pr(',"luz":'); if (ctrl.aj.ldrActivo) pr(lec.luzPct); else nulo();
      pr(',"bomba":'); pr(ctrl.sal.bomba ? 1 : 0);
      pr(',"vent":'); pr(ctrl.sal.vent ? 1 : 0);
      pr(',"lamp":'); pr(ctrl.sal.lampara ? 1 : 0);
      pr(',"modo":"'); pr(ctrl.manual ? 'manual' : 'auto');
      pr('","riego":"'); pr(nombreRiego());
      pr('","ciclo":'); pr(ctrl.riego === RIEGO_REPOSO ? 0 : ctrl.ciclo);
      pr(',"fase":'); pr(ctrl.segundosRestantesFase(ahora));
      pr(',"bh":'); pr(ctrl.segundosBombaEstaHora());
      pr(',"al":['); listarAlarmas(ctrl.alarmas);
      prln(']}');
    }

    function inicioMensaje(tipo, ahora) {
      pr('{"tipo":"'); pr(tipo); pr('","s":'); pr(Math.floor(ahora / 1000)); pr(',"msg":"');
    }
    const finMensaje = () => prln('"}');
    function error(texto, ahora) {
      inicioMensaje('error', ahora);
      pr(texto);
      finMensaje();
    }

    function enviarEventos(ahora) {
      let e;
      while ((e = ctrl.sacarEvento())) {
        pr('{"tipo":"evento","s":');
        pr(Math.floor(ahora / 1000));
        pr(',"cod":');
        pr(e.codigo);
        pr(',"msg":"');
        switch (e.codigo) {
          case EV.RIEGO_INICIO:
            pr('Riego automático: el suelo está en '); pr(e.a);
            pr(' % y el mínimo es '); pr(e.b); pr(' %.');
            break;
          case EV.RIEGO_PULSO:
            pr('Riego, ciclo '); pr(e.a);
            pr(': el suelo va en '); pr(e.b); pr(' %.');
            break;
          case EV.RIEGO_ESPERA:
            pr('Ciclo '); pr(e.a);
            pr(' listo: se esperan '); pr(e.b); pr(' s para que el agua se absorba.');
            break;
          case EV.RIEGO_LISTO:
            pr('Riego terminado: el suelo llegó a '); pr(e.a);
            pr(' % (objetivo '); pr(e.b); pr(' %).');
            break;
          case EV.RIEGO_CICLOS:
            pr('Riego en pausa tras '); pr(e.b);
            pr(' ciclos: el suelo subió a '); pr(e.a);
            pr(' %. Se volverá a regar si baja del mínimo.');
            break;
          case EV.RIEGO_SIN_EFECTO:
            pr('Alarma: se regó y la humedad no subió (de '); pr(e.a);
            pr(' % a '); pr(e.b);
            pr(' %). Revisa el estanque, la bomba y el sensor. El riego automático queda detenido hasta reiniciar la alarma.');
            break;
          case EV.RIEGO_CORTADO:
            pr('Riego detenido: el sensor de suelo dejó de medir.');
            break;
          case EV.LIMITE_BOMBA:
            pr('Bomba detenida: se usaron '); pr(e.a);
            pr(' s de bomba en esta hora, el máximo permitido.');
            break;
          case EV.VENT_ON:
          case EV.VENT_OFF:
            pr(e.codigo === EV.VENT_ON ? 'Extractor encendido: ' : 'Extractor apagado: ');
            imprimirDecimal(e.a, 1); pr(' °C y '); pr(e.b);
            pr(' % de humedad del aire.');
            break;
          case EV.VENT_SEGURIDAD:
            pr('Extractor encendido por precaución: el sensor de temperatura no responde.');
            break;
          case EV.LAMP_ON:
            pr(e.b ? 'Luz térmica encendida por falta de luz (' : 'Luz térmica encendida: hace frío (');
            imprimirDecimal(e.a, 1); pr(' °C).');
            break;
          case EV.LAMP_OFF:
            pr('Luz térmica apagada ('); imprimirDecimal(e.a, 1); pr(' °C).');
            break;
          case EV.LAMP_SEGURIDAD:
            pr('Luz térmica apagada por seguridad: temperatura alta o sensor sin respuesta.');
            break;
          case EV.FALLA_DHT:
            pr('Falla: el sensor DHT no responde. Revisa el cable de datos en D2.');
            break;
          case EV.DHT_OK:
            pr('El sensor DHT volvió a responder.');
            break;
          case EV.FALLA_SUELO:
            pr('Falla: el sensor de suelo está fuera de la tierra o desconectado (A0). No se regará hasta que vuelva.');
            break;
          case EV.SUELO_OK:
            pr('El sensor de suelo volvió a medir.');
            break;
          case EV.MODO_MANUAL:
            pr('Modo manual: el automático queda en pausa y vuelve solo tras 10 minutos sin órdenes.');
            break;
          case EV.MODO_AUTO:
            pr('Modo automático.');
            break;
          case EV.MANUAL_VENCIDO:
            pr('10 minutos sin órdenes: vuelve el modo automático.');
            break;
          case EV.BOMBA_MANUAL_FIN:
            pr('Bomba apagada tras '); pr(e.a); pr(' s.');
            break;
          case EV.ALARMAS_REINICIADAS:
            pr('Alarmas reiniciadas: el riego automático vuelve a funcionar.');
            break;
          default:
            pr('Evento '); pr(e.codigo);
        }
        prln('"}');
      }
    }

    // ---- Órdenes desde el computador ------------------------------------------
    const es = (a, b) => a != null && a === b;

    function numeroEn(txt, escala, minimo, maximo) {
      const v = M.leerDecimal(txt, escala);
      return v !== null && v >= minimo && v <= maximo ? v : null;
    }

    function ayuda() {
      prln('# MOS-K Green Tech. Ordenes (terminar con Enter, 115200 baudios):');
      prln('# ESTADO | CONFIG | MODO AUTO | MODO MANUAL');
      prln('# REGAR 5 | BOMBA ON 10 | BOMBA OFF | EXTRACTOR ON/OFF | LUZ ON/OFF');
      prln('# SET SUELO 35 55 | SET TEMP 15 28 | SET HUM_AIRE 85 | SET LUZ 30');
      prln('# SET RIEGO 5 60 6 (pulso s, espera s, ciclos) | SET BOMBA_HORA 120 | SET PH 5.5 7.5');
      prln('# SENSOR PH ON/OFF | SENSOR LDR ON/OFF');
      prln('# CAL SUELO SECO | CAL SUELO MOJADO | CAL PH 7 | CAL PH 4 | CAL PH 10');
      prln('# ALARMAS RESET | FABRICA');
    }

    function confirmarAjuste(ahora) {
      guardarMemoria();
      inicioMensaje('ok', ahora);
      pr('Ajuste guardado.');
      finMensaje();
      enviarConfig();
    }

    function ejecutar(texto, ahora) {
      const fin = texto.indexOf('\0');                  // en C la cadena termina en el primer byte 0
      if (fin >= 0) texto = texto.slice(0, fin);
      texto = texto.replace(/[a-z]/g, (c) => c.toUpperCase());
      const tok = texto.split(/[ \t]+/).filter((s) => s.length > 0).slice(0, 6);
      const n = tok.length;
      if (n === 0) return;
      let a, b, c;

      if (es(tok[0], 'AYUDA') || es(tok[0], '?')) { ayuda(); return; }
      if (es(tok[0], 'ESTADO')) { enviarDatos(ahora); return; }
      if (es(tok[0], 'CONFIG')) { enviarHola(); enviarConfig(); return; }

      if (es(tok[0], 'MODO')) {
        if (es(tok[1], 'AUTO')) ctrl.modoAutomatico(ahora);
        else if (es(tok[1], 'MANUAL')) ctrl.ventManual(ahora, ctrl.sal.vent);
        else { error('Usa MODO AUTO o MODO MANUAL.', ahora); return; }
        enviarEventos(ahora);
        enviarDatos(ahora);
        return;
      }

      if (es(tok[0], 'REGAR') || es(tok[0], 'BOMBA')) {
        const regar = es(tok[0], 'REGAR');
        if (!regar && es(tok[1], 'OFF')) {
          ctrl.apagarBombaManual(ahora);
        } else if (regar || es(tok[1], 'ON')) {
          const segTxt = regar ? tok[1] : tok[2];
          let seg = 5;
          if (segTxt != null) {
            seg = numeroEn(segTxt, 1, 1, BOMBA_MANUAL_MAX_SEG);
            if (seg === null) { error('Los segundos de bomba van de 1 a 30.', ahora); return; }
          }
          if (!ctrl.bombaManual(ahora, seg, regar)) {
            error('No se puede: se alcanzó el tope de bomba de esta hora. Usa ALARMAS RESET si revisaste el estanque.', ahora);
            return;
          }
        } else {
          error('Usa REGAR 5, BOMBA ON 10 o BOMBA OFF.', ahora);
          return;
        }
        aplicarSalidas();
        enviarEventos(ahora);
        enviarDatos(ahora);
        return;
      }

      if (es(tok[0], 'EXTRACTOR') || es(tok[0], 'VENT') || es(tok[0], 'LUZ')) {
        const on = es(tok[1], 'ON');
        if (!on && !es(tok[1], 'OFF')) { error('Usa ON u OFF.', ahora); return; }
        if (es(tok[0], 'LUZ')) ctrl.lamparaManual(ahora, on); else ctrl.ventManual(ahora, on);
        aplicarSalidas();
        enviarEventos(ahora);
        enviarDatos(ahora);
        return;
      }

      if (es(tok[0], 'SET')) {
        const aj = ctrl.aj;
        if (es(tok[1], 'SUELO')) {
          a = numeroEn(tok[2], 1, 5, 90); b = a === null ? null : numeroEn(tok[3], 1, 10, 100);
          if (a === null || b === null || b < a + 5) {
            error('SET SUELO mínimo objetivo: mínimo de 5 a 90 %, objetivo al menos 5 puntos más alto.', ahora); return;
          }
          aj.sueloMin = a; aj.sueloObjetivo = b;
        } else if (es(tok[1], 'TEMP')) {
          a = numeroEn(tok[2], 10, 0, 350); b = a === null ? null : numeroEn(tok[3], 10, 100, 450);
          if (a === null || b === null || b < a + 30) {
            error('SET TEMP mínima máxima: entre 0 y 45 °C, con al menos 3 °C de diferencia.', ahora); return;
          }
          aj.tempMin10 = a; aj.tempMax10 = b;
        } else if (es(tok[1], 'HUM_AIRE')) {
          a = numeroEn(tok[2], 1, 40, 99);
          if (a === null) { error('SET HUM_AIRE va de 40 a 99 %.', ahora); return; }
          aj.humAireMax = a;
        } else if (es(tok[1], 'LUZ')) {
          a = numeroEn(tok[2], 1, 0, 90);
          if (a === null) { error('SET LUZ va de 0 a 90 %.', ahora); return; }
          aj.luzMin = a;
        } else if (es(tok[1], 'RIEGO')) {
          a = numeroEn(tok[2], 1, 1, 30);
          b = a === null ? null : numeroEn(tok[3], 1, 10, 600);
          c = b === null ? null : numeroEn(tok[4], 1, 1, 20);
          if (a === null || b === null || c === null) {
            error('SET RIEGO pulso espera ciclos: pulso de 1 a 30 s, espera de 10 a 600 s, de 1 a 20 ciclos.', ahora); return;
          }
          aj.pulsoSeg = a; aj.esperaSeg = b; aj.maxCiclos = c;
        } else if (es(tok[1], 'BOMBA_HORA')) {
          a = numeroEn(tok[2], 1, 10, 900);
          if (a === null) { error('SET BOMBA_HORA va de 10 a 900 s.', ahora); return; }
          aj.bombaHoraSeg = a;
        } else if (es(tok[1], 'PH')) {
          a = numeroEn(tok[2], 100, 0, 1350); b = a === null ? null : numeroEn(tok[3], 100, 50, 1400);
          if (a === null || b === null || b < a + 50) {
            error('SET PH mínimo máximo: entre 0 y 14, con al menos 0,5 de diferencia.', ahora); return;
          }
          aj.phMin100 = a; aj.phMax100 = b;
        } else {
          error('Ajuste desconocido. Escribe AYUDA.', ahora); return;
        }
        confirmarAjuste(ahora);
        return;
      }

      if (es(tok[0], 'SENSOR')) {
        const on = es(tok[2], 'ON');
        if (!on && !es(tok[2], 'OFF')) { error('Usa SENSOR PH ON/OFF o SENSOR LDR ON/OFF.', ahora); return; }
        if (es(tok[1], 'PH')) ctrl.aj.phActivo = on;
        else if (es(tok[1], 'LDR')) ctrl.aj.ldrActivo = on;
        else { error('Usa SENSOR PH ON/OFF o SENSOR LDR ON/OFF.', ahora); return; }
        confirmarAjuste(ahora);
        return;
      }

      if (es(tok[0], 'CAL')) {
        if (es(tok[1], 'SUELO')) {
          const seco = es(tok[2], 'SECO');
          if (!seco && !es(tok[2], 'MOJADO')) { error('Usa CAL SUELO SECO o CAL SUELO MOJADO.', ahora); return; }
          leerSuelo();
          const otro = seco ? mem.sueloMojado : mem.sueloSeco;
          const dif = Math.abs(sueloCrudo - otro);
          if (dif < 100) {
            error('Esta lectura es casi igual a la del otro punto. Mide en tierra seca y luego con el sensor en un vaso de agua.', ahora);
            return;
          }
          if (seco) mem.sueloSeco = sueloCrudo; else mem.sueloMojado = sueloCrudo;
          guardarMemoria();
          inicioMensaje('ok', ahora);
          pr(seco ? 'Suelo seco calibrado en ' : 'Suelo mojado calibrado en ');
          pr(sueloCrudo);
          finMensaje();
          enviarConfig();
          return;
        }
        if (es(tok[1], 'PH')) {
          let ph100;
          if (es(tok[2], '7')) ph100 = 700;
          else if (es(tok[2], '4')) ph100 = 400;
          else if (es(tok[2], '10')) ph100 = 1000;
          else { error('Usa CAL PH 7, CAL PH 4 o CAL PH 10.', ahora); return; }
          if (!ctrl.aj.phActivo || !phListo() || phMv < 100 || phMv > 4900) {
            error('La sonda de pH no entrega una lectura válida. Revisa que esté conectada en A1 y que SENSOR PH esté en ON.', ahora);
            return;
          }
          const otroMv = ph100 === 700 ? mem.phMvB : mem.phMvA;
          const otroListo = ph100 === 700 ? mem.phCalibrado & 2 : mem.phCalibrado & 1;
          if (otroListo && phMv - otroMv < 80 && otroMv - phMv < 80) {
            error('La lectura es casi igual a la de la otra solución. Enjuaga la sonda y espera que la lectura se estabilice.', ahora);
            return;
          }
          if (ph100 === 700) { mem.phMvA = phMv; mem.ph100A = 700; mem.phCalibrado |= 1; }
          else { mem.phMvB = phMv; mem.ph100B = ph100; mem.phCalibrado |= 2; }
          guardarMemoria();
          inicioMensaje('ok', ahora);
          pr('pH ');
          pr(Math.trunc(ph100 / 100));
          pr(' calibrado en ');
          pr(phMv);
          pr(' mV.');
          if ((mem.phCalibrado & 3) === 3) {
            pr(' Pendiente: ');
            imprimirDecimal(Math.trunc(((mem.phMvB - mem.phMvA) * 10) / Math.trunc((mem.ph100B - mem.ph100A) / 100)), 1);
            pr(' mV por unidad de pH.');
          } else {
            pr(' Falta el segundo punto.');
          }
          finMensaje();
          enviarConfig();
          return;
        }
        error('Usa CAL SUELO SECO/MOJADO o CAL PH 7/4/10.', ahora);
        return;
      }

      if (es(tok[0], 'ALARMAS') || es(tok[0], 'RESET')) {
        ctrl.reiniciarAlarmas(ahora);
        enviarEventos(ahora);
        enviarDatos(ahora);
        return;
      }

      if (es(tok[0], 'FABRICA')) {
        valoresDeFabrica();
        ctrl.aj = copiaAjustes(mem.aj);
        guardarMemoria();
        inicioMensaje('ok', ahora);
        pr('Valores de fábrica restaurados. Hay que volver a calibrar.');
        finMensaje();
        enviarConfig();
        return;
      }

      error('Orden desconocida. Escribe AYUDA.', ahora);
    }

    function leerSerie(ahora) {
      while (placa.entrada.length > 0) {
        const ch = placa.entrada.shift();
        if (ch === 10 || ch === 13) {
          if (lineaLarga) error('Orden demasiado larga.', ahora);
          else if (largoLinea > 0) ejecutar(linea, ahora);
          linea = '';
          largoLinea = 0;
          lineaLarga = false;
        } else if (largoLinea < 55) {
          linea += String.fromCharCode(ch);
          largoLinea++;
        } else {
          lineaLarga = true;
        }
      }
    }

    // ---- Inicio y ciclo principal --------------------------------------------
    function setup() {
      escribirRele(PIN.BOMBA, false);
      escribirRele(PIN.VENT, false);
      escribirRele(PIN.LAMPARA, false);
      pinMode(PIN.BOMBA, OUTPUT);
      pinMode(PIN.VENT, OUTPUT);
      pinMode(PIN.LAMPARA, OUTPUT);
      pinMode(PIN.SUELO_VCC, OUTPUT);
      digitalWrite(PIN.SUELO_VCC, LOW);
      if (USA_BOTON) pinMode(PIN.BOTON, INPUT_PULLUP);

      cargarMemoria();
      ctrl.iniciar(millis());
      iniciarLcd();
      enviarHola();
      enviarConfig();
      leerSuelo();
    }

    function loop() {
      const ahora = millis();
      leerSerie(ahora);
      if (u32(ahora - tSuelo) >= 1000) { tSuelo = ahora; leerSuelo(); }
      if (u32(ahora - tDht) >= 2500) { tDht = ahora; leerDht(); }
      if (u32(ahora - tPh) >= 200) { tPh = ahora; if (ctrl.aj.phActivo) muestrearPh(); }
      if (USA_BOTON) revisarBoton(ahora);
      if (u32(ahora - tCtrl) >= 500) {
        tCtrl = ahora;
        armarLecturas();
        if (!iniciando(ahora)) ctrl.paso(ahora, lec);
        aplicarSalidas();
        enviarEventos(ahora);
      }
      if (u32(ahora - tDatos) >= 2000) { tDatos = ahora; enviarDatos(ahora); }
      if (u32(ahora - tLcd) >= 1000) { tLcd = ahora; mostrarLcd(ahora); }
    }

    // ---- Lo que ve el mundo exterior --------------------------------------------
    placa.setup = setup;
    placa.loop = loop;
    placa.escribirSerie = (bytes) => { for (const by of bytes) placa.entrada.push(by & 0xff); };
    placa.tomarSalida = () => { const s = placa.salida; placa.salida = []; return s; };
    placa.estado = () => ({ ctrl, lec, mem, sueloCrudo, phMv, cantidadPh, luzCrudo, iniciando: iniciando(millis()) });
    placa.reles = () => ({
      bomba: placa.modo[PIN.BOMBA] === OUTPUT && placa.pin[PIN.BOMBA] === (RELE_ACTIVO_EN_BAJO ? LOW : HIGH),
      vent: placa.modo[PIN.VENT] === OUTPUT && placa.pin[PIN.VENT] === (RELE_ACTIVO_EN_BAJO ? LOW : HIGH),
      lampara: placa.modo[PIN.LAMPARA] === OUTPUT && placa.pin[PIN.LAMPARA] === (RELE_ACTIVO_EN_BAJO ? LOW : HIGH),
    });
    return placa;
  }

  MOSK.arduino = { crearArduino, PIN, A0, A1, A2, HIGH, LOW, TAM_GUARDADO, guardadoABytes, bytesAGuardado, sumaDeBytes };
})();
