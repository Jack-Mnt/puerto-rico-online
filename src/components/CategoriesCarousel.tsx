import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Categoria } from "@/lib/types";

interface CategoriesCarouselProps {
  categorias: Categoria[];
  activeSlug?: string | null;
}

export function CategoriesCarousel({ categorias, activeSlug }: CategoriesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {/* Desktop arrows */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 h-10 w-10 items-center justify-center rounded-full border border-[#E6D3A3]/20 bg-[#120E0E]/80 backdrop-blur-sm text-[#E6D3A3] opacity-0 transition-all duration-300 group-hover:opacity-100 hover:border-[#E6D3A3]/50 hover:bg-[#120E0E] hover:shadow-[0_0_16px_rgba(230,211,163,0.15)]"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Siguiente"
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 h-10 w-10 items-center justify-center rounded-full border border-[#E6D3A3]/20 bg-[#120E0E]/80 backdrop-blur-sm text-[#E6D3A3] opacity-0 transition-all duration-300 group-hover:opacity-100 hover:border-[#E6D3A3]/50 hover:bg-[#120E0E] hover:shadow-[0_0_16px_rgba(230,211,163,0.15)]"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollRef}
        className="cat-scroll flex gap-3 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.cat-scroll::-webkit-scrollbar{display:none}`}</style>
        {categorias.map((c) => {
          const isActive = activeSlug === c.slug || hoveredId === c.id;
          return (
            <Link
              key={c.id}
              to="/productos"
              search={{ categoria: c.slug } as never}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                snap-start shrink-0
                flex items-center justify-center text-center
                rounded-2xl md:rounded-3xl
                border
                transition-all duration-300 ease-out
                cursor-pointer
                select-none
                min-w-[130px] sm:min-w-[150px] md:min-w-[190px] lg:min-w-[200px]
                h-[100px] sm:h-[110px] md:h-[190px] lg:h-[220px]
                px-3 md:px-5
                ${
                  isActive
                    ? "bg-gradient-to-br from-[#1a1414] to-[#2d1e16] border-[#E6D3A3]/50 shadow-[0_0_24px_rgba(195,125,69,0.25)] scale-[1.02]"
                    : "bg-[#120E0E] border-[#E6D3A3]/10 hover:border-[#E6D3A3]/30 hover:shadow-[0_8px_30px_rgba(195,125,69,0.12)] hover:scale-[1.02]"
                }
              `}
            >
              <span
                className={`
                  font-display leading-tight tracking-wide line-clamp-2
                  text-[10px] sm:text-xs md:text-sm lg:text-base
                  ${isActive ? "text-[#E6D3A3]" : "text-white/85"}
                `}
              >
                {c.nombre}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
