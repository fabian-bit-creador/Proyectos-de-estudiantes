"""Compara el programa real (C++) con el Arduino virtual del panel (JavaScript)
usando guiones al azar: sensores con valores extremos, órdenes válidas e
inválidas, el botón y saltos de tiempo. Ambos deben responder byte a byte igual.

Uso: python3 pruebas/paridad_aleatoria.py [cantidad_de_guiones] [semilla]
Requiere g++ y node. Primero compila el banco con probar_arduino.py.
"""
import random
import subprocess
import sys
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent
BANCO = AQUI / 'simulador' / 'banco'
BANCO_JS = AQUI / 'banco.js'

ORDENES = [
    'ESTADO', 'CONFIG', 'AYUDA', '?', 'MODO AUTO', 'MODO MANUAL', 'MODO', 'MODO RAPIDO',
    'REGAR', 'REGAR 3', 'REGAR 30', 'REGAR 31', 'REGAR 0', 'REGAR -2', 'REGAR 2.6', 'REGAR OFF',
    'BOMBA ON', 'BOMBA ON 12', 'BOMBA ON 45', 'BOMBA OFF', 'BOMBA', 'BOMBA X',
    'EXTRACTOR ON', 'EXTRACTOR OFF', 'VENT ON', 'VENT OFF', 'LUZ ON', 'LUZ OFF', 'LUZ', 'LUZ 1',
    'SET SUELO 35 55', 'SET SUELO 40 60', 'SET SUELO 60 50', 'SET SUELO 5 10', 'SET SUELO 90 100', 'SET SUELO 3 9',
    'SET TEMP 15 28', 'SET TEMP 12.5 30', 'SET TEMP 30 28', 'SET TEMP 0 3', 'SET TEMP -1 20', 'SET TEMP 20,5 24',
    'SET HUM_AIRE 85', 'SET HUM_AIRE 40', 'SET HUM_AIRE 120', 'SET LUZ 30', 'SET LUZ 95',
    'SET RIEGO 5 60 6', 'SET RIEGO 2 10 3', 'SET RIEGO 30 600 20', 'SET RIEGO 1 9 1', 'SET RIEGO 4 20',
    'SET BOMBA_HORA 120', 'SET BOMBA_HORA 10', 'SET BOMBA_HORA 5', 'SET PH 5.5 7.5', 'SET PH 5,8 7.2',
    'SET PH 7 7.2', 'SET PH 0 14', 'SET NADA 1',
    'SENSOR PH ON', 'SENSOR PH OFF', 'SENSOR LDR ON', 'SENSOR LDR OFF', 'SENSOR LDR', 'SENSOR X ON',
    'CAL SUELO SECO', 'CAL SUELO MOJADO', 'CAL SUELO', 'CAL PH 7', 'CAL PH 4', 'CAL PH 10', 'CAL PH 9', 'CAL',
    'ALARMAS RESET', 'RESET', 'FABRICA', 'BAILAR', 'set suelo 30 50', '  regar   4  ', 'Regar 2',
    'X' * 70, 'SET TEMP 15 28 99 99 99 99', 'ñandú', 'REGAR 1e3', '-', 'SET PH . 7',
]


def guion_al_azar(r):
    lineas = ['sinlcd'] if r.random() < 0.1 else []
    lineas += ['inicio', 'avanzar %d' % r.choice([10, 500, 3000, 4000])]
    for _ in range(r.randint(20, 60)):
        x = r.random()
        if x < 0.15:
            lineas.append('suelo %d' % r.choice([0, 3, 6, 200, 350, 500, 640, 700, 850, 990, 1014, 1015, 1023, r.randint(0, 1023)]))
        elif x < 0.22:
            lineas.append('ph %d' % r.choice([0, 15, 400, 512, 515, 620, 700, 1003, 1023, r.randint(0, 1023)]))
        elif x < 0.27:
            lineas.append('ldr %d' % r.randint(0, 1023))
        elif x < 0.37:
            if r.random() < 0.15:
                lineas.append('dht nan')
            else:
                lineas.append('dht %s %s' % (r.choice(['-4.5', '0', '14', '15', '18.3', '22', '26.5', '28', '29.95', '31', '40']),
                                             r.choice(['20', '55.4', '60', '79.5', '84.6', '85', '90', '99.9'])))
        elif x < 0.62:
            lineas.append('serie ' + r.choice(ORDENES))
        elif x < 0.67:
            lineas.append('boton %d' % r.randint(0, 1))
        elif x < 0.73:
            lineas.append(r.choice(['pines', 'lcd']))
        else:
            lineas.append('avanzar %d' % r.choice([10, 20, 100, 490, 1000, 2500, 5000, 30000, 61000, 120000, r.randint(10, 700000)]))
    lineas += ['avanzar 3000', 'pines', 'lcd']
    return '\n'.join(lineas) + '\n'


def correr(args, guion):
    r = subprocess.run(args, input=guion.encode('utf-8'), capture_output=True, timeout=300)
    if r.returncode:
        raise RuntimeError(r.stderr.decode('utf-8', 'replace'))
    return b'\n'.join(l for l in r.stdout.split(b'\n') if not l.startswith(b'E '))


def main():
    cantidad = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    semilla = int(sys.argv[2]) if len(sys.argv) > 2 else 2026
    if not BANCO.exists():
        sys.exit('Falta el banco C++: corre primero python3 pruebas/probar_arduino.py')
    r = random.Random(semilla)
    distintos = 0
    lineas_total = 0
    for i in range(cantidad):
        guion = guion_al_azar(r)
        a = correr([str(BANCO)], guion)
        b = correr(['node', str(BANCO_JS)], guion)
        lineas_total += a.count(b'\n')
        if a != b:
            distintos += 1
            la, lb = a.split(b'\n'), b.split(b'\n')
            k = next(j for j in range(max(len(la), len(lb))) if la[j:j + 1] != lb[j:j + 1])
            print(f'Guion {i}: distinto en la línea {k + 1}\n  C++: {la[k:k + 1]}\n  JS : {lb[k:k + 1]}')
            print('--- guion ---\n' + guion)
            break
    print(f'PARIDAD AL AZAR: {cantidad - distintos} de {cantidad} guiones iguales ({lineas_total} líneas comparadas, semilla {semilla})')
    sys.exit(1 if distintos else 0)


if __name__ == '__main__':
    main()
