# Pymedigital Ltda. · alfabetización digital para pymes de La Pintana

Proyecto de **Administración de Empresas** — Colegio Cardenal José María Caro.
Feria Técnico Profesional 2026.

Archivo: **`PymeDigital.html`** — un solo archivo, sin dependencias externas. Funciona sin internet.
Verificación: botón «Verificar el motor» o `?pruebas=1`. **16 comprobaciones.**

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
- Las fotos de la sección «solución» siguen como gradiente: el archivo original indica dónde
  poner una foto propia, y debe ser propia por derechos de autor.
- Los testimonios están marcados «(ejemplo)». Si consiguen testimonios reales, hay que pedir
  autorización escrita para publicarlos.
