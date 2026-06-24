import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MapPin, ExternalLink, MessageCircle } from "lucide-react";
import { sedesQuery, configQuery } from "@/lib/queries";

export const Route = createFileRoute("/sedes")({
  head: () => ({
    meta: [
      { title: "Nuestras Sedes — Puerto Rico Online" },
      { name: "description", content: "Encuentra nuestras sedes en Ica. Visítanos en Cutervo, Huaca, Divino, Casua y Unidad." },
      { property: "og:title", content: "Nuestras Sedes — Puerto Rico Online" },
      { property: "og:description", content: "Encuentra nuestras sedes en Ica. Visítanos en Cutervo, Huaca, Divino, Casua y Unidad." },
    ],
  }),
  component: SedesPage,
});

function SedesPage() {
  const { data: sedes = [], isLoading } = useQuery(sedesQuery);
  const { data: config = {} } = useQuery(configQuery);

  const whatsappGeneral = (config.whatsapp_principal || config.whatsapp_moderador || "").replace(/\D/g, "");
  const whatsappGeneralUrl = whatsappGeneral ? `https://wa.me/${whatsappGeneral}` : "";

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
            <p className="text-xs uppercase tracking-[0.22em] font-display mb-3" style={{ color: "var(--color-accent)" }}>Nuestras Sedes</p>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl tracking-wide">
              Estamos cerca de ti
            </h1>
            <p className="mt-5 mx-auto max-w-2xl text-base md:text-lg text-white/70 leading-relaxed">
              Visítanos en cualquiera de nuestras sedes para acompañar cada celebración.
            </p>
          </div>
        </section>

        {/* Lista de Sedes */}
        <section className="container-pro py-16 md:py-24">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 md:p-7 animate-pulse"
                  style={{ background: "white", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-start gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl" style={{ background: "var(--color-surface)" }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded" style={{ background: "var(--color-surface)" }} />
                      <div className="h-3 w-full rounded" style={{ background: "var(--color-surface)" }} />
                    </div>
                  </div>
                  <div className="h-10 w-full rounded-xl" style={{ background: "var(--color-surface)" }} />
                </div>
              ))}
            </div>
          ) : sedes.length === 0 ? (
            <div
              className="mx-auto max-w-md rounded-2xl p-10 text-center"
              style={{ background: "white", border: "1px solid var(--color-border)" }}
            >
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl" style={{ background: "var(--color-surface)" }}>
                <MapPin className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
              </div>
              <h3 className="font-display text-lg mb-2">Aún no hay sedes registradas</h3>
              <p className="text-sm text-muted-foreground">
                Pronto compartiremos los puntos donde podrás visitarnos.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sedes.map((sede) => (
                <div
                  key={sede.id}
                  className="rounded-2xl p-6 md:p-7 transition hover:shadow-lg flex flex-col"
                  style={{
                    background: "white",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-start gap-3 mb-5">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{ background: "color-mix(in oklab, var(--color-accent) 12%, transparent)" }}
                    >
                      <MapPin className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg">{sede.nombre}</h3>
                      {sede.direccion ? (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{sede.direccion}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/70 mt-1 leading-relaxed italic">Dirección por confirmar</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto">
                    {sede.google_maps_url ? (
                      <a
                        href={sede.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline w-full text-sm"
                      >
                        <ExternalLink className="h-4 w-4" /> Ver en Google Maps
                      </a>
                    ) : (
                      <button
                        disabled
                        className="btn btn-outline w-full text-sm opacity-50 cursor-not-allowed"
                      >
                        <ExternalLink className="h-4 w-4" /> Ubicación no disponible
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA bloque */}
          <div
            className="mt-12 rounded-2xl p-8 md:p-10 text-center"
            style={{
              background: "linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 18%, transparent), color-mix(in oklab, var(--color-accent) 6%, transparent))",
              border: "1px solid color-mix(in oklab, var(--color-accent) 30%, transparent)",
            }}
          >
            <h3 className="font-display text-xl md:text-2xl mb-2">
              ¿Necesitas ayuda o deseas realizar un pedido?
            </h3>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-6">
              Nuestro equipo está listo para ayudarte y coordinar tu pedido.
            </p>
            <a
              href={whatsappGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-accent inline-flex"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Puerto Rico
            </a>
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
