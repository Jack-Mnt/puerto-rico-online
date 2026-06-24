import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Award, Clock, HeartHandshake, Sparkles, Wine, MapPin, MessageCircle, Facebook, Instagram } from "lucide-react";
import { sedesQuery, configQuery, whatsappUrl } from "@/lib/queries";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.3v6.3A6.5 6.5 0 1 1 10 9v3.2a3.3 3.3 0 1 0 3.3 3.3V3h3.2Z" />
    </svg>
  );
}

export const Route = createFileRoute("/nosotros")({
  head: () => ({
    meta: [
      { title: "Nosotros — Puerto Rico Online" },
      { name: "description", content: "Más de 30 años celebrando junto a Ica. Conoce la historia de Puerto Rico." },
      { property: "og:title", content: "Nosotros — Puerto Rico Online" },
      { property: "og:description", content: "Más de 30 años celebrando junto a Ica. Conoce la historia de Puerto Rico." },
    ],
  }),
  component: NosotrosPage,
});

function NosotrosPage() {
  const { data: sedes = [] } = useQuery(sedesQuery);
  const { data: config = {} } = useQuery(configQuery);

  const whatsappGeneralUrl = whatsappUrl(config.whatsapp_principal);
  const socials = [
    { url: config.facebook_url, icon: Facebook, label: "Facebook" },
    { url: config.instagram_url, icon: Instagram, label: "Instagram" },
    { url: config.tiktok_url, icon: TikTokIcon, label: "TikTok" },
  ].filter((s) => s.url);


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full" style={{ background: "var(--color-premium)" }} />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full" style={{ background: "var(--color-accent)" }} />
          </div>
          <div className="container-pro relative py-20 md:py-28 text-center">
            <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "color-mix(in oklab, var(--color-premium) 20%, transparent)", border: "1px solid color-mix(in oklab, var(--color-premium) 30%, transparent)" }}>
              <Wine className="h-5 w-5" style={{ color: "var(--color-premium)" }} />
            </div>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl tracking-wide">
              Más de 30 años celebrando junto a Ica
            </h1>
            <p className="mt-5 mx-auto max-w-2xl text-base md:text-lg text-white/70 leading-relaxed">
              Una historia construida con confianza, calidad y momentos compartidos.
            </p>
          </div>
        </section>

        {/* Nuestras Sedes */}
        <section className="container-pro py-16 md:py-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.22em] font-display mb-3" style={{ color: "var(--color-accent)" }}>Nuestras Sedes</p>
            <h2 className="font-display text-2xl md:text-4xl">Estamos cerca de ti</h2>
            <p className="mt-3 mx-auto max-w-xl text-muted-foreground leading-relaxed">
              Conoce los puntos donde puedes encontrarnos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
            {/* Foto / placeholder */}
            <div
              className="relative aspect-[4/3] rounded-2xl overflow-hidden grid place-items-center"
              style={{
                background: "var(--color-surface)",
                border: "1px dashed var(--color-border)",
              }}
            >
              <div className="text-center px-6">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl" style={{ background: "color-mix(in oklab, var(--color-accent) 12%, transparent)" }}>
                  <MapPin className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
                </div>
                <p className="text-sm text-muted-foreground">Espacio reservado para foto de nuestras sedes</p>
              </div>
            </div>

            {/* Lista compacta */}
            <div>
              <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {sedes.map((sede) => (
                  <li key={sede.id} className="flex items-start gap-3 py-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: "color-mix(in oklab, var(--color-accent) 12%, transparent)" }}>
                      <MapPin className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base md:text-lg">{sede.nombre}</p>
                      {sede.direccion && (
                        <p className="text-sm text-muted-foreground leading-relaxed truncate">{sede.direccion}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link to="/sedes" className="btn btn-accent inline-flex">
                  Ver todas las sedes
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Nuestra Historia */}
        <section className="container-pro py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs uppercase tracking-[0.22em] font-display mb-3" style={{ color: "var(--color-accent)" }}>Nuestra Historia</p>
            <h2 className="font-display text-2xl md:text-4xl mb-8">
              Familia, tradición y pasión por lo que hacemos
            </h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed md:text-lg">
              <p>
                Puerto Rico nació como una empresa familiar con un propósito claro: ofrecer a Ica productos de calidad para cada celebración. Desde entonces, han pasado más de tres décadas de aprendizaje, crecimiento y, sobre todo, de compartir innumerables momentos junto a nuestros clientes.
              </p>
              <p>
                Lo que comenzó como un pequeño negocio local se ha convertido en un referente de confianza en la región. Hoy seguimos siendo esa misma familia, con los mismos valores, pero con la experiencia de quienes han aprendido que cada brindis cuenta una historia.
              </p>
            </div>
          </div>
        </section>

        {/* Diferenciadores */}
        <section className="border-y" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="container-pro py-16 md:py-24">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.22em] font-display mb-3" style={{ color: "var(--color-accent)" }}>Por qué elegirnos</p>
              <h2 className="font-display text-2xl md:text-4xl">Lo que nos diferencia</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Award, title: "Productos originales", desc: "Garantía de autenticidad en cada botella que entregamos." },
                { icon: HeartHandshake, title: "Atención rápida", desc: "Respuesta ágil y personalizada para que nunca esperes de más." },
                { icon: Sparkles, title: "Cercanía con nuestros clientes", desc: "Te conocemos, entendemos lo que buscas y te lo facilitamos." },
                { icon: Clock, title: "Más de 30 años de experiencia", desc: "Tres décadas respaldan cada recomendación que hacemos." },
              ].map(({ icon: I, title, desc }) => (
                <div key={title} className="card-pro p-6 text-center">
                  <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
                    <I className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Valores */}
        <section className="container-pro py-16 md:py-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.22em] font-display mb-3" style={{ color: "var(--color-accent)" }}>Lo que nos guía</p>
            <h2 className="font-display text-2xl md:text-4xl">Nuestros valores</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Calidad", desc: "Seleccionamos lo mejor para ti." },
              { label: "Confianza", desc: "Una relación construida a lo largo de los años." },
              { label: "Servicio", desc: "Tu experiencia es nuestra prioridad." },
              { label: "Celebración", desc: "Cada encuentro merece ser memorable." },
            ].map((v) => (
              <div key={v.label} className="card-pro p-6 md:p-8 text-center">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: "var(--color-premium)" }} />
                <h3 className="font-display text-lg md:text-xl mb-2">{v.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cierre */}
        <section className="relative overflow-hidden" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full" style={{ background: "var(--color-accent)" }} />
          </div>
          <div className="container-pro relative py-16 md:py-24 text-center">
            <div className="mx-auto max-w-3xl">
              <p className="font-display text-xl md:text-3xl leading-relaxed tracking-wide">
                "En Puerto Rico no solo vendemos bebidas. Formamos parte de los encuentros, los brindis y las historias que merecen ser celebradas."
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/productos" className="btn btn-accent">
                  Explorar catálogo
                </Link>
                <Link to="/" className="btn btn-outline" style={{ color: "var(--color-primary-foreground)", borderColor: "color-mix(in oklab, white 20%, transparent)" }}>
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
