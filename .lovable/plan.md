## Cambiar "Pick Up" → "Recojo en tienda" en toda la UI

El valor interno `tipo_entrega = 'pickup'` permanece intacto en la base de datos. Solo se modifican las etiquetas visibles.

### 1. Crear helper compartido

Nuevo archivo `src/lib/tipo-entrega.ts`:
```ts
export function labelTipoEntrega(t: string | null | undefined): string {
  if (t === "delivery") return "Delivery";
  if (t === "pickup") return "Recojo en tienda";
  return "—";
}
```

### 2. Checkout (`src/routes/checkout.tsx`)
- Botón: `Pick Up` → `Recojo en tienda` (línea 238).
- Mensajes de WhatsApp (líneas 149 y 182): `"Pick Up"` → `"Recojo en tienda"`.

### 3. Pedido confirmado (`src/routes/pedido-confirmado.tsx`)
- Línea 84: usar `labelTipoEntrega(resumen.tipo_entrega)`.

### 4. Panel Cajero
- `src/routes/cajero.index.tsx` líneas 230 y 290: usar `labelTipoEntrega(...)`.
- `src/routes/cajero.historial.tsx`:
  - Línea 127: `<option value="pickup">Recojo en tienda</option>`.
  - Líneas 173 y 245: usar `labelTipoEntrega(...)`.

### 5. Panel Moderador
- `src/routes/moderador.index.tsx` líneas 307 y 397: usar `labelTipoEntrega(...)`.
- `src/routes/moderador.historial.tsx`:
  - Línea 116: `<option value="pickup">Recojo en tienda</option>`.
  - Líneas 157 y 244: usar `labelTipoEntrega(...)`.

### 6. Admin
- `src/routes/admin.pedidos.tsx` línea 224: usar `labelTipoEntrega(viewing.tipo_entrega)`.
- `src/routes/admin.reportes.tsx`:
  - Si hay filtro tipo entrega con opción visible "Pickup", cambiar a "Recojo en tienda" (verificar en el archivo).
  - Línea 107 (exportación Excel): `"Tipo entrega": labelTipoEntrega(p.tipo_entrega)` para que el Excel también muestre el texto legible.
- Admin/operación reusa `ModeradorKanban`, ya cubierto.

### 7. Textos sueltos en marketing
- `src/components/Header.tsx` línea 67: `"Delivery & Pick Up"` → `"Delivery y Recojo en tienda"`.
- `src/routes/__root.tsx` línea 83 (meta description): `"delivery o pick up"` → `"delivery o recojo en tienda"`.
- `src/routes/index.tsx` línea 14 (meta description): mismo cambio.

### Fuera de alcance
- Carrito (`src/routes/carrito.tsx`) no muestra tipo de entrega, no requiere cambios.
- Valores internos en filtros (`value="pickup"`) y BD se mantienen sin cambios.
- `react-day-picker`, `DayPicker`, `Pick<...>` de TS y demás coincidencias técnicas con "Pick" no se tocan.
