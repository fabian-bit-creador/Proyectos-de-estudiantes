# LevelUp.com · Talento que educa

Proyecto de **IV°A · Administración de Empresas** — Colegio Cardenal José María Caro, La Pintana.
Feria Técnico Profesional 2026 (8 de octubre). Equipo: Jairo Meza, Stefany Tobar, Nayareth Jiménez y
Alisson Jara. Docentes: Daniela Ortega y Fabián Herrera.

Archivo: **`LevelUp.html`**, un solo archivo de 277 KB que funciona sin conexión. Verificación:
`?pruebas=1` en la dirección corre **51 comprobaciones**.

## Versión Feria: certificados con código QR

La base es la versión nueva del equipo (`levelup_1_1.html`): sus siete capacitaciones, sus textos, sus
colores (morado, turquesa, lila y tinta), su logo y su tema oscuro. Sobre ella se construyó la propuesta
para la Feria: **quien visita el stand estudia una capacitación, rinde la evaluación y se lleva su
certificado en el celular escaneando un código QR.**

### Cómo se obtiene un certificado

1. **Elegir una capacitación.** Son ocho: las siete del equipo y una nueva para estudiantes. Se pueden
   filtrar por público (estudiantes, personal del colegio, docentes), por área o con el buscador.
2. **Estudiar los 3 módulos.** Cada módulo tiene una explicación, tres ideas clave y un caso práctico.
   Después viene un repaso con glosario, preguntas para reflexionar y la normativa del tema.
3. **Rendir la evaluación.** Son 10 preguntas de alternativas, que se desbloquean al leer los tres
   módulos. Se aprueba con 80 % (8 correctas). Se puede repetir: las preguntas y las alternativas cambian
   de orden, y la revisión muestra la respuesta correcta de cada error.
4. **Generar el certificado.** Solo se pide el nombre, sin RUT, correo ni teléfono. El certificado trae
   folio, puntaje, fecha y un código QR. Se descarga en PDF (A4 horizontal) o como imagen, se imprime o
   se comparte.

Antes de empezar, cada capacitación muestra su ficha: duración, módulos, evaluación, público y lo que
se obtiene al aprobar.

### Cómo funciona el código QR

El certificado es un enlace. Sus datos (capacitación, nombre, fecha y puntaje) van en el fragmento `#`
de la dirección, que el navegador nunca envía al servidor. Por eso no hace falta una base de datos: al
escanear el QR, el celular abre LevelUp y la página dibuja el certificado. Luego se descarga en PDF o se
guarda el enlace.

El **código de control** del folio resume esos datos. Si alguien cambia el nombre, la fecha o el
puntaje en el enlace, la página lo muestra como «enlace modificado». No es una firma digital, porque el
cálculo está en la misma página, pero protege contra los cambios hechos a mano. Cada certificado dice
que **reconoce una actividad formativa de un proyecto estudiantil y no es una certificación oficial.**

**Para que el QR funcione en la Feria, la página tiene que estar publicada en internet.** El celular del
visitante necesita datos móviles; el computador del stand, no.

- Los QR apuntan por defecto a **https://levelup-adm.netlify.app/**, el sitio del equipo. **Hoy ese sitio
  muestra la versión anterior.** Hay que subir este `LevelUp.html` a Netlify con el nombre `index.html`.
- Si la página se abre desde otra dirección pública, los QR usan esa dirección automáticamente.
- En el pie de página, **«Dirección de los códigos QR»** permite escribir otra dirección. Queda guardada
  en ese computador.
- En esa misma ventana hay un **QR de prueba**. Si al escanearlo el celular muestra el certificado de
  ejemplo, los QR de la Feria funcionan.

### Modo stand

El modo stand se activa con `?stand=1` al final de la dirección, o con «Activar el modo stand» en el pie.

- **El avance y el nombre de cada visitante no se guardan en el computador**, solo en la sesión.
  «Siguiente visitante» los borra antes de atender a la próxima persona.
- **Panel del stand.** Muestra cifras anónimas: certificados entregados por capacitación, personas que
  comenzaron, evaluaciones rendidas, aprobación, perfiles (opcional) y la pregunta de impacto.
- **«¿Hay fila? Hazla en tu celular».** Es un QR para que los visitantes hagan la capacitación en su
  teléfono mientras esperan.
- **Guion de 3 minutos.** Sirve para presentar el proyecto.

### Qué se cambió de la página del equipo

- **Sin valores monetarios.** Se quitaron «Planes y precios» (tres planes con precio), el simulador de
  financiamiento y «¿En qué se utilizarían los recursos?», porque es un proyecto escolar.
- **El formulario se convirtió en estadística.** «Mi perfil» pedía nombre, cargo, área, interés y
  habilidad, y guardaba el nombre para siempre. Ahora el nombre se pide solo al generar el certificado,
  y quién eres es opcional y de un toque (estudiante, docente, apoderado…). En su lugar está **«Así se
  definieron las capacitaciones»**:
  - la encuesta a 23 trabajadores de 13 cargos, en cifras;
  - el recorrido del problema a la solución;
  - un gráfico de 23 personas por pregunta, con la decisión que tomó el equipo según sus Informes 2 y 3;
  - la relación entre cada tema pedido y la capacitación que lo cubre;
  - la medición de impacto del Informe 3, comparada con la línea base de 43,5 %.
- **Lo que se comprimió:**
  - los ocho lemas quedaron en una línea que rota en la portada;
  - la grilla de áreas quedó en el filtro del catálogo;
  - las recomendaciones quedaron como filtro por público;
  - la autoevaluación de 1 a 5, que no tenía uso, se reemplazó por la pregunta de impacto.
- **Una capacitación para estudiantes.** «Habilidades laborales para tu práctica profesional» trata
  currículum y entrevista, comunicación y responsabilidad en el trabajo, retroalimentación, bitácora y
  seguro escolar. Tiene sus 10 preguntas, glosario y normativa.
- **Material de estudio por capacitación.** Se abre desde cada tarjeta y se imprime o guarda en PDF en
  hoja vertical, con texto seleccionable.
- **Caso de prueba.** Hay un certificado de ejemplo a nombre de una persona ficticia, Valentina Rojas
  Fuentes, con la marca «Ejemplo · sin validez». Sirve para mostrar el resultado y probar el QR.
- **Imagen interpretativa.** La portada muestra una ilustración del stand, con el toldo azul y la
  cartulina lila del presupuesto del equipo. El computador muestra un certificado aprobado con su QR
  (que es real y abre LevelUp), un celular lo escanea y al fondo está el colegio.

### Revisión del sentido del contenido

- **Áreas.** La portada decía «8 áreas», pero solo 6 tenían cursos. Ahora son 7 y todas tienen al menos
  una capacitación: «Habilidades laborales» y «Desarrollo personal», que no tenían ninguna, se unieron
  y reciben el curso para estudiantes.
- **Cifras vagas.** «100 % seguimiento digital» no medía nada. Se reemplazó por datos concretos:
  8 capacitaciones, 3 módulos, 10 preguntas con 80 % para aprobar, y certificado con QR.
- **Recomendaciones.** La recomendación por interés en «Habilidades laborales» llevaba a Liderazgo;
  ahora hay un curso propio.
- **Objetivo y normativa.** Cada capacitación tiene un objetivo («al terminar podrás») y la normativa
  en que se apoya:
  - Ley 20.536 de violencia escolar;
  - Ley 21.643, «Ley Karin»;
  - Ley 19.628 de datos personales;
  - Decretos 83 y 170, y Ley 21.545, «Ley TEA»;
  - Bases Curriculares de 3° y 4° medio;
  - Decreto 67;
  - Marco para la Buena Dirección y el Liderazgo Escolar;
  - Ley 16.744 y DS 313 del seguro escolar.
- **Líneas de ayuda.** Bienestar suma Salud Responde (600 360 7777) y la línea de prevención del
  suicidio (*4141).
- **Texto del equipo.** El contenido de los siete cursos no se modificó.
- **Temas que faltan.** La encuesta pidió primeros auxilios, reglamento interno y seguridad, y Excel.
  Quedaron como «temas por preparar con el colegio», porque deben salir de los protocolos reales del
  establecimiento.

### Datos y privacidad

La página no envía nada a ningún servidor. Fuera del modo stand, el avance y los certificados se guardan
solo en ese navegador. Al abrir un certificado desde el QR en un celular, queda también en «Mis
certificados» de ese teléfono. El nombre viaja solo dentro del enlace del certificado.

## Verificación

- **`?pruebas=1`: 51 comprobaciones.**
  - Contenido: 8 capacitaciones de 3 módulos y 10 preguntas sin repetir; todas las áreas con cursos.
  - Encuesta: cada pregunta suma 23 y los porcentajes coinciden con los informes.
  - Nombre: rechaza RUT, correo y teléfono.
  - Enlace: conserva tildes, eñes y apóstrofos; cambiar puntaje, nombre, fecha o capacitación lo
    invalida.
  - QR: de versión 10 o menor, aun con un nombre largo.
  - PDF: con su tabla de referencias correcta.
  - Modo stand: «Siguiente visitante» borra el avance.
  - Ningún monto de dinero en la página.
- **Recorrido completo en Chromium: 27 comprobaciones.**
  - Estudiar, reprobar con 7 de 10, aprobar con 10 de 10 y generar el certificado.
  - El QR se leyó con un decodificador real (jsQR) desde la pantalla, desde la imagen descargada y desde
    el PDF. Los tres dan el mismo enlace.
  - El PDF es una página A4 horizontal, y la impresión sale en una sola hoja.
  - El enlace abierto en un celular muestra «Certificado verificado». Si se altera el puntaje, avisa que
    fue modificado.
- **17 comprobaciones más:**
  - modo stand;
  - tema oscuro;
  - certificado de ejemplo;
  - guía impresa en vertical;
  - página abierta como archivo, cuyos QR usan la dirección pública;
  - «reducir movimiento».
- **Accesibilidad.** axe-core no encontró problemas en la portada (tema claro y oscuro), las pantallas
  del curso, el certificado ni la vista del celular.
- **Anchos.** La página se revisó a 390 px sin desbordes.

## Para el día de la Feria

1. Publicar este archivo en Netlify y escanear el QR de prueba con dos o tres celulares, Android y iPhone.
2. En el computador del stand, abrir la página con `?stand=1`.
3. Presentar con el guion del panel del stand. Después de cada visitante, presionar «Siguiente visitante».
4. Al terminar el día, anotar las cifras del panel del stand para el informe de impacto. Solo quedan en
   ese computador.

## Qué queda pendiente para el equipo

1. Publicar la página y probar los QR antes del 8 de octubre.
2. Revisar el curso para estudiantes con quien coordina las prácticas profesionales.
3. Revisar la normativa citada con el Encargado de Convivencia y el equipo de apoyo.
4. Preparar con el colegio primeros auxilios, reglamento interno y Excel.

## Versiones anteriores

La **versión 2** sigue en el historial del repositorio (commit `eaf3f17`). Tenía siete cursos con
práctica interactiva: una hoja de Excel que calculaba fórmulas, un prompt de IA sin datos personales,
primeros auxilios y respiración guiada. También tenía el juego «Une los conceptos», diagnóstico, ruta
por cargo, niveles y panel de resultados. Esta versión parte de la página nueva del equipo, que cambió
el set de cursos, y se enfocó en los certificados para la Feria. Cualquiera de esas piezas se puede
recuperar si el equipo la quiere en el stand.

La **versión 1** corrigió la página original: la respuesta correcta siempre era la primera, el logo
repetido pesaba 1,5 MB, el ícono de la pestaña era ilegible y en celular la página se salía hacia el
lado.
