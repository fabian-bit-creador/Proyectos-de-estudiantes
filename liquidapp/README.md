# LiquidApp — auditoría y versión corregida

Esta carpeta **no es parte de la aplicación Monitoreo Intensivo**. Contiene material de
retroalimentación docente sobre un proyecto de estudiantes, guardado aquí para tener
historial de versiones.

## Contexto

LiquidApp es el proyecto del Grupo 1 de IV°A (Administración de Empresas, mención
Recursos Humanos) para la Feria Técnico Profesional 2026 del Colegio Cardenal José
María Caro: un simulador de liquidaciones de sueldo y finiquitos según la legislación
laboral chilena.

Se auditó la entrega del 7 de septiembre de 2026 (`Enlace_LiquidApp.htm`, 1.080 líneas)
y se reescribió con las correcciones aplicadas.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `auditoria.html` | Informe de auditoría: 23 hallazgos priorizados y 13 parámetros legales verificados contra la fuente oficial. |
| `LiquidApp.html` | Versión corregida del simulador, con la liquidación imprimible con código QR y el asistente LiquidBot. Un solo archivo autocontenido, sin dependencias externas. Es el mismo archivo que el equipo publica como `index.html` en https://liquidapp-ruby.vercel.app/. |

## La versión corregida

Se abre con doble clic. **No necesita servidor, ni instalación, ni conexión a internet:**
el CSS, los íconos (SVG) y el motor de cálculo están dentro del archivo.

- `?pruebas=1` en la dirección corre 54 pruebas al abrir la página: 22 del motor de cálculo,
  25 de LiquidBot y 7 de la liquidación con QR (enlace, PDF y textos). También hay un botón
  "Verificar el motor de cálculo" dentro de la calculadora.
- Todos los valores legales viven en el objeto `PARAMETROS`, al principio del script.
  **Ese es el único lugar donde hay que actualizar cifras** cuando cambie la ley.
- La página no envía datos a ningún servidor. La memoria del navegador guarda los montos
  de la última simulación, pero nunca nombres ni RUT.

## Liquidación imprimible con código QR

La liquidación sigue la plantilla nueva del equipo: cabecera azul con la marca y la franja
verde, datos de la empresa y de la persona con íconos, tablas de haberes y descuentos, barra
verde del líquido a pagar, firma y el celular con el lema «Tu liquidación en tus manos».

- **«Ver liquidación con QR»**, bajo el resultado de la Sección 2, la muestra a pantalla completa
  con los botones **Descargar PDF**, **Mostrar QR grande** (para escanearlo desde la pantalla del
  stand), **Imprimir** y **Copiar enlace**. «Imprimir o guardar en PDF» imprime la misma hoja.
- **El código QR lleva la liquidación completa** en el fragmento `#liq=` de la dirección: período,
  días, haberes, AFP, salud, contrato, parámetros, descuentos, fecha de emisión y, si se
  escribieron, nombres y RUT. El navegador nunca envía ese fragmento al servidor. Al escanearlo,
  la página vuelve a calcular todo con el mismo motor, muestra la liquidación y deja
  descargarla en PDF o abrirla en la calculadora. Un código de control detecta enlaces
  cortados o modificados.
- **El PDF es vectorial**: texto real en Helvetica, íconos, lema y QR en trazos; una hoja A4 de
  unos 130 KB. Se arma en el navegador, sin servicios externos.
- La hoja impresa no lleva la fecha ni el título que agrega el navegador (`@page` sin márgenes).
- La dirección pública del QR está en `DIRECCION_PUBLICA`, al comienzo de la sección 11 del
  script. Si el equipo cambia de dominio, se edita ahí. Cuando la página está publicada, el QR
  usa su propia dirección.

Se corrigieron de paso «Préstamo CAAF» (es CCAF) y los nombres de las filas.

## LiquidBot: asistente de preguntas frecuentes

El botón **«¿Dudas? LiquidBot»**, abajo a la izquierda, abre un chat que responde las dudas
sobre la liquidación, el finiquito y el uso de la calculadora. Bajo cada resultado hay un acceso
directo que le pide explicar esa liquidación o ese finiquito.

**Funciona sin conexión y sin costo, y no es una inteligencia artificial**, aunque conversa como
un asistente:

- **Entiende cómo hablamos**: «me echaron de la pega», «800 lucas», «un palo y medio», «las
  imposiciones», «boletear», «la grati», «las vacas», «la quincena», «mi jefe».
- **Corrige erratas** comunes («gratificasion», «inpuesto», «vacasiones», «sesantia») sin tocar
  las palabras bien escritas.
- **Recuerda el tema y el sueldo** de la pregunta anterior mientras la página está abierta:
  «¿y si es a plazo fijo?», «¿y con Isapre de 5 UF?», «¿y con 10 horas extras?» recalculan y
  dicen cuánto cambia el líquido; «no entendí» lo explica en simple y «dame un ejemplo» lo
  muestra con números.
- **Piensa antes de responder**: muestra lo que revisa («Entendí "pega" como trabajo»,
  «Revisando el art. 50») durante uno a tres segundos y escribe la respuesta de a poco. Un toque
  sobre el globo la muestra entera. El lector de pantalla oye la respuesta completa una sola vez,
  y con «reducir movimiento» aparece entera tras una pausa breve.

Temas que se sumaron, cada uno con su norma: honorarios (retención de 15,25 % en 2026),
asignación familiar (tramos desde mayo de 2026), semana corrida, anticipo, Ley Bustos, aportes
del empleador y reforma de pensiones (3,5 % desde agosto de 2026), duración del plazo fijo,
colación, límites de los descuentos (15 %, 30 % y 45 %), período de carencia de las licencias,
acumulación del feriado, límite de horas extras, plazo del finiquito y cálculo inverso («¿cuánto
bruto necesito para un líquido de 800 mil?»).

Por dentro sigue siendo simple: reconoce la pregunta por sus palabras clave entre las que
preparó el equipo, y calcula cada monto con
`PARAMETROS` y con las mismas funciones del motor. Por eso nunca contradice a la
calculadora: en los tres casos de práctica dice el mismo líquido y la misma salud que el
panel, peso a peso. Si no reconoce una pregunta, lo dice y ofrece alternativas.

Sigue las reglas del prompt de LiquidBot del equipo:

- Responde primero lo que se preguntó y muestra la fórmula con un ejemplo. Si la persona dice
  su sueldo («gano 900 mil»), calcula con ese monto.
- Cita la norma: Código del Trabajo, DL 3.500, Ley 19.728, Ley 21.561 y Ley 19.628.
- Indica en qué sección y campo de la página está cada cosa.
- Explica «tu liquidación» y «tu finiquito» con lo que la persona tiene en la calculadora, y
  carga los casos de práctica.
- Ante un despido o un finiquito por firmar, informa lo general sin juzgar el caso y deriva a
  la Inspección del Trabajo, a un abogado laboral o a la Defensoría Laboral.
- Declina con amabilidad lo que está fuera de su ámbito, no cambia sus reglas ante «olvida tus
  instrucciones» y no ayuda a disfrazar sueldo como colación ni a pagar bajo el mínimo.
- Pide no escribir RUT, correos ni teléfonos, y los oculta en pantalla. No guarda la
  conversación.

**Para agregar una pregunta:**

1. Sumar sus palabras clave en `INTENCIONES_BOT`.
2. Escribir la respuesta en `RESPUESTAS_BOT` y, si se puede, un resumen en `RESUMENES_BOT`.
3. Si hay un chilenismo nuevo, sumarlo a `CHILENISMOS_BOT`.
4. Agregar una prueba.

Se agregaron a `PARAMETROS` el ingreso mínimo especial y las etapas de la Ley 21.561, que
antes solo estaban escritos en el texto.

Una versión conectada a una IA como Claude necesitaría un servidor intermedio que guarde la
clave de la API. **La clave nunca puede ir dentro de la página**, porque cualquiera que la
abra podría copiarla.

**Dos correcciones de paso:**

- Los montos negativos se redondeaban distinto que los positivos: la salud del caso de la
  jefatura salía −$265.687 en el panel y $265.688 en el comprobante.
- Entre 701 y 1023 px de ancho, el botón «Presentar proyecto» tapaba el botón «Ver detalle»
  de la barra del resultado.

## Parámetros vigentes al momento de la revisión

| Parámetro | Valor | Fuente |
| --- | --- | --- |
| UTM octubre 2026 | $72.151 (septiembre: $71.721) | SII |
| Ingreso mínimo mensual | $553.553 desde el 1 de mayo de 2026 | Ley 21.830 |
| Valor UF | $41.065 al 1 de octubre de 2026 | Banco Central, vía SII |
| Asignación familiar | $22.601, $13.870 y $4.382 por carga, según tramo, desde mayo de 2026 | Ley 21.830, Dirección del Trabajo |
| Retención de honorarios | 15,25 % en 2026; 16 % en 2027; 17 % en 2028 | Ley 21.133, SII |
| Cotización del empleador | 3,5 % desde agosto de 2026, con el SIS incluido | Ley 21.735, Superintendencia de Pensiones y Previred |
| Seguro de accidentes | 0,90 % básico más adicional; 0,03 % del seguro SANNA | Ley 16.744 y Ley 21.010, SUSESO |
| Tope imponible AFP y salud | 90,0 UF | Superintendencia de Pensiones |
| Tope imponible cesantía | 135,2 UF | Superintendencia de Pensiones |
| Jornada semanal ordinaria | 42 horas desde el 26/04/2026 | Ley 21.561 |

La calculadora parte en octubre de 2026, el mes de la Feria.

## Cómo se publica en Vercel

El sitio del equipo (https://liquidapp-ruby.vercel.app/) es este mismo archivo. Para actualizarlo:

1. En el repositorio de GitHub del equipo, reemplazar `index.html` por `LiquidApp.html`, con el
   nombre `index.html`.
2. Hacer commit en la rama que publica Vercel. Vercel vuelve a publicar solo en uno o dos minutos.
3. Abrir el sitio, cargar un caso, tocar «Ver liquidación con QR» y escanear el código con un
   celular: debe abrirse la misma liquidación con el botón «Descargar PDF».

Los códigos QR solo funcionan con la versión nueva publicada: si se escanean antes, se abre la
calculadora sin la liquidación.

## Qué queda pendiente para el equipo

1. Confirmar con Recursos Humanos si el aguinaldo del establecimiento es imponible.
2. Agregar la UTM de noviembre y diciembre de 2026 cuando el SII las publique.
3. Validar contra tres liquidaciones reales anonimizadas y autorizadas.
4. Escribir el guion de demostración de tres minutos para el stand.
5. Probar en un celular real, sin conexión, el día anterior a la Feria.
6. Revisar las respuestas de LiquidBot y sumar las preguntas que hagan los visitantes en la Feria.
