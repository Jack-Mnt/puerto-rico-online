// Estados de pedido (enum estado_pedido)
export const ESTADOS = [
  "pedido_creado",
  "pedido_aceptado",
  "pedido_rechazado",
  "pedido_despachado",
  "pedido_entregado",
  "pedido_cancelado",
] as const;
export type EstadoPedido = (typeof ESTADOS)[number];

// Enum accion_historial (incluye reasignado)
export type AccionHistorial = EstadoPedido | "pedido_reasignado";

export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  pedido_creado: "Nuevo",
  pedido_aceptado: "Aceptado",
  pedido_rechazado: "Rechazado",
  pedido_despachado: "Despachado",
  pedido_entregado: "Entregado",
  pedido_cancelado: "Cancelado",
};

export const ACCION_LABEL: Record<AccionHistorial, string> = {
  ...ESTADO_LABEL,
  pedido_reasignado: "Reasignado",
};

export const ESTADO_COLOR: Record<EstadoPedido, string> = {
  pedido_creado: "bg-blue-100 text-blue-800 border-blue-200",
  pedido_aceptado: "bg-amber-100 text-amber-800 border-amber-200",
  pedido_rechazado: "bg-rose-100 text-rose-800 border-rose-200",
  pedido_despachado: "bg-indigo-100 text-indigo-800 border-indigo-200",
  pedido_entregado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pedido_cancelado: "bg-zinc-200 text-zinc-700 border-zinc-300",
};

export const MOTIVOS_RECHAZO = [
  "Productos sin stock",
  "Algunos productos sin stock",
] as const;
export type MotivoRechazo = (typeof MOTIVOS_RECHAZO)[number];
