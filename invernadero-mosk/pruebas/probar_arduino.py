"""Pruebas del programa del Arduino, ejecutado en un Arduino simulado (pruebas/simulador).

Uso:
  python3 pruebas/probar_arduino.py            el programa real (C++), compilado con g++
  python3 pruebas/probar_arduino.py --js       el Arduino virtual del panel (JavaScript, con node)
  python3 pruebas/probar_arduino.py --paridad  además compara ambos byte a byte en cada guion

Corre cada escenario y revisa lo que el programa envía por el puerto serie,
el estado de los relés y la pantalla LCD.
"""
import json
import pathlib
import re
import subprocess
import sys
import tempfile

AQUI = pathlib.Path(__file__).resolve().parent
SIM = AQUI / 'simulador'
PROG = AQUI.parent / 'InvernaderoMOSK'
BANCO_JS = AQUI / 'banco.js'
MODO = 'cpp'                 # 'cpp', 'js' o 'paridad'
BANCOS = {}                  # variante -> ejecutable C++
PARIDAD = []                 # (guion, iguales, detalle)

# Códigos de evento, leídos del propio logica.h
CABECERA = (PROG / 'logica.h').read_text(encoding='utf-8')
bloque = re.search(r'enum Evento : uint8_t \{(.*?)\};', CABECERA, re.S).group(1)
EV = {}
siguiente = 0
for nombre, valor in re.findall(r'(EV_\w+)(?:\s*=\s*(\d+))?', bloque):
    siguiente = int(valor) if valor else siguiente + 1
    EV[nombre] = siguiente

resultados = []


def compilar(extra=()):
    destino = SIM / ('banco' + ('_' + '_'.join(e.strip('-D').replace('=', '') for e in extra) if extra else ''))
    cmd = ['g++', '-std=gnu++17', '-Wall', '-Wextra', '-O1', '-I', str(SIM), *extra, '-o', str(destino),
           str(SIM / 'banco.cpp'), str(PROG / 'logica.cpp'), str(PROG / 'medicion.cpp')]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit('No compiló el banco:\n' + r.stderr)
    avisos = [l for l in r.stderr.splitlines() if 'warning' in l and ('InvernaderoMOSK' in l)]
    return destino, avisos


def ejecutar(args, guion):
    r = subprocess.run(args, input=guion.encode('utf-8'), capture_output=True)
    if r.returncode:
        raise RuntimeError(r.stderr.decode('utf-8', 'replace'))
    return r.stdout


def comando_js(variante, eeprom=None):
    return ['node', str(BANCO_JS)] + (['--dht22'] if variante == 'dht22' else []) + ([str(eeprom)] if eeprom else [])


def sin_eeprom(salida):
    return b'\n'.join(l for l in salida.split(b'\n') if not l.startswith(b'E '))


def correr(guion, eeprom=None, variante='normal'):
    if MODO == 'js':
        salida = ejecutar(comando_js(variante, eeprom), guion)
    else:
        salida = ejecutar([str(BANCOS[variante])] + ([str(eeprom)] if eeprom else []), guion)
        if MODO == 'paridad' and not eeprom:     # la EEPROM del computador no tiene el mismo orden de bytes
            otra = ejecutar(comando_js(variante), guion)
            a, b = sin_eeprom(salida).split(b'\n'), sin_eeprom(otra).split(b'\n')
            distinta = next((i for i in range(max(len(a), len(b))) if a[i:i + 1] != b[i:i + 1]), None)
            detalle = '' if distinta is None else f'línea {distinta + 1}: C++ {a[distinta:distinta + 1]} / JS {b[distinta:distinta + 1]}'
            PARIDAD.append((guion, distinta is None, detalle))
    out = []
    for cruda in salida.split(b'\n'):
        if not cruda:
            continue
        tipo, ms, resto = cruda.split(b' ', 2)
        ms = int(ms)
        if tipo == b'S':
            texto = resto.decode('utf-8')
            if texto.startswith('#'):
                out.append(('texto', ms, texto))
            else:
                out.append(('json', ms, json.loads(texto)))      # falla si no es JSON válido
        elif tipo == b'P':
            b, v, l, modo = map(int, resto.split())
            out.append(('pines', ms, {'bomba': b, 'vent': v, 'lamp': l, 'modo': modo}))
        elif tipo == b'L':
            out.append(('lcd', ms, resto.decode('latin-1')))
        elif tipo == b'E':
            out.append(('eeprom', ms, int(resto)))
    return out


def json_de(out, tipo):
    return [(ms, d) for k, ms, d in out if k == 'json' and d.get('tipo') == tipo]


def eventos(out):
    return [(ms, d['cod'], d['msg']) for ms, d in json_de(out, 'evento')]


def codigos(out):
    return [c for _, c, _ in eventos(out)]


def ok(nombre, cond, detalle=''):
    resultados.append((nombre, bool(cond), detalle))
    print(('  ✓ ' if cond else '  ✗ ') + nombre + ('' if cond or not detalle else ' — ' + str(detalle)))


def pines(out):
    return [(ms, d) for k, ms, d in out if k == 'pines']


def lcds(out):
    return [d for k, ms, d in out if k == 'lcd']


ARRANQUE = 'inicio\navanzar 4000\n'


def escenario_arranque():
    print('Arranque')
    out = correr('inicio\npines\navanzar 4000\npines\nlcd\n')
    j = [d for k, ms, d in out if k == 'json']
    ok('Lo primero que envía es el saludo y la configuración', j[0]['tipo'] == 'hola' and j[1]['tipo'] == 'config', j[:2])
    p = pines(out)
    ok('Los relés quedan apagados al encender (HIGH en relés activos en bajo)', p[0][1]['bomba'] == 1 and p[0][1]['vent'] == 1 and p[0][1]['lamp'] == 1 and p[0][1]['modo'] == 1, p[0])
    datos = json_de(out, 'datos')
    ok('Mientras inicia no informa temperatura y no actúa', datos[0][1]['ini'] == 1 and datos[0][1]['t'] is None and datos[0][1]['bomba'] == 0)
    ok('Tras 3 s informa las lecturas', datos[-1][1]['ini'] == 0 and datos[-1][1]['t'] == 22.0 and datos[-1][1]['ha'] == 60 and datos[-1][1]['hs'] == 77, datos[-1])
    ok('Sin calibrar, el pH avisa «ph_sin_calibrar»', 'ph_sin_calibrar' in datos[-1][1]['al'])
    l = lcds(out)[-1]
    ok('La pantalla muestra temperatura y humedad', l.startswith('|T:22.0\xdfC HA:60%'), l)
    hola = json_de(out, 'hola')[0][1]
    ok('El saludo informa DHT11, la pantalla 0x27 y relés activos en bajo', hola['dht'] == 'DHT11' and hola['lcd'] == '0x27' and hola['rele_bajo'] == 1, hola)


def escenario_riego_normal():
    print('Riego por ciclos hasta el objetivo')
    out = correr(ARRANQUE + 'suelo 850\navanzar 1000\npines\navanzar 5000\npines\nsuelo 700\navanzar 60500\npines\n'
                 'suelo 600\navanzar 70000\npines\nlcd\n')
    c = codigos(out)
    esperado = [EV['EV_RIEGO_INICIO'], EV['EV_RIEGO_ESPERA'], EV['EV_RIEGO_PULSO'], EV['EV_RIEGO_ESPERA'], EV['EV_RIEGO_LISTO']]
    ok('Inicio, espera, segundo pulso, espera y riego terminado', c == esperado, c)
    p = pines(out)
    ok('La bomba enciende (pin en LOW) al detectar suelo seco', p[0][1]['bomba'] == 0, p[0])
    ok('La bomba se apaga al terminar el pulso de 5 s', p[1][1]['bomba'] == 1, p[1])
    ok('Tras la espera de 60 s, si sigue bajo el objetivo, riega otra vez', p[2][1]['bomba'] == 0, p[2])
    ok('Al llegar al objetivo la bomba queda apagada', p[3][1]['bomba'] == 1, p[3])
    inicio = [m for _, cod, m in eventos(out) if cod == EV['EV_RIEGO_INICIO']][0]
    ok('El mensaje explica por qué riega', 'el suelo está en 23 %' in inicio and 'el mínimo es 35 %' in inicio, inicio)
    datos = json_de(out, 'datos')
    ok('El panel recibe 10 s de bomba usados en la hora', datos[-1][1]['bh'] == 10, datos[-1][1]['bh'])
    regando = [d for ms, d in datos if d['riego'] == 'regando']
    ok('Durante el riego informa ciclo y segundos restantes', regando and regando[0]['ciclo'] == 1 and 1 <= regando[0]['fase'] <= 5, regando[:1])


def escenario_sin_efecto():
    print('Riego sin efecto (estanque vacío)')
    out = correr(ARRANQUE + 'suelo 850\navanzar 400000\npines\nlcd\navanzar 3000\nlcd\navanzar 3000\nlcd\n'
                 'serie ALARMAS RESET\navanzar 2000\npines\n')
    c = codigos(out)
    pulsos = c.count(EV['EV_RIEGO_PULSO']) + 1
    ok('Hace los 6 ciclos y declara «riego sin efecto»', pulsos == 6 and EV['EV_RIEGO_SIN_EFECTO'] in c, c)
    msg = [m for _, cod, m in eventos(out) if cod == EV['EV_RIEGO_SIN_EFECTO']][0]
    ok('El mensaje pide revisar estanque, bomba y sensor', 'Revisa el estanque' in msg, msg)
    datos = [d for ms, d in json_de(out, 'datos') if ms < 400000 + 4000]
    ok('Queda bloqueado con la alarma activa', datos[-1]['riego'] == 'bloqueado' and 'riego_sin_efecto' in datos[-1]['al'], datos[-1])
    p = pines(out)
    ok('Bloqueado, la bomba no vuelve a partir', p[0][1]['bomba'] == 1)
    ok('La pantalla muestra la alarma', any('! ALARMA' in l and 'Revisa estanque' in l for l in lcds(out)), lcds(out))
    ok('Al reiniciar la alarma vuelve a regar', c.count(EV['EV_ALARMAS_REINICIADAS']) == 1 and c[-1] == EV['EV_RIEGO_INICIO'] and p[-1][1]['bomba'] == 0, c[-3:])


def escenario_sensor_suelo():
    print('Sensor de suelo fuera de la tierra')
    out = correr(ARRANQUE + 'suelo 1023\navanzar 4000\npines\nsuelo 500\navanzar 2000\n')
    c = codigos(out)
    ok('Avisa la falla y no riega', c[:1] == [EV['EV_FALLA_SUELO']] and EV['EV_RIEGO_INICIO'] not in c and pines(out)[0][1]['bomba'] == 1, c)
    d = [d for ms, d in json_de(out, 'datos') if ms <= 8000][-1]
    ok('El dato de suelo llega vacío y con la alarma «suelo»', d['hs'] is None and 'suelo' in d['al'], d)
    ok('Al volver a la tierra avisa que mide otra vez', EV['EV_SUELO_OK'] in c)
    out2 = correr(ARRANQUE + 'suelo 850\navanzar 2000\nsuelo 1023\navanzar 1000\npines\n')
    c2 = codigos(out2)
    ok('Si el sensor falla durante el riego, la bomba se detiene', EV['EV_RIEGO_CORTADO'] in c2 and pines(out2)[0][1]['bomba'] == 1, c2)


def escenario_calor_frio():
    print('Extractor y luz térmica')
    out = correr(ARRANQUE + 'dht 29 60\navanzar 3000\npines\ndht 26.5 60\navanzar 10000\npines\navanzar 30000\npines\n')
    p = pines(out)
    c = codigos(out)
    ok('Con 29 °C enciende el extractor', p[0][1]['vent'] == 0 and EV['EV_VENT_ON'] in c, c)
    ok('No apaga antes de 30 s aunque ya bajó la temperatura', p[1][1]['vent'] == 0)
    ok('Apaga después, al bajar de 26,5 °C', p[2][1]['vent'] == 1 and EV['EV_VENT_OFF'] in c)
    msg = [m for _, cod, m in eventos(out) if cod == EV['EV_VENT_ON']][0]
    ok('El mensaje dice la temperatura', '29.0 °C' in msg, msg)

    out = correr(ARRANQUE + 'dht 85 95\navanzar 3000\npines\n'.replace('85 95', '24 90'))
    ok('Con 90 % de humedad del aire también ventila', pines(out)[0][1]['vent'] == 0)

    out = correr(ARRANQUE + 'dht 14 60\navanzar 3000\npines\ndht 18 60\navanzar 35000\npines\n')
    p = pines(out)
    c = codigos(out)
    ok('Con 14 °C enciende la luz térmica', p[0][1]['lamp'] == 0 and EV['EV_LAMP_ON'] in c, c)
    ok('A 18 °C la apaga pasados 30 s', p[1][1]['lamp'] == 1 and EV['EV_LAMP_OFF'] in c)

    out = correr(ARRANQUE + 'dht 14 60\navanzar 3000\ndht 29 60\navanzar 3000\npines\n')
    c = codigos(out)
    ok('Si hace calor la luz se apaga de inmediato, sin esperar', pines(out)[0][1]['lamp'] == 1 and EV['EV_LAMP_SEGURIDAD'] in c, c)


def escenario_falla_dht():
    print('Sensor DHT sin señal')
    out = correr(ARRANQUE + 'dht 14 60\navanzar 3000\ndht nan\navanzar 9000\npines\ndht 22 60\navanzar 3000\n')
    c = codigos(out)
    ok('Tras 3 lecturas fallidas avisa la falla', EV['EV_FALLA_DHT'] in c, c)
    ok('Enciende el extractor por precaución y apaga la luz', EV['EV_VENT_SEGURIDAD'] in c and EV['EV_LAMP_SEGURIDAD'] in c and pines(out)[0][1]['vent'] == 0 and pines(out)[0][1]['lamp'] == 1, c)
    d = [d for ms, d in json_de(out, 'datos') if ms <= 16000][-1]
    ok('La temperatura llega vacía con la alarma «dht»', d['t'] is None and 'dht' in d['al'], d)
    ok('Cuando vuelve, lo informa', EV['EV_DHT_OK'] in c)


def escenario_manual():
    print('Modo manual y riego puntual')
    out = correr(ARRANQUE + 'serie BOMBA ON 10\navanzar 500\npines\navanzar 10000\npines\nserie MODO AUTO\navanzar 1000\n')
    c = codigos(out)
    ok('«BOMBA ON 10» pasa a manual y enciende la bomba', c[0] == EV['EV_MODO_MANUAL'] and pines(out)[0][1]['bomba'] == 0, c)
    fin = [m for _, cod, m in eventos(out) if cod == EV['EV_BOMBA_MANUAL_FIN']]
    ok('La apaga sola a los 10 s', pines(out)[1][1]['bomba'] == 1 and fin and '10 s' in fin[0], fin)
    ok('«MODO AUTO» vuelve al automático', c[-1] == EV['EV_MODO_AUTO'])

    out = correr(ARRANQUE + 'serie REGAR 3\navanzar 4000\n')
    c = codigos(out)
    d = json_de(out, 'datos')[-1][1]
    ok('«REGAR 3» riega 3 s y vuelve solo al automático', c == [EV['EV_MODO_MANUAL'], EV['EV_BOMBA_MANUAL_FIN'], EV['EV_MODO_AUTO']] and d['modo'] == 'auto', c)

    out = correr(ARRANQUE + 'serie EXTRACTOR ON\navanzar 1000\npines\navanzar 600500\n')
    c = codigos(out)
    ok('El extractor manual enciende', pines(out)[0][1]['vent'] == 0)
    ok('Tras 10 minutos sin órdenes vuelve al automático', EV['EV_MANUAL_VENCIDO'] in c and c[-1] in (EV['EV_MODO_AUTO'], EV['EV_VENT_OFF']), c)

    out = correr(ARRANQUE + 'dht 14 60\navanzar 3000\nserie LUZ ON\nserie MODO MANUAL\navanzar 1000\ndht 32 60\navanzar 3000\npines\n')
    ok('En manual, la luz se apaga igual si la temperatura se dispara', pines(out)[-1][1]['lamp'] == 1 and EV['EV_LAMP_SEGURIDAD'] in codigos(out))

    out = correr(ARRANQUE + 'boton 0\navanzar 100\nboton 1\navanzar 500\npines\navanzar 6000\npines\n')
    j = json_de(out, 'evento')
    ok('El botón riega 5 s y vuelve al automático', any(d['cod'] == 'boton' for ms, d in j) and pines(out)[0][1]['bomba'] == 0 and pines(out)[1][1]['bomba'] == 1 and codigos(out)[-1] == EV['EV_MODO_AUTO'], [d for ms, d in j])


def escenario_tope_hora():
    print('Tope de bomba por hora')
    out = correr(ARRANQUE + 'serie SET BOMBA_HORA 10\nserie SET RIEGO 8 10 6\nsuelo 850\navanzar 30000\npines\navanzar 100000\n'
                 'avanzar 3600000\n')
    c = codigos(out)
    ok('Corta la bomba al usar los 10 s de la hora', EV['EV_LIMITE_BOMBA'] in c, c)
    d = [d for ms, d in json_de(out, 'datos') if ms < 130000][-1]
    ok('La alarma «limite_bomba» queda activa y no se riega', 'limite_bomba' in d['al'] and d['riego'] == 'reposo' and pines(out)[0][1]['bomba'] == 1, d)
    despues = [cod for ms, cod, m in eventos(out) if ms > 34000 and ms < 3600000]
    ok('No vuelve a regar en esa hora', EV['EV_RIEGO_INICIO'] not in despues, despues)
    ok('Pasada la hora vuelve a regar', [cod for ms, cod, m in eventos(out) if ms >= 3600000].count(EV['EV_RIEGO_INICIO']) >= 1)
    out = correr(ARRANQUE + 'serie SET BOMBA_HORA 10\nserie BOMBA ON 30\navanzar 12000\nserie BOMBA ON 5\navanzar 500\n')
    errores = [d['msg'] for ms, d in json_de(out, 'error')]
    ok('El tope también vale en manual', EV['EV_LIMITE_BOMBA'] in codigos(out) and errores and 'tope de bomba' in errores[0], errores)


def escenario_ordenes():
    print('Órdenes y ajustes')
    out = correr(ARRANQUE + 'serie SET SUELO 60 50\nserie SET SUELO 40 60\nserie SET TEMP 30 28\nserie SET TEMP 12.5 30\n'
                 'serie SET PH 5,8 7.2\nserie SET HUM_AIRE 120\nserie set riego 6 90 4\nserie AYUDA\n'
                 'serie ' + 'X' * 70 + '\nserie BAILAR\nserie SENSOR LDR ON\navanzar 3000\n')
    errores = [d['msg'] for ms, d in json_de(out, 'error')]
    ok('Rechaza objetivo bajo el mínimo, temperaturas cruzadas y humedad imposible', len(errores) == 5 and 'objetivo' in errores[0] and '3 °C' in errores[1] and '40 a 99' in errores[2], errores)
    ok('Avisa la orden demasiado larga y la desconocida', 'demasiado larga' in errores[3] and 'desconocida' in errores[4], errores[3:])
    cfg = json_de(out, 'config')[-1][1]
    ok('Guarda los ajustes válidos (también en minúsculas y con coma decimal)',
       (cfg['suelo_min'], cfg['suelo_obj'], cfg['temp_min'], cfg['temp_max'], cfg['ph_min'], cfg['ph_max'], cfg['pulso'], cfg['espera'], cfg['ciclos'], cfg['sensor_ldr'])
       == (40, 60, 12.5, 30.0, 5.8, 7.2, 6, 90, 4, 1), cfg)
    ayuda = [d for k, ms, d in out if k == 'texto']
    ok('AYUDA lista las órdenes en líneas que empiezan con #', len(ayuda) == 8 and any('CAL PH 7' in l for l in ayuda), len(ayuda))
    ok('Con la fotorresistencia activa informa la luz', json_de(out, 'datos')[-1][1]['luz'] is not None)


def escenario_luz():
    print('Fotorresistencia')
    out = correr(ARRANQUE + 'serie SENSOR LDR ON\nldr 100\navanzar 3000\npines\nldr 600\navanzar 35000\npines\n')
    c = codigos(out)
    on = [(cod, m) for ms, cod, m in eventos(out) if cod == EV['EV_LAMP_ON']]
    ok('Con poca luz enciende la lámpara y explica el motivo', pines(out)[0][1]['lamp'] == 0 and on and 'falta de luz' in on[0][1], on)
    ok('Con luz suficiente la apaga', pines(out)[1][1]['lamp'] == 1 and EV['EV_LAMP_OFF'] in c)


def escenario_calibracion():
    print('Calibración')
    out = correr(ARRANQUE + 'suelo 980\nserie CAL SUELO SECO\navanzar 100\nsuelo 900\nserie CAL SUELO MOJADO\navanzar 100\n'
                 'suelo 320\nserie CAL SUELO MOJADO\navanzar 100\n'
                 'ph 512\navanzar 2500\nserie CAL PH 7\navanzar 100\nph 515\navanzar 2500\nserie CAL PH 4\navanzar 100\n'
                 'ph 620\navanzar 2500\nserie CAL PH 4\navanzar 2000\nph 512\navanzar 2500\nph 700\navanzar 2500\nph 0\navanzar 4500\n')
    oks = [d['msg'] for ms, d in json_de(out, 'ok')]
    errores = [d['msg'] for ms, d in json_de(out, 'error')]
    cfg = json_de(out, 'config')[-1][1]
    ok('Calibra el suelo seco y el mojado', cfg['suelo_seco'] == 980 and cfg['suelo_mojado'] == 320, cfg)
    ok('Rechaza un punto mojado casi igual al seco', any('casi igual' in e for e in errores), errores)
    ok('Calibra pH 7 y pH 4 e informa la pendiente', cfg['ph_cal'] == 3 and any('Pendiente: -17' in o for o in oks), oks)
    ok('Rechaza pH 4 casi igual a pH 7 (sonda sin enjuagar)', sum('casi igual' in e for e in errores) == 2 and oks[2].startswith('pH 7 calibrado en 2502 mV'), errores)
    datos = json_de(out, 'datos')
    medidas = {round(d['phmv'] / 10) * 10: d['ph'] for ms, d in datos if d['phmv'] is not None}
    ok('Con la calibración, 3030 mV es pH 4,00 y 2502 mV es pH 7,00', medidas.get(3030) == 4.0 and medidas.get(2500) == 7.0, medidas)
    fuera = [d for ms, d in datos if d['phmv'] and 3400 <= d['phmv'] <= 3450]
    ok('Un pH de 1,8 activa «ph_fuera»', fuera and 'ph_fuera' in fuera[-1]['al'] and 'ph_sin_calibrar' not in fuera[-1]['al'], fuera[-1:])
    cero = [d for ms, d in datos if d['phmv'] == 0]
    ok('Con la sonda desconectada avisa «ph_falla» y no inventa un valor', cero and cero[-1]['ph'] is None and 'ph_falla' in cero[-1]['al'], cero[-1:])


def escenario_eeprom():
    print('Memoria EEPROM')
    with tempfile.TemporaryDirectory() as tmp:
        ee = pathlib.Path(tmp) / 'eeprom.bin'
        out1 = correr(ARRANQUE + 'serie SET SUELO 40 60\navanzar 100\nsuelo 960\nserie CAL SUELO SECO\navanzar 100\neeprom\n', ee)
        out2 = correr('inicio\neeprom\n', ee)
        cfg2 = json_de(out2, 'config')[0][1]
        ok('Los ajustes y la calibración sobreviven al apagar', cfg2['suelo_min'] == 40 and cfg2['suelo_obj'] == 60 and cfg2['suelo_seco'] == 960, cfg2)
        escr = [d for k, ms, d in out2 if k == 'eeprom'][0]
        ok('Al encender no reescribe la EEPROM si estaba bien', escr == 0, escr)
        ee.write_bytes(bytes([0xFF]) * 1024)
        out3 = correr('inicio\n', ee)
        ok('Con la EEPROM vacía parte con los valores de fábrica', json_de(out3, 'config')[0][1]['suelo_min'] == 35)
        datos = ee.read_bytes()
        datos = bytes([datos[0], datos[1], datos[2], datos[3] ^ 0x55]) + datos[4:]
        ee.write_bytes(datos)
        out4 = correr('inicio\n', ee)
        ok('Si la memoria se corrompe, vuelve a fábrica en vez de usar datos raros', json_de(out4, 'config')[0][1]['suelo_min'] == 35)
        out5 = correr(ARRANQUE + 'serie SET SUELO 50 70\navanzar 100\nserie FABRICA\navanzar 100\n', ee)
        ok('FABRICA restaura los valores', json_de(out5, 'config')[-1][1]['suelo_min'] == 35 and 'fábrica' in json_de(out5, 'ok')[-1][1]['msg'])


def escenario_variantes():
    print('Variantes')
    out = correr('sinlcd\n' + ARRANQUE)
    ok('Sin pantalla conectada sigue funcionando', json_de(out, 'hola')[0][1]['lcd'] is None and len(json_de(out, 'datos')) >= 2)
    out = correr('inicio\n', variante='dht22')
    ok('Con DHT22 el saludo lo informa', json_de(out, 'hola')[0][1]['dht'] == 'DHT22')
    out = correr(ARRANQUE + 'suelo 850\navanzar 3000\nlcd\navanzar 3000\nlcd\navanzar 3000\nlcd\n')
    ok('La pantalla muestra el riego en curso', any('Regando ciclo 1' in l or 'Absorbiendo agua' in l for l in lcds(out)), lcds(out))
    ok('Todas las filas de la pantalla caben en 16 caracteres', all(len(l.split('|')[1]) == 16 and len(l.split('|')[2]) == 16 for l in lcds(out)))


def main():
    global MODO
    if '--js' in sys.argv:
        MODO = 'js'
        print('Probando el Arduino virtual del panel (panel/src/arduino-virtual.js)')
    else:
        MODO = 'paridad' if '--paridad' in sys.argv else 'cpp'
        BANCOS['normal'], avisos = compilar()
        BANCOS['dht22'], _ = compilar(['-DTIPO_DHT=DHT22'])
        ok('El banco compila sin advertencias en el código del invernadero', not avisos, avisos)
    for esc in (escenario_arranque, escenario_riego_normal, escenario_sin_efecto, escenario_sensor_suelo,
                escenario_calor_frio, escenario_falla_dht, escenario_manual, escenario_tope_hora, escenario_ordenes,
                escenario_luz, escenario_calibracion, escenario_eeprom, escenario_variantes):
        esc()
    if MODO == 'paridad':
        print('Paridad con el Arduino virtual del panel')
        distintos = [p for p in PARIDAD if not p[1]]
        ok(f'El Arduino virtual responde byte a byte igual que el programa real ({len(PARIDAD)} guiones)',
           PARIDAD and not distintos, distintos[0][2] + '\n' + distintos[0][0] if distintos else '')
    fallas = [r for r in resultados if not r[1]]
    nombre = {'cpp': 'ARDUINO', 'js': 'ARDUINO VIRTUAL', 'paridad': 'ARDUINO + PARIDAD'}[MODO]
    print(f'\n{nombre}: {len(resultados) - len(fallas)} de {len(resultados)} comprobaciones')
    sys.exit(1 if fallas else 0)


if __name__ == '__main__':
    main()
