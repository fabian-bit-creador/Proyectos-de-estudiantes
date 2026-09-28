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
| `LiquidApp.html` | Versión corregida del simulador, con el asistente LiquidBot. Un solo archivo autocontenido, sin dependencias externas. |

## La versión corregida

Se abre con doble clic. **No necesita servidor, ni instalación, ni conexión a internet:**
el CSS, los íconos (SVG) y el motor de cálculo están dentro del archivo.

- `?pruebas=1` en la dirección corre 39 pruebas al abrir la página: 22 del motor de cálculo
  y 17 de LiquidBot. También hay un botón "Verificar el motor de cálculo" dentro de la calculadora.
- Todos los valores legales viven en el objeto `PARAMETROS`, al principio del script.
  **Ese es el único lugar donde hay que actualizar cifras** cuando cambie la ley.
- La página no envía datos a ningún servidor. La memoria del navegador guarda los montos
  de la última simulación, pero nunca nombres ni RUT.

## LiquidBot: asistente de preguntas frecuentes

El botón **«¿Dudas? LiquidBot»**, abajo a la izquierda, abre un chat que responde las dudas
sobre la liquidación, el finiquito y el uso de la calculadora. Bajo cada resultado hay un acceso
directo que le pide explicar esa liquidación o ese finiquito.

**Funciona sin conexión y sin costo, y no es una inteligencia artificial.** Reconoce la
pregunta por sus palabras clave entre las que preparó el equipo, y calcula cada monto con
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
2. Escribir la respuesta en `RESPUESTAS_BOT`.
3. Agregar una prueba.

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
| UTM septiembre 2026 | $71.721 | SII |
| Ingreso mínimo mensual | $553.553 desde el 1 de mayo de 2026 | Ley de reajuste |
| Valor UF | ≈ $40.875 | Banco Central |
| Tope imponible AFP y salud | 90,0 UF | Superintendencia de Pensiones |
| Tope imponible cesantía | 135,2 UF | Superintendencia de Pensiones |
| Jornada semanal ordinaria | 42 horas desde el 26/04/2026 | Ley 21.561 |

## Qué queda pendiente para el equipo

1. Confirmar con Recursos Humanos si el aguinaldo del establecimiento es imponible.
2. Agregar la UTM de octubre, noviembre y diciembre de 2026 cuando el SII las publique.
3. Validar contra tres liquidaciones reales anonimizadas y autorizadas.
4. Escribir el guion de demostración de tres minutos para el stand.
5. Probar en un celular real, sin conexión, el día anterior a la Feria.
6. Revisar las respuestas de LiquidBot y sumar las preguntas que hagan los visitantes en la Feria.
