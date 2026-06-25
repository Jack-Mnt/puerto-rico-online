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
    <div className="card-pro group flex flex-col overflow-hidden">
      <Link to="/producto/$slug" params={{ slug: p.slug }} className="block relative aspect-square bg-[color:var(--color-background)] p-4">
        {img ? (
          <img src={img} alt={p.nombre} loading="lazy" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">Sin imagen</div>
        )}
        {p.destacado && (
          <span className="absolute left-3 top-3 chip premium-gradient !text-[#120E0E] !border-transparent text-[11px] uppercase tracking-wider font-semibold">Más vendido</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium leading-relaxed">{p.marca?.nombre ?? "—"}</div>
        <Link to="/producto/$slug" params={{ slug: p.slug }} className="mt-2 line-clamp-2 text-base font-semibold leading-snug hover:text-[color:var(--color-accent)]">
          {p.nombre}
        </Link>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="price text-xl font-bold leading-none">S/ {p.precio_venta.toFixed(2)}</span>
          <button
            onClick={() => { add({ id: p.id, nombre: p.nombre, slug: p.slug, precio_venta: Number(p.precio_venta), precio_costo: p.precio_costo, imagen: p.imagen }); toast.success("Agregado al carrito"); }}
            className="btn btn-accent !p-2 rounded-full"
            aria-label="Agregar"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
