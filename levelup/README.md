# LevelUp.com · Talento que educa

Proyecto de **IV°A · Administración de Empresas** — Colegio Cardenal José María Caro. Feria Técnico Profesional 2026.
Grupo de Nayaret Jiménez (en el directorio de GLM figura con Stefany Tobar como líder).
Publicado por el equipo en https://levelup-adm.netlify.app

Archivo: **`LevelUp.html`**, un solo archivo. Verificación: `?pruebas=1` en la dirección, **25 comprobaciones**.
La única parte que necesita internet es la encuesta oficial de Google Forms; sin conexión, la página lo avisa.

Se mantuvieron la esencia, los colores (morado, turquesa y tinta), el logo y todos los textos del equipo.

## Lo que se construyó: el ciclo completo de la capacitación

El propio equipo define su propósito como «detectar necesidades, entregar material, practicar, evaluar y
utilizar los resultados para seguir mejorando». La página tenía las piezas, pero el ciclo no se cerraba:
el diagnóstico solo repetía lo elegido y los tests no dejaban registro. Ahora cada paso alimenta al siguiente.

1. **Detectar.** El diagnóstico (con el cargo, opcional) entrega una **ruta personal**: qué manuales
   abrir y en qué orden, por dónde partir en Excel, qué tema de primeros auxilios revisar primero y qué
   modalidad conviene según el formato preferido. Cada respuesta queda sumada al panel.
2. **Entregar y practicar.** Las tarjetas de «Capacitación según tu cargo» abren la ruta de ese cargo con
   el avance de cada manual.
3. **Evaluar.** Los tests pasaron de 3 a 5 preguntas: las 3 del equipo y 2 nuevas sacadas del mismo
   manual. Al corregir, cada pregunta muestra la respuesta correcta y **por qué**. Se aprueba con 70 %,
   el mismo corte que ya usaba el equipo.
4. **Subir de nivel.** «Mi avance» muestra el nivel (del 0 «Punto de partida» al 4 «Talento que educa»),
   la ruta del cargo y una **constancia de participación** imprimible con los manuales aprobados.
5. **Usar los resultados.** El **panel de la capacitación** consolida qué capacitación pide la comunidad,
   un **plan sugerido** ordenado por demanda con el formato que prefieren quienes lo pidieron, quién
   respondió, y por manual: intentos, promedio, aprobación y **la pregunta más fallada** (qué explicar
   mejor). Todo se exporta a Excel.

## Lo que estaba mal y se corrigió

- **En los 12 tests la respuesta correcta era siempre la primera alternativa.** Ahora se barajan en
  cada intento.
- **La página pesaba 1,5 MB** porque el mismo logo de 296 KB estaba cinco veces. Ahora pesa 164 KB: el
  logo va comprimido (13 KB, sin diferencia visible) y se quitó el `og:image` en base64, que las redes
  sociales no pueden leer.
- **El ícono de la pestaña era el logo entero**, ilegible a 16 px. Ahora es el emblema (libro, figuras y
  birrete), más un ícono de 180 px para la pantalla de inicio del celular.
- **En celular la página se salía hacia el lado** en todos los anchos de teléfono (hasta 113 px en uno de
  320 px): «Elige tu modalidad» forzaba tres columnas con un estilo en línea.
- **Los botones de opción se estiraban a todo el ancho** y el círculo quedaba flotando sobre el texto.
- La barra de navegación se partía en dos líneas cerca de los 900 px; el menú del celular abría 10 px
  bajo la barra.
- Resultados y comentarios se armaban juntando texto con código HTML; ahora se insertan como texto.
- Se quitó la etiqueta que Netlify agrega a las páginas publicadas: no es parte del proyecto.

## Primeros auxilios: tres líneas agregadas

Al manual se sumaron indicaciones estándar que faltaban: poner a la persona de lado al terminar la
convulsión, llamar al **SAMU (131)** si dura más de 5 minutos, se repite, no recupera la conciencia, le
cuesta respirar o se lesionó, y los números de emergencia de Chile (SAMU 131, Bomberos 132,
Carabineros 133). **Conviene que el equipo las revise con el protocolo del colegio.**

## Datos

Todo se guarda **solo en el navegador** donde se usa: no hay servidor. En la Feria, cada visitante que
responde el diagnóstico o rinde un test en el mismo computador suma al panel. «Cambiar de participante»
deja el avance de la persona anterior en el panel y empieza uno nuevo; «Borrar datos de prueba» limpia
todo. La constancia es de una actividad formativa escolar y no corresponde a una certificación oficial.

## Para presentarlo en la feria

1. Responder el diagnóstico con el cargo y mostrar la ruta personal.
2. Abrir un manual, rendir el test y mostrar la explicación de una respuesta equivocada.
3. Mostrar el panel: qué capacitación pide la comunidad y cuál conviene hacer primero.
