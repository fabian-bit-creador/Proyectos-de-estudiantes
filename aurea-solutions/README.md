# Áurea Solutions · inducción de funcionarios nuevos

Proyecto de título de **IV°A, especialidad de Administración** — Colegio Cardenal José María Caro,
Fundación Belén Educa, La Pintana. **Feria Técnico Profesional 2026.**

Equipo: **Sofía Muñoz** (líder), **Anhais Molina** (marketing e imagen) y **Pascal Delgado**
(implementación e investigación) — Grupo N°8.
Informe Nº1: **28/30 · nota 6,5**. Informe Nº2 entregado, con validación de usuarios.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `AureaSolutions.html` | La página completa, en un solo archivo y sin dependencias externas (340 KB, de los cuales 122 KB son la imagen satelital). |
| `GuiaParaElEquipo.html` | La explicación para las estudiantes: qué se cambió, qué les toca a ellas y cómo tomar las fotos 360. Imprimible. |
| `fotos/LEEME.txt` | Los nombres exactos que deben tener los archivos de foto de cada parada. |

## Qué se corrigió

1. **El formulario no enviaba nada.** Hacía `alert('Consulta registrada…')` y `form.reset()`, sin
   `name` en ningún campo. Prometía contacto y no llegaba a ninguna parte. Corregido con
   `name`, `method="POST"`, `data-netlify="true"` y honeypot.
2. **El logo no cargaba.** Apuntaba a `aurea-logo-original.png`, un archivo que no venía con el
   HTML. Se dibujó una marca nueva en SVG: una espiral áurea construida sobre Fibonacci.
3. **La metodología estaba descrita pero no se ejecutaba.** No había recorrido, ni ruta, ni glosario.
4. CSS muerto de una sección eliminada, campos sin `<label>`, contenido escondido en móvil con
   `display:none`, botones de etapa sin estado ni navegación por teclado, y variables globales
   implícitas apoyadas en los `id` del documento.

## Revisión contra los Informes Nº1 y Nº2

Los dos informes se leyeron después de la primera versión de la página y cambiaron varias cosas:

- **El equipo son tres personas, no cuatro**, y sus nombres y roles están en el Informe Nº1.
- **La validación con RR.HH. ya estaba hecha**, al contrario de lo que decía la primera versión de
  la guía: entrevista a **Carolina Fuentes, Jefa Administrativa**, y encuesta a **17 docentes** el
  3 de septiembre de 2026. Esa evidencia ahora abre la página.
- **El público objetivo son los docentes que ingresan**, no los funcionarios en general.
- El proyecto tiene **cuatro entregables con nombre propio**: Acompañamiento Áurea, Capacitación
  Syscol, **Mapa Caro** y Página Web. El recorrido virtual que ya estaba construido *es* el Mapa
  Caro del objetivo específico Nº3, así que ahora se llama así y sus 16 paradas son los espacios
  que el propio informe enumera.
- El **Semáforo de integración** que aparece en el presupuesto para el estand se implementó en
  versión digital.

## Qué se agregó

- **Recorrido virtual de 16 paradas** con visor de fotos 360° equirectangulares escrito en WebGL
  a mano, sin librerías. Detecta solo si la foto es 360 (proporción 2:1) o normal. Trae una
  panorámica de demostración generada por la propia página, para mostrarlo funcionando sin fotos.
  Las fotos se pueden dejar en `fotos/` o cargarlas desde el navegador (IndexedDB).
- **Ruta por cargo** con **un solo cargo piloto** (docente de aula), siguiendo la retroalimentación
  del Informe Nº1: *«diseñen una ruta piloto para un solo cargo»*. Los otros tres quedan marcados
  como «en diseño», con el aviso de qué falta levantar con RR.HH.
- **Checklist de hitos** por cargo, persistente e imprimible, y **pulso 30/60/90** que calcula el
  punto más flojo y enlaza a la sección correspondiente. No recoge datos de nadie.
- **Historia y contexto** con datos verificados del Cardenal José María Caro y de Fundación Belén
  Educa. La parte de cultura quedó explícitamente como espacio a completar desde el PEI.
- **Glosario de 36 siglas escolares chilenas** con buscador que ignora tildes.
- **Validación con usuarios reales**: los datos de la encuesta del Informe Nº2 graficados. Paleta
  azul/rojo en vez de verde/rojo, validada con el verificador de daltonismo (ΔE 20 en deuteranopía,
  sobre un objetivo de 8), con la cifra escrita dentro de cada segmento para que el gráfico se lea
  sin depender del color.
- **Capacitación Syscol** en seis módulos, con la recomendación horaria de la Jefa Administrativa.
- **Semáforo de integración** digital para el estand, anónimo y sin datos personales.

## Mapa Caro desde arriba y maqueta 3D (septiembre 2026)

El equipo preguntó si se podía «hacer lo de Blender»: una simulación del espacio del colegio y un mapa
satelital donde marcar ubicaciones. Quedó dentro del Mapa Caro, en dos pestañas nuevas junto a
«Fotos 360°», sin librerías y sin internet:

- **Desde arriba.** La imagen satelital real del colegio (San Leandro 0368), con el terreno marcado,
  los nombres de las calles y cuatro referencias (patio central, techo mayor, cancha y la dirección).
  Se mueve arrastrando y se acerca con la rueda o con dos dedos. Cada parada ubicada aparece con su
  número; tocarla abre su ficha.
- **Editar ubicaciones.** La página pide las paradas una por una y basta tocar el mapa donde está cada
  una; se corrigen arrastrando el número o con las flechas del teclado. Se pueden agregar **puntos del
  proyecto** con nombre y nota (por ejemplo, dónde se hace la inducción). Todo se guarda en el
  navegador, se exporta e importa en `.json`, y **«Descargar la página con las ubicaciones»** entrega
  este mismo archivo con las ubicaciones adentro, listo para publicar.
- **Maqueta 3D.** La página la arma sola: el piso es la imagen satelital y cada edificio es su contorno
  levantado a su altura, con el techo real pintado encima. WebGL escrito a mano, como el visor 360.
  Se gira con el dedo, tiene vista aérea, vista desde arriba con el norte hacia arriba, doble clic para
  acercarse y **«Recorrer las paradas»**, que vuela de parada en parada mostrando la ficha de cada una.
  Sin WebGL avisa y la vista desde arriba sigue funcionando.
- **Para Blender.** «Descargar la maqueta para Blender (.gltf)» entrega un glTF 2.0 de un solo archivo
  (137 KB, con la imagen adentro). Se abre en Blender con *Archivo → Importar → glTF 2.0*. Pasa el
  validador oficial de Khronos sin errores ni advertencias.

Por qué no se modeló en Blender: modelar el colegio a mano es trabajo de semanas. Aquí la maqueta sale
de datos: la imagen satelital y los contornos de los edificios.

**Lo que es aproximado y hay que decirlo en la feria:** las alturas (5 a 9 m) se estimaron por las
sombras; los techos se ven planos; el techo mayor probablemente es el gimnasio, pero hay que
confirmarlo; y las paradas **no vienen ubicadas**: no se puede saber desde afuera dónde queda cada
oficina, así que las marca el equipo con alguien que conozca el colegio.

**Fuentes.** Imagen: *Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community*.
Contorno del colegio, pabellones y cancha: © colaboradores de OpenStreetMap (vía 233105149, 6.389 m²).
En OpenStreetMap hay otro polígono llamado «Colegio Cardenal José María Caro» (vía 550497144, San
Leandro 369) que no corresponde al colegio; el correcto se confirmó con el enlace a Google Maps de la
página del colegio en Belén Educa. El techo mayor y los dos edificios del sur se trazaron sobre la
imagen.

## Verificación

- 53 verificaciones del motor (`?pruebas=1` o el botón «Verificar el motor»). Las 23 nuevas cubren
  las coordenadas del mapa, la triangulación de los techos (el de los pabellones es cóncavo, de 30
  vértices), la cámara 3D, la limpieza de las ubicaciones que vienen de afuera y el archivo glTF.
- Recorrido completo del mapa y la maqueta en Chromium, en escritorio y en celular táctil: ubicar,
  arrastrar, puntos del proyecto, exportar, importar, descargar la página y abrirla en otro navegador,
  girar y pellizcar la maqueta, recorrido automático y sin WebGL.
- 54 comprobaciones de comportamiento en Chromium, incluida una que lee los píxeles del canvas
  para confirmar que el visor 360 dibuja, que arrastrar cambia la vista y que centrar la restaura.
- Tres bugs encontrados y corregidos durante esa verificación: el primer dibujo del visor ocurría
  con el canvas todavía en `display:none` (viewport 0 px, pantalla negra); la primera parada solo
  se pintaba dentro del callback de IndexedDB, que en `file://` puede no resolverse nunca; y la
  clase `.barra` de la barra del gráfico chocaba con la de la cabecera fija, que quedaba recortada
  a 2,9 rem con `overflow:hidden`.

## Pendientes del equipo

Están detallados en `GuiaParaElEquipo.html`. Los cuatro primeros:

1. **Llenar la carpeta de Drive**, que sigue vacía pese a que los dos informes existen.
2. **Tomar las fotos del Mapa Caro** — el objetivo específico Nº3 se comprometió al 100% de las
   ubicaciones en dos semanas. El visor y las 16 paradas ya están; faltan exactamente las fotos.
3. **Ubicar las 16 paradas en «Desde arriba»** con alguien que conozca el colegio, y descargar la
   página con las ubicaciones. Media hora.
4. **Probar la ruta con un docente que haya llegado este año**, tal como el Informe Nº2 anuncia
   para el Informe Nº3.

**La versión en base44 declara `<html lang="en">`** aunque está en español. Chrome la ofrece
«traducir al español» y cambia las siglas: en la copia que guardaron, PEI quedó como «Isla del
Príncipe Eduardo», CRA como «Agencia Tributaria Canadiense» y NEE como «de soltera». Se arregla
pidiendo a base44 que declare `lang="es"`.

La guía incluye además una recomendación sobre **base44 frente al archivo HTML**: quedarse con el
HTML como versión principal, porque una página alojada en base44 no abre si el día de la feria no
hay wifi.
