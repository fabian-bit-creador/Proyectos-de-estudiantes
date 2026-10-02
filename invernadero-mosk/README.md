# MOS-K Green Tech · Invernadero inteligente

IV°C Electrónica · Feria Técnico Profesional 2026. Equipo «Mosquitas del Invernadero» (5 integrantes).
Sitio del equipo: https://mos-kgreentech.netlify.app/

El invernadero mide temperatura y humedad del aire, humedad del suelo, pH y (si se conecta) luz;
riega solo, ventila con calor o humedad y enciende la luz térmica con frío. Esta carpeta trae
**el programa del Arduino UNO** y **un panel para el computador** que se conecta por USB.

## Qué hay aquí

| Archivo | Para qué |
| --- | --- |
| `InvernaderoMOSK/` | El programa del Arduino. Se abre `InvernaderoMOSK.ino` en el Arduino IDE. Pines, tipo de DHT y lógica de los relés están en `config.h`. |
| `PanelInvernadero.html` | El panel. Se abre con Chrome o Edge, botón **Conectar Arduino**. Lecturas en vivo, bomba/extractor/luz a mano, gráficos con exportación a Excel (CSV), ajustes, calibración del suelo y del pH, consola y la **guía de armado** con conexiones y fallas comunes. Funciona sin internet. |
| `panel/` | Código fuente del panel. `python3 panel/construir.py` vuelve a armar el HTML. |
| `pruebas/` | Pruebas del programa del Arduino y del panel (ver abajo). |

Sin el Arduino a mano, **Probar sin Arduino** abre una simulación: el mismo programa corriendo en
el navegador con una planta de mentira (clima, estanque vacío, sensor suelto, sonda en soluciones
de calibración). Está marcada como simulación en toda la pantalla.

## Puesta en marcha

1. Arduino IDE 2 con dos bibliotecas: **DHT sensor library** (Adafruit, con *Adafruit Unified
   Sensor*) y **LiquidCrystal I2C** (Frank de Brabander).
2. Conectar según la tabla. Todos los módulos llevan además 5V y GND, salvo el sensor de suelo,
   que toma su VCC de D4 para corroerse menos.
3. Subir el programa a la placa **Arduino UNO** y cerrar el Monitor Serie.
4. Abrir `PanelInvernadero.html`, **Conectar Arduino** y calibrar en la pestaña **Calibrar**.

| Pin | Va a | | Pin | Va a |
| --- | --- | --- | --- | --- |
| D2 | DHT · DATA | | A1 | Módulo de pH · Po |
| D3 | Pulsador «Regar ahora» (a GND) | | A2 | LDR a 5V y 10 kΩ a GND (opcional) |
| D4 | FC-28 · VCC | | A4 / A5 | LCD I2C · SDA / SCL |
| A0 | FC-28 · A0 | | D7 · D8 · D9 | Relés: bomba · extractor · luz térmica |

## Cómo decide

- **Riego por ciclos:** bajo 35 % de humedad del suelo, la bomba funciona 5 s, espera 60 s a que
  el agua llegue al sensor y vuelve a medir, hasta 55 % o 6 ciclos. Si la humedad no sube 5 puntos,
  se detiene con la alarma «riego sin efecto» (estanque vacío, manguera suelta, bomba o sensor).
  Además, la bomba nunca pasa de 120 s por hora.
- **Extractor** con 28 °C o con 85 % de humedad del aire; **luz térmica** con 15 °C o menos. Con
  histéresis y 30 s entre cambios para no golpear los relés. La luz nunca se enciende con calor ni
  si el sensor de temperatura falla; en ese caso el extractor queda encendido por precaución.
- **pH:** se mide y se avisa. Regar no corrige el pH.
- Todos los valores se cambian desde el panel y quedan en la EEPROM del Arduino.

## Diferencias con lo que tenía el equipo

- La presentación usa **DHT11** y el sitio dice **DHT22**: el programa viene para DHT11; para
  DHT22 se cambia una línea en `config.h`.
- El tablero del sitio muestra datos simulados con el texto «Arduino UNO en línea». Conviene
  aclarar que es una simulación, o enlazar este panel.
- **Luz térmica de 220 V:** la conexión al relé la hace o revisa el profesor, con el lado de 220 V
  en una caja aislada. Para la feria se sugiere una de 12 V.
- La bomba y el extractor van con fuente propia, no desde el pin 5V del Arduino.

## Cómo se verificó

- El programa compila para Arduino UNO: 25.056 bytes de memoria de programa (77 %) y 814 bytes de
  RAM (39 %), sin advertencias en el código del proyecto. Variante DHT22, igual.
- `python3 pruebas/probar_arduino.py`: **74 comprobaciones** del programa real, compilado con g++
  sobre un Arduino simulado (riego, alarmas, extractor, luz, botón, órdenes, calibración, EEPROM,
  sin pantalla y DHT22).
- El Arduino del modo simulación es una copia en JavaScript del programa. `--paridad` y
  `pruebas/paridad_aleatoria.py` comparan ambos **byte a byte**: 23 guiones de los escenarios y
  680 guiones al azar (unas 216.000 líneas), todos idénticos.
- `node pruebas/probar_panel.js` o `?pruebas=1` en la dirección: **22 pruebas** del panel, entre
  ellas la huella de la salida del programa compilado.
- En Chromium: simulación completa; conexión USB con un puerto simulado (cancelar, puerto
  ocupado, desenchufar y volver a enchufar, Arduino que no se reinicia, datos ilegibles);
  accesibilidad con axe (WCAG 2.1 AA) sin observaciones; celular de 390 px sin desborde.
- **No se probó con el hardware real.** Al armarlo, revisar: dirección de la pantalla (el saludo
  del Arduino en la Consola dice `"lcd":"0x27"` o `"0x3F"`), si los relés se activan con LOW, y
  la calibración del FC-28 y de la sonda.

## Pendientes del equipo

- Probar con el invernadero armado y calibrar el sensor de suelo y la sonda de pH (soluciones pH 7
  y pH 4).
- Definir la luz térmica y su conexión con el profesor.
- Ensayar la demostración del botón **Presentar proyecto** (3 pasos para el stand).
