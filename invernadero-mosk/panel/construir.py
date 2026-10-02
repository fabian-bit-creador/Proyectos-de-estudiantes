"""Arma PanelInvernadero.html: un solo archivo, sin internet, con el CSS y el
JavaScript de panel/ adentro.

Uso: python3 panel/construir.py

Antes de armarlo comprueba que el Arduino virtual del panel responda igual
que el programa real: corre el guion de referencia en el banco C++
(pruebas/simulador, con g++) y en el banco JavaScript (con node), y guarda
la huella en panel/huella.json. El panel vuelve a comprobarla con
«Verificar el motor». Sin g++, usa la huella guardada.
"""
import json
import pathlib
import re
import shutil
import subprocess
import sys
import urllib.parse

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent
SRC = AQUI / 'src'
SIM = RAIZ / 'pruebas' / 'simulador'
PROG = RAIZ / 'InvernaderoMOSK'
SALIDA = RAIZ / 'PanelInvernadero.html'
HUELLA = AQUI / 'huella.json'

ORDEN_JS = ['medicion.js', 'logica.js', 'arduino-virtual.js', 'guion.js', 'planta.js', 'protocolo.js',
            'conexion.js', 'graficos.js', '@huella', 'pruebas.js', 'panel.js']


def fnv1a(datos):
    h = 0x811C9DC5
    for b in datos:
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def huella_cpp():
    """Huella de la salida del programa real (C++) para el guion de referencia."""
    if not shutil.which('node'):
        return None, 'falta node'
    guion = subprocess.run(['node', str(RAIZ / 'pruebas' / 'banco.js'), '--guion-referencia'],
                           capture_output=True, check=True).stdout
    banco = SIM / 'banco'
    if not shutil.which('g++'):
        return None, 'falta g++'
    cmd = ['g++', '-std=gnu++17', '-O1', '-I', str(SIM), '-o', str(banco), str(SIM / 'banco.cpp'),
           str(PROG / 'logica.cpp'), str(PROG / 'medicion.cpp')]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        return None, 'no compiló el banco C++:\n' + r.stderr
    salida = subprocess.run([str(banco)], input=guion, capture_output=True, check=True).stdout
    js = json.loads(subprocess.run(['node', str(RAIZ / 'pruebas' / 'banco.js'), '--huella'],
                                   capture_output=True, check=True).stdout)
    cpp = {'huella': fnv1a(salida), 'bytes': len(salida)}
    if cpp != js:
        sys.exit(f'El Arduino virtual NO responde igual que el programa real: C++ {cpp} / JS {js}.\n'
                 'Corre python3 pruebas/probar_arduino.py --paridad para ver dónde difieren.')
    return cpp, None


def main():
    cpp, problema = huella_cpp()
    if cpp:
        HUELLA.write_text(json.dumps(cpp) + '\n', encoding='utf-8')
        print(f'Huella del programa real: {cpp["huella"]} ({cpp["bytes"]} bytes), igual en el Arduino virtual.')
    elif HUELLA.exists():
        cpp = json.loads(HUELLA.read_text(encoding='utf-8'))
        print(f'Aviso: {problema}. Se usa la huella guardada en {HUELLA.name}.')
    else:
        sys.exit(f'No se pudo calcular la huella ({problema}) y no hay {HUELLA.name}.')

    partes = []
    for nombre in ORDEN_JS:
        if nombre == '@huella':
            partes.append(f'globalThis.MOSK.HUELLA_CPP = {json.dumps(cpp)};')
            continue
        codigo = (SRC / nombre).read_text(encoding='utf-8')
        if '</script' in codigo.lower():
            sys.exit(f'{nombre} contiene «</script»: rompería el HTML.')
        partes.append(f'/* ---- {nombre} ---- */\n{codigo.strip()}')
    js = '\n\n'.join(partes)
    css = (AQUI / 'estilos.css').read_text(encoding='utf-8').strip()
    cuerpo = (AQUI / 'cuerpo.html').read_text(encoding='utf-8').strip()

    logo = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34"><rect width="34" height="34" rx="8" fill="#163c2b"/>'
            '<path d="M8 24V15L17 9L26 15V24H20V18H14V24H8Z" fill="none" stroke="#4fae7d" stroke-width="2" stroke-linejoin="round"/>'
            '<circle cx="17" cy="14.5" r="2" fill="#e3a23c"/></svg>')
    icono = 'data:image/svg+xml,' + urllib.parse.quote(logo)

    html = f'''<!DOCTYPE html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panel del invernadero · MOS-K Green Tech</title>
<meta name="description" content="Panel para monitorear y controlar el invernadero automatizado MOS-K Green Tech con un Arduino UNO conectado por USB. Incluye simulación, calibración y guía de armado.">
<meta name="theme-color" content="#163c2b">
<link rel="icon" href="{icono}">
<style>
{css}
</style>
</head>
<body>
<noscript><p style="padding:16px;background:#fbe6e4;color:#9b1c22">Este panel necesita JavaScript. Ábrelo con Chrome o Edge.</p></noscript>
{cuerpo}
<script>
{js}
</script>
</body>
</html>
'''
    externos = re.findall(r'(?:src|href)\s*=\s*["\']https?:', html)
    if externos:
        sys.exit(f'El HTML pide recursos de internet: {externos}')
    SALIDA.write_text(html, encoding='utf-8')
    print(f'Listo: {SALIDA.relative_to(RAIZ)} ({len(html.encode("utf-8")) / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
