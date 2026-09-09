# Áurea Solutions · inducción de funcionarios nuevos

Proyecto de título de **IV°A, especialidad de Administración** — Colegio Cardenal José María Caro,
Fundación Belén Educa, La Pintana. **Feria Técnico Profesional 2026.**

Equipo: **Sofía Muñoz** y tres integrantes por confirmar (Grupo N°8).
Informe Nº1: **28/30 · nota 6,5**.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `AureaSolutions.html` | La página completa, en un solo archivo y sin dependencias externas (109 KB). |
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

## Qué se agregó

- **Recorrido virtual de 12 paradas** con visor de fotos 360° equirectangulares escrito en WebGL
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

## Verificación

- 24 verificaciones del motor (`?pruebas=1` o el botón «Verificar el motor»).
- 41 comprobaciones de comportamiento en Chromium, incluida una que lee los píxeles del canvas
  para confirmar que el visor 360 dibuja, que arrastrar cambia la vista y que centrar la restaura.
- Dos bugs encontrados y corregidos durante esa verificación: el primer dibujo del visor ocurría
  con el canvas todavía en `display:none` (viewport 0 px, pantalla negra), y la primera parada
  solo se pintaba dentro del callback de IndexedDB, que en `file://` puede no resolverse nunca.

## Pendientes del equipo

Están detallados en `GuiaParaElEquipo.html`. Los tres primeros:

1. **Validar con RR.HH. que la inducción es el problema** — es lo que pidió la retroalimentación
   del Informe Nº1 y sigue sin hacerse.
2. **Llenar la carpeta de Drive**, que está vacía.
3. **Probar la ruta con un funcionario real** que haya llegado este año.
