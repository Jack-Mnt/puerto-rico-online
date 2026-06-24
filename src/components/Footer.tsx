import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { storageUrl } from "@/lib/supabase";
import { configQuery, sedesQuery, whatsappUrl, formatPhone } from "@/lib/queries";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.3v6.3A6.5 6.5 0 1 1 10 9v3.2a3.3 3.3 0 1 0 3.3 3.3V3h3.2Z" />
    </svg>
  );
}

export function Footer() {
  const { data: config = {} } = useQuery(configQuery);
  const { data: sedes = [] } = useQuery(sedesQuery);
  const logoSrc = storageUrl(config.logo_light || config.logo_dark || "branding/logo-light.PNG");
  const descripcion = config.footer_descripcion;
  const waUrl = whatsappUrl(config.whatsapp_principal);
  const email = config.email_contacto;
  const socials = [
    { url: config.facebook_url, icon: Facebook, label: "Facebook" },
    { url: config.instagram_url, icon: Instagram, label: "Instagram" },
    { url: config.tiktok_url, icon: TikTokIcon, label: "TikTok" },
  ].filter((s) => s.url);

  return (
    <footer style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
      <div className="container-pro py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="mb-3">
            <img src={logoSrc} alt={config.nombre_empresa || "Puerto Rico Online"} className="h-auto w-auto object-contain max-h-10 md:max-h-14" onError={(e) => (e.currentTarget.style.display = "none")} />
          </div>
          {descripcion && <p className="text-sm text-white/70 leading-relaxed">{descripcion}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-2">
              {socials.map(({ url, icon: Icon, label }) => (
                <a
                  key={label}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.18em] text-white/80 mb-3">TIENDA</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/productos">Catálogo</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
            <li><Link to="/checkout">Checkout</Link></li>
            <li><Link to="/nosotros">Nosotros</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.18em] text-white/80 mb-3">NUESTRAS SEDES</h4>
          <ul className="space-y-2 text-sm text-white/70">
            {sedes.map((s) => (
              <li key={s.id}>
                {s.google_maps_url ? (
                  <a
                    href={s.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5" /> {s.nombre}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> {s.nombre}
                  </span>
                )}
              </li>
            ))}
            {sedes.length > 0 && (
              <li className="pt-1"><Link to="/sedes" className="text-white/60 hover:text-white text-xs">Ver todas →</Link></li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.18em] text-white/80 mb-3">
            <Link to="/contacto" className="hover:text-white transition-colors">CONTÁCTANOS</Link>
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            {config.whatsapp_principal && (
              <li>
                <a href={`tel:${config.whatsapp_principal.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="h-4 w-4" /> {formatPhone(config.whatsapp_principal)}
                </a>
              </li>
            )}
            {waUrl && (
              <li>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white transition-colors">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" /> {email}
                </a>
              </li>
            )}
            <li className="pt-1"><Link to="/unete" className="hover:text-white transition-colors">Únete a la familia PR</Link></li>
            <li className="text-white/50 text-xs pt-1">Atención todos los días.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-pro py-4 text-xs text-white/50 flex justify-between">
          <span>© {new Date().getFullYear()} {config.nombre_empresa || "Puerto Rico Online"}</span>
          <span>Tomar bebidas alcohólicas en exceso es dañino. Venta prohibida a menores de 18 años.</span>
        </div>
      </div>
    </footer>
  );
}
