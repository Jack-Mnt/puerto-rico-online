import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { sedesQuery, configQuery } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · Puerto Rico Online" }] }),
  component: CheckoutPage,
});

const SEDES_FALLBACK = ["Cutervo", "Huaca", "Divino", "Casua", "Unidad"];

type TipoEntrega = "delivery" | "pickup";
type MetodoPago = "efectivo" | "yape_plin";

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const { data: sedesRows = [] } = useQuery(sedesQuery);
  const { data: config = {} } = useQuery(configQuery);

  const sedeOptions = useMemo(() => {
    if (sedesRows.length) return sedesRows.map((s) => ({ id: s.id, nombre: s.nombre }));
    return SEDES_FALLBACK.map((n) => ({ id: n, nombre: n }));
  }, [sedesRows]);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [sede, setSede] = useState<{ id: string; nombre: string } | null>(null);
  const [tipo, setTipo] = useState<TipoEntrega>("delivery");
  const [pago, setPago] = useState<MetodoPago>("efectivo");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container-pro py-24 text-center">
          <h1 className="font-display text-3xl">Tu carrito está vacío</h1>
          <Link to="/productos" className="btn btn-primary mt-6 inline-flex">Ir al catálogo</Link>
        </main>
        <Footer />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) { toast.error("Ingresa nombre y teléfono"); return; }
    if (!sede) { toast.error("Selecciona una sede"); return; }
    setSubmitting(true);
    try {
      // Try with sede_id (uuid). If sede is fallback string, send null
      const sedeIsUuid = /^[0-9a-f-]{36}$/i.test(sede.id);
      const pedidoPayload: Record<string, unknown> = {
        cliente_nombre: nombre.trim(),
        cliente_telefono: telefono.trim(),
        sede_id: sedeIsUuid ? sede.id : null,
        tipo_entrega: tipo,
        metodo_pago: pago,
        direccion: tipo === "delivery" ? direccion.trim() || null : null,
        referencia: tipo === "delivery" ? referencia.trim() || null : null,
        total,
        estado: "pedido_creado",
      };

      const { data: pedido, error: pErr } = await supabase
        .from("pedidos")
        .insert(pedidoPayload)
        .select("id")
        .single();
      if (pErr) throw pErr;

      const detalle = items.map((i) => ({
        pedido_id: pedido.id,
        producto_id: i.id,
        cantidad: i.cantidad,
        precio_venta: i.precio_venta,
        precio_costo: i.precio_costo ?? 0,
        subtotal: i.precio_venta * i.cantidad,
      }));
      const { error: dErr } = await supabase.from("detalle_pedidos").insert(detalle);
      if (dErr) throw dErr;

      const whatsapp = (config.whatsapp_moderador || "51955618119").replace(/\D/g, "");
      const productosTxt = items.map((i) => `- ${i.nombre} x${i.cantidad}`).join("\n");
      const msg = [
        "Hola, acabo de realizar un pedido en Puerto Rico.",
        "",
        `Pedido: ${pedido.id}`,
        `Nombre: ${nombre.trim()}`,
        `Sede: ${sede.nombre}`,
        `Tipo de entrega: ${tipo === "delivery" ? "Delivery" : "Pick Up"}`,
        `Método de pago: ${pago === "efectivo" ? "Efectivo" : "Yape / Plin"}`,
        `Total: S/ ${total.toFixed(2)}`,
        "",
        "Productos:",
        productosTxt,
      ].join("\n");
      const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
      clear();
      toast.success("¡Pedido creado! Redirigiendo a WhatsApp...");
      window.location.href = url;
      setTimeout(() => navigate({ to: "/" }), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear pedido";
      toast.error(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-pro py-10">
        <h1 className="font-display text-3xl md:text-4xl">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">Confirma tus datos y serás redirigido a WhatsApp para finalizar.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            <section className="card-pro p-6">
              <h2 className="font-display text-lg mb-4">Tus datos</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <label className="label">Teléfono *</label>
                  <input className="field" value={telefono} onChange={(e) => setTelefono(e.target.value)} required maxLength={20} inputMode="tel" />
                </div>
              </div>
            </section>

            <section className="card-pro p-6">
              <h2 className="font-display text-lg mb-4">Sede</h2>
              <div className="seg">
                {sedeOptions.map((s) => (
                  <button type="button" key={s.id} className="seg-btn" data-active={sede?.id === s.id} onClick={() => setSede(s)}>{s.nombre}</button>
                ))}
              </div>
            </section>

            <section className="card-pro p-6">
              <h2 className="font-display text-lg mb-4">Tipo de entrega</h2>
              <div className="seg">
                <button type="button" className="seg-btn" data-active={tipo === "delivery"} onClick={() => setTipo("delivery")}>Delivery</button>
                <button type="button" className="seg-btn" data-active={tipo === "pickup"} onClick={() => setTipo("pickup")}>Pick Up</button>
              </div>
              {tipo === "delivery" && (
                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="label">Dirección (opcional)</label>
                    <input className="field" value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={200} />
                  </div>
                  <div>
                    <label className="label">Referencia (opcional)</label>
                    <input className="field" value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={200} />
                  </div>
                </div>
              )}
            </section>

            <section className="card-pro p-6">
              <h2 className="font-display text-lg mb-4">Método de pago</h2>
              <div className="seg">
                <button type="button" className="seg-btn" data-active={pago === "efectivo"} onClick={() => setPago("efectivo")}>Efectivo</button>
                <button type="button" className="seg-btn" data-active={pago === "yape_plin"} onClick={() => setPago("yape_plin")}>Yape / Plin</button>
              </div>
            </section>
          </div>

          <aside className="card-pro p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-display text-lg">Resumen</h3>
            <div className="mt-4 space-y-2 max-h-64 overflow-auto">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="line-clamp-1 pr-2">{i.nombre} <span className="text-muted-foreground">x{i.cantidad}</span></span>
                  <span className="price font-semibold shrink-0">S/ {(i.precio_venta * i.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="hairline my-4" />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="price font-bold text-xl">S/ {total.toFixed(2)}</span>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-accent w-full mt-6">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</> : "Confirmar pedido"}
            </button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">Al confirmar serás redirigido a WhatsApp para coordinar entrega y pago.</p>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
}
