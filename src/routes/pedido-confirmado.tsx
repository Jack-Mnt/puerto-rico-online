import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle2, MessageCircle, ShoppingBag, Home } from "lucide-react";

export const Route = createFileRoute("/pedido-confirmado")({
  head: () => ({ meta: [{ title: "Pedido confirmado · Puerto Rico Online" }] }),
  component: PedidoConfirmadoPage,
});

type Resumen = {
  numero_pedido: number;
  items: { nombre: string; cantidad: number; subtotal: number }[];
  tipo_entrega: "delivery" | "pickup";
  total: number;
  whatsapp_url: string;
};

function PedidoConfirmadoPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ultimo_pedido");
      if (raw) setResumen(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 opacity-90"
            style={{
              background:
                "radial-gradient(1200px 500px at 50% -10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent), linear-gradient(180deg, color-mix(in oklab, var(--primary) 8%, transparent), transparent 60%)",
            }}
          />
          <div className="container-pro py-14 md:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 ring-4 ring-primary/20 mb-6">
                <CheckCircle2 className="h-12 w-12 text-primary" strokeWidth={2.2} />
              </div>
              <p className="uppercase tracking-[0.25em] text-xs text-primary font-semibold">Pedido confirmado</p>
              <h1 className="font-display text-4xl md:text-5xl mt-3">
                ¡Gracias por elegir Puerto Rico!
              </h1>
              {resumen && (
                <p className="mt-3 text-lg md:text-xl text-muted-foreground">
                  Pedido <span className="font-semibold text-foreground">#{resumen.numero_pedido}</span>
                </p>
              )}
              <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Tu pedido ya fue recibido y nuestro equipo comenzará a gestionarlo de inmediato.
              </p>
            </div>
          </div>
        </section>

        <section className="container-pro pb-16">
          <div className="max-w-3xl mx-auto grid gap-6">
            {resumen && (
              <div className="card-pro p-6 md:p-8">
                <h2 className="font-display text-xl mb-4">Detalle del pedido</h2>
                <div className="space-y-2">
                  {resumen.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-sm md:text-base">
                      <span className="pr-3">
                        {i.nombre} <span className="text-muted-foreground">x{i.cantidad}</span>
                      </span>
                      <span className="price font-semibold shrink-0">
                        S/ {Number(i.subtotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="hairline my-5" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo de entrega</span>
                  <span className="font-medium">
                    {resumen.tipo_entrega === "delivery" ? "Delivery" : "Recojo en tienda"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-semibold">Total</span>
                  <span className="price font-bold text-2xl">
                    S/ {Number(resumen.total).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div
              className="rounded-2xl p-6 md:p-8 text-center"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--primary) 14%, transparent), color-mix(in oklab, var(--primary) 4%, transparent))",
                border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
              }}
            >
              <p className="font-display text-xl md:text-2xl leading-snug">
                En Puerto Rico celebramos contigo cada encuentro, cada brindis y cada momento especial.
              </p>
            </div>

            <div className="card-pro p-6 md:p-8 space-y-3 text-center">
              <p className="text-base">
                Ya hemos abierto <span className="font-semibold">WhatsApp</span> para coordinar los últimos detalles de tu entrega y pago.
              </p>
              <p className="text-sm text-muted-foreground">
                Seguimos creciendo para ofrecerte más productos, más promociones y mejores experiencias en cada pedido.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-2">
              {resumen?.whatsapp_url && (
                <a
                  href={resumen.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent w-full"
                >
                  <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
                </a>
              )}
              <Link to="/productos" className="btn btn-primary w-full">
                <ShoppingBag className="h-4 w-4" /> Seguir comprando
              </Link>
              <Link to="/" className="btn btn-outline w-full">
                <Home className="h-4 w-4" /> Volver al inicio
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
