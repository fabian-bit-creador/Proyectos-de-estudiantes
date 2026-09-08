# Visión Integral · diagnóstico de clima laboral educativo

Proyecto de título de **IV°A, especialidad de Administración** — Colegio Cardenal José María Caro,
Fundación Belén Educa, La Pintana. **Feria Técnico Profesional 2026.**

Equipo: **Daniel Cayupe, Zamara Pavez, Sofía Barrientos, Trinidad González**.

Archivo entregable: **`VisionIntegral.html`** (104 KB, un solo archivo, sin dependencias externas).

---

## 1. Qué encontramos en la página original

La versión publicada en Netlify estaba bien construida visualmente, pero tenía cinco problemas
que un jurado puede detectar en la feria.

### 1.1 El formulario de cotización no enviaba nada (el más grave)

El formulario era este:

```html
<form class="flex flex-col gap-4">
  <input type="hidden" name="form-name" value="cotizacion-bienestar"/>
```

Le faltaban tres cosas que Netlify Forms exige para registrar un formulario:

| Falta | Para qué sirve |
|---|---|
| `name="..."` en el `<form>` | es el nombre con que Netlify identifica el formulario |
| `data-netlify="true"` | le dice a Netlify que procese este formulario al publicar |
| `method="POST"` | sin esto el navegador manda un GET y no se registra nada |

Con solo el `<input type="hidden" name="form-name">` **Netlify no registra el formulario**: las
solicitudes no llegaban a ninguna parte. Y la página prometía *«respuesta estimada en menos de
48 horas hábiles»*. Si en la feria alguien completa el formulario y nunca recibe respuesta, esa
promesa se transforma en el punto débil de la presentación.

**Corregido** en el archivo nuevo. Cómo activarlo está en la sección 4.

### 1.2 La página se presentaba como empresa constituida

Decía *«Más elegido por establecimientos»* en el plan Integral, mostraba
`contacto@visionintegral.cl` (un dominio que el equipo no tiene) y ofrecía tres planes como si
estuvieran a la venta. Nada de eso se puede sostener: el proyecto no tiene clientes ni precios.

La pregunta *«¿cuántos establecimientos los han contratado?»* es la primera que hace un jurado.
En la versión nueva los tres niveles siguen ahí, pero declarados como **diseño de servicio**, y
la etiqueta dice **«Recomendado»** en vez de «Más elegido». Adelantarse a la pregunta es mejor
argumento que esperarla.

### 1.3 «100% Propuestas personalizadas»

Es una cifra que no mide nada: cualquier propuesta hecha a medida es 100% personalizada por
definición. Reemplazada por datos verificables: **3 etapas**, **5 dimensiones**, **0 datos que
salen del navegador**.

### 1.4 El enlace de Instagram no llevaba a ninguna parte

`href="#"`. Un enlace que no lleva a nada es peor que no ponerlo. Se sacó; cuando tengan la
cuenta, se agrega el enlace real.

### 1.5 La metodología estaba descrita, pero no se ejecutaba

Este era el vacío de fondo. La página explicaba muy bien **Mapeo → Análisis → Acción**, pero
no había forma de hacerlo: ni un cuestionario, ni una tabulación, ni una ficha de acción. Un
visitante de la feria leía la promesa y se iba sin ver nada funcionando.

---

## 2. Qué agrega la versión nueva: el instrumento

La página ahora **ejecuta** la metodología, en cuatro pasos dentro de la sección «Instrumento de
diagnóstico».

### Paso 1 · Mapeo
Se elige **una sola dimensión** de las cinco disponibles (comunicación interna, carga de trabajo,
reconocimiento y trato, convivencia entre equipos, liderazgo y conducción), se describe el grupo
consultado, cuántas personas lo componen y **el mínimo de respuestas para mostrar resultados**.

### Paso 2 · Consulta anónima
Cinco afirmaciones de la dimensión elegida, con escala de 1 a 5. No pide nombre, cargo, edad ni
antigüedad. Hay un comentario voluntario opcional. Las respuestas quedan **solo en el navegador**.

Sirve como **kiosco de feria**: dejan un notebook o tablet en el puesto, quien pasa responde en
menos de dos minutos, y el equipo muestra los resultados en vivo.

### Paso 3 · Análisis
Tabula todo: promedio por ítem, distribución de respuestas, índice general de 0 a 100, nivel
(crítico / por mejorar / aceptable / favorable), tasa de respuesta, ítem más alto y más bajo.

### Paso 4 · Acción
Toma el ítem que salió más bajo y arma la **ficha de microintervención**: qué se hace, quién la
lleva, en cuánto tiempo, con qué indicador se verifica, cuál es la meta y cómo se comprueba.
Cada uno de los 25 ítems tiene su propia acción propuesta: no es un texto genérico.

---

## 3. Las tres decisiones técnicas que conviene saber explicar en la feria

Son las tres preguntas más probables del jurado. Vale la pena que las cuatro personas del equipo
puedan responderlas.

### 3.1 El bloqueo por anonimato

Si hay menos respuestas que el mínimo definido (5 por defecto), **el análisis no se muestra**.
Aparece un candado que explica por qué.

> En un establecimiento chico, mostrar el detalle de un grupo de tres personas equivale a decir
> quién respondió qué. El anonimato no se garantiza prometiéndolo: se garantiza **no permitiendo**
> desagregaciones que identifiquen a alguien.

El bloqueo también tapa los comentarios voluntarios, que es por donde se filtra más información
identificable. Se puede bajar el mínimo, pero la herramienta advierte que eso tiene un costo.

**Pruébenlo en la feria**: suban el mínimo a 30 con 18 respuestas cargadas y muestren cómo se
bloquea solo. Es el mejor momento de la demostración.

### 3.2 Los ítems invertidos

Cinco de los 25 ítems están redactados al revés a propósito. Por ejemplo:

> *«Me llevo trabajo para la casa la mayoría de las semanas.»*

Aquí estar **muy de acuerdo** es una señal **mala**. El motor da vuelta el puntaje (un 5 vale 1)
para que en todos los ítems «más alto» signifique «mejor».

Se usan por dos razones: evitan que alguien marque toda la columna de la derecha sin leer, y
permiten detectar respuestas hechas al azar. Cada dimensión tiene al menos uno.

### 3.3 Nada de 360°, 180° ni 90°

La instrucción del profesor fue explícita: *«eviten evaluaciones 360°, 180° o 90° sin
justificación»*. Esas evalúan el **desempeño de personas identificadas** y necesitan otro marco
legal y otro consentimiento. Este instrumento mide **clima**, que es una propiedad del grupo, no
de las personas. La página lo dice en dos lugares distintos.

---

## 4. Cómo publicarlo en Netlify

El archivo reemplaza el sitio actual y **conserva el mismo dominio**.

### Opción A · arrastrar y soltar (2 minutos)

1. Crear una carpeta nueva en el escritorio.
2. Copiar dentro `VisionIntegral.html` y **renombrarlo a `index.html`**.
3. Entrar a [app.netlify.com](https://app.netlify.com), abrir el sitio `visionintegralcl`.
4. Ir a **Deploys** y arrastrar la carpeta al recuadro «Drag and drop your site output folder here».
5. Listo. El sitio queda publicado en el mismo dominio.

### Opción B · dejarlo junto al proyecto actual

Si prefieren no reemplazar todavía, súbanlo como una segunda página: copien el archivo a la
carpeta del proyecto con el nombre `instrumento.html` y enlácenlo desde el menú. Así pueden
mostrar las dos versiones en la feria.

### Activar el formulario de contacto

El formulario ya trae los tres atributos que faltaban:

```html
<form name="solicitud-piloto" method="POST" data-netlify="true" data-netlify-honeypot="bot-field">
```

Para que funcione:

1. Publicar el archivo en Netlify (el formulario **no** funciona abriendo el archivo desde el
   computador: ahí el botón descarga la solicitud como archivo de texto, que también sirve).
2. En el panel de Netlify, entrar a **Forms** y verificar que aparezca `solicitud-piloto`.
3. En **Forms → Settings → Form notifications**, agregar el correo donde quieren recibir las
   solicitudes.
4. Opcional: crear una página `gracias.html` y agregarle `action="/gracias.html"` al formulario.

Vale la pena **probarlo una vez** antes de la feria: completar el formulario en el sitio publicado
y confirmar que llega el correo.

---

## 5. Verificación

El archivo trae **22 verificaciones automáticas** del motor de cálculo. Para correrlas:

- Botón **«Verificar el motor»**, al final de la sección del instrumento; o
- abrir la página con `?pruebas=1` al final de la dirección.

Cubren el puntaje invertido, los umbrales de nivel, la tasa de respuesta, el bloqueo por
anonimato (incluido que tape los comentarios y el CSV), la elección del ítem más bajo con criterio
de desempate declarado, la meta tope de 5,0, el formato decimal chileno del CSV y el caso de cero
respuestas.

Si en la feria alguien pregunta si los números están bien, **muestren el botón**. Un proyecto que
se verifica solo delante del jurado dice más que cualquier explicación.

Además se probó en Chromium sin conexión: 27 comprobaciones de comportamiento (carga de ejemplo,
bloqueo y desbloqueo por anonimato, validación de ítems faltantes, escape de comentarios,
navegación por pestañas con teclado, exportación CSV y cambio de dimensión).

---

## 6. Qué falta y es decisión del equipo

| Pendiente | Quién lo resuelve |
|---|---|
| Cambiar los roles del equipo por los reales | el equipo |
| Poner las fotos (requiere autorización de uso de imagen) | el equipo |
| Enlace real de Instagram, si abren la cuenta | el equipo |
| Correo de contacto real (no uno de un dominio que no tienen) | el equipo |
| Activar y **probar** el formulario en Netlify | el equipo |
| Conseguir la autorización escrita si van a aplicarlo de verdad | dirección del establecimiento |

---

## 7. Detalles técnicos

- **Un solo archivo, sin dependencias.** No usa Tailwind por CDN, ni Google Fonts, ni ninguna
  librería. La versión anterior cargaba tipografías desde `fonts.googleapis.com`: **si en la feria
  no hay wifi, esa página se ve mal**. Esta no.
- **Tres capas separadas**: datos → cálculo (funciones puras, sin tocar la pantalla) → interfaz.
  Por eso el motor se puede verificar solo.
- **Sin `innerHTML` con texto de terceros.** Los comentarios voluntarios se insertan con
  `textContent`, así que si alguien escribe `<b>hola</b>` se ve el texto, no se ejecuta.
- **Accesibilidad**: pestañas con `role="tab"` y navegación por flechas, `aria-live` en los
  avisos, salto al contenido, foco visible, y respeto a `prefers-reduced-motion`.
- **Los datos no salen del navegador.** Se guardan en `localStorage`, en el equipo de quien la
  usa. No hay servidor, no hay base de datos, no hay envío. Está dicho en la página y en el pie.
- **Imprimible**: la ficha de microintervención se puede imprimir o guardar como PDF sin los
  botones ni el menú.

---

## 8. Restricción que se mantuvo

Instrucción del profesor al equipo:

> *«Deben seleccionar una sola dimensión, aplicar una consulta anónima y autorizada y evitar
> evaluaciones 360°, 180° o 90° sin justificación. Luego pueden probar una microintervención
> concreta.»*

El instrumento está construido para que **no se pueda** hacer otra cosa: solo deja elegir una
dimensión por vez, no pide ningún dato identificable, bloquea el detalle bajo el mínimo de
anonimato, advierte que se requiere autorización de la dirección, y termina obligatoriamente en
una microintervención con plazo e indicador.
