import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";
import { ProductCard } from "@/components/ProductCard";
import { CategoriesCarousel } from "@/components/CategoriesCarousel";
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
          <CategoriesCarousel categorias={categorias} />
        </section>

      </main>
      <Footer />
    </div>
  );
}
