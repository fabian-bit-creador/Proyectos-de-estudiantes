#!/usr/bin/env node
// Corre en node, sin navegador, las mismas pruebas de «Verificar el motor»
// que trae el panel (panel/src/pruebas.js).
//
// Uso: node pruebas/probar_panel.js
'use strict';
const fs = require('fs');
const path = require('path');

const PANEL = path.join(__dirname, '..', 'panel');
for (const archivo of ['medicion.js', 'logica.js', 'arduino-virtual.js', 'guion.js', 'planta.js', 'protocolo.js', 'graficos.js']) {
  require(path.join(PANEL, 'src', archivo));
}
globalThis.MOSK.HUELLA_CPP = JSON.parse(fs.readFileSync(path.join(PANEL, 'huella.json'), 'utf8'));
require(path.join(PANEL, 'src', 'pruebas.js'));

const r = globalThis.MOSK.correrPruebas();
for (const p of r.resultados) console.log((p.ok ? '  ✓ ' : '  ✗ ') + p.nombre + (p.ok ? '' : ' — ' + p.detalle));
console.log(`\nPANEL: ${r.total - r.fallas} de ${r.total} pruebas`);
process.exit(r.fallas ? 1 : 0);
