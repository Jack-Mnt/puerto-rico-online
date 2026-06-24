import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Mail, MessageCircle, Facebook, Instagram, Building2, Phone } from "lucide-react";
import { configQuery, whatsappUrl, formatPhone } from "@/lib/queries";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.3v6.3A6.5 6.5 0 1 1 10 9v3.2a3.3 3.3 0 1 0 3.3 3.3V3h3.2Z" />
    </svg>
  );
}

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — Puerto Rico Online" },
      { name: "description", content: "Escríbenos por WhatsApp o correo. Estamos para ayudarte." },
      { property: "og:title", content: "Contacto — Puerto Rico Online" },
      { property: "og:description", content: "Escríbenos por WhatsApp o correo. Estamos para ayudarte." },
    ],
  }),
  component: ContactoPage,
});

function ContactoPage() {
  const { data: config = {} } = useQuery(configQuery);
  const waUrl = whatsappUrl(config.whatsapp_principal);
  const socials = [
    { url: config.facebook_url, icon: Facebook, label: "Facebook" },
    { url: config.instagram_url, icon: Instagram, label: "Instagram" },
    { url: config.tiktok_url, icon: TikTokIcon, label: "TikTok" },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
          <div className="container-pro relative py-16 md:py-20 text-center">
            <p className="text-xs uppercase tracking-[0.22em] font-display mb-3" style={{ color: "var(--color-accent)" }}>Contacto</p>
            <h1 className="font-display text-3xl md:text-5xl tracking-wide">Hablemos</h1>
            <p className="mt-4 mx-auto max-w-xl text-white/70 leading-relaxed">
              Resolvemos tus consultas y tomamos pedidos por los siguientes canales.
            </p>
          </div>
        </section>

        <section className="container-pro py-16 md:py-20">
          <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="card-pro p-6 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl" style={{ background: "color-mix(in oklab, var(--color-accent) 12%, transparent)" }}>
                  <MessageCircle className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
                </div>
                <h3 className="font-display text-lg mb-1">WhatsApp</h3>
                <p className="text-sm text-muted-foreground break-all">{config.whatsapp_principal}</p>
              </a>
            )}
            {config.email_contacto && (
              <a href={`mailto:${config.email_contacto}`} className="card-pro p-6 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl" style={{ background: "color-mix(in oklab, var(--color-accent) 12%, transparent)" }}>
                  <Mail className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
                </div>
                <h3 className="font-display text-lg mb-1">Correo de contacto</h3>
                <p className="text-sm text-muted-foreground break-all">{config.email_contacto}</p>
              </a>
            )}
            {config.email_corporativo && (
              <a href={`mailto:${config.email_corporativo}`} className="card-pro p-6 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl" style={{ background: "color-mix(in oklab, var(--color-accent) 12%, transparent)" }}>
                  <Building2 className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
                </div>
                <h3 className="font-display text-lg mb-1">Correo corporativo</h3>
                <p className="text-sm text-muted-foreground break-all">{config.email_corporativo}</p>
              </a>
            )}
          </div>

          {socials.length > 0 && (
            <div className="mt-12 text-center">
              <p className="text-xs uppercase tracking-[0.22em] font-display mb-4" style={{ color: "var(--color-accent)" }}>Síguenos</p>
              <div className="flex items-center justify-center gap-3">
                {socials.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
