# Skill: GitHub Workflow PuertoRico Online

Usa este skill cuando trabajes con GitHub, ramas, commits, revisión de cambios, sincronización con Lovable o flujo de trabajo desde VS Code.

## Repositorio

Repositorio principal:

[https://github.com/Jack-Mnt/puerto-rico-online](https://github.com/Jack-Mnt/puerto-rico-online)

Ruta local del proyecto:

C:\Users\LENOVO\OneDrive\Documentos\GitHub\puerto-rico-online

## Contexto

Lovable ya está conectado a GitHub.

VS Code también está conectado a GitHub.

A partir de ahora la programación principal se realizará desde VS Code con Codex.

Lovable se usará principalmente para cambios visuales o ajustes rápidos de interfaz.

## Reglas antes de modificar archivos

Antes de modificar archivos:

1. Revisa el estado del proyecto con `git status`.
2. Identifica los archivos relevantes.
3. Explica brevemente qué archivos se tocarán.
4. Evita cambios innecesarios.
5. Mantén compatibilidad con Lovable.
6. No rompas funcionalidades existentes.
7. No elimines archivos sin autorización.
8. No sobrescribas cambios locales sin avisar.

## Flujo recomendado

Para cambios importantes, trabaja en ramas con nombres claros:

* feature/nombre-del-cambio
* fix/nombre-del-arreglo
* ui/nombre-del-ajuste-visual
* chore/nombre-de-configuracion

Ejemplos:

* feature/productos-relacionados
* fix/env-supabase
* ui/product-card-border
* chore/add-codex-skills

## Commits

Los commits deben ser claros, pequeños y fáciles de revisar.

Ejemplos:

* fix: protect local env files
* feat: add related products section
* ui: update pickup label to recojo en tienda
* chore: add codex project skills

## Seguridad

No subir archivos `.env` reales.

No subir claves privadas.

No subir service role keys.

No subir credenciales de Supabase.

No exponer tokens en el código.

## Compatibilidad con Lovable

El proyecto fue construido inicialmente con Lovable, por eso los cambios deben ser incrementales y compatibles con la estructura existente.

Evita reestructurar todo el proyecto sin necesidad.

Si Lovable hizo cambios visuales, revisa diferencias antes de sobrescribir.

## Regla general

Cada cambio debe ser claro, reversible y fácil de revisar.

Antes de implementar una tarea, primero revisa, explica y luego modifica solo lo necesario.
