# Recluta Smart — versión mejorada

Proyecto del Grupo Recluta Smart, IV°A, Administración de Empresas mención Recursos
Humanos, para la Feria Técnico Profesional 2026 del Colegio Cardenal José María Caro.

Se revisó la entrega original (`Recluta_Smart.html`, 1.765 líneas) y se reconstruyó
alrededor de lo que faltaba: **la herramienta**.

## El diagnóstico en una frase

La página describía un «filtro inteligente para encontrar docentes compatibles», pero
ese filtro no existía. La sección «Así se vería el filtro en acción» eran tres bloques
de HTML con los porcentajes 92 %, 86 % y 74 % escritos a mano. Al preguntarle al equipo
en el stand «muéstrenme cómo filtra», no había nada que mostrar.

## Qué se conservó

- **El catálogo de 26 cargos** en 6 estamentos, con propósito, funciones, requisitos
  obligatorios y deseables, formación, experiencia y competencias. Es lo mejor de la
  entrega original y está íntegro, sin cambiarle una coma.
- La identidad visual: azul institucional, celeste y los acentos del logo.
- El contenido sobre estamentos, perfil docente y rol de la encargada de área.

## Qué se agregó: cuatro herramientas que funcionan

| Herramienta | Qué hace |
| --- | --- |
| **Evaluador** | Puntúa a un candidato criterio por criterio con una rúbrica visible, y explica de dónde salió cada punto. |
| **Comparador** | Ordena a los candidatos evaluados y aplica una regla de desempate declarada de antemano. |
| **Pauta de entrevista** | Genera preguntas de comportamiento pasado (método STAR) por cargo, con qué buscar en cada respuesta. |
| **Revisor de avisos** | Detecta requisitos discriminatorios en un aviso de empleo, indica qué criterio del artículo 2 involucran y propone cómo redactarlo. |

## Cómo responde a la retroalimentación docente del 31 de agosto

> «Trabajen con un cargo ficticio o validado, una pauta estructurada y criterios por
> competencias. Eviten filtros discriminatorios y no atribuyan la rotación al
> reclutamiento sin evidencia.»

- **Pauta estructurada y criterios por competencias** → la rúbrica se apoya en los cuatro
  dominios del Marco para la Buena Enseñanza actualizado en 2021, con descriptores de
  nivel 0 a 3. Los pesos son visibles y editables.
- **Cargo ficticio** → tres candidatos de ejemplo con nombres de fantasía, y una
  advertencia permanente contra el uso de datos reales.
- **Evitar filtros discriminatorios** → el formulario no pide edad, sexo, comuna, estado
  civil ni foto; hay una sección que declara los 18 criterios que nunca se piden y por
  qué; y el revisor de avisos convierte esa regla en una herramienta demostrable.
- **No atribuir la rotación sin evidencia** → se reformuló como hipótesis explícita y se
  agregó la sección «cómo sabremos si funciona», con la línea base en blanco a propósito.

## Errores corregidos

1. El filtro no calculaba nada: porcentajes escritos a mano.
2. El formulario decía «Solicitud recibida» sin enviar nada a ninguna parte. Ahora genera
   un texto para copiar y lo dice explícitamente.
3. La rotación docente se presentaba como consecuencia de la selección, sin evidencia.
4. No había ninguna fuente citada. Ahora el marco legal y pedagógico está referenciado.
5. Sin pruebas: cualquier cambio era una apuesta.

## Cómo usarlo

Se abre con doble clic. **No necesita servidor, instalación ni conexión a internet.**

- `?pruebas=1` en la dirección corre las 17 pruebas del motor al abrir la página.
  También está el botón «Verificar el motor» dentro del evaluador.
- La rúbrica completa vive en la constante `RUBRICA`, y el catálogo en `CARGOS_DATA`.
  Son los dos únicos lugares donde hay que editar contenido.

## Fuentes

- Marco para la Buena Enseñanza actualizado 2021 — Estándares de la Profesión Docente,
  CPEIP · Mineduc, aprobado por el Consejo Nacional de Educación en marzo de 2021.
  Cuatro dominios y doce estándares: 1 a 4 en A, 5 y 6 en B, 7 a 9 en C, 10 a 12 en D.
- Código del Trabajo, artículo 2 — Dirección del Trabajo.
- Ley 20.609, sobre medidas contra la discriminación.
- Ley 21.015, de inclusión laboral de personas con discapacidad.
- Ley 19.070, Estatuto de los Profesionales de la Educación.

## Qué queda pendiente para el equipo

1. Validar la rúbrica con la encargada de área: ¿los pesos son los correctos para este
   establecimiento?
2. Levantar la línea base de los indicadores de la sección «cómo sabremos si funciona».
3. Probar la pauta con dos evaluadores sobre el mismo candidato ficticio y medir la
   diferencia. Ese es el dato más potente que pueden llevar a la Feria.
4. Escribir el guion de demostración de tres minutos.
5. Probar en un celular real, sin conexión, el día anterior.
