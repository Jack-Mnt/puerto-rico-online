# Skill: Productos relacionados PuertoRico Online

Usa este skill cuando trabajes en la página de detalle de producto, recomendaciones, productos de la misma marca, productos complementarios o gestión de relaciones manuales en admin.

## Objetivo

La página de detalle de producto debe mostrar recomendaciones útiles para mejorar la experiencia del cliente y aumentar el ticket promedio.

La funcionalidad se divide en dos secciones:

1. Más productos de [Marca]
2. Combínalo con

## Más productos de [Marca]

Esta sección se genera automáticamente.

Debe mostrar productos activos de la misma marca del producto actual, excluyendo el producto actual.

Ejemplo:

Si el cliente abre:

JW BLACK LABEL 750ML

La sección debe mostrar:

Más productos de Johnnie Walker

Ejemplos de productos:

- JW RED LABEL 750ML
- JW GOLD LABEL 750ML
- JW DOUBLE BLACK 750ML
- JW BLUE LABEL 750ML

## Ubicación de Más productos de [Marca]

Esta sección debe pertenecer al mismo div/contenedor de la descripción o información del producto principal.

No debe ser un bloque independiente debajo del producto.

Estructura conceptual:

ProductMainContainer
├── ProductImage
└── ProductInfo
    ├── CategoryBrand
    ├── ProductTitle
    ├── ProductPrice
    ├── QuantitySelector
    ├── AddToCartButton
    └── SameBrandProducts

## Diseño de Más productos de [Marca]

Las tarjetas deben mostrar solo:

- Imagen del producto
- Nombre del producto

No mostrar:

- Marca
- Precio
- Botón Agregar
- Texto “Ver producto”
- Subtítulo o descripción debajo del título

Toda la tarjeta debe ser clickeable y debe llevar al detalle del producto.

## Responsive de Más productos de [Marca]

Desktop:

- Mostrar máximo 4 productos visibles.
- Si hay más de 4 productos, usar carrusel.

Tablet y mobile:

- Mostrar máximo 3 productos visibles.
- Si hay más de 3 productos, usar carrusel.

## Combínalo con

Esta sección se basa en relaciones manuales por producto.

Debe leer la tabla:

productos_relacionados

La relación usada para esta sección es:

tipo_relacion = 'combinacion'

Ejemplo:

JW BLACK LABEL 750ML puede relacionarse manualmente con:

- COCA COLA 1.5L
- EVERVESS GINGER ALE 1.5L
- RED BULL 250ML
- HIELO 3.0KG
- HIELO 1.5KG
- COCA COLA 2.25L
- EVERVESS TONICA 1.5L

## Ubicación de Combínalo con

Esta sección debe tener su propio div/contenedor independiente debajo del bloque principal del producto.

No debe estar dentro del mismo contenedor de la descripción del producto.

Estructura conceptual:

ProductMainContainer
├── ProductImage
└── ProductInfo
    └── SameBrandProducts

ManualRelatedProductsContainer
└── Combínalo con

## Diseño de Combínalo con

Debe mantener el estilo de las tarjetas actuales de producto, pero sin mostrar marca.

Orden dentro de la tarjeta:

1. Imagen del producto
2. Nombre del producto
3. Precio
4. Botón + Agregar

No mostrar:

- Marca
- Subtítulo o descripción debajo del título

El botón + Agregar debe agregar el producto directamente al carrito.

La imagen o nombre pueden llevar al detalle del producto si la estructura actual lo permite.

## Responsive de Combínalo con

Desktop:

- Mostrar máximo 4 productos visibles.
- Si hay más de 4 productos, usar carrusel.

Tablet y mobile:

- Mostrar máximo 3 productos visibles.
- Si hay más de 3 productos, usar carrusel.

## Tabla productos_relacionados

La tabla usa una fila por cada relación.

Estructura conceptual:

- id
- producto_id
- producto_relacionado_id
- tipo_relacion
- orden
- activo
- created_at
- updated_at

Reglas:

- producto_id es el producto principal/base.
- producto_relacionado_id es el producto recomendado.
- tipo_relacion para esta funcionalidad debe ser 'combinacion'.
- orden define el orden de aparición.
- activo permite activar o desactivar la relación.
- No permitir mostrar relaciones inactivas.
- No mostrar productos relacionados inactivos.
- No mostrar duplicados.
- No relacionar un producto consigo mismo.

## Orden de visualización

La página debe mostrar:

1. Producto principal
2. Más productos de [Marca], dentro del mismo contenedor del producto principal
3. Combínalo con, en un contenedor independiente

## Admin

Más adelante, el panel admin debe permitir gestionar la sección Combínalo con desde la edición de cada producto.

Primera versión recomendada:

Admin → Productos → Editar producto → Combínalo con

Funciones:

- Buscar producto relacionado.
- Agregar producto relacionado.
- Ver lista de productos relacionados.
- Cambiar orden.
- Activar/desactivar relación.
- Eliminar relación.



## Reglas generales

Antes de modificar esta funcionalidad:

1. Revisar la página de detalle de producto.
2. Revisar cómo se consultan productos desde Supabase.
3. Revisar cómo se maneja marca_id o marca.
4. Revisar cómo se agrega un producto al carrito.
5. Revisar si existen componentes reutilizables de tarjetas.
6. Revisar tipos generados de Supabase.
7. No asumir estructura de base de datos sin revisar el código.

8. Mantener compatibilidad con Lovable. 
9. Mantener el estilo visual actual del proyecto.
