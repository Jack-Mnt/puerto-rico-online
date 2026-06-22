## Fase 2: Auth + Paneles Admin / Moderador / Cajero

### 1. Autenticación (login-only)
- Página `/login` con email + password (Supabase Auth, sin signup público).
- Hook `useAuth()` que expone `{ user, perfil (rol, sede_id, nombre), loading, signOut }` consultando `usuarios` tras `onAuthStateChange`.
- Listener único en `__root.tsx`: redirige a `/login` en SIGNED_OUT; invalida queries en SIGNED_IN.
- Tras login, redirige por rol: admin → `/admin`, moderador → `/moderador`, cajero → `/cajero`.
- Layouts protegidos `_admin.tsx`, `_moderador.tsx`, `_cajero.tsx` con guard de rol (redirect a `/login` o `/unauthorized`).

### 2. Panel Admin (`/admin/*`)
Sidebar con secciones, todas CRUD completos (lista + modal crear/editar + eliminar con confirmación):
- **Dashboard** — KPIs: pedidos hoy, ventas hoy, productos activos, sedes.
- **Productos** — tabla con búsqueda/filtro; form con imagen (upload a `productos/`), marca, categoría, precios, destacado, activo.
- **Categorías / Marcas** — CRUD simple (nombre, slug, imagen opcional).
- **Banners** — CRUD con upload a `banners/`, orden, activo.
- **Sedes** — CRUD (nombre, dirección, teléfono, whatsapp).
- **Usuarios** — listado de `usuarios` + botón "Crear usuario" que llama server function (`createStaffUser`) usando service role: crea en `auth.users`, inserta en `usuarios` con rol y sede.
- **Configuración** — edita fila única (nombre tienda, whatsapp principal, horario, etc.).

### 3. Panel Moderador (`/moderador/*`)
- **Pedidos** — tabla con filtros (estado, fecha, sede, método pago, tipo entrega). Acciones: cambiar estado, ver detalle, registrar en `historial_pedidos`.
- **Reportes** — métricas por rango de fechas, ventas por sede, utilidad estimada (precio_venta − precio_costo). Botones "Descargar Resumen" (CSV) y "Descargar por sede" (CSV) respetando filtros activos.

### 4. Panel Cajero (`/cajero/*`)
- Vista enfocada en pedidos del día de su `sede_id`:
  - Cola de pedidos nuevos/en preparación.
  - Acciones rápidas: marcar listo, entregado, cancelado.
  - Filtro por estado, búsqueda por ID/cliente.

### 5. Backend / Server Functions
- `src/lib/staff-users.functions.ts` con `createStaffUser`, `updateStaffUser`, `deleteStaffUser` usando `supabaseAdmin` (service role) — protegidas por middleware que valida que el caller sea admin.
- Secreto requerido: `SUPABASE_SERVICE_ROLE_KEY`.

### 6. UI / UX
- Sidebar colapsable, header con nombre + rol + logout.
- Estados loading (skeletons), vacíos (mensaje + CTA), error (retry).
- Mobile-first: sidebar → drawer en móvil.
- Mantiene estética premium tecnológica de la storefront.

### Detalles técnicos
- Stack: TanStack Router file-based, TanStack Query (loaders + suspense), zustand para auth.
- Subida de imágenes: `supabase.storage.from('PuertoRicoOnline').upload(...)`.
- CSV: generación client-side (no dependencias extra).
- Toast: sonner (ya disponible).
- Validación: zod en formularios.

### Requisitos previos (de tu lado)
1. **`SUPABASE_SERVICE_ROLE_KEY`** — necesario para crear usuarios desde el panel.
2. **Políticas RLS** en tu Supabase para permitir que rol `admin` haga CRUD sobre productos/categorias/marcas/banners/sedes/configuracion, y que `moderador`/`cajero` lean/actualicen pedidos. Te entrego el SQL sugerido al final.

### Orden de implementación
1. Auth + layouts protegidos + login.
2. Admin: shell + Productos + Categorías + Marcas.
3. Admin: Banners + Sedes + Configuración + Usuarios.
4. Moderador: Pedidos + Reportes (con CSV).
5. Cajero: Cola del día.

¿Apruebas el plan y me pasas el `SUPABASE_SERVICE_ROLE_KEY`?