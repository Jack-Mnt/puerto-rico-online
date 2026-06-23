import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, MapPin } from "lucide-react";
import { useCart } from "@/lib/cart";
import { storageUrl } from "@/lib/supabase";

export function Header() {
  const count = useCart((s) => s.count());
  return (
    <header className="sticky top-0 z-40" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
      <div className="hidden md:block border-b border-white/10">
        <div className="container-pro flex items-center justify-between py-2 text-xs text-white/70">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Cutervo · Huaca · Divino · Casua · Unidad</span>
          <span>Atención todos los días · Delivery & Pick Up</span>
        </div>
      </div>
      <div className="container-pro flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={storageUrl("branding/logo-light.PNG")}
            alt="Puerto Rico Online"
            className="h-9 w-auto"
            onError={(e) => ((e.currentTarget.style.display = "none"))}
          />
          
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link to="/" className="text-white/80 hover:text-white">Inicio</Link>
          <Link to="/productos" className="text-white/80 hover:text-white">Catálogo</Link>
          <Link to="/nosotros" className="text-white/80 hover:text-white">Nosotros</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/productos" className="hidden sm:inline-flex btn btn-ghost text-white/90 hover:bg-white/10">
            <Search className="h-4 w-4" />
          </Link>
          <Link to="/carrito" className="relative btn btn-accent">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
            {count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-[color:var(--color-accent)]">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
