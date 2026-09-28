# LevelUp.com · Talento que educa

Proyecto de **IV°A · Administración de Empresas** — Colegio Cardenal José María Caro. Feria Técnico Profesional 2026.
Grupo de Nayaret Jiménez (en el directorio de GLM figura con Stefany Tobar como líder).
Publicado por el equipo en https://levelup-adm.netlify.app

Archivo: **`LevelUp.html`**, un solo archivo de 276 KB. Verificación: `?pruebas=1` en la dirección, **44 comprobaciones**.
La única parte que necesita internet es la encuesta oficial de Google Forms; sin conexión, la página lo avisa.

Se mantuvieron la esencia, los colores (morado, turquesa y tinta), el logo y todos los textos del equipo.

## Versión 2: de manuales a cursos que se practican

**De dónde salen los cambios.** No había una página nueva: el repositorio, la página publicada en Netlify
(idéntica a la versión guardada) y la carpeta de Drive no tenían otra versión. Lo nuevo estaba en los
**Informes 2 (corregido) y 3** del equipo: la encuesta a 23 trabajadores, los temas que pidieron, la
pregunta con que planean medir el impacto y la actividad de su stand. La versión 2 se construyó con eso.

### Siete cursos, cada uno con lecciones, práctica y test

Cada manual se abre como un curso: sus secciones son las lecciones, luego viene una **práctica** y al
final el test de 5 preguntas. El curso recuerda el último paso visto, y «Ver el manual completo» muestra
todo en una página para proyectar o imprimir.

| Curso | Práctica |
|---|---|
| Excel | Una hoja de inventario donde las fórmulas se calculan de verdad (SUMA, PROMEDIO, MAX, MIN, CONTAR). Si falta el `=`, se escribe en inglés o se pone el número a mano, lo explica. |
| Documentos | Ordenar los cinco pasos para crear un documento. |
| Primeros auxilios | «¿Qué harías?»: cuatro situaciones; cada respuesta explica por qué. |
| IA educativa | Armar el prompt básico del manual. Si lleva un RUT, un correo o un teléfono, no deja copiarlo. |
| **Convivencia y conflictos** (nuevo) | Ordenar los cinco pasos de una mediación. |
| **Gestión emocional** (nuevo) | Un minuto de respiración cuadrada guiada. |
| **Liderazgo y comunicación** (nuevo) | Elegir la retroalimentación más útil en tres casos. |

Los tres cursos nuevos responden a temas que pidió la encuesta; entre ellos está el más pedido,
convivencia escolar. Las rutas por cargo los incluyen, y el diagnóstico suma el curso a la ruta cuando la
capacitación que propone la persona ya existe. Los niveles ahora piden 1, 3, 5 y 7 cursos aprobados, y
cada curso muestra su avance en «Mi avance».

### Secciones nuevas

- **Lo que respondieron 23 trabajadores:** las respuestas de la encuesta en barras (también como tabla),
  la modalidad que prefieren y los temas pedidos, cada uno con su curso.
- **Medición de impacto:** la pregunta del Informe 3 («¿las capacitaciones de LevelUp responden a tu
  cargo?») comparada con la encuesta inicial, donde 43,5 % respondió «por supuesto». Suma una nota de
  satisfacción de 1 a 5 y se exporta a Excel.
- **Une los conceptos:** la actividad del stand en versión digital. Cada ronda trae cinco conceptos al
  azar y registra el tiempo, los errores y el mejor tiempo.
- **Panel:** suma la medición de impacto, las prácticas completadas y las rondas jugadas.

### Animaciones

Las secciones aparecen al llegar a ellas y los anillos y barras de avance crecen. Los pasos del curso se
deslizan, al aprobar cae papel picado (más al subir de nivel) y el círculo de respiración marca el ritmo.
Si el computador o el celular tiene activado «reducir movimiento», todo queda quieto.

### Para revisar con el colegio

- Los tres cursos nuevos son **contenido general**, preparado a partir de lo que pidió la encuesta:
  convivencia cita la Ley 20.536 y el protocolo del colegio; gestión emocional incluye la línea *4141;
  liderazgo usa el modelo Situación–Comportamiento–Impacto. **Conviene que el equipo los revise** con el
  Encargado de Convivencia y el equipo de apoyo del colegio.
- **Reglamento interno** (cerca del 18 % de las respuestas) quedó «por preparar con el colegio»: debe
  salir del reglamento real del establecimiento.

## Versión 1: el ciclo completo de la capacitación

El equipo define su propósito como «detectar necesidades, entregar material, practicar, evaluar y
utilizar los resultados para seguir mejorando». La versión 1 cerró ese ciclo:

1. **Detectar.** El diagnóstico entrega una **ruta personal**: qué cursos abrir y en qué orden, y
   consejos según las respuestas.
2. **Capacitar.** «Capacitación según tu cargo» abre la ruta de cada cargo con su avance.
3. **Evaluar.** Tests de 5 preguntas que se barajan en cada intento; al corregir, cada pregunta muestra
   la respuesta correcta y por qué. Se aprueba con 70 %, el corte que ya usaba el equipo.
4. **Subir de nivel.** Nivel del 0 «Punto de partida» al 4 «Talento que educa», y una **constancia de
   participación** imprimible.
5. **Usar los resultados.** Un panel con qué capacitación pide la comunidad, un plan sugerido y la
   pregunta más fallada de cada test. Todo se exporta a Excel.

También se corrigió lo que estaba mal en la página original:

- La respuesta correcta era siempre la primera alternativa.
- La página pesaba 1,5 MB por el mismo logo repetido cinco veces.
- El ícono de la pestaña era ilegible.
- En celular la página se salía hacia el lado.
- Los botones de opción se estiraban a todo el ancho.
- Resultados y comentarios se armaban juntando texto con código HTML.

**Primeros auxilios:** se agregaron indicaciones estándar que faltaban:

- Poner a la persona de lado al terminar la convulsión.
- Cuándo llamar al SAMU (131).
- Los números de emergencia de Chile.

Conviene revisarlas con el protocolo del colegio.

## Datos

Todo se guarda **solo en el navegador** donde se usa: no hay servidor. Lo guardado con la versión 1 se
conserva. En la Feria, cada visitante que responde, practica o juega en el mismo computador suma al panel.
«Cambiar de participante» empieza con otra persona sin borrar el panel; «Borrar datos de prueba» limpia
todo. La constancia es de una actividad formativa escolar y no corresponde a una certificación oficial.

## Para presentarlo en la feria

1. Mostrar lo que respondieron los 23 trabajadores y abrir el curso más pedido.
2. Hacer una práctica con el visitante: la hoja de Excel o el prompt de IA.
3. Jugar una ronda de «Une los conceptos».
4. Pedirle que responda la medición de impacto y mostrar cómo cambia el panel.
