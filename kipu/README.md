# Kipu — Contabilidad PYME

Proyecto del equipo Kipu, III°A, para la Feria Técnico Profesional 2026 del Colegio
Cardenal José María Caro.

Esta copia parte de **la versión que el equipo publica en https://kipucl.netlify.app**
(revisada el 7 de octubre de 2026), que ya incluía las reparaciones anteriores y todo lo
que el equipo agregó después: fundamentos interactivos, estados financieros, libros y
cuentas T, facturación, SII, renta y gastos, contratos, modo guía y asistente de voz.
Sobre esa base se agregaron **dos casos de práctica** y una pestaña de **resultados del
negocio**, y se corrigieron seis problemas de la versión publicada.

## Lo nuevo

### Casos de práctica

Dos PYME ficticias de La Pintana, con un mes completo (septiembre de 2026) cada una. Al
cargar un caso se llenan las secciones de siempre —Ventas, Compras, Inventario, Clientes
y proveedores, Caja diaria y Perfil del dueño—, así que el visitante recorre Kipu como si
fuera el dueño.

| Caso | Qué le pasó | Qué enseña |
| --- | --- | --- |
| **Almacén Doña Rosa** | Vendió $3.466.700 y **ganó $454.140**, pero su plata solo subió $309.630. | Ganar plata no es lo mismo que tener plata: el fiado, la mercadería y los retiros para la casa. |
| **Ferretería El Maestro** | Vendió $8.901.660 —más del doble— y **perdió $106.660**. Necesitaba vender $9.573.000. | Vender mucho no es ganar: margen de 15,9 %, punto de equilibrio y crédito del proveedor. |

- Mientras hay un caso cargado, un aviso arriba de cada sección lo recuerda.
- **Los datos propios no se pierden**: Kipu los guarda aparte y los devuelve exactos al
  salir del caso, aunque se haya cambiado de un caso a otro.
- Los números se generan siempre iguales (generador con semilla), y cuadran: el libro de
  caja sale de las mismas ventas, compras, gastos y retiros.
- Personas, negocios y proveedores son ficticios y están marcados como tales.

### Resultados del negocio

Una pestaña que responde las tres preguntas de todo dueño con sus propios registros:

| Pregunta | Cómo se calcula |
| --- | --- |
| **¿Gané o perdí?** | ventas − costo de la mercadería vendida − gastos |
| **¿Qué tengo?** | plata en caja y banco + fiado por cobrar + mercadería a costo + equipos |
| **¿Qué debo?** | facturas de proveedores impagas + cuentas por pagar + préstamos |
| **¿Qué es mío?** | lo que tengo − lo que debo (patrimonio) |

Incluye:

- **Lo que dicen tus números**: una lectura en palabras simples (cuánto quedó de cada
  $1.000 vendidos, cuánto falta para no perder, si alcanza para pagar lo que vence).
- **Cuatro gráficos**: de lo vendido a lo ganado (cascada), lo que tienes y lo que debes,
  semana a semana contra el mínimo para no perder, y **por qué la ganancia no es igual a
  la plata**: un puente del resultado al cambio de la caja que cierra al peso.
- **Quién te debe y a quién le debes**, con botones «Me pagó» y «Le pagué» que anotan el
  movimiento en la Caja diaria. Si un pago deja la caja en negativo, Kipu avisa antes.
- **Lo que Kipu no registra solo**: gastos, retiros para la casa, aportes, préstamos y
  equipos. Lo pagado se anota en la Caja diaria, y si se quita de la lista, también se
  quita de la caja.
- Selector de período (cada mes con ventas, o todo lo registrado).

Cada gráfico tiene su tabla con los números («Ver los números») y ayuda al pasar el mouse
o tocar una barra. Los colores (azul lo que entra o se tiene, rojo lo que sale o se debe)
están validados para daltonismo, en modo claro y oscuro.

Los montos incluyen IVA, como los registra la PYME: es un resultado de gestión, no
reemplaza la contabilidad formal ni las declaraciones ante el SII.

## Cómo mostrarlo en la feria (un minuto)

1. En el Inicio, tocar **«Probar un caso de práctica»** y cargar la **Ferretería El
   Maestro**.
2. Preguntar: *«Vendió casi nueve millones en un mes. ¿Ganó plata?»* Mostrar el resultado:
   perdió, y el gráfico semana a semana muestra que en dos de los cuatro tramos no llegó
   al mínimo.
3. Cambiar al **Almacén Doña Rosa**: vende mucho menos, pero gana. Bajar al puente
   «¿Por qué la ganancia no es igual a la plata?» y explicar el fiado y los retiros.
4. Tocar **«Salir del caso»**: Kipu vuelve a los datos del visitante.

## Correcciones a la versión publicada

1. **Los indicadores del Inicio salían en $0.** Buscaban la palabra «venta» en cualquier
   dato guardado y la fecha en un campo que las ventas no tienen. Ahora leen las secciones
   reales, y la «ganancia estimada» es ventas menos costo de lo vendido y gastos (antes,
   ventas menos compras).
2. **La portada del Inicio era casi invisible.** Una regla antigua dejaba transparente su
   fondo oscuro y el texto claro quedaba sobre fondo marfil. Se devolvió el fondo que el
   mismo equipo definió.
3. **El encabezado «Inicio» aparecía arriba de todas las secciones**, junto con sus
   accesos rápidos. Ahora solo se muestra en el Inicio.
4. **En celulares la barra superior tapaba el contenido.** Entre 360 y 414 px mide 190 px
   de alto, pero la página le reservaba 126: el comienzo de cada sección y el botón
   «Inicio» del menú quedaban debajo. Ahora se reserva su alto real.
5. **Los avisos emergentes quedaban detrás de la calculadora flotante.** Se corrieron a
   su izquierda.
6. **El logo pesaba 426 KB** (PNG de 705 × 615 mostrado a 48 px). Se reemplazó por el
   mismo logo a 240 px en JPEG de 12 KB. El archivo bajó de 1,24 MB a 0,81 MB.

## Cómo usarlo

Se abre con doble clic. No necesita servidor, instalación ni internet: no carga nada de
fuera (solo tiene enlaces al SII y a Google que el usuario abre si quiere).

- `?pruebas=1` en la dirección ejecuta las **25 pruebas** al abrir: las 11 del equipo y
  14 nuevas (casos, fórmulas, patrimonio, puente de caja, salida del caso, fiado, deudas
  y caja).
- Para actualizar la página en Netlify, se sube `Kipu.html` con el nombre `index.html`.

## Historia del proyecto

La primera revisión reparó la entrega original: el logo SVG se expandía a 753 px y tapaba
el formulario, el acceso guardaba las claves en texto plano (se reemplazó por un perfil
local sin contraseñas) y la página dependía de tres servicios externos. También agregó la
**Caja diaria** con arqueo, para distinguir el control de caja de la contabilidad formal.
El equipo conservó esas reparaciones en su versión de Netlify.

## Qué queda pendiente para el equipo

1. **Probar en un celular real antes del 8 de octubre**: cargar un caso, ver los
   resultados y salir del caso.
2. El indicador «Flujo / saldo» del Inicio es ventas menos compras acumuladas, no la plata
   en caja; conviene cambiarle el nombre o mostrar el saldo de la Caja diaria.
3. Si consiguen autorización de una PYME real del sector, pueden agregar un tercer caso
   con sus números (sin datos personales).
