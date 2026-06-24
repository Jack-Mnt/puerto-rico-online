import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { configQuery, sedesQuery, whatsappUrl } from "@/lib/queries";
import { Send, Sparkles } from "lucide-react";

const PUESTOS = [
  "Administrativo",
  "Encargado de almacén y logística",
  "Cajero vendedor",
  "Almacén",
  "Otros",
];

export const Route = createFileRoute("/unete")({
  head: () => ({
    meta: [
      { title: "Únete a la familia PR — Puerto Rico Online" },
      { name: "description", content: "Postula para trabajar con Puerto Rico. Personas comprometidas, responsables y con ganas de crecer." },
      { property: "og:title", content: "Únete a la familia PR" },
      { property: "og:description", content: "Postula para trabajar con Puerto Rico." },
    ],
  }),
  component: UnetePage,
});

function UnetePage() {
  const { data: config = {} } = useQuery(configQuery);
  const { data: sedes = [] } = useQuery(sedesQuery);

  const [nombre, setNombre] = useState("");
  const [sede, setSede] = useState("");
  const [puesto, setPuesto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = nombre.trim();
    if (!n || !sede || !puesto) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }
    const numero = config.whatsapp_contrataciones;
    if (!numero) {
      setError("Canal de contrataciones no disponible. Intenta más tarde.");
      return;
    }
    const text = `Hola, quiero unirme a la familia Puerto Rico.\n\nNombre:\n${n}\n\nSede de interés:\n${sede}\n\nPuesto de interés:\n${puesto}\n\nMensaje adicional:\n${mensaje.trim() || "-"}`;
    const url = whatsappUrl(numero, text);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
          <div className="container-pro relative py-16 md:py-20 text-center">
            <p className="text-xs uppercase tracking-[0.22em] font-display mb-3" style={{ color: "var(--color-accent)" }}>Trabaja con nosotros</p>
            <h1 className="font-display text-3xl md:text-5xl tracking-wide">Únete a la familia PR</h1>
            <p className="mt-4 mx-auto max-w-2xl text-white/70 leading-relaxed">
              Siempre estamos buscando personas comprometidas, responsables y con ganas de crecer junto a nosotros.
            </p>
          </div>
        </section>

        <section className="container-pro py-12 md:py-16">
          <form onSubmit={onSubmit} className="card-pro p-6 md:p-10 max-w-2xl mx-auto space-y-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] font-display" style={{ color: "var(--color-accent)" }}>
              <Sparkles className="h-4 w-4" /> Postulación rápida
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre completo <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={100}
                required
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={{ borderColor: "var(--color-border)" }}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Sede de interés <span className="text-red-500">*</span></label>
              <select
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <option value="">Selecciona una sede</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.nombre}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Puesto de interés <span className="text-red-500">*</span></label>
              <select
                value={puesto}
                onChange={(e) => setPuesto(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <option value="">Selecciona un puesto</option>
                {PUESTOS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Mensaje adicional <span className="text-muted-foreground text-xs">(opcional)</span></label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={{ borderColor: "var(--color-border)" }}
                placeholder="Cuéntanos brevemente sobre tu experiencia o disponibilidad."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-display tracking-wide text-sm transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: "var(--color-accent)", color: "var(--color-primary)" }}
            >
              <Send className="h-4 w-4" /> Enviar postulación
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Serás redirigido a WhatsApp para enviar tu postulación.
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
