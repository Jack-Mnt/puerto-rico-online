import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Categoria } from "@/lib/types";

export function CategoriesCarousel({ categorias }: { categorias: Categoria[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {/* Arrows - desktop only */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="hidden md:grid absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 h-10 w-10 place-items-center rounded-full bg-white shadow-md border border-black/5 hover:border-[color:var(--color-accent)] transition opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="h-5 w-5 text-[color:var(--color-accent)]" />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Siguiente"
        className="hidden md:grid absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 h-10 w-10 place-items-center rounded-full bg-white shadow-md border border-black/5 hover:border-[color:var(--color-accent)] transition opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="h-5 w-5 text-[color:var(--color-accent)]" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.cat-scroll::-webkit-scrollbar{display:none}`}</style>
        {categorias.map((c) => (
          <Link
            key={c.id}
            to="/productos"
            search={{ categoria: c.slug } as never}
            className="snap-start shrink-0 flex items-center gap-3 bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md hover:border-[color:var(--color-accent)] transition-all px-4 py-3 min-w-[160px] md:min-w-[200px]"
          >
            <div className="h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-full premium-gradient grid place-items-center text-[#120E0E] font-display text-xs md:text-sm">
              {c.nombre.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-semibold truncate">{c.nombre}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
