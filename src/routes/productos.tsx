import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { categoriasQuery, fetchProductosPage, marcasQuery, productosQuery } from "@/lib/queries";
import { Search, X, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Search = { grupo?: string; categoria?: string; marca?: string; q?: string };
type PerPage = 10 | 20 | 30;

const GRUPOS = ["Licores", "Bebidas", "Cigarros y Vapes", "Complementos"] as const;

export const Route = createFileRoute("/productos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    grupo: typeof s.grupo === "string" ? s.grupo : undefined,
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
    marca: typeof s.marca === "string" ? s.marca : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({ meta: [{ title: "Catálogo · Puerto Rico Online" }, { name: "description", content: "Explora todo nuestro catálogo de licores premium." }] }),
  component: Catalogo,
});

function Catalogo() {
  const { grupo, categoria, marca, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/productos" });
  const { data: categorias = [] } = useQuery(categoriasQuery);
  const { data: marcas = [] } = useQuery(marcasQuery);
  const [search, setSearch] = useState(q ?? "");
  const [showMarcas, setShowMarcas] = useState(false);
  const [perPage, setPerPage] = useState<PerPage>(20);

  // Debounce búsqueda para no spamear Supabase
  const [searchDebounced, setSearchDebounced] = useState(search);
  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Categorías filtradas por grupo
  const categoriasDelGrupo = useMemo(
    () => (grupo ? categorias.filter((c) => c.grupo === grupo) : []),
    [categorias, grupo],
  );

  // IDs de categorías que aplican según grupo/categoría
  const categoriaIds = useMemo<string[] | undefined>(() => {
    if (categoria) {
      const cat = categorias.find((c) => c.slug === categoria);
      return cat ? [cat.id] : [];
    }
    if (grupo) return categoriasDelGrupo.map((c) => c.id);
    return undefined;
  }, [categoria, categorias, grupo, categoriasDelGrupo]);

  // Marcas disponibles según scope (lightweight)
  const { data: availableBrandIdsArr = [] } = useQuery(
    (await import("@/lib/queries")).productosScopeMarcasQuery(grupo ? (categoriaIds ?? []) : null),
  );
  const availableBrandIds = useMemo(() => new Set(availableBrandIdsArr), [availableBrandIdsArr]);
  const availableMarcas = useMemo(
    () => marcas.filter((m) => availableBrandIds.has(m.id)),
    [marcas, availableBrandIds],
  );

  // Auto-limpiar categoría si no pertenece al grupo
  useEffect(() => {
    if (categoria && grupo && !categoriasDelGrupo.some((c) => c.slug === categoria)) {
      navigate({ search: (prev: Search) => ({ ...prev, categoria: undefined }) });
    }
  }, [categoria, grupo, categoriasDelGrupo, navigate]);

  // Auto-limpiar marca si no está disponible
  useEffect(() => {
    if (marca && availableBrandIdsArr.length > 0 && !availableBrandIds.has(marca)) {
      navigate({ search: (prev: Search) => ({ ...prev, marca: undefined }) });
    }
  }, [marca, availableBrandIds, availableBrandIdsArr.length, navigate]);

  // Paginación server-side
  const pageFilters = useMemo(
    () => ({
      categoriaIds: categoriaIds && categoriaIds.length > 0 ? categoriaIds : undefined,
      marcaId: marca || undefined,
      search: searchDebounced || undefined,
    }),
    [categoriaIds, marca, searchDebounced],
  );

  const {
    data: pages,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["productos", "paged", pageFilters, perPage],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = (pageParam as number) * perPage;
      const to = from + perPage - 1;
      return fetchProductosPage(pageFilters, from, to);
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((s, p) => s + p.rows.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
  });

  const items = useMemo(() => pages?.pages.flatMap((p) => p.rows) ?? [], [pages]);
  const total = pages?.pages[0]?.total ?? 0;

  const setParam = (patch: Partial<Search>) =>
    navigate({
      search: (prev: Search) => {
        const next: Search = { ...prev };
        for (const k of Object.keys(patch) as (keyof Search)[]) {
          const v = patch[k];
          next[k] = v ? v : undefined;
        }
        return next;
      },
    });

  const clearAll = () => {
    setSearch("");
    navigate({ search: () => ({}) });
  };

  const activeCat = categorias.find((c) => c.slug === categoria);
  const activeMarca = marcas.find((m) => m.id === marca);
  const hasFilters = !!(grupo || categoria || marca || search);

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
        {(grupo || activeCat || activeMarca) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground mr-1">Filtros activos:</span>
            {grupo && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-[#120E0E] text-white text-xs px-3 py-1.5 hover:opacity-90 transition"
                onClick={() => setParam({ grupo: undefined, categoria: undefined, marca: undefined })}
              >
                {grupo} <X className="h-3 w-3" />
              </button>
            )}
            {activeCat && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-[#120E0E] text-white text-xs px-3 py-1.5 hover:opacity-90 transition"
                onClick={() => setParam({ categoria: undefined, marca: undefined })}
              >
                {activeCat.nombre} <X className="h-3 w-3" />
              </button>
            )}
            {activeMarca && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-[#120E0E] text-white text-xs px-3 py-1.5 hover:opacity-90 transition"
                onClick={() => setParam({ marca: undefined })}
              >
                {activeMarca.nombre} <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Filter block */}
        <section className="mb-8 rounded-2xl border border-[#E5E7EB] bg-[#FBF8F2] shadow-[0_1px_2px_rgba(18,14,14,0.04)] overflow-hidden">
          <div className="px-4 md:px-6 py-5 md:py-6 space-y-6">
            {/* Explorar por */}
            <div>
              <h3 className="font-display text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-foreground)]/70 mb-3">
                Explorar por
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {GRUPOS.map((g) => {
                  const icon = g === "Licores" ? "🥃" : g === "Bebidas" ? "🥤" : g === "Cigarros y Vapes" ? "🚬" : "🧊";
                  const active = grupo === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setParam({ grupo: active ? undefined : g, categoria: undefined, marca: undefined })}
                      className={[
                        "group flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-5 md:py-6 transition-all duration-200",
                        active
                          ? "bg-[#120E0E] text-[#D8C18A] border-[#120E0E] shadow-[0_8px_24px_-12px_rgba(18,14,14,0.55)]"
                          : "bg-white text-[color:var(--color-foreground)] border-[#E5E7EB] hover:border-[#C37D45] hover:shadow-sm",
                      ].join(" ")}
                    >
                      <span className="text-2xl md:text-3xl leading-none">{icon}</span>
                      <span className="text-xs md:text-sm font-medium text-center">{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Familias */}
            {grupo && (
              <FilterRow label="Familias">
                {categoriasDelGrupo.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No hay familias para este grupo.</p>
                ) : (
                  <HorizontalCarousel>
                    {categoriasDelGrupo.map((c) => (
                      <PillButton key={c.id} active={categoria === c.slug} onClick={() => setParam({ categoria: c.slug, marca: undefined })}>
                        {c.nombre}
                      </PillButton>
                    ))}
                  </HorizontalCarousel>
                )}
              </FilterRow>
            )}

            {/* Marcas (colapsable) */}
            {grupo && availableMarcas.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-foreground)]/70">
                    Marcas
                  </h3>
                  <button
                    onClick={() => setShowMarcas((s) => !s)}
                    className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-accent)] hover:opacity-80 transition"
                  >
                    {showMarcas ? "Ocultar marcas" : `Ver marcas (${availableMarcas.length})`}
                  </button>
                </div>
                {showMarcas && (
                  <HorizontalCarousel>
                    <PillButton active={!marca} onClick={() => setParam({ marca: undefined })}>Todas</PillButton>
                    {availableMarcas.map((m) => (
                      <PillButton key={m.id} active={marca === m.id} onClick={() => setParam({ marca: m.id })}>
                        {m.nombre}
                      </PillButton>
                    ))}
                  </HorizontalCarousel>
                )}
              </div>
            )}

            {/* Limpiar filtros */}
            {hasFilters && (
              <div className="pt-2 border-t border-[#E5E7EB]/70">
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-accent)] hover:opacity-80 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpiar filtros
                </button>
              </div>
            )}
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

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-foreground)]/70 mb-2">
        {label}
      </h3>
      {children}
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
          ? "bg-[#120E0E] text-[#D8C18A] border-[#120E0E] shadow-[0_4px_14px_-6px_rgba(18,14,14,0.45)]"
          : "bg-white text-[color:var(--color-foreground)] border-[#E5E7EB] hover:border-[#C37D45] hover:bg-[color:color-mix(in_oklab,var(--color-accent)_8%,white)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function HorizontalCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <div className="relative group/car">
      {canL && (
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => scrollBy(-1)}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E5E7EB] shadow-md hover:border-[#C37D45] transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canR && (
        <button
          type="button"
          aria-label="Siguiente"
          onClick={() => scrollBy(1)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E5E7EB] shadow-md hover:border-[#C37D45] transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
      <div
        ref={ref}
        className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 md:px-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.isArray(children)
          ? (children as React.ReactNode[]).map((child, i) => (
              <div key={i} className="snap-start">{child}</div>
            ))
          : <div className="snap-start">{children}</div>}
      </div>
    </div>
  );
}
