import { Link } from "@tanstack/react-router";
import { storageUrl } from "@/lib/supabase";

export function Footer() {
  return (
    <footer style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
      <div className="container-pro py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="mb-3">
            <img src={storageUrl("branding/logo-light.PNG")} alt="Puerto Rico Online" className="h-9 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Tu licorería premium online. Selección curada, entrega rápida y atención personalizada en todas nuestras sedes.
          </p>
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.18em] text-white/80 mb-3">TIENDA</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/productos">Catálogo</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
            <li><Link to="/checkout">Checkout</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.18em] text-white/80 mb-3">SEDES</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Cutervo</li><li>Huaca</li><li>Divino</li><li>Casua</li><li>Unidad</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.18em] text-white/80 mb-3">CONTACTO</h4>
          <p className="text-sm text-white/70">WhatsApp: +51 955 618 119<br/>Atención todos los días.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-pro py-4 text-xs text-white/50 flex justify-between">
          <span>© {new Date().getFullYear()} Puerto Rico Online</span>
          <span>Tomar bebidas alcohólicas en exceso es dañino. Venta prohibida a menores de 18 años.</span>
        </div>
      </div>
    </footer>
  );
}
