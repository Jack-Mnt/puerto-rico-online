import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ChevronLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { productoBySlugQuery, productosMismaMarcaQuery } from "@/lib/queries";
import { storageUrl } from "@/lib/supabase";
import type { Producto } from "@/lib/types";
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
  const { data: sameBrandProducts = [] } = useQuery(productosMismaMarcaQuery(p));
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
        <div className="grid grid-cols-1 md:grid-cols-[48%_52%] lg:grid-cols-[45%_55%] gap-8 md:gap-10 lg:gap-12">
          <div className="card-pro p-6 md:p-6 lg:p-8 grid place-items-center aspect-square md:aspect-auto md:h-[460px] lg:h-[500px] overflow-hidden">
            {img ? (
              <img
                src={img}
                alt={p.nombre}
                className="w-full h-full object-contain object-center"
              />
            ) : (
              <span className="text-muted-foreground">Sin imagen</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <span>{p.categoria?.nombre ?? "—"}</span>
              <span>·</span>
              <span>{p.marca?.nombre ?? "—"}</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl mt-2">{p.nombre}</h1>
            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="price text-3xl md:text-3xl lg:text-4xl font-bold">S/ {Number(p.precio_venta).toFixed(2)}</span>
              {p.destacado && <span className="chip premium-gradient !text-[#120E0E] !border-transparent">Más vendido</span>}
            </div>

            <div className="mt-6 md:mt-8 flex items-center gap-3 flex-nowrap">
              <div className="inline-flex items-center rounded-xl border border-[color:var(--color-border)] bg-white shrink-0">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:bg-secondary"><Plus className="h-4 w-4" /></button>
              </div>
              <button
                onClick={() => { add({ id: p.id, nombre: p.nombre, slug: p.slug, precio_venta: Number(p.precio_venta), precio_costo: p.precio_costo, imagen: p.imagen }, qty); toast.success("Agregado al carrito"); }}
                className="btn btn-accent flex-1 whitespace-nowrap"
              >
                Agregar al carrito
              </button>
            </div>

            {p.descripcion && (
              <div className="mt-6 md:mt-8">
                <p className="text-sm leading-relaxed text-muted-foreground">{p.descripcion}</p>
              </div>
            )}

            <SameBrandProductsSection marcaNombre={p.marca?.nombre} productos={sameBrandProducts} />
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
function SameBrandProductsSection({
  marcaNombre,
  productos,
}: {
  marcaNombre?: string | null;
  productos: Producto[];
}) {
  if (!marcaNombre || productos.length === 0) return null;

  return (
    <section className="mt-8 md:mt-10">
      <h2 className="font-display text-base md:text-lg">Más productos de {marcaNombre}</h2>
      <div className="mt-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3">
          {productos.map((producto) => (
            <SameBrandProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SameBrandProductCard({ producto }: { producto: Producto }) {
  const img = storageUrl(producto.imagen);

  return (
    <Link
      to="/producto/$slug"
      params={{ slug: producto.slug }}
      className="group block min-w-0 shrink-0 basis-[calc((100%-1.5rem)/3)] rounded-lg border border-[color:var(--color-border)] bg-white p-2 transition hover:-translate-y-0.5 hover:shadow-md lg:basis-[calc((100%-2.25rem)/4)]"
    >
      <div className="aspect-square rounded-md bg-[color:var(--color-background)] p-2">
        {img ? (
          <img
            src={img}
            alt={producto.nombre}
            loading="lazy"
            className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">Sin imagen</div>
        )}
      </div>
      <span className="mt-2 block line-clamp-2 text-xs font-semibold leading-snug transition group-hover:text-[color:var(--color-accent)] md:text-sm">
        {producto.nombre}
      </span>
    </Link>
  );
}
