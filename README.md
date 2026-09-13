# Proyectos de estudiantes

Aquí se alojan los proyectos trabajados en Claude, Codex u otra herramienta para
mejorar las páginas web de los estudiantes.

Cada proyecto vive en su propia carpeta, con su código y el informe de revisión
que lo acompaña.

## Proyectos

| Proyecto | Curso | Equipo | Qué contiene |
| --- | --- | --- | --- |
| [LiquidApp](liquidapp/) | IV°A · Administración, mención RR.HH. | Andrés Berríos, Angelo Díaz, Bastián Luna, Bastián Pérez | Simulador de liquidaciones de sueldo y finiquitos. Auditoría de 23 hallazgos y versión corregida en un solo archivo HTML. |
| [Recluta Smart](recluta-smart/) | IV°A · Administración, mención RR.HH. | — | Reclutamiento y selección docente. Evaluador por competencias basado en el MBE 2021, comparador, pauta de entrevista y revisor de avisos discriminatorios. |
| [Kipu](kipu/) | III°A · Administración | — | Contabilidad para PYME. Se quitó el login que guardaba claves en texto plano, se eliminaron las dependencias de CDN y se agregó el libro de caja con arqueo. |
| [Expro](expro/) | III°A · Administración | — | Gestión para microempresas, caso «La Esquina». Se corrigió la inyección de HTML en las tablas, se agregó guardado real y el punto de equilibrio que la página prometía. |
| [GLM](glm/) | III°A y IV°A · Administración | Equipo GLM 2026 (12 integrantes) | Sitio del equipo de Gestión, Logística y Marketing de la Feria. Logo en SVG, carruseles, espacios para 33 fotos, cronograma, mapa del colegio y directorio de proyectos. |
| [Visión Integral](vision-integral/) | IV°A · Administración | Daniel Cayupe, Zamara Pavez, Sofía Barrientos, Trinidad González | Diagnóstico de clima laboral educativo. Se reparó el formulario que no enviaba nada y se construyó el instrumento en cuatro pasos: mapeo, consulta anónima, análisis con resguardo de anonimato y ficha de microintervención. |
| [Áurea Solutions](aurea-solutions/) | IV°A · Administración | Sofía Muñoz, Anhais Molina, Pascal Delgado (Grupo N°8) | Inducción de funcionarios nuevos. Se reparó el formulario que decía «consulta registrada» sin enviar nada y se construyó un recorrido virtual del colegio con visor de fotos 360° en WebGL, ruta por cargo con un solo cargo piloto, y glosario de 36 siglas escolares. |

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
