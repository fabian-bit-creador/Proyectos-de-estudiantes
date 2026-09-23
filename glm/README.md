# GLM · Feria Técnico Profesional 2026

Sitio del equipo de **Gestión, Logística y Marketing** de la Feria TP 2026 del
Colegio Cardenal José María Caro, Fundación Belén Educa.

Reemplaza las dos versiones anteriores (`feria_tp_2026_1.html` e `index_2.html`),
que se unificaron en un solo sitio.

## Qué trae

- **El logo 2026 real**, incrustado en el archivo (PNG con fondo transparente,
  26 KB). Reemplaza al SVG reconstruido de la versión anterior, que montaba el texto
  «Gestión, Logística y Marketing» encima de las letras. En la barra y el pie va una
  marca compacta en SVG, porque a tamaño pequeño el logo completo no se lee.
- **Tres carruseles** accesibles (equipo, ferias anteriores, fotos del colegio) con
  botones, puntos de posición y navegación con las flechas del teclado.
- **Espacios para 33 fotografías** que aparecen solas al dejar los archivos en la
  carpeta `fotos/`. La lista exacta de nombres está en `fotos/LEEME.txt`.
- **Cuenta regresiva** al 8 de octubre y **cronograma** que marca solo qué fase está
  en curso, comparando con la fecha del día.
- **Vista satelital del colegio**, con la dirección verificada (San Leandro 0368,
  Población Santo Tomás). Mientras no esté incrustada la imagen fija, el recuadro
  muestra la dirección y un botón que abre el colegio visto desde arriba en Google
  Earth. Se sacó el «plano referencial» anterior: eran manzanas inventadas que
  podían pasar por el colegio real.
- **Directorio de los 28 proyectos**, filtrable por curso.
- Los contenidos de la Guía Operativa: qué hace y qué no hace GLM, las tres áreas,
  el semáforo de seguimiento y la operación del día de la Feria.

## Los colores

Salen del logo, y cada área tiene el suyo:

Tomados del logo 2026, promediando los píxeles de cada letra:

| Área | Relleno (logo) | Texto | Uso |
| --- | --- | --- | --- |
| Gestión | Naranja `#FD7521` | `#B8480A` | Letra G |
| Logística | Morado `#B37BE5` | `#7A45B5` | Letra L |
| Marketing | Verde `#80D85B` | `#2F7D22` | Letra M |
| Institucional | Azul `#084CA9` | `#084CA9` | Texto y línea del logo |

**Por qué hay dos columnas.** Los colores del logo son muy luminosos: sobre blanco
el naranja da 2,71:1 de contraste, el morado 3,05:1 y el verde 1,77:1, y un texto
necesita 4,5:1 para leerse bien. Así que el color vivo se usa en rellenos, bordes y
acentos, y cada área tiene una variante oscura para cuando hay que escribir con su
color. Sobre un relleno naranja, morado o verde el texto va en tinta oscura, nunca
en blanco.

## Cómo poner las fotos

1. Deja las imágenes en la carpeta `fotos/`, con los nombres de `fotos/LEEME.txt`.
2. Recarga la página. No hay que tocar el código.

Mientras una foto no exista se muestra un recuadro con las iniciales y el nombre
que debe tener el archivo. Ese recuadro está diseñado para verse bien: el sitio se
puede presentar aunque falten fotos.

**Antes de publicar la foto de una persona, confirma que exista autorización de uso
de imagen.** La Guía Operativa lo pide y es responsabilidad de Marketing.

### Fotos que viajan dentro del archivo

La carpeta `fotos/` no viaja cuando el HTML se reenvía por WhatsApp o correo. Por eso
existe `FOTOS_INCRUSTADAS`: un mapa con la misma clave que el nombre de cada hueco,
que la página revisa **antes** de buscar el archivo suelto.

**Esta copia pública va con ese mapa vacío, a propósito.** El equipo son estudiantes,
varios menores de edad, y un repositorio público de GitHub queda indexado y guarda el
historial para siempre: una cara subida aquí no se puede retirar del todo. La copia
con las fotos se entregó directamente al profesor, para compartirla dentro del
colegio. Si existe la autorización de uso de imagen y se decide publicarlas, se
incrustan en esta copia.

## Cómo cambiar el contenido

Todo lo editable está en listas al final del archivo, después del comentario
`GLM · Feria TP 2026`:

| Lista | Qué contiene |
| --- | --- |
| `EQUIPO` | Los 12 integrantes, su área, nivel y reflexión |
| `CONDUCCION` | EA TP y docentes responsables |
| `PROYECTOS` | Los 28 proyectos con líder, curso y especialidad |
| `FASES` | Las 6 fases del cronograma |
| `GALERIA` y `FOTOS_COLEGIO` | Los pies de foto |

Seis reflexiones de IV medio están vacías: aparecen con un aviso en cursiva
invitando a completarlas.

## Verificación

`?pruebas=1` en la dirección ejecuta 23 comprobaciones: que el equipo tenga los 12
integrantes de la guía, que estén repartidos 6 y 6, que cada área tenga 4, que los
nombres de archivo no se repitan, que los acentos se limpien bien, que los filtros
funcionen, que la página no cargue nada desde internet, que una foto incrustada gane
sobre el archivo suelto, que el logo sea la imagen real, que el botón de fecha de la
barra se lea, que no se dibuje un mapa inventado y que la barra y la portada
conserven su margen lateral en celular.

## Decisiones que conviene explicar

- **No se incrusta el muro de Instagram.** Un muro incrustado deja de verse sin
  conexión, y ese es justamente el escenario del día de la Feria. En su lugar hay
  enlace a la cuenta y espacios para las capturas.
- **No aparece la clave de la aplicación GLM.** La Guía Operativa dice que es de uso
  interno del equipo y de los docentes, y este sitio es público.
- **Doce integrantes, no catorce.** La versión anterior mostraba un contador en 14 y
  listaba 11 nombres. La Guía Operativa y el Documento Maestro dicen 12: seis de III
  medio y seis de IV medio.
- **Sin CDN.** Nada se descarga de internet: ni tipografías, ni iconos, ni librerías.

## Qué queda pendiente

1. Completar las seis reflexiones de IV medio.
2. Tomar y cargar las 33 fotografías.
3. Confirmar la dirección exacta del colegio, marcada en la sección «El colegio».
4. Revisar si falta algún proyecto o cambió algún líder en el directorio.
5. Probar en un celular real, sin conexión, antes del 8 de octubre.

## Fuentes

- Guía Operativa GLM · Feria Técnico Profesional 2026
- Documento Maestro GLM · Feria Técnico Profesional 2026
- Instagram del equipo: [@feria_tp_2026](https://www.instagram.com/feria_tp_2026)
