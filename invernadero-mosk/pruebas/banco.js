#!/usr/bin/env node
// Banco de pruebas en JavaScript: corre el Arduino virtual del panel
// (panel/src/arduino-virtual.js) con el mismo guion y la misma salida que
// simulador/banco.cpp, para comprobar que la simulación del panel es fiel.
//
// Uso: node pruebas/banco.js [--dht22] [eeprom.bin] < guion.txt
//      node pruebas/banco.js --huella      imprime la huella del guion de referencia
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'panel', 'src');
for (const archivo of ['medicion.js', 'logica.js', 'arduino-virtual.js', 'guion.js']) require(path.join(SRC, archivo));
const { correrGuion, huella, GUION_REFERENCIA } = globalThis.MOSK.guion;

let dht22 = false;
let archivoEeprom = null;
for (const a of process.argv.slice(2)) {
  if (a === '--dht22') dht22 = true;
  else if (a === '--huella') {
    const { salida } = correrGuion(GUION_REFERENCIA);
    process.stdout.write(JSON.stringify({ huella: huella(salida), bytes: salida.length }) + '\n');
    process.exit(0);
  } else if (a === '--guion-referencia') {
    process.stdout.write(GUION_REFERENCIA);
    process.exit(0);
  } else archivoEeprom = a;
}

let eeprom;
if (archivoEeprom && fs.existsSync(archivoEeprom)) {
  eeprom = new Uint8Array(1024).fill(0xff);
  eeprom.set(fs.readFileSync(archivoEeprom).subarray(0, 1024));
}

let resultado;
try {
  resultado = correrGuion(fs.readFileSync(0, 'utf8'), { dht22, eeprom });
} catch (e) {
  process.stderr.write(e.message + '\n');
  process.exit(2);
}
if (archivoEeprom) fs.writeFileSync(archivoEeprom, Buffer.from(resultado.eeprom));
process.stdout.write(Buffer.from(resultado.salida));
