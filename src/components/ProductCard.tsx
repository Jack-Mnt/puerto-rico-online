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
          <span className="absolute left-3 top-3 chip premium-gradient !text-[#120E0E] !border-transparent text-[10px] uppercase tracking-wider">Más vendido</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.marca?.nombre ?? "—"}</div>
        <Link to="/producto/$slug" params={{ slug: p.slug }} className="mt-1 line-clamp-2 text-sm font-semibold leading-snug hover:text-[color:var(--color-accent)]">
          {p.nombre}
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="price text-lg font-bold">S/ {p.precio_venta.toFixed(2)}</span>
          <button
            onClick={() => { add({ id: p.id, nombre: p.nombre, slug: p.slug, precio_venta: Number(p.precio_venta), precio_costo: p.precio_costo, imagen: p.imagen }); toast.success("Agregado al carrito"); }}
            className="btn btn-accent !px-3 !py-2"
            aria-label="Agregar"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
