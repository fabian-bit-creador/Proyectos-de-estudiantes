# Proyectos de estudiantes

Aquí se alojan los proyectos trabajados en Claude, Codex u otra herramienta para
mejorar las páginas web de los estudiantes.

Cada proyecto vive en su propia carpeta, con su código y el informe de revisión
que lo acompaña.

## Portada

`index.html` es el portal de la colección: lista los catorce proyectos con buscador y filtro por
curso. Cada tarjeta tiene **Abrir**, que lleva al archivo de su carpeta, y **Descargar HTML**, que
entrega una copia suelta para llevar en un pendrive. Esa copia va embebida en el propio portal, así
que la portada funciona sin conexión y sin el resto de los archivos al lado; el precio es que pesa
2,5 MB y que las copias embebidas hay que regenerarlas cuando un proyecto cambia. El botón «Abrir»
siempre muestra la versión vigente.

## Proyectos

| Proyecto | Curso | Equipo | Qué contiene |
| --- | --- | --- | --- |
| [LiquidApp](liquidapp/) | IV°A · Administración, mención RR.HH. | Andrés Berríos, Angelo Díaz, Bastián Luna, Bastián Pérez | Simulador de liquidaciones de sueldo y finiquitos. Auditoría de 23 hallazgos y versión corregida en un solo archivo HTML. La liquidación imprimible sigue la plantilla del equipo y lleva un código QR que abre la misma liquidación en el celular para descargarla en PDF. Incluye LiquidBot, un asistente de preguntas frecuentes que funciona sin conexión: entiende chilenismos y erratas, recuerda el tema y el sueldo para preguntas como «¿y si es a plazo fijo?», responde con los mismos montos de la calculadora, cita la norma y, ante un despido, informa lo general y deriva a la Inspección del Trabajo. |
| [Recluta Smart](recluta-smart/) | IV°A · Administración, mención RR.HH. | — | Reclutamiento y selección docente. Evaluador por competencias basado en el MBE 2021, comparador, pauta de entrevista y revisor de avisos discriminatorios. |
| [Kipu](kipu/) | III°A · Administración | Sergio Rojas, Colomba Vera Flores, Sebastian Baquedano, Javiera Caro, Antonia Bustos | Contabilidad para PYME, sobre la versión que el equipo publica en Netlify. Dos casos de práctica de La Pintana (un almacén que gana y una ferretería que vende más y pierde) y una pestaña de resultados que responde ¿gané o perdí?, ¿qué tengo? y ¿qué debo?, con gráficos accesibles. Se corrigieron los indicadores del Inicio, la portada casi invisible y la barra que tapaba el contenido en celulares. |
| [Expro](expro/) | III°A · Administración | — | Gestión para microempresas, caso «La Esquina». Se corrigió la inyección de HTML en las tablas, se agregó guardado real y el punto de equilibrio que la página prometía. |
| [GLM](glm/) | III°A y IV°A · Administración | Equipo GLM 2026 (12 integrantes) | Sitio del equipo de Gestión, Logística y Marketing de la Feria. Logo en SVG, carruseles, espacios para 33 fotos, cronograma, mapa del colegio y directorio de proyectos. Publicado para uso interno en https://glm-feria-tp-2026.vercel.app |
| [Visión Integral](vision-integral/) | IV°A · Administración | Daniel Cayupe, Zamara Pavez, Sofía Barrientos, Trinidad González | Diagnóstico de clima laboral educativo. Se reparó el formulario que no enviaba nada y se construyó el instrumento en cuatro pasos: mapeo, consulta anónima, análisis con resguardo de anonimato y ficha de microintervención. |
| [Áurea Solutions](aurea-solutions/) | IV°A · Administración | Sofía Muñoz, Anhais Molina, Pascal Delgado (Grupo N°8) | Inducción de funcionarios nuevos. Se reparó el formulario que decía «consulta registrada» sin enviar nada y se construyó un recorrido virtual del colegio con visor de fotos 360° en WebGL, ruta por cargo con un solo cargo piloto, y glosario de 36 siglas escolares. El Mapa Caro suma la vista satelital real del colegio, donde el equipo ubica las paradas y puntos del proyecto y descarga la página con ellos, y una maqueta 3D generada con esa imagen y los contornos de OpenStreetMap, con recorrido automático y descarga para Blender (.gltf). |
| [AAC.Laboral](aac-laboral/) | IV°A · Administración, mención RR.HH. | — | Orientación sobre derechos laborales con fichas por régimen (Código del Trabajo, Estatuto Docente y Estatuto Administrativo). Se agregaron 6 fichas, buscador tolerante al singular y calculadoras de feriado, hora extra y plazos. |
| [DocentePro](docentepro/) | IV°A · Administración | — | Evaluación de desempeño. Se reconstruyó la app de Base44 como archivo único y se puso al centro el instrumento real: ponderación 50/25/25, logro = nivel ÷ niveles del estándar, cortes objetivos de asistencia y puntualidad, impresión en PDF con el nivel marcado y exportación a Excel. |
| [Pymedigital](pymedigital/) | Administración | — | Alfabetización digital para pymes de La Pintana. Se unieron las dos páginas en un archivo, se cerró la inyección de HTML del catálogo y el diagnóstico pasó de dar consejos fijos a señalar las dos preguntas peor contestadas. Mapa real de la comuna con OpenStreetMap y Leaflet (también sin internet): 176 pymes de barrio, las 16 ferias libres del municipio y los siete CESFAM; cada negocio se puede valorar y la cobertura por sector muestra dónde falta Pymedigital. |
| [Help Wanted](help-wanted/) | III° medio | — | Staffbots para PyMEs. El proyecto prometía que «la PyME define la información» pero no había forma de definirla: ahora el negocio carga sus datos y el bot responde solo con eso, citando de qué dato salió cada respuesta. Incluye las cinco dimensiones del modelo SERVQUAL, autoevaluación de atención y los límites legales de la Ley 19.496. |
| [PRAM](pram/) | III°A · Administración | Matías Bustamante, Víctor Sanabria, Ian Arenas, Sabina Huechucoy | Atención al cliente para pymes, con el caso de Sushi IsiMiya. Se conservaron la esencia y los colores y se agregó el logo en la pestaña del navegador. El reclamo del formulario ya no desaparece: queda en un libro de casos con responsable y plazo, la respuesta se arma con la frase guía del protocolo (para copiar o abrir en WhatsApp o correo) y el caso se cierra anotando qué parte del Triángulo del Servicio hay que ajustar. El panel dejó de inventar barras (respuesta = atención × 0,82) y las reseñas dejaron de mostrar un 5.0 fijo. |
| [LevelUp](levelup/) | IV°A · Administración | Jairo Meza, Stefany Tobar, Nayareth Jiménez, Alisson Jara | Capacitación del personal del colegio, con la versión Feria: quien visita el stand estudia una capacitación, rinde la evaluación y se lleva su certificado en el celular escaneando un código QR. Parte de la página nueva del equipo, con sus siete cursos, colores y logo, y suma una capacitación para estudiantes («Habilidades laborales para tu práctica profesional»), material de estudio imprimible y normativa en cada curso. El certificado tiene folio y código de control, se descarga en PDF o imagen, y el QR se verificó con un lector real desde la pantalla, la imagen y el PDF. Se quitaron los planes y precios, y el formulario de perfil se reemplazó por «Así se definieron las capacitaciones», con la encuesta del equipo a 23 trabajadores y la decisión que tomaron con cada respuesta. Incluye un certificado de ejemplo para probar el QR, una ilustración del stand y un modo stand que borra los datos de cada visitante y cuenta los certificados entregados. Para que el QR funcione, la página debe estar publicada. |
| [MOS-K Green Tech](invernadero-mosk/) | IV°C · Electrónica | MOS-K Green Tech (5 integrantes) | Invernadero automatizado con Arduino UNO. Trae el programa del Arduino (riego por ciclos con alarma si el agua no llega, tope de bomba por hora, extractor y luz térmica con histéresis, pH solo como aviso, pantalla LCD y ajustes guardados en la EEPROM) y un panel que se conecta por USB desde Chrome o Edge: lecturas en vivo, bomba, extractor y luz a mano, gráficos con exportación a CSV, ajustes, calibración del suelo y del pH, consola y guía de armado con las conexiones. Sin el Arduino, simula el mismo programa con una planta de mentira. Se verificó con 74 comprobaciones del programa compilado y comparando byte a byte el Arduino virtual del panel con el real; falta probarlo con el invernadero armado. |

## Capa común de feria

Los ocho proyectos comparten un botón flotante «Presentar proyecto» que abre una guía de tres pasos
para usar en el estand. Es un `<dialog>` con `showModal()`, así que atrapa el foco, se cierra con
Escape y no aparece al imprimir. Junto con él se unificó el contorno de foco, se agregó
`touch-action:manipulation` para quitar el retardo de toque en celular y `scroll-margin-top` para
que los anclajes no queden bajo la barra fija.

## Para continuar el trabajo con otro asistente

`_traspaso/BRIEFING-PROYECTOS-TP-2026.md` reúne el contexto, las reglas de construcción, el
catálogo de defectos recurrentes encontrados en las siete páginas y el estado de cada proyecto.
Está escrito para que cualquier asistente de IA pueda retomar sin haber visto la conversación.

## Cómo se organiza cada carpeta

```
<nombre-del-proyecto>/
├── README.md        contexto, estado y pendientes del equipo
├── <archivo>.html   la versión corregida, lista para entregar
└── auditoria.html   el informe de revisión
```

## Convenciones

- Una carpeta por proyecto, con el nombre del proyecto en minúsculas y sin espacios.
- El `README.md` de cada carpeta explica de qué se trata, qué se corrigió y qué
  queda pendiente para el equipo.
- Los proyectos se entregan como archivos autocontenidos siempre que se pueda:
  sin dependencias externas, para que funcionen sin conexión el día de la feria.
- Nunca se suben datos personales reales de estudiantes ni de funcionarios.

## Mantener las descargas actualizadas

Después de modificar cualquier proyecto, ejecutar `python3 scripts/sync-portal.py`.
`python3 scripts/sync-portal.py --check` confirma que las 14 copias descargables coincidan
con los HTML de sus carpetas. Así «Abrir» y «Descargar HTML» entregan la misma versión.

Revisión del 4 de octubre de 2026: práctica de orientación en Áurea, evidencia y acuerdos
de mejora en DocentePro, comparación de decisiones en EXPRO, correcciones móviles en
PRAM y PymeDigital, y precisión del alcance del código QR de LevelUp.
