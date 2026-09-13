# Proyectos Feria Técnico Profesional 2026 — briefing para continuar el trabajo

**Para quién es este archivo:** cualquier asistente de IA (ChatGPT, Gemini, Claude u otro) que vaya
a ayudar al profesor Fabián Herrera a mejorar las páginas web de los proyectos de sus estudiantes.
Está escrito para que se pueda empezar sin haber visto la conversación anterior.

**Lo esencial en tres líneas:** son proyectos escolares de la especialidad de Administración que se
presentan en una feria el 8 de octubre de 2026. Cada equipo hizo una página web con ayuda de IA y
casi todas tienen los mismos defectos. El trabajo consiste en auditarlas, repararlas y devolverlas
como **un solo archivo HTML que funcione sin internet**.

---

## 1. Contexto

| Dato | Valor |
|---|---|
| Establecimiento | Colegio Cardenal José María Caro |
| Sostenedor | Fundación Belén Educa (sin fines de lucro, Arzobispado de Santiago) |
| Comuna | La Pintana, Santiago, Chile |
| Dirección | San Leandro 0368 · RBD 25779 |
| Especialidad | Administración de Empresas (IV°A con mención en RR.HH.) |
| Cursos involucrados | III°A, III°C, IV°A, IV°B, IV°C |
| Evento | Feria Técnico Profesional 2026 |
| Fecha | **Jueves 8 de octubre de 2026** |
| Docentes a cargo | Fabián Herrera, Daniela Ortega |

**Secuencia de entregas de cada equipo:** Informe Nº1 (comprensión del proyecto) → Informe Nº2
(validación con usuarios y selección de la solución) → Informe Nº3 (prueba del prototipo) → feria.

**Repositorio donde vive todo:** `github.com/fabian-bit-creador/proyectos-de-estudiantes`
(rama `main`). Una carpeta por proyecto, cada una con su `README.md`.

---

## 2. La regla que manda sobre todas las demás

> **El día de la feria puede no haber wifi en el gimnasio.**

De ahí sale casi todo lo que sigue. Cada entregable es **un solo archivo `.html` autocontenido**:

- Sin Tailwind por CDN, sin Google Fonts, sin FontAwesome, sin ninguna librería descargada.
- CSS propio en un `<style>`, íconos como sprite SVG inline, tipografías del sistema.
- Si el proyecto necesita imágenes, van en una carpeta `fotos/` al lado, con un `LEEME.txt` que
  dice el nombre exacto que debe tener cada archivo.
- Debe abrir con doble clic desde un pendrive y funcionar completo.

Verificación rápida de que se cumple: buscar `src="http` o `href="http` en el archivo. Si aparece
algo que no sea un enlace de navegación, está mal.

---

## 3. Las siete reglas de construcción

### 3.1 Tres capas separadas

```
1. DATOS      → constantes que el equipo puede editar (catálogos, parámetros, textos)
2. CÁLCULO    → funciones puras. No tocan el DOM. Reciben datos, devuelven datos.
3. INTERFAZ   → pinta el resultado de la capa 2.
```

La razón no es estética: es que la capa 2 se puede **probar sola**.

### 3.2 Pruebas automáticas dentro del propio archivo

Cada página trae un arreglo de aserciones y un botón **«Verificar el motor»**, más el atajo
`?pruebas=1` en la dirección. Entre 11 y 30 pruebas por proyecto.

```js
var PRUEBAS = [
  ['El tope imponible de AFP se aplica sobre 90 UF', function(){ ... return true/false; }],
  ...
];
```

Esto tiene un uso pedagógico concreto: **si un jurado pregunta si los números están bien, el equipo
aprieta el botón delante de él.** Un proyecto que se verifica solo dice más que cualquier
explicación. Díganselo a los equipos.

### 3.3 Nunca `innerHTML` con texto que escribió otra persona

Comentarios, nombres, conceptos escritos por un usuario van con `textContent` o `createElement`.
`innerHTML` solo con literales del propio archivo. Tres de estos proyectos tenían inyección real.

### 3.4 Los formularios no mienten

Ver §5.1. Es el defecto más repetido y el más grave de cara al jurado.

### 3.5 No inventar datos del establecimiento

Horarios reales, nombres de cargos, protocolos, el PEI: **no se inventan**. Se dejan como espacios
marcados visualmente («Por completar con el colegio») y se listan en la guía del equipo. Es más
honesto y además es mejor pedagogía: obliga al equipo a ir a preguntar.

Lo que sí se puede afirmar, se verifica contra fuente y se cita. Nada de memoria.

### 3.6 Privacidad y normativa chilena

- Ningún dato personal real de estudiantes o funcionarios en las páginas.
- Fotos de personas: requieren autorización de uso de imagen.
- Consultas de clima o satisfacción: anónimas, y con **guardia de anonimato** (no mostrar el
  desglose por debajo de N respuestas, porque con 3 personas mostrar el detalle equivale a decir
  quién respondió qué).
- Referencias legales verificadas contra fuente: Código del Trabajo, topes imponibles en UF,
  tramos del IUSC en UTM, Decreto 67 (evaluación), Ley 21.719 (datos personales),
  Ley 21.643 (Karin), Ley 21.561 (42 horas), Ley 20.609, Ley 21.015.
- **Nunca publicar claves.** En un proyecto había una clave de uso interno que no debía salir a
  una página pública, y se dejó fuera.

### 3.7 Honestidad comercial

Ninguno de estos proyectos es una empresa constituida. Está prohibido dejar en la página:

- «Más elegido por establecimientos» sin clientes reales.
- Correos en dominios que el equipo no posee.
- Cifras inventadas del tipo «100% de satisfacción».
- Promesas de respuesta («respondemos en 48 horas hábiles») si el formulario no envía nada.

La versión correcta es declararlo: «propuesta de diseño, el proyecto no tiene clientes ni precios
definidos». Adelantarse a la pregunta del jurado es mejor argumento que esperarla.

---

## 4. Accesibilidad, idioma y gráficos

**Accesibilidad** (se aplicó en todos):
`role="tab"` + `aria-selected` + navegación con flechas · `aria-live` / `role="alert"` en avisos ·
`:focus-visible` con contorno de 3 px · enlace «saltar al contenido» · `prefers-reduced-motion` ·
contraste verificado, no supuesto.

**Idioma:** todo en español de Chile. `toLocaleString('es-CL')`, coma decimal, y CSV con separador
`;` más el BOM `\uFEFF` al inicio para que Excel en español no rompa los acentos.

**Gráficos:** la paleta se valida, no se elige a ojo.

- **No usar verde y rojo juntos**: son justo los que una persona con daltonismo confunde. En su
  lugar, azul `#1a6ea8` y rojo `#b3252c`, que mantienen separación ΔE 20 en deuteranopía.
- Cada segmento lleva su cifra escrita encima, así el gráfico se lee aunque no se vea ningún color.
- Leyenda siempre presente, y `aria-label` con la descripción numérica en la barra.
- Nunca dos ejes Y en un mismo gráfico.

---

## 5. Catálogo de defectos recurrentes

Esta es la lista real de lo encontrado en siete páginas. **Sirve como checklist para auditar
cualquier página nueva.**

### 5.1 El formulario que dice que envió y no envía — apareció en 3 de 7

El patrón exacto:

```js
form.onsubmit = e => { e.preventDefault(); alert('Consulta registrada...'); form.reset() };
```

Muestra un cartel de éxito, borra lo escrito y no manda nada a ninguna parte. En dos casos los
campos ni siquiera tenían atributo `name`, así que aunque se hubiera intentado enviar no había nada
que enviar.

**La corrección**, si se publica en Netlify (que es lo que usan):

```html
<form name="mi-formulario" method="POST" data-netlify="true" data-netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="mi-formulario">
  <p class="oculto"><label>No llenar: <input name="bot-field" tabindex="-1"></label></p>
  <input type="text" name="nombre" required>
  ...
```

Netlify necesita las cuatro cosas: `name` en el `<form>`, `method="POST"`, `data-netlify="true"`, y
`name` en **cada** campo. Y como el formulario no funciona abriendo el archivo desde el computador,
el botón debe **descargar la solicitud como archivo** en ese caso, en vez de mentir.

### 5.2 Los demás

| # | Defecto | Dónde apareció |
|---|---|---|
| 1 | Login que guarda contraseñas en texto plano en `localStorage` | Kipu |
| 2 | Dependencias de CDN (Tailwind, FontAwesome, Google Fonts) | Kipu, Visión Integral |
| 3 | `<img>` apuntando a un archivo que no viaja con el HTML | Áurea Solutions |
| 4 | `innerHTML` con datos del usuario → inyección de HTML | Expro, Kipu |
| 5 | CSS muerto de una sección que ya se eliminó | Áurea Solutions |
| 6 | Botón «Guardar cambios» que en realidad descargaba un archivo | Expro |
| 7 | Foco perdido en cada tecla porque se re-renderiza toda la tabla | Expro |
| 8 | Variables globales implícitas (`stage`, `title`, `items`) apoyadas en los `id` | Áurea Solutions |
| 9 | Contenido escondido en móvil con `display:none` | Áurea Solutions |
| 10 | Botones de etapa sin estado activo ni navegación por teclado | varios |
| 11 | `.nav a` gana especificidad sobre `.btn--v` → botón ilegible (contraste 1,4:1) | Visión Integral, Áurea |
| 12 | Choque de nombres de clase CSS entre dos componentes | Áurea Solutions |
| 13 | Canvas dibujado mientras está en `display:none` → sale negro | Áurea Solutions |
| 14 | Render inicial dependiente de IndexedDB, que en `file://` puede no resolver nunca | Áurea Solutions |
| 15 | Logo SVG renderizando a tamaño natural y tapando la página | Kipu |
| 16 | RUT ficticio con dígito verificador inválido | Recluta Smart |
| 17 | Error de un mes en conteos de antigüedad (off-by-one) | LiquidApp |
| 18 | Parámetros legales desactualizados o inventados | LiquidApp |
| 19 | Metodología descrita pero nunca ejecutada (no hay herramienta) | Visión Integral, Áurea |
| 20 | Enlace de red social apuntando a `href="#"` | Visión Integral |

**El defecto Nº19 es el más importante conceptualmente.** Varias páginas explicaban muy bien una
metodología de tres o cuatro etapas y no permitían hacer ninguna. El visitante leía la promesa y se
iba sin ver nada funcionando. La reparación no es escribir mejor: es **construir la herramienta**.

---

## 6. Cómo verificar antes de entregar

No basta con que «se vea bien». El método que se usó:

1. **Correr las pruebas del propio archivo** (`?pruebas=1`). Todas en verde.
2. **Abrirlo en un navegador de verdad** y manejarlo: hacer clic en todo, llenar los formularios,
   probar con el teclado. Varios bugs solo aparecen así — los Nº11, 13 y 14 de la tabla salieron
   exactamente en este paso.
3. **Mirar capturas en escritorio y en celular.** El Nº9 y el Nº11 se vieron a simple vista.
4. **Buscar recursos externos**: `grep 'src="http\|href="http'`.
5. **Probar sin conexión**, que es la condición del 8 de octubre.

Si la herramienta con la que se trabaja puede ejecutar un navegador sin interfaz, úsese. Si no,
hay dos caminos que igual funcionan:

- Escribir las pruebas dentro del archivo y **pedirle al profesor que abra la página y apriete el
  botón**, y que mande una captura.
- Pedirle que abra la consola del navegador (F12) y pegue lo que aparezca en rojo.

Lo que **no** sirve es entregar sin haber ejecutado nada.

---

## 7. Estado de cada proyecto

| Proyecto | Curso | Estado | Pruebas |
|---|---|---|---|
| LiquidApp | IV°A | Entregado | 22 |
| Recluta Smart | IV°A | Entregado | 17 |
| Kipu | III°A | Entregado | 11 |
| Expro | III°A | Entregado | 13 |
| GLM | III°A y IV°A | Entregado | 13 |
| Visión Integral | IV°A | Entregado | 22 |
| Áurea Solutions | IV°A | Entregado y actualizado con sus informes | 30 |
| **Empresa 360** | **III°A** | **Pendiente** — el equipo hizo una actualización que todavía no llega | — |

### LiquidApp — simulador de liquidaciones de sueldo y finiquitos
Equipo: Andrés Berríos, Angelo Díaz, Bastián Luna, Bastián Pérez.
Auditoría de 23 hallazgos. Correcciones principales: topes imponibles (90 UF y 135,2 UF), los dos
tramos superiores del IUSC, piso del 7% en Isapre, feriado en días corridos, jornada de 42 horas,
aguinaldos fuera de la base de gratificación.
**Restricción del profesor:** *«No pueden ingresar remuneraciones reales ni operar como sistema de
nómina.»* Todo es un simulador educativo con casos ficticios.

### Recluta Smart — reclutamiento y selección docente
Se conservó su catálogo de 26 cargos tal cual. Se agregó evaluador por competencias basado en el
**MBE 2021**, comparador con criterio de desempate declarado, pauta de entrevista STAR y un
**revisor de avisos discriminatorios**.
**Restricción:** *«Eviten filtros discriminatorios y no atribuyan la rotación al reclutamiento sin
evidencia.»*

### Kipu — contabilidad para PYME
Se reparó sobre su propio código (260 KB, no se reescribió). Tres arreglos: el logo que bloqueaba
la página, **se eliminó el login que guardaba contraseñas en texto plano** (decisión aprobada por el
profesor: quitarlo y explicar por qué), y se sacaron los CDN generando el CSS equivalente.

### Expro — gestión para microempresas, caso «La Esquina»
Inyección de HTML en las tablas, guardado real, punto de equilibrio.

### GLM — sitio del equipo de gestión de la feria
Logo recreado en SVG, tres carruseles, 33 espacios para fotos, cronograma, mapa del colegio.
**Restricción:** la clave de la aplicación interna de GLM **no se publica** en una página pública.

### Visión Integral — clima laboral educativo
Equipo: Daniel Cayupe, Zamara Pavez, Sofía Barrientos, Trinidad González. Informe Nº1: 30/30.
Instrumento de cuatro pasos (mapeo → consulta anónima → análisis → microintervención), con guardia
de anonimato configurable e ítems invertidos.
**Restricción:** *«una sola dimensión, consulta anónima y autorizada, evitar evaluaciones 360°,
180° o 90° sin justificación».*

### Áurea Solutions — inducción de docentes nuevos
Equipo: Sofía Muñoz, Anhais Molina, Pascal Delgado. Informe Nº1: 28/30.
El más elaborado: **Mapa Caro**, un recorrido de 16 paradas con visor de fotos 360° equirectangulares
escrito en WebGL a mano (sin librerías), que detecta solo si la foto es 360 o normal. Más ruta del
docente nuevo, checklist, capacitación Syscol, semáforo de integración para el estand, glosario de
36 siglas escolares y la evidencia de su encuesta a 17 docentes graficada.
**Pendiente del equipo:** las fotos del Mapa Caro y llenar su carpeta de Drive.

---

## 8. Qué falta

1. **Empresa 360 (III°A)** — es lo siguiente. El equipo hizo una actualización que el profesor va a
   compartir. Retroalimentación previa del docente: *«La mirada administrativa es adecuada, pero el
   documento se detiene en identidad y acuerdos. Seleccionen una PYME real y un proceso prioritario;
   completen desafío, evidencia, preguntas, investigación, Gantt y reflexiones.»*
2. **Áurea Solutions** — si llega el código exportado de base44, comparar las dos versiones.
3. **Dos ramas huérfanas** llamadas `claude/liquidapp-audit-improve-lau5mv` (una en cada repositorio)
   que solo el profesor puede borrar desde la interfaz de GitHub.

---

## 9. Cómo trabajar con el profesor

- **Escribe en español de Chile.** Las guías para estudiantes también.
- **Le importa la honestidad por sobre el lucimiento.** Si algo no se puede hacer, hay que decirlo
  con esa palabra y ofrecer lo más cercano. Si una fuente está bloqueada o un dato no se puede
  verificar, se informa; no se rellena con algo plausible.
- **El entregable es el archivo HTML mejorado, y nada más.** No hace falta redactar guías ni
  manuales para los estudiantes: lo que se cambió se explica en la respuesta del chat y en el
  `README.md` de la carpeta, en pocas líneas. El profesor reenvía el HTML al equipo como opción.
- **Alinear cada mejora con la retroalimentación que él ya escribió** en sus informes. Está en los
  documentos de seguimiento y es vinculante: si él pidió «una ruta piloto para un solo cargo», la
  página se construye así, literalmente.
- **Leer los informes del equipo antes de proponer.** En Áurea Solutions los informes cambiaron
  cosas de fondo: el equipo eran tres personas y no cuatro, la validación con RR.HH. ya estaba
  hecha, y el recorrido que se había construido resultó ser un entregable que ellos ya tenían
  definido con otro nombre. Sin leer los informes, se trabaja a ciegas.

---

## 10. Sugerencia de reparto

Para no duplicar trabajo ni pisarse:

| Tarea | Buena para un asistente que… |
|---|---|
| Auditar una página con el checklist de §5 | …puede leer archivos largos con cuidado |
| Verificar parámetros legales chilenos | …tiene búsqueda web y cita la fuente |
| Reescribir el HTML completo | …puede generar y entregar archivos grandes |
| Probar que funciona | …puede ejecutar código o un navegador |
| Diseño visual y paleta | …valida contraste y daltonismo, no elige a ojo |

Lo importante es que **cualquiera que toque un archivo lo entregue verificado**, con sus pruebas en
verde, y anote en el `README.md` de la carpeta qué cambió.

---

## 11. Prompt para empezar

> Vas a ayudarme con los proyectos de la Feria Técnico Profesional 2026 de mi colegio. Te adjunto
> el briefing con el contexto, las reglas de construcción y el catálogo de defectos que ya
> encontramos en siete páginas: léelo completo antes de responder.
>
> Te voy a pasar la página de un equipo. Quiero que:
> 1. La audites contra el checklist del punto 5, sin saltarte ninguno.
> 2. Me digas primero el problema **más grave**, con el código exacto que lo produce.
> 3. La reescribas como **un solo archivo HTML sin dependencias externas**, porque el día de la
>    feria puede no haber wifi.
> 4. Le pongas pruebas automáticas adentro, con botón «Verificar el motor».
> 5. Me resumas en pocas líneas, en el chat, qué cambiaste y qué queda pendiente para el equipo.
>    **No me escribas una guía ni un manual aparte: solo el archivo HTML.**
>
> Si algo no lo puedes verificar, dímelo en vez de inventarlo.

---

*Documento preparado el 13 de septiembre de 2026, a 25 días de la feria.*
*Repositorio: `github.com/fabian-bit-creador/proyectos-de-estudiantes`*
