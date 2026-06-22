import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";
import { ProductCard } from "@/components/ProductCard";
import { categoriasQuery, destacadosQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Puerto Rico Online · Licorería Premium" },
      { name: "description", content: "Whisky, vinos, espumantes y más con delivery o pick up." },
      { property: "og:title", content: "Puerto Rico Online" },
      { property: "og:description", content: "Licorería premium online en Perú." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(destacadosQuery);
    context.queryClient.prefetchQuery(categoriasQuery);
  },
  component: Home,
});

function Home() {
  const { data: destacados = [], isLoading: loadingDest } = useQuery(destacadosQuery);
  const { data: categorias = [] } = useQuery(categoriasQuery);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <BannerCarousel />

        {/* Destacados */}
        <section className="container-pro py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-accent)] font-display">Selección</p>
              <h2 className="font-display text-2xl md:text-4xl mt-2">Productos destacados</h2>
            </div>
            <Link to="/productos" className="hidden md:inline btn btn-outline">Ver todo</Link>
          </div>
          {loadingDest ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card-pro h-[360px] animate-pulse" />
              ))}
            </div>
          ) : destacados.length === 0 ? (
            <p className="text-muted-foreground">Aún no hay productos destacados.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {destacados.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>

        {/* Categorías */}
        <section id="categorias" className="container-pro pb-16">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-accent)] font-display">Explora</p>
            <h2 className="font-display text-2xl md:text-4xl mt-2">Categorías</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categorias.map((c) => (
              <Link
                key={c.id}
                to="/productos"
                search={{ categoria: c.slug } as never}
                className="card-pro p-5 text-center hover:border-[color:var(--color-accent)]"
              >
                <div className="mx-auto h-12 w-12 rounded-full premium-gradient grid place-items-center text-[#120E0E] font-display text-sm">
                  {c.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className="mt-3 text-sm font-semibold">{c.nombre}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Beneficios */}
        <section id="beneficios" className="bg-[color:var(--color-surface)] border-y border-[color:var(--color-border)]">
          <div className="container-pro py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { i: Truck, t: "Delivery rápido", d: "Entrega en el día en nuestras sedes." },
              { i: ShieldCheck, t: "Productos originales", d: "100% garantía de autenticidad." },
              { i: Sparkles, t: "Selección premium", d: "Marcas y ediciones limitadas." },
              { i: Clock, t: "Atención todos los días", d: "Pedidos vía WhatsApp y online." },
            ].map(({ i: I, t, d }) => (
              <div key={t} className="flex gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--color-primary)] text-white">
                  <I className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
