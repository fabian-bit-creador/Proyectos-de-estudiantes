# Help Wanted · Staffbots para PyMEs

Proyecto de **III° medio** — Colegio Cardenal José María Caro. Feria Técnico Profesional 2026.

Archivo: **`HelpWanted.html`** — un solo archivo, sin dependencias externas. Funciona sin internet.
Verificación: botón «Verificar el motor» o `?pruebas=1`. **37 comprobaciones.**

## El problema de fondo: el proyecto no decía qué vendía

La página anterior describía un Staffbot con frases como «se adapta a las necesidades de cada
negocio» y «la PyME define la información», pero **no había ninguna forma de definir nada**. Era
una promesa sin nada detrás, y eso es lo primero que pregunta un jurado.

Ahora la promesa es el producto. La oferta quedó dicha en tres cosas concretas: **orden**
(la información del negocio queda escrita en un solo lugar), **respuesta** (las consultas
repetidas se contestan solas) y **criterio** (el bot sigue reglas de atención).

## Lo que estaba roto

**1. La página no abría bien en ningún lado.** Cargaba Tailwind desde un CDN y las fuentes desde
Google: sin internet, el 8 de octubre, se veía como texto suelto sin diseño. Además pedía dos
imágenes que no existen (`assets/help-wanted-logo.png` y `assets/staffbot.png`), así que hoy se ve
con dos íconos rotos. Todo el diseño se reescribió sin Tailwind, y el logo es un SVG dentro del
archivo.

**2. El bot llamaba a un servidor que no existe.** Cada pregunta hacía `fetch('/api/chat')`, fallaba,
y recién ahí respondía. Se eliminó.

**3. El bot elegía mal la respuesta.** Eran diez `if` seguidos, sin `else`, así que **ganaba el
último que coincidía**, no el que más se parecía. «¿Cuánto demora el pedido?» terminaba contestada
con el catálogo de productos porque `producto` venía después en la lista. Ahora las intenciones se
puntúan y gana la de mayor puntaje.

**4. El formulario mentía.** Decía «tu solicitud quedó registrada» sin enviar nada a ninguna parte.
Se reemplazó por algo que sí hace lo que dice.

## Lo que se construyó

### La PyME carga su información y el bot la usa

Es el centro del proyecto y ahora funciona de verdad. El negocio escribe su horario, dirección,
canales, tiempos de retiro y despacho, medios de pago, política de cambios, su lista de productos
con precio y sus propias preguntas frecuentes. El bot responde **solo con eso**.

Debajo de cada respuesta aparece **de qué dato salió** («Origen: Lista de productos», «Origen:
Pregunta frecuente cargada por el negocio»). Eso es lo que se muestra en la feria: no es magia,
es la información del negocio bien ordenada.

El tablero de la portada se enciende a medida que se carga, así se ve qué falta.

### Las reglas de atención, que es lo que se pidió evidenciar

- **No inventa.** Si el precio no está cargado, lo dice. Hay una prueba automática que verifica
  justamente esto: que ante un producto desconocido **no aparezca ninguna cifra**.
- **Reconoce cuándo no sabe** y deriva a una persona con nombre y canal. Nunca se queda en un
  «no entendí».
- **No se hace pasar por persona.** Si se lo preguntan, lo dice.
- Lo que escribió el negocio gana sobre cualquier respuesta genérica.

### Cómo responde algo que nadie escribió

Aparte de los datos del negocio, el bot tiene una **base de conocimiento de atención**: reconoce
qué tipo de situación es y sabe qué forma darle a la respuesta, aunque la pregunta exacta no esté
en ninguna lista. Son seis protocolos:

| Situación | Por qué existe |
|---|---|
| **Reclamo o algo salió mal** | Un reclamo mal contestado es el que termina en redes sociales. Lo primero no es explicar, es reconocer. Se atiende **antes** de buscar el dato: si alguien dice «me llegó fallado, ¿me lo cambian?», el bot no recita la política de devoluciones, primero se hace cargo. |
| **Pide descuento o regatea** | El bot no puede negociar precios: no es su decisión, y una rebaja prometida por error la paga el negocio. Deriva y muestra el precio de lista. |
| **Necesita algo para hoy** | Prometer un plazo que el negocio no cumple es perder al cliente dos veces. Arma la respuesta solo con los plazos que estén cargados. |
| **Quiere reservar o comprar** | Cerrar una venta es decisión del negocio. El bot deja todo listo (precios, medios de pago, cómo es la entrega) y pasa a una persona. |
| **Saluda o agradece** | Contestar un saludo con un menú de opciones es lo que hace que un bot se sienta una máquina. |
| **Pregunta algo fuera del negocio** | Redirige sin ser cortante, ofreciendo lo que sí puede responder. |

**El límite, que el equipo tiene que poder explicar:** el bot resuelve preguntas que nadie
escribió, pero **nunca inventa un dato del negocio**. Si no tiene el precio, no lo estima. Lo que
improvisa es la *forma* de responder, no el contenido. Hay una prueba automática que recorre los
seis protocolos con una ficha vacía y falla si alguno deja escapar una cifra de plata.

**Y el «no sé» ahora sirve.** Antes terminaba en «esa no la sé». Ahora siempre cierra ofreciendo
lo que sí puede responder, armado con lo que el negocio cargó: *«Sí te puedo decir el horario, el
precio de 3 productos, cómo funcionan las entregas y los medios de pago.»* Además, si falta un
dato pero está el relacionado, lo ofrece: quien pregunta por el retiro y no está cargado recibe la
información del despacho.

## Tono y demora

**Tono** (cercano, formal o breve): cambia cómo suena el bot, **no lo que dice**. Y hay una regla
que importa: el tono se aplica solo a lo que escribe el bot. **Lo que cargó el negocio se cita tal
cual**, porque son sus palabras, no las nuestras. Una prueba lo verifica.

**Demora**: una respuesta instantánea delata a la máquina y corta el hilo de la conversación. El
bot muestra un indicador de «escribiendo», bloquea la entrada mientras responde y espera un
momento antes de contestar. La espera se calcula sobre el largo de la respuesta —como demoraría
alguien escribiéndola— con piso y techo para que en la feria nadie quede esperando. Es
configurable: al instante, rápido, natural (recomendado) o pausado. Y se anula sola si el
navegador pide menos animación.

## Cómo atender bien: las cinco dimensiones

No es opinión. Parasuraman, Zeithaml y Berry (modelo **SERVQUAL**, 1988) midieron que la gente
juzga un servicio por cinco dimensiones: **fiabilidad, capacidad de respuesta, seguridad, empatía
y elementos tangibles**, y lo que mide el modelo es la *brecha* entre lo que el cliente esperaba y
lo que recibió. Cada una está explicada, con qué hace el bot en esa dimensión.

### Autoevaluación con pasos concretos

Diez afirmaciones, dos por dimensión. **Una de cada par está invertida**: quien marca todo
«siempre» sin leer saca 62,5 %, no 100 %, y hay una prueba que lo verifica. El resultado señala la
dimensión más débil y entrega los tres pasos de **esa** dimensión, no una lista genérica. Se puede
imprimir en una página, con su propio encabezado.

### Los ocho pasos de la primera semana

Una lista marcable que se guarda en el navegador, para acompañar a una PyME real durante la feria
y retomar donde iba.

## Lo que obliga la ley chilena

Un bot que responde sobre precios o garantías está entregando información comercial, y le aplica
la **Ley 19.496**. Esto está en la página porque un dato equivocado aquí le cuesta caro al negocio:

| Punto | Qué dice |
|---|---|
| Información veraz y oportuna | Obligación de informar bien sobre precio, características y condiciones. |
| **Garantía legal: 6 meses** | Con la **Ley 21.398** (Pro Consumidor), vigente desde el **24 de marzo de 2022**, el consumidor elige entre cambio, reparación o devolución dentro de 6 meses en productos nuevos. **Antes eran 3.** |
| No se puede restringir | No se puede cobrar por los derechos de la garantía legal ni acortarla alegando una garantía voluntaria. |
| Retracto: 10 días | En compras a distancia, arrepentirse sin dar explicaciones dentro de 10 días. |
| Vida útil y repuestos | Desde el **24 de agosto de 2022** hay que informar la vida útil y por cuánto tiempo habrá repuestos y servicio técnico. |

Hay una prueba automática que falla si alguien deja escrito «3 meses» en la página.

## Resguardos

Todo lo que se carga **queda solo en ese navegador**: no viaja a ningún servidor. La página lo
dice en la sección de carga y en el pie.

Si en la feria se carga una PyME real, esos son datos de un tercero: conviene pedir permiso al
dueño antes de anotar su teléfono.

Esto es material de un proyecto escolar, **no asesoría legal**. Para una duda real, la fuente es
el SERNAC.

## Pendiente

- **El robot físico.** La página anterior prometía un hardware sincronizado con la app. No está
  construido y no se puede demostrar, así que se sacó de la promesa principal. Si el equipo lo
  arma, entra como una sección propia con lo que realmente haga.
- **Probar con una PyME real** y anotar en qué preguntas el bot dice «no sé»: esa lista es la
  mejor guía para saber qué falta cargar.
