# Kipu — Contabilidad PYME (versión reparada)

Proyecto del equipo Kipu, III°A, para la Feria Técnico Profesional 2026 del Colegio
Cardenal José María Caro.

Se revisó la entrega original (`kipu_contabilidad_pyme_ultima_1.html`, 2.789 líneas) y se
reparó conservando el código del equipo, que es el más avanzado de los proyectos revisados.

## Lo que ya estaba bien

Siete calculadoras contables que funcionan, inventario, directorio de clientes y
proveedores, agenda con calendario, documentos en IndexedDB, exportación a CSV, gráficos
dibujados a mano en canvas y uso correcto de `escapeHtml` en las tablas. Nada de eso se
tocó.

## Los tres problemas que se corrigieron

### 1. La página estaba rota al abrirla

El logo de la pantalla de acceso es un SVG con `viewBox` pero **sin `width` ni `height`**.
Sin una regla de CSS que lo limite, el navegador lo expandía hasta **753 × 753 píxeles**
—casi diez veces su tamaño— y tapaba el formulario. Lo primero que veía un visitante era
un círculo gigante.

Se corrigió con una regla en el reset: `img,svg,video,canvas{max-width:100%}` y
`svg{height:auto}`.

### 2. Las claves se guardaban en texto plano

```js
users[name] = pass;
localStorage.setItem(registeredUsersKey, JSON.stringify(users));
```

Cualquiera con la consola del navegador abierta podía leer todas las contraseñas
registradas. Como las personas reutilizan claves, el riesgo salía del proyecto.

**Se eliminó el sistema de acceso completo.** Kipu no tiene servidor: todo vive en el
navegador de quien la usa, así que un login no protege nada y solo da una sensación de
seguridad que no existe. En su lugar hay un perfil local con un nombre para mostrar, un
botón para borrar todos los datos guardados, y una explicación de por qué se tomó esa
decisión.

### 3. Dependía de tres servicios externos

Tailwind, Font Awesome y Google Fonts se cargaban desde internet. Sin conexión, la página
perdía todo el diseño.

- Las 427 clases de Tailwind se reemplazaron por **408 reglas de CSS equivalentes**,
  generadas a partir de las clases que la página realmente usa.
- Los 86 iconos de Font Awesome se reemplazaron por un **sprite de 42 iconos SVG**
  dibujados dentro del archivo.
- Las tipografías usan la pila del sistema con fallback serif, conservando el aire
  editorial del diseño original.

Resultado: **cero dependencias externas**. Funciona con el computador desconectado.

## Lo que se agregó: Caja diaria

Responde a la retroalimentación docente: *«distinguir control de caja de contabilidad
formal»*.

Kipu tenía siete herramientas de contabilidad formal —ecuación contable, balance, estado
de resultados— pero ningún **libro de caja**, que es lo que una PYME lleva todos los días.
Estaban enseñando lo que hace el contador, no lo que hace la dueña.

La sección nueva incluye:

- libro de caja con saldo corrido fila a fila;
- **arqueo de caja**: se cuenta el efectivo real y la herramienta calcula el faltante o
  sobrante, con sugerencias de dónde buscar la diferencia;
- exportación a CSV;
- un panel que explica la diferencia entre ambos registros con un ejemplo concreto: una
  venta a crédito de $50.000 es un ingreso contable, pero la caja no registra nada. Una
  PYME puede estar ganando y quedarse sin caja el mismo mes.

## Cómo usarlo

Se abre con doble clic. No necesita servidor, instalación ni internet.

- `?pruebas=1` en la dirección ejecuta las 11 pruebas del motor al abrir.
- El motor de caja está en la función pura `calcularCaja(saldoInicial, movimientos)`, que
  no toca la página y por eso se puede probar sola.

## Qué queda pendiente para el equipo

1. **Elegir una PYME concreta** y usar sus datos (con autorización) o datos ficticios
   verosímiles. Hoy la herramienta es genérica.
2. El encabezado sigue diciendo «Inicio» al cambiar de sección; conviene que muestre el
   nombre de la sección activa.
3. Conectar el libro de caja con el estado de resultados para mostrar, con números
   propios, por qué ambos no coinciden.
4. Probar en un celular real, sin conexión, antes del 8 de octubre.
