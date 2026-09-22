# Pymedigital Ltda. · alfabetización digital para pymes de La Pintana

Proyecto de **Administración de Empresas** — Colegio Cardenal José María Caro.
Feria Técnico Profesional 2026.

Archivo: **`PymeDigital.html`** — un solo archivo, sin dependencias externas. Funciona sin internet.
Verificación: botón «Verificar el motor» o `?pruebas=1`. **27 comprobaciones.**

## Qué se hizo

El equipo entregó el proyecto en **dos archivos HTML** que se enlazaban entre sí por nombre
(`pymedigital.html` ↔ `pymedigital-2.html`). Eso se rompe apenas alguien renombra un archivo o
abre uno solo desde el correo, que es justo lo que pasa cuando se comparte un proyecto. Ahora es
**una sola página** con el mismo contenido y el mismo diseño: el índice lateral ya listaba las
trece secciones de ambas páginas, así que unirlas es lo que ese índice esperaba.

No se rediseñó nada. Los colores, la tipografía, las tarjetas y el logo son los suyos.

## Lo que estaba roto

**1. Inyección de HTML en el catálogo.** Las fichas se armaban pegando texto con `innerHTML`.
Una pyme inscrita con el nombre `<img src=x onerror="...">` ejecutaba ese código en la página,
en el computador de quien la abriera. Ahora cada ficha se arma con `createElement` y
`textContent`: lo que se escribe se muestra como texto, nunca como código. Está comprobado con
un intento real de inyección.

**2. La página no abría sin internet.** Cargaba Google Fonts y el script de Google Sign-In desde
afuera. El 8 de octubre puede no haber wifi en la feria. Se quitaron los dos; las fuentes quedan
con una pila del sistema que mantiene el dibujo.

**3. El botón «Regístrate con Google» no funcionaba.** Traía un Client ID de ejemplo
(`TU_CLIENT_ID_DE_GOOGLE...`), así que solo mostraba un aviso pidiendo configurarlo. Ocupaba el
mejor lugar del encabezado sin hacer nada, y el proyecto no necesita cuentas. Se reemplazó por
**Mis pymes**, que sí resuelve un problema real: descargar en Excel las pymes inscritas.

**4. El buscador solo miraba el nombre.** Quien escribía «Santa Rosa» o «belleza» no encontraba
nada. Ahora busca en nombre, rubro, dirección y descripción.

**5. El teléfono solo aceptaba celular con el formato exacto `+56 9 1234 5678`.** Una pyme con
fijo no podía inscribirse, y casi nadie escribe los espacios igual. Ahora acepta celular y fijo
de Santiago, con o sin `+56`, con espacios o guiones, y lo guarda normalizado.

**6. No había forma de borrar una pyme.** Un nombre mal escrito quedaba para siempre, salvo
vaciar el navegador entero. Cada ficha propia tiene ahora **Quitar del catálogo**, con
confirmación.

**7. El catálogo parpadeaba al escribir.** Cada ficha se animaba en cada repintado, y el
catálogo se repinta en cada tecla del buscador. Ahora solo se anima la ficha recién inscrita.

## Lo que se agregó

**El diagnóstico ahora diagnostica.** Antes las seis preguntas daban un puntaje global y tres
consejos fijos por nivel: la misma respuesta para dos pymes muy distintas. Ahora identifica
**las dos preguntas peor contestadas** y de ahí saca las recomendaciones, muestra el puntaje
exacto y una tabla con la respuesta de cada pregunta, marcando las flojas. Con empate gana la
pregunta más básica, porque las primeras miden lo más elemental.

**Imprimir / PDF del diagnóstico.** Imprime **solo el resultado**, con su propio encabezado, no
las once páginas del sitio. Quien responde en la feria se lleva su hoja.

**Excel del catálogo.** `Mis pymes` descarga un CSV con separador `;` y comilla de seguridad
para que Excel no ejecute como fórmula lo que escribió un visitante.

**Accesibilidad.** Avisos que el lector de pantalla anuncia, foco visible en todo lo que se
puede usar con teclado, y respeto por `prefers-reduced-motion`.

**16 pruebas propias**, con su sección visible en la página. Sirven para la feria y para que el
equipo sepa si algo se rompió al editar.

## El mapa de la comuna (sin Google Maps, y a propósito)

Se preguntó si se podía usar Google Maps. No conviene, por tres razones concretas:

1. **Necesita internet.** La feria es el 8 de octubre y puede no haber wifi. El mapa de Google
   se vería como un cuadro gris.
2. **Necesita una clave de API que viaja dentro del archivo.** Este proyecto se entrega como un
   HTML que se reenvía y además está publicado en GitHub: la clave quedaría a la vista de
   cualquiera, y una clave de Maps expuesta la puede usar un tercero y el consumo lo paga el
   dueño de la cuenta.
3. **Necesita una cuenta de facturación** con tarjeta asociada.

Así que el mapa está **dibujado en SVG dentro del mismo archivo**. Funciona sin internet, no
cuesta nada y no hay ninguna clave que cuidar.

**Qué es real y qué es aproximado.** Esto importa y está dicho en la página:

- Reales: los límites de la comuna y las comunas vecinas con la calle por la que limitan
  (San Ramón por Venancia Leiva, La Granja por calle Santo Tomás, La Florida y Puente Alto por
  Av. La Serena, San Bernardo por calle Los Álamos, El Bosque por Av. San Francisco); las
  avenidas Santa Rosa, Observatorio y Lo Blanco; los siete sectores; las direcciones de los
  seis CESFAM; la ubicación y los días de cinco ferias libres; el Campus Antumapu.
- Aproximado: la posición de cada punto **dentro** del cuadro. Es un esquema, no un mapa a
  escala, y lo dice.
- La tabla «Todos los puntos, con su dirección» lleva la dirección exacta de cada uno y una
  columna que distingue los que están **sobre la avenida que indica su dirección** de los que
  están **aproximados en su sector**. La dirección real está siempre en la tabla.

**Tres capas, no cuatro.** Pymes (azul, círculo), ferias libres (naranja, cuadrado) y servicios
y equipamiento (verde, rombo). Se validaron con el verificador de paletas: con cuatro colores
los puntos dejan de distinguirse con seguridad para alguien con daltonismo. Cada capa lleva
además su propia forma y su rótulo, así que el color nunca es el único dato.

**La parte que sirve para decidir.** Debajo del mapa hay una lectura de **cobertura por
sector**: cuántas pymes, cuántos servicios y cuántas ferias tiene cada uno. Los sectores con
feria libre y sin ninguna pyme inscrita quedan marcados como **«vitrina sin usar»**. Con los
datos de ejemplo salen tres: Santo Tomás, Pablo de Rokha y Flor Fernández. Eso es un argumento
concreto para la feria, no un adorno.

**Cómo llegan los clientes.** La comuna **no tiene estación de Metro**: la más cercana es Copa
Lo Martínez, de la Línea 2. El G28 une los centros cívicos de San Bernardo y La Pintana pasando
por Hospital El Pino y Copa Lo Martínez; el 286 llega hasta Las Condes. Están listados los
diecinueve recorridos que sirven la comuna.

El formulario de registro pide ahora el **sector**, que es lo que permite ubicar la pyme en el
mapa, y el buscador del catálogo también encuentra por sector.

## Resguardos

Las pymes inscritas **se guardan solo en ese navegador**: no viajan a ningún servidor. La página
lo dice en el catálogo y en el formulario.

Si en la feria se inscriben pymes reales, esos son datos de terceros: conviene pedir permiso al
dueño del negocio antes de anotar su teléfono, y descargar la planilla al final en vez de dejar
los datos en un computador prestado.

## Pendiente

- **El teléfono y el correo de contacto del pie son reales y esta página queda pública en
  GitHub.** Si no quieren que el número personal quede indexado, conviene reemplazarlo por un
  correo del proyecto antes de difundir el enlace.
- **Las ferias libres son 16 y el mapa tiene 5.** Faltan las otras once: el municipio publica
  el listado completo, y agregarlas es editar el arreglo `PUNTOS`. Lo mismo la dirección del
  CESFAM Flor Fernández, que no se pudo verificar.
- Las fotos de la sección «solución» siguen como gradiente: el archivo original indica dónde
  poner una foto propia, y debe ser propia por derechos de autor.
- Los testimonios están marcados «(ejemplo)». Si consiguen testimonios reales, hay que pedir
  autorización escrita para publicarlos.
