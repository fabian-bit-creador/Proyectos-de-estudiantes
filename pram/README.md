# PRAM · Atención al cliente para PYMES

Proyecto de **III°A · Administración** — Colegio Cardenal José María Caro. Feria Técnico Profesional 2026.
Equipo: Matías Bustamante, Víctor Sanabria, Ian Arenas y Sabina Huechucoy. Caso de aplicación: **Sushi IsiMiya**.

Archivo: **`PRAM.html`**, un solo archivo sin dependencias externas. Verificación: `?pruebas=1` en la
dirección, **31 comprobaciones**.

Se mantuvieron la esencia y los colores del sitio: el vino, el rojo IsiMiya, el dorado, las tipografías
y todas las secciones del equipo. Lo nuevo usa esos mismos colores.

## Logo en la pestaña del navegador

Una «P» crema con la flecha dorada de mejora sobre el degradado vino, tomada del recuadro PRAM de la
portada. Va dentro del archivo en tres versiones: SVG para los navegadores actuales, PNG de 32 px de
respaldo y PNG de 180 px para cuando se agrega la página a la pantalla de inicio del celular. La barra
del navegador en el celular toma el color vino de la barra del sitio.

## Lo que se construyó: el libro de casos

La página prometía «convertir cada reclamo en una oportunidad concreta de mejora», pero el reclamo del
formulario desaparecía: sumaba 1 a un contador y el mensaje decía que *una implementación real debe
asignar responsable y plazo*. Ahora eso existe.

1. **Escuchar.** Si alguien evalúa con 3 estrellas o menos, cuenta qué ocurrió (lo que ya escribió en el
   comentario no se le vuelve a pedir) y recibe su número de caso, `PRAM-0001`, con la fecha en que le
   responderán. El equipo también puede registrar los casos que llegan por WhatsApp, Instagram, teléfono
   o en el local.
2. **Resolver.** Cada caso tiene responsable y plazo para responder (2, 24, 48 o 72 horas, lo decide la
   pyme). La página arma la respuesta con la frase guía del protocolo de reclamos, con el nombre del
   cliente, el tema y el plazo. Se copia o se abre directo en WhatsApp o en el correo si el cliente dejó
   su celular o correo. Si el plazo ya venció, la respuesta pide disculpas y da un plazo nuevo en vez de
   prometer una fecha pasada.
3. **Mejorar.** Al cerrar el caso se anota qué se hizo por el cliente (va en el mensaje de cierre), qué
   parte del **Triángulo del Servicio** hay que ajustar (la página sugiere una según el tipo de caso) y
   qué se hará para que no se repita.

Los casos se ordenan por urgencia, se filtran (abiertos, atrasados, resueltos) y se exportan a Excel.
Ningún mensaje pide a nadie cambiar ni borrar una opinión, como dice el propio protocolo del equipo.

## Lo que estaba mal y se corrigió

- **El panel inventaba números.** «Tiempo de respuesta» era la barra de atención × 0,82 y «Resolución»
  × 0,76. Ahora se calcula desde lo registrado: atención = evaluaciones con 4 o 5 estrellas, respuesta =
  casos respondidos dentro del plazo y resolución = casos cerrados. Sin datos muestra «—», no un 0. Se
  agregó qué tipo de caso se repite más y qué parte del triángulo hay que reforzar.
- **Las reseñas mostraban un 5.0 fijo** con cinco estrellas. Ahora es el promedio real («Nuevo» mientras
  no hay evaluaciones), y elegir estrellas en «Deja tu evaluación» registra la evaluación de verdad.
- **«Actualizar ↻» no mostraba su aviso:** faltaba la regla que hace visible la notificación.
- **Se podía enviar un reclamo vacío** y contaba como situación registrada.
- **El Instagram decía `[@usuario]`** con un enlace roto. Queda oculto hasta que el equipo ponga el suyo
  en el `href` y el texto de esa fila.
- **Sin la carpeta de fotos**, la galería mostraba el ícono de imagen rota con el texto alternativo encima
  y el recuadro PRAM se veía desteñido. Ahora cada foto que falta deja el degradado vino con su texto.
- **En celular, el texto del carrusel quedaba encima de los botones** ‹ › y de los puntos.
- **La barra de navegación no cabía** entre 761 y 1250 px: «Quiénes somos» se partía en dos líneas y bajo
  850 px la página se desbordaba hacia el lado. Ahora los enlaces se aprietan y en pantallas medianas
  aparece el mismo menú ☰ que ya tenía el celular.
- **«Ver como celular» cargaba la página dos veces** en cada visita; ahora la carga solo al abrirla.
- Los títulos de las secciones quedaban tapados por la barra fija al usar el menú, y al imprimir las
  secciones que no se habían mirado salían en blanco.

## Datos

Todo se guarda **solo en el navegador** donde se usa (no hay servidor), así que los datos siguen ahí al
recargar pero no se comparten entre equipos. «Borrar datos de prueba» limpia todo. En un negocio real se
piden solo los datos necesarios para responder y se borran al cerrar el caso.

## Para completar

- **Fotos:** la página usa la carpeta `sushi-isimiya-fotos/` y el fondo `sushi.webp`, que no venían con
  el archivo. Basta dejarlos junto a `PRAM.html`.
- **Instagram:** poner el enlace y el usuario reales en la fila de contacto.
- **Contacto:** el WhatsApp y el correo de la sección de contacto quedan públicos en este repositorio.

## Para presentarlo en la feria

1. En «Medir para mejorar», evaluar con 2 estrellas y contar qué pasó con un pedido.
2. En «Libro de casos», asignar responsable, abrir la respuesta y marcar como respondido.
3. Cerrar el caso con lo que se hizo y la parte del triángulo: el panel de «Metas» se actualiza solo.
