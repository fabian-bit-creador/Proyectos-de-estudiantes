# AAC.Laboral · orientación sobre derechos laborales

Proyecto de **IV°A, Administración de Empresas mención RR.HH.** — Colegio Cardenal José María Caro.
Feria Técnico Profesional 2026.

Archivo: **`AACLaboral.html`** — un solo archivo, sin dependencias externas.
Verificación: botón «Verificar el motor» o `?pruebas=1`. **36 comprobaciones.**

## Base

Se partió del entregable que el equipo generó con Codex, que ya venía bien construido: sin CDN,
`textContent` en todo, `noscript`, `focus-visible`, área de impresión y 18 pruebas propias.
Lo más valioso de su diseño es que **se niega a responder cuando no corresponde**: si alguien marca
«municipal» u «honorarios», no le aplica el DFL 29 por analogía.

Se verificaron sus citas legales contra fuente: el artículo 211-B bis sobre denuncia de acoso, el
dictamen ORD. N°253/21 del 16 de abril de 2026 y las 42 horas desde el 26 de abril de 2026.
Todas correctas.

## Qué se agregó

**Seis fichas nuevas del Código del Trabajo.** Las 15 originales no cubrían lo que la gente
pregunta primero. Ahora son 22:

| Ficha | Norma verificada |
| --- | --- |
| Renuncia voluntaria | Art. 159 N°2 y 177 · aviso de 30 días |
| Causales de término | Arts. 159, 160 y 161 |
| Indemnización por años de servicio | Art. 163 · 330 días de tope · base limitada a 90 UF (art. 172) |
| Cotizaciones impagas | Art. 162 |
| Colación | Art. 34 · media hora mínima, no se computa como trabajada |
| Licencia médica | DS 3/1984 MINSAL art. 11 · 2 días hábiles sector privado, 3 el público |
| Fuero maternal y postnatal parental | Arts. 197 bis y 201 |

La licencia médica trajo una fuente nueva, porque **no se rige por el Código del Trabajo**: la ficha
lo dice explícitamente y enlaza a la Superintendencia de Seguridad Social.

**Buscador que tolera el singular.** Antes «vacaciones» encontraba y «vacacion» no devolvía nada.
Tampoco «me despidieron», «renuncia» ni «indemnización». Ahora la coincidencia exacta vale 2 puntos,
el prefijo de cuatro letras o más vale 1, y el título suma 1. Las dos negativas que el equipo había
protegido siguen funcionando: `permisometro` y `criptomonedas` no devuelven nada.

**Tres calculadoras**, que es lo que convierte la página de orientación en herramienta:

- **Feriado anual** — antigüedad y zona. 15 días hábiles de base, 20 en Aysén, Magallanes y Palena,
  más el progresivo del art. 68 sobre los diez años.
- **Hora extraordinaria** — sueldo y jornada semanal, con el recargo del 50% del art. 32.
- **Plazos** — vencimiento de la escrituración del contrato (15 o 5 días corridos, art. 9) y del
  finiquito (10 días hábiles, art. 177). El finiquito **muestra las dos lecturas de «día hábil»**,
  porque el resultado cambia según cuál se aplique y la página no debe elegir por el usuario.

**Fecha de edición en un solo lugar.** Antes estaba escrita en cuatro sitios y además codificada en
el JavaScript. Ahora sale de `DATA.edicion` y se inyecta donde corresponda.

## Límites que se mantuvieron a propósito

La página orienta, no resuelve. No analiza pruebas, no decide si hubo infracción, no recibe
denuncias y no calcula la indemnización de nadie. Cada ficha conserva su ámbito de aplicación y su
enlace a la norma. Las calculadoras se declaran como estimaciones educativas.
