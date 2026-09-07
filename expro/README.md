# Expro — Gestión operativa para microempresas (versión reparada)

Proyecto del equipo Expro, III°A, para la Feria Técnico Profesional 2026 del Colegio
Cardenal José María Caro. Caso de aplicación: el almacén familiar «La Esquina».

Se revisó la entrega original (`exprolaesquina.html`, 1.137 líneas) y se reconstruyó
conservando la identidad visual, los datos de ejemplo y la estructura de tres planillas.

## Los tres errores que se corrigieron

### 1. Inyección de HTML en las tablas

Las filas se armaban concatenando texto:

```js
tbody.innerHTML += `<td><input value="${item.concepto}"></td>`
```

Bastaba escribir un concepto con comillas dobles para romper la tabla, y era posible
inyectar código ejecutable. Ahora las filas se construyen con `createElement` y `.value`,
así que el navegador trata el texto siempre como texto. Hay una prueba automática que lo
verifica con `<img src=x onerror=alert(1)>`.

### 2. «Guardar Cambios» no guardaba

```js
function guardarDatos() { exportarDatos(); }
```

El botón descargaba un archivo JSON. No había `localStorage`, así que al recargar la
página se perdía todo el trabajo. Ahora **los datos se guardan solos** en el navegador
cada vez que se edita algo, y exportar quedó como lo que realmente es: una copia de
seguridad.

### 3. El foco se perdía al escribir

Cada edición volvía a dibujar la tabla completa con `innerHTML`, lo que destruía el campo
que se estaba usando. Ahora editar una celda **solo recalcula los totales y el gráfico**;
la tabla se redibuja únicamente al agregar o eliminar filas.

## Otras correcciones

- **Sin dependencias externas.** Se quitaron Google Fonts, Font Awesome y Chart.js. El CSS
  es propio, los iconos son SVG dentro del archivo y los gráficos se dibujan a mano en SVG.
  La página funciona con el computador desconectado.
- **Formato chileno.** `toLocaleString()` sin idioma mostraba `450,000`; ahora usa `es-CL`
  y muestra `450.000`.
- **Pestañas accesibles**: `role="tab"`, `aria-selected`, y navegación con las flechas del
  teclado.
- **El gráfico agrupa por categoría** en vez de dibujar una barra por movimiento suelto,
  que no permitía ver dónde se va el dinero.
- **Los datos se declaran ficticios** en un aviso permanente, y se explica que trabajar con
  cifras reales del negocio requiere autorización de sus dueños.

## Lo que se agregó

### Punto de equilibrio

La página prometía «análisis de flujos de efectivo, punto de equilibrio y presupuesto»
pero no calculaba ninguno. Ahora el punto de equilibrio funciona:

- margen de contribución = precio de venta − costo variable;
- equilibrio en unidades = costos fijos ÷ margen de contribución;
- comparación con las ventas reales del mes, en un gráfico;
- si el costo variable iguala o supera al precio, avisa que **no hay equilibrio posible**:
  vender más agranda la pérdida, y el problema es el precio o el costo, no el volumen.

El diagnóstico traduce la diferencia a una meta de mostrador: cuántos productos más hay
que vender por día.

### Distinción entre caja y contabilidad

La planilla se llamaba «Registro Contable Simplificado», pero es un libro de caja. Ahora
se llama así y hay una nota que explica la diferencia: el libro de caja responde «¿tengo
plata?» y la contabilidad formal «¿estoy ganando?».

## Alcance

La retroalimentación docente pedía trabajar **uno o dos procesos** en vez de abarcar
contratos, remuneraciones, turnos, asistencia y seguridad a la vez. La página ahora declara
un proceso prioritario —el control de caja diario— y marca en la sección «Áreas Expro»
cuáles están en uso y cuáles quedan en planificación.

## Cómo usarlo

Se abre con doble clic. No necesita servidor, instalación ni internet.

- `?pruebas=1` en la dirección ejecuta las 13 pruebas del motor al abrir.
- Las funciones `calcularCaja()` y `calcularEquilibrio()` son puras: reciben números y
  devuelven números, sin tocar la página. Por eso se pueden probar solas.

## Qué queda pendiente para el equipo

1. Levantar las tres líneas base de la sección «El caso»: hoy están en cero.
2. Conversar con los dueños de La Esquina si quieren usar cifras reales, y en ese caso
   pedir autorización por escrito.
3. Verificar el precio de venta promedio y el costo variable con datos del negocio: son
   los dos números que más mueven el punto de equilibrio.
4. Probar en un celular real, sin conexión, antes del 8 de octubre.
