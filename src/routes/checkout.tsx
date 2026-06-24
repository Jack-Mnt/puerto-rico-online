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

type ProductoDetalleInfo = {
  id: string;
  precio_costo: number | null;
  marca?: { nombre: string | null } | null;
};

function toValidNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

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
    if (items.some((i) => Number(i.cantidad) <= 0)) { toast.error("Revisa las cantidades del carrito"); return; }
    setSubmitting(true);
    let pedidoCreado = false;
    let pedidoId = "";
    try {
      const productoIds = Array.from(new Set(items.map((i) => i.id)));
      const { data: productosDetalle, error: productosErr } = await supabase
        .from("productos")
        .select("id,precio_costo,marca:marcas(nombre)")
        .in("id", productoIds);
      if (productosErr) throw productosErr;

      const productosInfo = new Map(
        ((productosDetalle ?? []) as unknown as ProductoDetalleInfo[]).map((p) => [p.id, p]),
      );
      const detalle = items.map((i) => {
        const cantidad = Math.max(1, toValidNumber(i.cantidad));
        const precioVenta = Math.max(0, toValidNumber(i.precio_venta));
        const productoInfo = productosInfo.get(i.id);
        const precioCosto = Math.max(0, toValidNumber(i.precio_costo ?? productoInfo?.precio_costo));
        const subtotal = Math.max(0, precioVenta * cantidad);
        const utilidad = Math.max(0, subtotal - precioCosto * cantidad);

        return {
          producto_id: i.id,
          producto_nombre: i.nombre,
          producto_marca: productoInfo?.marca?.nombre ?? null,
          cantidad,
          precio_venta: precioVenta,
          precio_costo: precioCosto,
          subtotal,
          utilidad,
        };
      });

      // Generate id client-side so we can link detalle without needing SELECT on pedidos
      pedidoId = crypto.randomUUID();
      const detalleConPedido = detalle.map((d) => ({ ...d, pedido_id: pedidoId }));
      const sedeIsUuid = /^[0-9a-f-]{36}$/i.test(sede.id);
      const pedidoPayload: Record<string, unknown> = {
        id: pedidoId,
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

      // Insert without returning representation (no SELECT grant required on pedidos)
      const { error: pErr } = await supabase
        .from("pedidos")
        .insert(pedidoPayload);
      if (pErr) throw pErr;
      pedidoCreado = true;

      const { error: dErr } = await supabase.from("detalle_pedidos").insert(detalleConPedido);
      if (dErr) throw dErr;

      // Reference shown to the customer (local, no DB read)
      const numeroLocal = pedidoId.slice(0, 8).toUpperCase();

      const whatsapp = (config.whatsapp_principal || config.whatsapp_moderador || "").replace(/\D/g, "");
      const productosTxt = items.map((i) => `- ${i.nombre} x${i.cantidad}`).join("\n");
      const msg = [
        "Hola, acabo de realizar un pedido en Puerto Rico.",
        "",
        `Pedido #${numeroLocal}`,
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

      const resumen = {
        numero_pedido: numeroLocal,
        items: items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, subtotal: i.precio_venta * i.cantidad })),
        tipo_entrega: tipo,
        total,
        whatsapp_url: url,
      };
      try { sessionStorage.setItem("ultimo_pedido", JSON.stringify(resumen)); } catch { /* ignore */ }

      clear();
      toast.success("¡Pedido confirmado!");
      window.open(url, "_blank");
      navigate({ to: "/pedido-confirmado" });
    } catch (err) {
      if (pedidoCreado) {
        const numeroLocal = pedidoId ? pedidoId.slice(0, 8).toUpperCase() : "PEDIDO";
        const whatsapp = (config.whatsapp_principal || config.whatsapp_moderador || "").replace(/\D/g, "");
        const productosTxt = items.map((i) => `- ${i.nombre} x${i.cantidad}`).join("\n");
        const msg = [
          "Hola, acabo de realizar un pedido en Puerto Rico.",
          "",
          "Pedido creado",
          `Nombre: ${nombre.trim()}`,
          `Sede: ${sede.nombre}`,
          `Tipo de entrega: ${tipo === "delivery" ? "Delivery" : "Pick Up"}`,
          `Método de pago: ${pago === "efectivo" ? "Efectivo" : "Yape / Plin"}`,
          `Total: S/ ${total.toFixed(2)}`,
          "",
          "Productos:",
          productosTxt,
        ].join("\n");
        const url = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}` : "";
        const resumen = {
          numero_pedido: numeroLocal,
          items: items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, subtotal: i.precio_venta * i.cantidad })),
          tipo_entrega: tipo,
          total,
          whatsapp_url: url,
        };
        try { sessionStorage.setItem("ultimo_pedido", JSON.stringify(resumen)); } catch { /* ignore */ }
        clear();
        toast.success("¡Pedido confirmado!");
        if (url) window.open(url, "_blank");
        navigate({ to: "/pedido-confirmado" });
        return;
      }
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
