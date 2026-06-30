# Skill: Flujo de pedidos PuertoRico Online

Usa este skill cuando trabajes en carrito, checkout, creación de pedidos, estados de pedido, panel de cajero, panel de moderador, panel admin o integración con WhatsApp.

## Contexto general

PuertoRico Online es una tienda virtual para PuertoRico La Licorería, una licorería con varias sedes en Ica, Perú.

El flujo no termina en una pasarela de pago. El pedido se registra en la web y luego el cliente es redirigido a WhatsApp para coordinar con el moderador.

## Flujo del cliente

1. El cliente entra a la tienda.
2. Navega productos.
3. Filtra por categoría, marca o búsqueda.
4. Agrega productos al carrito.
5. Revisa su carrito.
6. Selecciona sede.
7. Selecciona tipo de entrega:

   * Delivery
   * Recojo en tienda
8. Selecciona método de pago:

   * Efectivo
   * Yape/Plin
9. Confirma el pedido.
10. El sistema registra el pedido.
11. El cliente es redirigido a WhatsApp para continuar la coordinación.

## Términos importantes

No usar “Pick up” como texto visible para el cliente.

Usar siempre:

* “Recojo en tienda”

Puede existir internamente como `pickup` si el sistema ya lo maneja así, pero en la interfaz visible debe mostrarse como “Recojo en tienda”.

## Dirección del cliente

La dirección puede ser opcional.

El moderador puede pedir más datos por WhatsApp después de creado el pedido.

No bloquees el flujo si el cliente no ingresa dirección, salvo que la lógica existente ya lo exija.

## Stock

Actualmente no se maneja stock automático.

El cajero valida manualmente si hay productos disponibles.

No implementes stock automático salvo que se solicite explícitamente.

## Roles

### Cliente

Puede:

* Ver productos.
* Agregar productos al carrito.
* Crear pedidos.
* Ir a WhatsApp para coordinar.

### Cajero

Pertenece a una sede específica.

Debe poder:

* Ver solo pedidos asignados a su sede.
* Aceptar pedidos.
* Rechazar pedidos.
* Marcar pedidos como despachados.
* Marcar pedidos como entregados.

Motivos de rechazo visibles:

* Productos sin stock.
* Algunos productos sin stock.

Si el motivo es “Algunos productos sin stock”, permitir describir qué productos faltan.

El cajero no debe ver utilidad ni información administrativa sensible.

### Moderador

Debe poder:

* Ver pedidos de todas las sedes.
* Coordinar con el cliente por WhatsApp.
* Reasignar pedidos entre sedes.
* Supervisar estados.
* Ver historial del pedido.
* Gestionar incidencias operativas.

### Admin

Debe poder:

* Gestionar productos.
* Gestionar categorías.
* Gestionar marcas.
* Gestionar banners.
* Gestionar sedes.
* Gestionar usuarios.
* Ver reportes.
* Ver utilidad diaria, semanal y mensual.

## Estados del pedido

Los estados principales del sistema son:

* pedido_creado
* pedido_aceptado
* pedido_rechazado
* pedido_reasignado
* pedido_despachado
* pedido_entregado
* pedido_cancelado

Antes de cambiar estados, revisa cómo están definidos en Supabase, tipos generados, enums, funciones, hooks o servicios actuales.

No inventes nuevos estados salvo que se solicite explícitamente.

## Historial

Cada cambio importante de estado debe reflejarse en el historial del pedido si el proyecto ya maneja esta lógica.

No rompas triggers, funciones o lógica existente de historial.

## WhatsApp

La coordinación final del pedido ocurre por WhatsApp.

Cuando se crea un pedido, el flujo debe facilitar la redirección a WhatsApp con información útil del pedido.

No implementes pagos online todavía salvo que se solicite explícitamente.

## Regla general

Antes de modificar el flujo de pedidos, revisa:

* Componentes de carrito.
* Checkout.
* Servicios de Supabase.
* Hooks relacionados.
* Tipos generados.
* Políticas o funciones relacionadas, si existen.
* Paneles de cajero, moderador y admin.

Cualquier cambio debe respetar la operación real del negocio.
