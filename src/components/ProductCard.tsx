import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { Producto } from "@/lib/types";
import { storageUrl } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ p }: { p: Producto }) {
  const add = useCart((s) => s.add);
  const img = storageUrl(p.imagen);
  return (
    <div className="card-pro group flex flex-col overflow-hidden h-[340px] sm:h-[420px]">
      {/* Zona imagen 60% */}
      <Link
        to="/producto/$slug"
        params={{ slug: p.slug }}
        className="relative block bg-[color:var(--color-background)] p-2 sm:p-3"
        style={{ flex: "0 0 60%" }}
      >
        {img ? (
          <img
            src={img}
            alt={p.nombre}
            loading="lazy"
            className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">Sin imagen</div>
        )}
        {p.destacado && (
          <span className="absolute left-2 top-2 sm:left-3 sm:top-3 chip premium-gradient !text-[#120E0E] !border-transparent text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
            Más vendido
          </span>
        )}
      </Link>

      {/* Zona información 25% */}
      <div
        className="flex flex-col px-3 pt-2 sm:px-4 sm:pt-3 overflow-hidden"
        style={{ flex: "0 0 25%" }}
      >
        <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium truncate">
          {p.marca?.nombre ?? "—"}
        </div>
        <Link
          to="/producto/$slug"
          params={{ slug: p.slug }}
          className="mt-1 line-clamp-2 text-sm sm:text-base font-semibold leading-snug hover:text-[color:var(--color-accent)]"
        >
          {p.nombre}
        </Link>
      </div>

      {/* Zona compra 15% */}
      <div
        className="mt-auto flex items-center justify-between gap-2 px-3 pb-3 sm:px-4 sm:pb-4"
        style={{ flex: "0 0 15%" }}
      >
        <span className="price text-base sm:text-lg font-bold leading-none whitespace-nowrap shrink">
          S/ {p.precio_venta.toFixed(2)}
        </span>
        <button
          onClick={() => {
            add({ id: p.id, nombre: p.nombre, slug: p.slug, precio_venta: Number(p.precio_venta), precio_costo: p.precio_costo, imagen: p.imagen });
            toast.success("Agregado al carrito");
          }}
          className="btn btn-accent !p-2 rounded-full shrink-0"
          aria-label="Agregar"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Agregar</span>
        </button>
      </div>
    </div>
  );
}
