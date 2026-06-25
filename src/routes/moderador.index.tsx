import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, MessageCircle, Repeat, Ban, CheckCircle2, PackageCheck } from "lucide-react";
import { supabase, storageUrl } from "@/lib/supabase";
import { PageHeader, EmptyState } from "@/components/PanelLayout";
import { Modal } from "@/components/Modal";
import { useAuthStore } from "@/lib/auth";
import { formatMoney, formatDate } from "@/lib/csv";
import {
  ESTADOS,
  ESTADO_LABEL,
  ESTADO_COLOR,
  ACCION_LABEL,
  type EstadoPedido,
  type AccionHistorial,
} from "@/lib/estados";
import { useRealtimePedidos } from "@/hooks/useRealtimePedidos";

export const Route = createFileRoute("/moderador/")({
  component: ModeradorKanban,
});

type Pedido = {
  id: string;
  numero_pedido: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  direccion: string | null;
  referencia?: string | null;
  notas?: string | null;
  sede_id: string | null;
  estado: EstadoPedido;
  metodo_pago: string | null;
  tipo_entrega: string | null;
  total: number;
  created_at: string;
};

// Estados activos que mostramos en el panel principal.
const ESTADOS_ACTIVOS: EstadoPedido[] = [
  "pedido_creado",
  "pedido_aceptado",
  "pedido_rechazado",
  "pedido_despachado",
];

// Variante visual de cada tarjeta.
type Variant = "creado" | "aceptado" | "rechazado" | "reasignado" | "despachado";

type Columna = {
  key: "nuevos" | "rechazados" | "despachados";
  title: string;
  variants: Variant[];
};

const COLUMNAS: Columna[] = [
  { key: "nuevos", title: "Nuevos", variants: ["creado", "aceptado"] },
  { key: "rechazados", title: "Rechazados", variants: ["rechazado", "reasignado"] },
  { key: "despachados", title: "Despachados", variants: ["despachado"] },
];

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; chip: string; label: string }> = {
  creado: { bg: "#FFF7D6", border: "#FACC15", chip: "bg-amber-100 text-amber-900", label: "Nuevo" },
  aceptado: { bg: "#EAF8EF", border: "#22C55E", chip: "bg-emerald-100 text-emerald-900", label: "Aceptado" },
  rechazado: { bg: "#FDECEC", border: "#EF4444", chip: "bg-red-100 text-red-900", label: "Rechazado" },
  reasignado: { bg: "#EAF2FF", border: "#3B82F6", chip: "bg-blue-100 text-blue-900", label: "Reasignado" },
  despachado: { bg: "#DFF7E8", border: "#16A34A", chip: "bg-green-200 text-green-900", label: "Despachado" },
};

function ModeradorKanban() {
  const qc = useQueryClient();
  const { perfil } = useAuthStore();
  const [viewing, setViewing] = useState<Pedido | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const { data: sedes = [] } = useQuery({
    queryKey: ["sedes-options"],
    queryFn: async () => (await supabase.from("sedes").select("id,nombre")).data || [],
  });

  const queryKey = ["mod-pedidos-activos"];
  useRealtimePedidos([queryKey, ["mod-reasignados-ids"], ["mod-historial"], ["pedido-historial"], ["mod-pedido-items"]]);
  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .in("estado", ESTADOS_ACTIVOS)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });

  // Pedidos con acción "pedido_reasignado" en historial (para variante visual).
  const { data: reasignadosIds = new Set<string>() } = useQuery({
    queryKey: ["mod-reasignados-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_pedidos")
        .select("pedido_id")
        .eq("accion", "pedido_reasignado");
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.pedido_id as string));
    },
  });

  const entregar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("entregar_pedido", { p_pedido_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido entregado");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["pedido-historial"] });
      qc.invalidateQueries({ queryKey: ["mod-historial"] });
      setViewing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const cancelar = useMutation({
    mutationFn: async ({ id, observaciones }: { id: string; observaciones: string }) => {
      const { error } = await supabase.rpc("cancelar_pedido", {
        p_pedido_id: id,
        p_observaciones: observaciones,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido cancelado");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["pedido-historial"] });
      qc.invalidateQueries({ queryKey: ["mod-historial"] });
      setCancelingId(null);
      setViewing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const reasignar = useMutation({
    mutationFn: async ({
      p,
      nuevaSede,
      observaciones,
    }: {
      p: Pedido;
      nuevaSede: string;
      observaciones: string;
    }) => {
      const { error } = await supabase.rpc("reasignar_pedido", {
        p_pedido_id: p.id,
        p_nueva_sede_id: nuevaSede,
        p_observaciones: observaciones,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sede reasignada");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["mod-reasignados-ids"] });
      qc.invalidateQueries({ queryKey: ["pedido-historial"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function variantOf(p: Pedido): Variant {
    if (p.estado === "pedido_despachado") return "despachado";
    if (p.estado === "pedido_aceptado") return "aceptado";
    if (p.estado === "pedido_rechazado") {
      if (reasignadosIds.has(p.id)) return "reasignado";
      return "rechazado";
    }
    return "creado";
  }

  const grupos = useMemo(() => {
    return COLUMNAS.map((col) => ({
      ...col,
      items: data
        .map((p) => ({ p, v: variantOf(p) }))
        .filter((x) => col.variants.includes(x.v)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reasignadosIds]);

  return (
    <div>
      <PageHeader
        title="Centro de operaciones"
        description="Pedidos en curso. Los entregados y cancelados se archivan en Historial."
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !data.length ? (
        <EmptyState title="Sin pedidos activos" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {grupos.map((g) => (
            <div key={g.key} className="rounded-xl border border-border bg-card flex flex-col">
              <div className="px-3 py-2.5 border-b border-border flex items-center justify-between bg-card rounded-t-xl">
                <h3 className="font-semibold text-sm">{g.title}</h3>
                <span className="text-xs text-muted-foreground">{g.items.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[78vh] overflow-y-auto">
                {g.items.map(({ p, v }) => (
                  <PedidoCard
                    key={p.id}
                    pedido={p}
                    variant={v}
                    sedeNombre={sedes.find((s) => s.id === p.sede_id)?.nombre || "Sin sede"}
                    onOpen={() => setViewing(p)}
                    onMarcarEntregado={
                      v === "despachado"
                        ? () => entregar.mutate(p.id)
                        : undefined
                    }
                    busy={entregar.isPending}
                  />
                ))}
                {g.items.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-6">—</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <PedidoModeradorModal
          pedido={viewing}
          sedes={sedes}
          onClose={() => setViewing(null)}
          onCancelar={() => setCancelingId(viewing.id)}
          onEntregado={() => entregar.mutate(viewing.id)}
          onReasignar={(nuevaSede, observaciones) =>
            reasignar.mutate({ p: viewing, nuevaSede, observaciones })
          }
          busy={entregar.isPending || reasignar.isPending}
        />
      )}

      {cancelingId && (
        <CancelarModal
          onClose={() => setCancelingId(null)}
          onSubmit={(observaciones) => cancelar.mutate({ id: cancelingId, observaciones })}
          busy={cancelar.isPending}
        />
      )}
    </div>
  );
}

function formatHora(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function PedidoCard({
  pedido,
  variant,
  sedeNombre,
  onOpen,
  onMarcarEntregado,
  busy,
}: {
  pedido: Pedido;
  variant: Variant;
  sedeNombre: string;
  onOpen: () => void;
  onMarcarEntregado?: () => void;
  busy?: boolean;
}) {
  const s = VARIANT_STYLES[variant];
  return (
    <div
      className="rounded-lg border p-2.5 transition-shadow hover:shadow-sm"
      style={{ backgroundColor: s.bg, borderColor: s.border }}
    >
      <button onClick={onOpen} className="w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-foreground/60">#{pedido.numero_pedido}</span>
          <span className="text-[10px] text-foreground/60">{formatHora(pedido.created_at)}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
          <div className="text-sm text-foreground font-medium truncate">{pedido.cliente_nombre}</div>
          <div className="text-sm text-foreground font-medium truncate text-right">{sedeNombre}</div>
          <div className="text-sm text-foreground font-medium truncate capitalize">
            {pedido.tipo_entrega || "—"}
          </div>
          <div className="text-sm text-foreground font-medium truncate text-right">
            {formatMoney(pedido.total)}
          </div>
        </div>
      </button>
      {onMarcarEntregado && (
        <button
          disabled={busy}
          onClick={onMarcarEntregado}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-700 text-white px-2 py-1.5 text-xs font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          <PackageCheck className="h-3.5 w-3.5" /> Marcar entregado
        </button>
      )}
    </div>
  );
}

function PedidoModeradorModal({
  pedido,
  sedes,
  onClose,
  onCancelar,
  onEntregado,
  onReasignar,
  busy,
}: {
  pedido: Pedido;
  sedes: { id: string; nombre: string }[];
  onClose: () => void;
  onCancelar: () => void;
  onEntregado: () => void;
  onReasignar: (sedeId: string) => void;
  busy: boolean;
}) {
  const [nuevaSede, setNuevaSede] = useState(pedido.sede_id ?? "");
  const sedeActual = sedes.find((s) => s.id === pedido.sede_id)?.nombre || "Sin sede";

  const { data: items } = useQuery({
    queryKey: ["mod-pedido-items", pedido.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detalle_pedidos")
        .select("*, productos(nombre, imagen)")
        .eq("pedido_id", pedido.id);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: historial } = useQuery({
    queryKey: ["pedido-historial", pedido.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_pedidos")
        .select("*, usuarios(nombre)")
        .eq("pedido_id", pedido.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const whatsappHref = pedido.cliente_telefono
    ? `https://wa.me/${pedido.cliente_telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola ${pedido.cliente_nombre}, te escribo de Puerto Rico sobre tu pedido #${pedido.numero_pedido}.`,
      )}`
    : null;

  return (
    <Modal open onClose={onClose} title={`Pedido #${pedido.numero_pedido}`} size="xl">
      <div className="grid lg:grid-cols-3 gap-5 text-sm">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${ESTADO_COLOR[pedido.estado]}`}>
              {ESTADO_LABEL[pedido.estado]}
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(pedido.created_at)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info label="Cliente" value={pedido.cliente_nombre} />
            <Info label="Teléfono" value={pedido.cliente_telefono ?? "—"} />
            <Info label="Método pago" value={pedido.metodo_pago ?? "—"} />
            <Info label="Tipo entrega" value={pedido.tipo_entrega ?? "—"} />
            <Info label="Sede actual" value={sedeActual} />
            <Info label="Estado" value={ESTADO_LABEL[pedido.estado]} />
          </div>
          {pedido.direccion && <Info label="Dirección" value={pedido.direccion} />}
          {pedido.referencia && <Info label="Referencia" value={pedido.referencia} />}
          {pedido.notas && <Info label="Notas" value={pedido.notas} />}

          <div>
            <div className="font-semibold mb-2">Productos</div>
            <div className="space-y-2">
              {items?.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2 border border-border rounded">
                  {d.productos?.imagen ? (
                    <img src={storageUrl(d.productos.imagen)} alt="" className="h-10 w-10 object-cover rounded" />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{d.productos?.nombre || d.producto_id}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.cantidad} × {formatMoney(Number(d.precio_venta))}
                    </div>
                  </div>
                  <div className="font-semibold">{formatMoney(Number(d.subtotal))}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-border mt-3 pt-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatMoney(pedido.total)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5" /> Reasignar sede
            </div>
            <select
              className="input w-full"
              value={nuevaSede}
              onChange={(e) => setNuevaSede(e.target.value)}
            >
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <button
              disabled={busy || !nuevaSede || nuevaSede === pedido.sede_id}
              onClick={() => onReasignar(nuevaSede)}
              className="w-full rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm disabled:opacity-50"
            >
              Reasignar
            </button>
          </div>

          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp al cliente
            </a>
          )}

          <div className="flex flex-col gap-2">
            <button
              disabled={busy || pedido.estado === "pedido_entregado"}
              onClick={onEntregado}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Marcar entregado
            </button>
            <button
              disabled={busy || pedido.estado === "pedido_cancelado"}
              onClick={onCancelar}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-800 text-white px-3 py-2 text-sm font-medium hover:bg-zinc-900 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" /> Cancelar pedido
            </button>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Historial
            </div>
            <ol className="relative border-l border-border ml-2 space-y-3">
              {historial?.map((h: any) => (
                <li key={h.id} className="ml-4">
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                  <div className="text-xs font-medium">
                    {ACCION_LABEL[h.accion as AccionHistorial] || h.accion}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDate(h.created_at)}
                    {h.usuarios?.nombre && ` · ${h.usuarios.nombre}`}
                  </div>
                  {h.descripcion && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">{h.descripcion}</div>
                  )}
                </li>
              ))}
              {!historial?.length && (
                <li className="ml-4 text-xs text-muted-foreground">Sin eventos registrados.</li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

void ESTADOS;
