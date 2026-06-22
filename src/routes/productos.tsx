import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { categoriasQuery, marcasQuery, productosQuery } from "@/lib/queries";
import { Search, X } from "lucide-react";

type Search = { categoria?: string; marca?: string; q?: string };

export const Route = createFileRoute("/productos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
    marca: typeof s.marca === "string" ? s.marca : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({ meta: [{ title: "Catálogo · Puerto Rico Online" }, { name: "description", content: "Explora todo nuestro catálogo de licores premium." }] }),
  component: Catalogo,
});

function Catalogo() {
  const { categoria, marca, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/productos" });
  const { data: productos = [], isLoading } = useQuery(productosQuery);
  const { data: categorias = [] } = useQuery(categoriasQuery);
  const { data: marcas = [] } = useQuery(marcasQuery);
  const [search, setSearch] = useState(q ?? "");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return productos.filter((p) => {
      if (categoria && p.categoria?.slug !== categoria) return false;
      if (marca && p.marca_id !== marca) return false;
      if (term && !p.nombre.toLowerCase().includes(term) && !(p.marca?.nombre.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [productos, categoria, marca, search]);

  const setParam = (k: keyof Search, v?: string) =>
    navigate({ search: (prev: Search) => ({ ...prev, [k]: v || undefined }) });

  const activeCat = categorias.find((c) => c.slug === categoria);
  const activeMarca = marcas.find((m) => m.id === marca);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-pro py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-accent)] font-display">Catálogo</p>
            <h1 className="font-display text-3xl md:text-4xl mt-1">Todos los productos</h1>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="field pl-10"
              placeholder="Buscar marca o producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Active filters */}
        {(activeCat || activeMarca) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeCat && (
              <button className="chip chip-active" onClick={() => setParam("categoria", undefined)}>
                {activeCat.nombre} <X className="h-3 w-3" />
              </button>
            )}
            {activeMarca && (
              <button className="chip chip-active" onClick={() => setParam("marca", undefined)}>
                {activeMarca.nombre} <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
            <div>
              <h3 className="font-display text-xs uppercase tracking-[0.22em] mb-3 text-muted-foreground">Categorías</h3>
              <div className="flex flex-wrap gap-2">
                <button className={`chip ${!categoria ? "chip-active" : ""}`} onClick={() => setParam("categoria", undefined)}>Todas</button>
                {categorias.map((c) => (
                  <button key={c.id} className={`chip ${categoria === c.slug ? "chip-active" : ""}`} onClick={() => setParam("categoria", c.slug)}>
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>
            <div className="hairline" />
            <div>
              <h3 className="font-display text-xs uppercase tracking-[0.22em] mb-3 text-muted-foreground">Marcas</h3>
              <div className="flex flex-wrap gap-2">
                <button className={`chip ${!marca ? "chip-active" : ""}`} onClick={() => setParam("marca", undefined)}>Todas</button>
                {marcas.map((m) => (
                  <button key={m.id} className={`chip ${marca === m.id ? "chip-active" : ""}`} onClick={() => setParam("marca", m.id)}>
                    {m.nombre}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="card-pro h-[360px] animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card-pro p-12 text-center">
                <p className="text-muted-foreground">No encontramos productos con esos filtros.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">{filtered.length} productos</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function _placeholder() {}
void _placeholder;
