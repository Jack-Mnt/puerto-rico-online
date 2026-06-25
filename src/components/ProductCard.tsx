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
    <div className="card-pro card-producto group flex flex-col h-[330px] md:h-[380px] lg:h-[410px]">
      {/* Zona imagen */}
      <Link
        to="/producto/$slug"
        params={{ slug: p.slug }}
        className="product-image-container relative block bg-[color:var(--color-background)] p-2 md:p-3"
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
          <span className="absolute left-2 top-2 md:left-3 md:top-3 chip premium-gradient !text-[#120E0E] !border-transparent text-[10px] md:text-[11px] uppercase tracking-wider font-semibold">
            Más vendido
          </span>
        )}
      </Link>

      {/* Zona información */}
      <div className="product-info flex flex-col px-3 pt-2 md:px-4 md:pt-3 h-[62px] md:h-[76px]">
        <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground font-medium truncate leading-none">
          {p.marca?.nombre ?? "—"}
        </div>
        <Link
          to="/producto/$slug"
          params={{ slug: p.slug }}
          className="product-name mt-1 line-clamp-2 text-sm md:text-base font-semibold leading-snug hover:text-[color:var(--color-accent)]"
        >
          {p.nombre}
        </Link>
      </div>

      {/* Zona compra */}
      <div className="product-buy-row mt-auto flex items-center justify-between gap-2 px-3 pb-3 md:px-4 md:pb-4">
        <span className="product-price text-base md:text-lg font-bold leading-none whitespace-nowrap">
          S/ {p.precio_venta.toFixed(2)}
        </span>
        <button
          onClick={() => {
            add({ id: p.id, nombre: p.nombre, slug: p.slug, precio_venta: Number(p.precio_venta), precio_costo: p.precio_costo, imagen: p.imagen });
            toast.success("Agregado al carrito");
          }}
          className="btn btn-accent !py-2 !px-3 md:!px-4 rounded-full shrink-0"
          aria-label="Agregar"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Agregar</span>
        </button>
      </div>
    </div>
  );
}
