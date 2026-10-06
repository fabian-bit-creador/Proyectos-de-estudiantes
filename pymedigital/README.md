# Pymedigital Ltda. · alfabetización digital para pymes de La Pintana

Proyecto de **Administración de Empresas** — Colegio Cardenal José María Caro.
Feria Técnico Profesional 2026.

Archivo: **`PymeDigital.html`** — un solo archivo, sin dependencias externas: hasta la biblioteca del
mapa (Leaflet) va incluida dentro. Funciona sin internet.
Verificación: botón «Verificar el motor» o `?pruebas=1`. **47 comprobaciones.**

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

## El mapa real de la comuna · 6 de octubre de 2026

El esquema dibujado a mano se reemplazó por el **mapa real de La Pintana**, hecho con
[Leaflet](https://leafletjs.com) (biblioteca libre, licencia BSD, incluida dentro del archivo) y datos de
[OpenStreetMap](https://www.openstreetmap.org/copyright) (licencia ODbL). Se mueve, se acerca y cada punto
abre su ficha.

### Qué muestra

| Capa | Qué hay | De dónde sale |
|---|---|---|
| **Pymes de barrio** (círculo azul) | 176 negocios: almacenes, botillerías, peluquerías, panaderías, talleres, ferreterías… | OpenStreetMap |
| **Cadenas e instituciones** (anillo gris oscuro) | 15 cadenas (Lider, Santa Isabel, Copec, Cruz Verde, Banco Estado…) y 2 instituciones veterinarias públicas | OpenStreetMap |
| **Ferias libres** (cuadrado naranjo y línea) | Las **16 ferias** del municipio y el persa General Arriagada, cada una dibujada **en su tramo de calle** | Listado municipal de ferias libres (Transparencia) |
| **Servicios** (rombo verde) | Los siete CESFAM, la Municipalidad, el Campus Antumapu y el Colegio Cardenal José María Caro | OpenStreetMap y Ministerio de Salud |
| **Pymes inscritas** (alfiler azul) | Las que se inscriben en el formulario de la página | Este equipo |

**Cómo se distingue una pyme.** Se cuenta como cadena el negocio que lleva la marca de una cadena (en
OpenStreetMap o en la lista de marcas del código); el resto aparece como pyme de barrio. Es una regla
simple y está escrita en la página. Veinte negocios que OpenStreetMap registra sin nombre no se muestran,
porque no se pueden identificar.

**Qué tan nuevos son los datos.** La mayoría de los negocios se registró en terreno en 2016 y 2017.
**Algunos pueden haber cerrado y faltan los nuevos**: la página lo dice, cada ficha trae un enlace
«corregir» que lleva al punto exacto en OpenStreetMap, y la valoración permite avisar que un negocio ya
no está. Los nombres se muestran tal como están en OpenStreetMap; solo se corrigieron erratas evidentes
de nombres de calles (por ejemplo «Pedro Aguirre Cedra»).

**No se guarda ningún teléfono ni correo de los negocios**, aunque OpenStreetMap tenga algunos. Para
contactar, cada ficha tiene «Google Maps» y «Cómo llegar».

### Google Maps sí, pero sin clave

El mapa de Google incrustado sigue sin convenir: exige una clave de API que quedaría a la vista en el
archivo publicado y una cuenta con tarjeta. Lo que sí se usa son los **enlaces públicos de Google Maps**:
«Google Maps» abre el punto exacto y «Cómo llegar» abre la ruta desde donde esté la persona. Ninguno
necesita clave.

### Con internet y sin internet

- **Publicada en un sitio web:** teselas oficiales de OpenStreetMap.
- **Abierta como archivo** (desde el correo o un pendrive): OpenStreetMap bloquea sus teselas cuando no
  hay dirección web de origen, así que se usan las del estilo humanitario (HOT) que sirve OpenStreetMap
  Francia. Tampoco necesitan clave.
- **Sin internet:** la página dibuja sola el mapa con las calles, plazas, canchas, colegios y zonas de
  cultivo de la comuna que trae guardadas (unos 90 KB), con los nombres de las avenidas. Todo lo demás
  funciona igual. Lo avisa debajo del mapa.

Se descartó CARTO, que se había considerado: hoy sus teselas responden «API KEY REQUIRED» si no se usa una clave.

### Valorar un negocio

Cada ficha y cada fila de la lista tiene **Valorar**: de 1 a 5 estrellas, cuatro marcas opcionales
(buena atención, buenos precios, **acepta tarjeta o transferencia**, **tiene WhatsApp o redes**), un
comentario corto y la opción «este negocio ya no está aquí». Las dos marcas digitales no son casualidad:
el resumen muestra qué porcentaje de las valoraciones las marcó, y eso es justo la brecha que Pymedigital
quiere cerrar.

- El promedio aparece en la ficha, en la lista y como insignia ★ sobre la marca del mapa. Hay un ranking
  de mejor valorados y un filtro «Solo con valoración».
- **Se guardan solo en el equipo donde se hicieron.** No viajan a ningún servidor.
- Para juntar las de varios celulares, cada uno descarga su planilla (CSV con `;` y BOM, con las fórmulas
  neutralizadas) y el equipo del stand la suma con «Sumar valoraciones de otro equipo». Cada valoración
  tiene su identificador, así que sumar dos veces la misma planilla no duplica nada.
- El comentario no acepta teléfonos, correos ni RUT: quedarían a la vista del siguiente visitante.
- **El mapa parte sin ninguna valoración.** No se inventó ninguna: todas las que aparezcan las habrá
  hecho alguien.

### Cobertura por sector

Se mantiene la lectura de «vitrina sin usar» (sector con feria y sin ninguna pyme inscrita), ahora con
datos reales: cuántas pymes de barrio hay en el mapa, cuántas ferias, servicios, valoraciones y pymes
inscritas tiene cada sector. Cada punto se cuenta en el sector del **CESFAM más cercano** (El Castillo,
que no tiene CESFAM con ese nombre, se ubica donde OpenStreetMap lo marca). Es una aproximación y la
página lo dice: no hay un límite oficial publicado para estos siete sectores.

Las pymes de ejemplo del catálogo **ya no se dibujan en el mapa ni cuentan como cobertura**: no existen,
y en un mapa real alguien podría ir a buscarlas.

### Inscribir una pyme en su lugar exacto

El formulario tiene **Marcar en el mapa**: lleva al mapa, se mueve hasta dejar la cruz sobre el negocio
(o se toca el lugar) y «Usar este punto» vuelve al formulario con el sector elegido. Si el punto queda
fuera de La Pintana, no se acepta. Sin marcar, la pyme aparece cerca del centro de su sector, señalada
como ubicación aproximada. La planilla de **Mis pymes** trae ahora el sector y la ubicación.

### Lo que se corrigió del mapa anterior

- **Tres ferias no eran de La Pintana**: El Sauce (Av. Observatorio entre Los Mimbres y Av. Los Morros),
  El Manzano 3 (Av. Lo Blanco entre Pasaje Drake e Incahuasi) y Santa Rosa. No están en el listado
  municipal y esas calles transversales no existen en la comuna. Se quitaron y se agregaron las once
  ferias que faltaban.
- **El CESFAM El Roble está en Av. Observatorio 1777**, no en Av. Santa Rosa 12975 (esa es la
  Municipalidad).
- **La dirección del CESFAM Flor Fernández**, que estaba pendiente: Av. Ciudad de México 1503.
- Se agregó el **CESFAM Juan Pablo II** (La Primavera 02870), que pertenece a la Pontificia Universidad
  Católica. Los seis municipales siguen siendo seis.
- Los sectores del esquema estaban en lugares que no corresponden (por ejemplo, Pablo de Rokha aparecía
  al nororiente y está al poniente). Ahora salen de la ubicación real de cada CESFAM.

### Celular y accesibilidad

- En celular, **un dedo baja por la página y dos dedos mueven el mapa** (si no, la página quedaba
  atrapada en el mapa). En el computador, la rueda del mouse acerca el mapa solo después de hacer clic en él.
- Todo lo que está en el mapa está también en la **lista de negocios** de al lado (abajo en celular),
  con buscador, filtro por rubro y botones «Ver» y «Valorar». Un enlace permite saltar el mapa con el
  teclado, Escape cierra la ficha y el foco vuelve al botón que la abrió.
- Revisado con axe (WCAG 2.1 AA) en escritorio y celular: sin observaciones en la sección del mapa, la
  ventana de valorar y el formulario. Para eso se subió el contraste de la etiqueta «Sistema de registro»
  y del botón «Registrar mi pyme» (estaban en 4,3:1; el tono casi no cambia).
- Los colores siguen siendo los tres validados para daltonismo; las cadenas van en gris oscuro y con otra
  forma, para no sumar un cuarto color.

### Para actualizar los datos

Los datos están en el bloque `MAPA_DATOS` del archivo. Se sacaron de OpenStreetMap con
[Overpass](https://overpass-api.de) usando el área de la comuna (relación 191216). Por ejemplo, los negocios:

```
[out:json];
area(3600191216)->.a;
( nwr["shop"](area.a); nwr["amenity"~"restaurant|fast_food|cafe|pharmacy|fuel|bank|ice_cream|veterinary"](area.a); );
out center tags;
```

Las calles se simplificaron y se guardaron como polilíneas codificadas; cada feria se ubicó buscando el
cruce exacto de su calle con las dos calles que nombra el listado municipal.

El archivo pesa unos 600 KB: Leaflet son 147 KB y los datos del mapa, 124 KB.

## Resguardos

Las pymes inscritas **se guardan solo en ese navegador**: no viajan a ningún servidor. La página
lo dice en el catálogo y en el formulario.

Si en la feria se inscriben pymes reales, esos son datos de terceros: conviene pedir permiso al
dueño del negocio antes de anotar su teléfono, y descargar la planilla al final en vez de dejar
los datos en un computador prestado.

Las valoraciones son opiniones de visitantes sobre negocios reales y con nombre. Se guardan solo en el
equipo, no llevan nombres de personas ni datos de contacto, y conviene presentarlas como lo que son: un
ejercicio de la feria, no un ranking oficial del barrio.

## Pendiente

- **El teléfono y el correo de contacto del pie son reales y esta página queda pública en
  GitHub.** Si no quieren que el número personal quede indexado, conviene reemplazarlo por un
  correo del proyecto antes de difundir el enlace.
- **Las valoraciones no se comparten solas entre equipos.** Para eso haría falta un servidor con base
  de datos, que este proyecto evita a propósito (cuentas, claves, costos). Mientras, la planilla se suma
  a mano.
- **Los negocios de OpenStreetMap son de 2016 y 2017.** Un buen trabajo para el equipo: recorrer un
  sector y actualizar OpenStreetMap (un «mapatón»). El botón «corregir» de cada ficha lleva al punto.
- El listado municipal de ferias es de 2021: conviene confirmar los días con el municipio antes de
  difundirlo.
- Las fotos de la sección «solución» siguen como gradiente: el archivo original indica dónde
  poner una foto propia, y debe ser propia por derechos de autor.
- Los testimonios están marcados «(ejemplo)». Si consiguen testimonios reales, hay que pedir
  autorización escrita para publicarlos.

## Ajustes de uso · 4 de octubre de 2026

- Corregido el catálogo de servicios y la sección de soluciones en celular: las reglas de escritorio estaban anulando las columnas móviles.
- Reparado el enlace del logo al inicio. Los montos se identifican como referenciales del proyecto escolar, pendientes de validación comercial.
- Ajuste del 5 de octubre: el buscador de la cabecera y los botones del diagnóstico también caben en teléfonos de 320 px.
