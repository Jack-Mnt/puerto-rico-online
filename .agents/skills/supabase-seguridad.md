# Skill: Supabase y seguridad

Usa este skill cuando trabajes con Supabase, autenticación, roles, queries, políticas RLS, migraciones, variables de entorno, storage o conexión a base de datos.

## Contexto

El proyecto usa Supabase para:

* Base de datos.
* Autenticación.
* Roles.
* Storage de imágenes.
* Pedidos.
* Productos.
* Usuarios internos.
* Banners.
* Reportes.

No debes asumir la estructura de la base de datos sin revisar el proyecto.

Antes de modificar lógica relacionada con Supabase, revisa:

* Cliente de Supabase.
* Variables de entorno.
* Tipos generados.
* Hooks.
* Servicios.
* Queries.
* Migraciones.
* SQL functions.
* Policies RLS.
* Tablas relacionadas.

## Variables de entorno

No expongas claves privadas.

El frontend solo debe usar claves públicas seguras, como la anon key de Supabase.

Nunca coloques service role key en el frontend.

Nunca subas `.env` real al repositorio.

El repositorio puede tener `.env.example` con nombres de variables, pero sin valores reales.

Archivos locales que deben estar ignorados por Git:

* `.env`
* `.env.local`
* `.env.development.local`
* `.env.production.local`

## Conexión con Supabase

Antes de cambiar la conexión, identifica qué variables usa actualmente el proyecto.

Ejemplos posibles:

* VITE_SUPABASE_URL
* VITE_SUPABASE_ANON_KEY

No asumas estos nombres sin revisar el código.

## Compatibilidad con Lovable

El proyecto fue construido inicialmente con Lovable.

No rompas compatibilidad con Lovable.

No cambies nombres de variables de entorno si Lovable ya depende de ellos.

No modifiques la inicialización de Supabase salvo que sea necesario.

Cualquier cambio en conexión, variables o cliente de Supabase debe ser mínimo y justificado.

## RLS y seguridad

Antes de cambiar políticas RLS, revisa:

* Qué rol necesita leer.
* Qué rol necesita escribir.
* Qué operaciones corresponden a cliente, cajero, moderador y admin.
* Si la operación ocurre desde frontend o desde una función segura.

No abras tablas sensibles públicamente sin justificación.

No des permisos amplios por facilidad.

## Storage

Las imágenes del proyecto están en Supabase Storage.

Antes de cambiar rutas o buckets, revisa cómo se están usando actualmente.

No rompas imágenes existentes.

## Tipos

Si el proyecto usa tipos generados de Supabase, mantenlos actualizados cuando cambie la base de datos.

No escribas tipos manuales duplicados si ya existen tipos generados.

## Regla general

Cuando una tarea involucre Supabase:

1. Revisa la implementación actual.
2. Identifica archivos relevantes.
3. Explica qué encontraste.
4. Propón el cambio.
5. Evita tocar seguridad sin necesidad.
6. No expongas secretos.
7. Mantén compatibilidad con Lovable y GitHub.
