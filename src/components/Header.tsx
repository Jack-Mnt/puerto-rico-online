import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Search, MapPin, Menu, X, Home, Store, Info, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { storageUrl } from "@/lib/supabase";

export function Header() {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    close();
    navigate({ to: "/productos", search: term ? { q: term } : {} });
  };

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
    >
      <div className="hidden md:block border-b border-white/10">
        <div className="container-pro flex items-center justify-between py-2 text-xs text-white/70">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Cutervo · Huaca · Divino · Casua · Unidad
          </span>
          <span>Atención todos los días · Delivery & Pick Up</span>
        </div>
      </div>
      <div className="container-pro flex items-center justify-between py-3 md:py-4">
        <Link to="/" className="flex items-center gap-3 mr-2 md:mr-12 lg:mr-[72px]">
          <img
            src={storageUrl("branding/logo-light.PNG")}
            alt="Puerto Rico Online"
            className="h-auto w-auto object-contain max-h-9 md:max-h-14"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link to="/" className="text-white/80 hover:text-white">Inicio</Link>
          <Link to="/productos" className="text-white/80 hover:text-white">Catálogo</Link>
          <Link to="/nosotros" className="text-white/80 hover:text-white">Nosotros</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/productos"
            className="hidden sm:inline-flex btn btn-ghost text-white/90 hover:bg-white/10"
          >
            <Search className="h-4 w-4" />
          </Link>
          <Link to="/carrito" className="relative btn btn-accent">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
            {mounted && count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-[color:var(--color-accent)]">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/90 hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={close}
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{ color: "var(--color-accent)" }}
            >
              Menú
            </span>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/90 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 border-b border-white/10">
            <form onSubmit={onSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                placeholder="Buscar productos…"
                className="w-full rounded-full bg-white/10 border border-white/15 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[color:var(--color-accent)]"
              />
            </form>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <MobileLink to="/" icon={Home} label="Inicio" onClick={close} />
            <MobileLink to="/productos" icon={Store} label="Catálogo" onClick={close} />
            <MobileLink to="/nosotros" icon={Info} label="Nosotros" onClick={close} />
            <button
              type="button"
              onClick={() => {
                close();
                navigate({ to: "/productos" });
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/85 hover:bg-white/5 hover:text-white text-left"
            >
              <Search className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
              <span className="text-sm">Buscar productos</span>
            </button>
            <MobileLink to="/nosotros" icon={MapPin} label="Nuestras sedes" onClick={close} hash="sedes" />

            <div className="my-3 border-t border-white/10" />

            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/85 hover:bg-white/5 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
              <span className="text-sm">WhatsApp</span>
            </a>
          </nav>

          <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/50">
            Puerto Rico · Licorería premium
          </div>
        </aside>
      </div>
    </header>
  );
}

function MobileLink({
  to,
  icon: Icon,
  label,
  onClick,
  hash,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  onClick: () => void;
  hash?: string;
}) {
  return (
    <Link
      to={to}
      hash={hash}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/85 hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
      <span className="text-sm">{label}</span>
    </Link>
  );
}
