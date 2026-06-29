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
      { name: "description", content: "Whisky, vinos, espumantes y más con delivery o recojo en tienda." },
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

const PRIORITY_CATEGORIES = [
  "Whisky",
  "Ron",
  "Cervezas",
  "Vodka",
  "Gin",
  "Tequila",
  "Vino",
  "Pisco",
  "Champagne",
  "Licores Varios",
];

function Home() {
  const { data: destacados = [], isLoading: loadingDest } = useQuery(destacadosQuery);
  const { data: allCategorias = [] } = useQuery(categoriasQuery);

  const categorias = (() => {
    const map = new Map(allCategorias.map((c) => [c.nombre, c]));
    return PRIORITY_CATEGORIES
      .map((nombre) => map.get(nombre))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <BannerCarousel />

        {/* Destacados */}
        <section className="container-pro py-14 md:py-20">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--color-accent)] font-display leading-none">Selección</p>
              <h2 className="font-display text-3xl md:text-4xl leading-tight">Productos destacados</h2>
            </div>
            <Link to="/productos" className="hidden md:inline btn btn-outline">Ver todo</Link>
          </div>
          {loadingDest ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card-pro h-[330px] md:h-[380px] lg:h-[410px] animate-pulse" />
              ))}
            </div>
          ) : destacados.length === 0 ? (
            <p className="text-base text-muted-foreground leading-relaxed">Aún no hay productos destacados.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {destacados.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
          <div className="mt-8 md:hidden flex justify-center">
            <Link to="/productos" className="btn btn-outline w-full">Ver todo</Link>
          </div>
        </section>

        {/* Categorías */}
        <section id="categorias" className="container-pro pb-14 md:pb-20">
          <div className="mb-8 md:mb-10 space-y-2">
            <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--color-accent)] font-display leading-none">Explora</p>
            <h2 className="font-display text-3xl md:text-4xl leading-tight">Categorías</h2>
          </div>
          <CategoriesCarousel categorias={categorias} />
        </section>

      </main>
      <Footer />
    </div>
  );
}
