# DocentePro · evaluación de desempeño

Proyecto de **IV°A, Administración de Empresas** — Colegio Cardenal José María Caro,
Fundación Belén Educa, La Pintana. Feria Técnico Profesional 2026.

Archivo: **`DocentePro.html`** — un solo archivo, sin dependencias externas. Funciona sin internet.
Verificación: botón «Verificar el motor» o `?pruebas=1`. **26 comprobaciones.**

## De qué se partió

La estudiante tenía la aplicación hecha en Base44, que no se puede abrir sin conexión ni
entregar como archivo. Esta versión reproduce el proyecto en un HTML que se abre en cualquier
computador o teléfono y que se puede enviar por correo o WhatsApp.

Lo importante es que el proyecto **no es una app genérica de recursos humanos**: es la
evaluación de desempeño. Así que el centro de la página es el instrumento real, con la
aritmética que lo hace funcionar.

## Las fórmulas del instrumento

Ese era el encargo: identificar con qué se evalúa cada indicador. El instrumento
institucional reparte el resultado en tres ámbitos:

| Ámbito | Peso |
|---|---|
| Funciones del cargo | 50 % |
| Rasgos Belén | 25 % |
| Indicadores de impacto | 25 % |

Y el cálculo por estándar es:

```
logro del estándar  = nivel obtenido ÷ niveles del estándar
ponderado           = logro × peso del estándar
logro total         = suma de los ponderados
```

Dividir por los niveles **de cada estándar** es lo que evita que un estándar de tres niveles
valga menos que uno de cuatro solo por tener menos opciones. No todos los estándares del
instrumento tienen cuatro niveles: varios tienen tres, y la página los dibuja con tres.

Los dos indicadores objetivos no se califican con criterio sino con un porcentaje:

| Indicador | Insuficiente | En Desarrollo | Meta | Sobresaliente |
|---|---|---|---|---|
| Asistencia | menos de 94 % | 94 a 95,99 % | 96 a 98 % | más de 98 % |
| Puntualidad | menos de 90 % | 90 a 93 % | 94 % | 100 % |

## Tres inconsistencias del instrumento original

Están documentadas dentro de la página, en la sección **Método**, y conviene que la estudiante
las sepa explicar porque un jurado puede preguntarlas:

1. **Los pesos por estándar del original suman 137 %, no 100 %.** En esta página los pesos se
   repartieron en partes iguales dentro de cada ámbito, para que el total cierre en 100 %.
2. **El corte de puntualidad deja un hueco entre 95 % y 99 %**: el instrumento no dice qué
   nivel corresponde ahí. La página lo resuelve asignando «Meta» y lo declara.
3. **Las etiquetas de los ámbitos cambian entre la hoja de matriz y la de rúbrica** del archivo
   original. Se usaron las de la matriz.

Nada de esto se inventó ni se escondió: la sección Método marca cada elemento como
*Verificado*, *Ajustado*, *Propuesta* o *Pendiente*.

## Qué tiene la página

- **Pauta por cargo.** Asistente de aula con los 15 estándares del instrumento institucional,
  cada uno con su medio de verificación. Docente de aula va marcado como **propuesta del
  proyecto, sin validar**, porque su rúbrica no estaba entre las que se entregaron.
- **Cálculo en vivo**, con el desglose por ámbito y el aviso de pauta incompleta: mientras
  falten estándares, el porcentaje se muestra sobre lo evaluado, no sobre el total.
- **Imprimir / PDF.** La hoja impresa lleva su propio encabezado —cargo, persona, ciclo,
  período— el nivel marcado en cada estándar con la leyenda «✓ NIVEL ELEGIDO», y el resultado.
  Se archiva sola.
- **Excel (CSV)** con separador `;` y coma decimal, para que Excel en español lo abra directo.
  Incluye el porcentaje de asistencia y puntualidad que produjo cada nivel, no solo el nivel.
- **Cortes objetivos** y **Sello Belén** (los cinco valores) como secciones propias.
- **Método**, la sección de transparencia.

## Resguardos

La página dice en la franja superior, en el encabezado impreso y en el CSV que **no es un
sistema oficial de evaluación** del colegio ni de Fundación Belén Educa, y que sus resultados
no sirven para decisiones laborales. Los datos quedan solo en el navegador: no se envían a
ningún servidor.

Por eso mismo: **no ingresar evaluaciones reales de personas identificables** en la
demostración de la feria. Para mostrarla, usar un nombre ficticio.

## Pendiente

- **Logos institucionales.** El encabezado tiene dos espacios reservados, marcados «Logo
  colegio» y «Logo Belén Educa». Van como archivo local, nunca enlazados desde internet.
- **Rúbricas de los demás cargos.** Cuando lleguen, cada una se agrega como un cargo más del
  arreglo `CARGOS`, con sus estándares, sus niveles y su medio de verificación.
