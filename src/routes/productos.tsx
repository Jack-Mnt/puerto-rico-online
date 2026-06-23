import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { categoriasQuery, marcasQuery, productosQuery } from "@/lib/queries";
import { Search, X, ChevronDown } from "lucide-react";

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

const INITIAL_BRANDS = 8;

function Catalogo() {
  const { categoria, marca, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/productos" });
  const { data: productos = [], isLoading } = useQuery(productosQuery);
  const { data: categorias = [] } = useQuery(categoriasQuery);
  const { data: marcas = [] } = useQuery(marcasQuery);
  const [search, setSearch] = useState(q ?? "");
  const [showAllBrands, setShowAllBrands] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return productos.filter((p) => {
      if (categoria && p.categoria?.slug !== categoria) return false;
      if (marca && p.marca_id !== marca) return false;
      if (term) {
        const hay =
          p.nombre.toLowerCase().includes(term) ||
          (p.marca?.nombre?.toLowerCase().includes(term) ?? false) ||
          (p.categoria?.nombre?.toLowerCase().includes(term) ?? false);
        if (!hay) return false;
      }
      return true;
    });
  }, [productos, categoria, marca, search]);

  const setParam = (k: keyof Search, v?: string) =>
    navigate({ search: (prev: Search) => ({ ...prev, [k]: v || undefined }) });

  const activeCat = categorias.find((c) => c.slug === categoria);
  const activeMarca = marcas.find((m) => m.id === marca);

  const visibleMarcas = showAllBrands ? marcas : marcas.slice(0, INITIAL_BRANDS);
  const hiddenCount = Math.max(0, marcas.length - INITIAL_BRANDS);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-pro py-8 md:py-10">
        {/* Title + search */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-accent)] font-display">Catálogo</p>
            <h1 className="font-display text-3xl md:text-4xl mt-1">Todos los productos</h1>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="field pl-10"
              placeholder="Buscar producto, marca o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Active filters */}
        {(activeCat || activeMarca) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground mr-1">Filtros activos:</span>
            {activeCat && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-[#120E0E] text-white text-xs px-3 py-1.5 hover:opacity-90 transition"
                onClick={() => setParam("categoria", undefined)}
              >
                {activeCat.nombre} <X className="h-3 w-3" />
              </button>
            )}
            {activeMarca && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-[#120E0E] text-white text-xs px-3 py-1.5 hover:opacity-90 transition"
                onClick={() => setParam("marca", undefined)}
              >
                {activeMarca.nombre} <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Premium filter block */}
        <section
          className="mb-8 rounded-2xl border border-[color:var(--color-border)] bg-[#FBF8F2] shadow-[0_1px_2px_rgba(18,14,14,0.04)] overflow-hidden"
        >
          {/* Categorías */}
          <div className="px-4 md:px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-foreground)]/70">
                Categorías
              </h3>
            </div>
            <div className="-mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 min-w-min pb-1">
                <PillButton active={!categoria} onClick={() => setParam("categoria", undefined)}>
                  Todas
                </PillButton>
                {categorias.map((c) => (
                  <PillButton
                    key={c.id}
                    active={categoria === c.slug}
                    onClick={() => setParam("categoria", c.slug)}
                  >
                    {c.nombre}
                  </PillButton>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 md:mx-6 h-px bg-gradient-to-r from-transparent via-[color:var(--color-border)] to-transparent" />

          {/* Marcas */}
          <div className="px-4 md:px-6 pt-4 pb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-foreground)]/70">
                Marcas
              </h3>
              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllBrands((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-accent)] hover:opacity-80 transition"
                >
                  {showAllBrands ? "Ver menos" : `Ver más marcas (${hiddenCount})`}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showAllBrands ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
            <div className="-mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto no-scrollbar">
              <div className={`flex items-center gap-2 pb-1 ${showAllBrands ? "flex-wrap" : "min-w-min"}`}>
                <PillButton active={!marca} onClick={() => setParam("marca", undefined)}>
                  Todas
                </PillButton>
                {visibleMarcas.map((m) => (
                  <PillButton
                    key={m.id}
                    active={marca === m.id}
                    onClick={() => setParam("marca", m.id)}
                  >
                    {m.nombre}
                  </PillButton>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Products grid */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card-pro h-[360px] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-pro p-12 text-center">
              <p className="text-muted-foreground">No encontramos productos con esos filtros.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">{filtered.length} productos</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border",
        active
          ? "bg-[#120E0E] text-white border-[#120E0E] shadow-[0_4px_14px_-6px_rgba(18,14,14,0.45)]"
          : "bg-white text-[color:var(--color-foreground)] border-[color:var(--color-border)] hover:border-[color:var(--color-accent)] hover:bg-[color:color-mix(in_oklab,var(--color-accent)_8%,white)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function _placeholder() {}
void _placeholder;
