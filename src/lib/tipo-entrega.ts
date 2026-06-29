export function labelTipoEntrega(t: string | null | undefined): string {
  if (t === "delivery") return "Delivery";
  if (t === "pickup") return "Recojo en tienda";
  return "—";
}
