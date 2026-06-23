import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ChevronLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { productoBySlugQuery } from "@/lib/queries";
import { storageUrl } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/producto/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productoBySlugQuery(params.slug));
    if (!p) throw notFound();
    return null;
  },
  head: () => ({ meta: [{ title: "Producto · Puerto Rico Online" }] }),
  component: Detail,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-pro py-24 text-center">
        <h1 className="font-display text-3xl">Producto no encontrado</h1>
        <Link to="/productos" className="btn btn-primary mt-6 inline-flex">Volver al catálogo</Link>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-pro py-24 text-center">
        <h1 className="font-display text-2xl">Algo salió mal</h1>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </main>
      <Footer />
    </div>
  ),
});

function Detail() {
  const { slug } = Route.useParams();
  const { data: p } = useQuery(productoBySlugQuery(slug));
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  if (!p) return null;
  const img = storageUrl(p.imagen);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-pro py-8">
        <Link to="/productos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Volver al catálogo
        </Link>
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="card-pro p-8 grid place-items-center aspect-square">
            {img ? <img src={img} alt={p.nombre} className="max-h-full max-w-full object-contain" /> : <span className="text-muted-foreground">Sin imagen</span>}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <span>{p.categoria?.nombre ?? "—"}</span>
              <span>·</span>
              <span>{p.marca?.nombre ?? "—"}</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl mt-2">{p.nombre}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="price text-4xl font-bold">S/ {Number(p.precio_venta).toFixed(2)}</span>
              {p.destacado && <span className="chip premium-gradient !text-[#120E0E] !border-transparent">Más vendido</span>}
            </div>
            {p.descripcion && <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{p.descripcion}</p>}

            <div className="mt-8 flex items-center gap-3">
              <div className="inline-flex items-center rounded-xl border border-[color:var(--color-border)] bg-white">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:bg-secondary"><Plus className="h-4 w-4" /></button>
              </div>
              <button
                onClick={() => { add({ id: p.id, nombre: p.nombre, slug: p.slug, precio_venta: Number(p.precio_venta), precio_costo: p.precio_costo, imagen: p.imagen }, qty); toast.success("Agregado al carrito"); }}
                className="btn btn-accent flex-1"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
