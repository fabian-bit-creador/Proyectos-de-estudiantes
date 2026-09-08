# GLM · Feria Técnico Profesional 2026

Sitio del equipo de **Gestión, Logística y Marketing** de la Feria TP 2026 del
Colegio Cardenal José María Caro, Fundación Belén Educa.

Reemplaza las dos versiones anteriores (`feria_tp_2026_1.html` e `index_2.html`),
que se unificaron en un solo sitio.

## Qué trae

- **El logo del equipo reconstruido en SVG**, dentro del archivo. Se ve nítido en
  cualquier tamaño, se imprime bien y no depende de que exista una imagen al lado.
  Hay dos versiones: la completa para el hero y una compacta para la barra, porque
  a tamaño pequeño el nombre completo no se lee.
- **Tres carruseles** accesibles (equipo, ferias anteriores, fotos del colegio) con
  botones, puntos de posición y navegación con las flechas del teclado.
- **Espacios para 33 fotografías** que aparecen solas al dejar los archivos en la
  carpeta `fotos/`. La lista exacta de nombres está en `fotos/LEEME.txt`.
- **Cuenta regresiva** al 8 de octubre y **cronograma** que marca solo qué fase está
  en curso, comparando con la fecha del día.
- **Mapa del colegio** dibujado en SVG (se ve sin internet) más un botón que abre la
  ubicación real en Google Maps.
- **Directorio de los 28 proyectos**, filtrable por curso.
- Los contenidos de la Guía Operativa: qué hace y qué no hace GLM, las tres áreas,
  el semáforo de seguimiento y la operación del día de la Feria.

## Los colores

Salen del logo, y cada área tiene el suyo:

| Área | Color | Uso |
| --- | --- | --- |
| Gestión | Naranja `#FF6B00` | Letra G del logo |
| Logística | Morado `#9A5FC7` | Letra L |
| Marketing | Verde `#6DBE45` | Letra M |
| Institucional | Azul `#1B3D9B` | Nombre y barra del logo |

## Cómo poner las fotos

1. Deja las imágenes en la carpeta `fotos/`, con los nombres de `fotos/LEEME.txt`.
2. Recarga la página. No hay que tocar el código.

Mientras una foto no exista se muestra un recuadro con las iniciales y el nombre
que debe tener el archivo. Ese recuadro está diseñado para verse bien: el sitio se
puede presentar aunque falten fotos.

**Antes de publicar la foto de una persona, confirma que exista autorización de uso
de imagen.** La Guía Operativa lo pide y es responsabilidad de Marketing.

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

`?pruebas=1` en la dirección ejecuta 13 comprobaciones: que el equipo tenga los 12
integrantes de la guía, que estén repartidos 6 y 6, que cada área tenga 4, que los
nombres de archivo no se repitan, que los acentos se limpien bien, que los filtros
funcionen y que la página no cargue nada desde internet.

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
