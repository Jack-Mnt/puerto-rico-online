import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Truck, PackageCheck } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase, storageUrl } from "@/lib/supabase";
import { PageHeader, EmptyState } from "@/components/PanelLayout";
import { Modal } from "@/components/Modal";
import { useAuthStore } from "@/lib/auth";
import { formatMoney, formatDate } from "@/lib/csv";
import {
  ESTADO_LABEL,
  ESTADO_COLOR,
  MOTIVOS_RECHAZO,
  type EstadoPedido,
  type MotivoRechazo,
} from "@/lib/estados";
import { useRealtimePedidos } from "@/hooks/useRealtimePedidos";
import { useNuevoPedidoNotifier } from "@/hooks/useNuevoPedidoNotifier";
import { NotifToggle } from "@/components/NotifToggle";
import { NotifSystemToggle } from "@/components/NotifSystemToggle";

export const Route = createFileRoute("/cajero/")({
  component: CajeroPanel,
});

type Pedido = {
  id: string;
  numero_pedido: number;
  cliente_nombre: string;
  sede_id: string | null;
  estado: EstadoPedido;
  metodo_pago: string | null;
  tipo_entrega: string | null;
  total: number;
  observaciones: string | null;
  created_at: string;
};

const VISIBLES: EstadoPedido[] = ["pedido_creado", "pedido_aceptado", "pedido_despachado"];

type Variant = "creado" | "aceptado" | "despachado";

const COLUMNAS: { key: Variant; title: string; estados: EstadoPedido[] }[] = [
  { key: "creado", title: "Nuevos", estados: ["pedido_creado"] },
  { key: "aceptado", title: "Aceptados", estados: ["pedido_aceptado"] },
  { key: "despachado", title: "Despachados", estados: ["pedido_despachado"] },
];

const VARIANT_STYLES: Record<Variant, { bg: string; border: string }> = {
  creado: { bg: "#FFF7D6", border: "#FACC15" },
  aceptado: { bg: "#EAF8EF", border: "#22C55E" },
  despachado: { bg: "#EAF2FF", border: "#3B82F6" },
};

function formatHora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function CajeroPanel() {
  const { perfil } = useAuthStore();
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<Pedido | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const queryKey = ["cajero-pedidos", perfil?.sede_id];
  useRealtimePedidos([queryKey, ["pedido-historial"], ["cajero-pedido-items"], ["cajero-historial", perfil?.sede_id]]);
  useNuevoPedidoNotifier({ variant: "cajero", sedeFilterId: perfil?.sede_id ?? null });
  const { data = [], isLoading } = useQuery({
    queryKey,
    enabled: !!perfil?.sede_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("sede_id", perfil!.sede_id)
        .in("estado", VISIBLES)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoPedido }) => {
      const fn =
        estado === "pedido_aceptado"
          ? "aceptar_pedido"
          : estado === "pedido_despachado"
          ? "despachar_pedido"
          : null;
      if (!fn) throw new Error(`Estado no soportado: ${estado}`);
      const { error } = await supabase.rpc(fn, { p_pedido_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey });
      setViewing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const rechazar = useMutation({
    mutationFn: async ({ id, observaciones }: { id: string; observaciones: string }) => {
      const { error } = await supabase.rpc("rechazar_pedido", {
        p_pedido_id: id,
        p_observaciones: observaciones,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido rechazado");
      qc.invalidateQueries({ queryKey });
      setRejectingId(null);
      setViewing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const grupos = COLUMNAS.map((c) => ({
    ...c,
    items: data.filter((p) => c.estados.includes(p.estado)),
  }));

  if (!perfil?.sede_id) {
    return <EmptyState title="Sin sede asignada" description="Solicita a un administrador que te asigne una sede." />;
  }

  return (
    <div>
      <PageHeader
        title="Pedidos de mi sede"
        description="Acepta, despacha o rechaza los pedidos asignados a tu sede."
        action={<div className="flex items-center gap-2"><NotifSystemToggle /><NotifToggle /></div>}
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !data.length ? (
        <EmptyState title="Sin pedidos" description="Cuando lleguen pedidos a tu sede aparecerán aquí." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {grupos.map((g) => (
            <div key={g.key} className="rounded-xl border border-border bg-card flex flex-col">
              <div className="px-3 py-2.5 border-b border-border flex items-center justify-between rounded-t-xl">
                <h3 className="font-semibold text-sm">{g.title}</h3>
                <span className="text-xs text-muted-foreground">{g.items.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[78vh] overflow-y-auto">
                {g.items.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-6">—</p>
                )}
                {g.items.map((p) => (
                  <PedidoCard
                    key={p.id}
                    pedido={p}
                    variant={g.key}
                    onOpen={() => setViewing(p)}
                    onDespachar={
                      g.key === "aceptado"
                        ? () => cambiarEstado.mutate({ id: p.id, estado: "pedido_despachado" })
                        : undefined
                    }
                    busy={cambiarEstado.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <PedidoCajeroModal
          pedido={viewing}
          onClose={() => setViewing(null)}
          onAceptar={() => cambiarEstado.mutate({ id: viewing.id, estado: "pedido_aceptado" })}
          onDespachar={() => cambiarEstado.mutate({ id: viewing.id, estado: "pedido_despachado" })}
          onRechazar={() => setRejectingId(viewing.id)}
          busy={cambiarEstado.isPending}
        />
      )}

      {rejectingId && (
        <RechazoModal
          onClose={() => setRejectingId(null)}
          onSubmit={(observaciones) => rechazar.mutate({ id: rejectingId, observaciones })}
          busy={rechazar.isPending}
        />
      )}
    </div>
  );
}

function PedidoCard({
  pedido,
  variant,
  onOpen,
  onDespachar,
  busy,
}: {
  pedido: Pedido;
  variant: Variant;
  onOpen: () => void;
  onDespachar?: () => void;
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
          <div className="text-sm text-foreground font-medium truncate text-right capitalize">
            {pedido.metodo_pago || "—"}
          </div>
          <div className="text-sm text-foreground font-medium truncate capitalize">
            {pedido.tipo_entrega || "—"}
          </div>
          <div className="text-sm text-foreground font-medium truncate text-right">
            {formatMoney(pedido.total)}
          </div>
        </div>
      </button>
      {onDespachar && (
        <button
          disabled={busy}
          onClick={onDespachar}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 text-white px-2 py-1.5 text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <PackageCheck className="h-3.5 w-3.5" /> Marcar despachado
        </button>
      )}
    </div>
  );
}

function PedidoCajeroModal({
  pedido,
  onClose,
  onAceptar,
  onDespachar,
  onRechazar,
  busy,
}: {
  pedido: Pedido;
  onClose: () => void;
  onAceptar: () => void;
  onDespachar: () => void;
  onRechazar: () => void;
  busy: boolean;
}) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["cajero-pedido-items", pedido.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detalle_pedidos")
        .select("*, productos(nombre, imagen)")
        .eq("pedido_id", pedido.id);
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <Modal open onClose={onClose} title={`Pedido #${pedido.numero_pedido}`} size="lg">
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${ESTADO_COLOR[pedido.estado]}`}>
            {ESTADO_LABEL[pedido.estado]}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(pedido.created_at)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Info label="Cliente" value={pedido.cliente_nombre} />
          <Info label="Método pago" value={pedido.metodo_pago ?? "—"} />
          <Info label="Tipo entrega" value={pedido.tipo_entrega ?? "—"} />
        </div>
        {pedido.observaciones && (
          <div className="p-2 border border-border rounded bg-muted/30">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Observaciones</div>
            <div className="text-sm whitespace-pre-wrap">{pedido.observaciones}</div>
          </div>
        )}

        <div>
          <div className="font-semibold mb-2">Productos</div>
          {isLoading ? (
            <p className="text-muted-foreground text-xs">Cargando...</p>
          ) : (
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
                  <div className="font-semibold">{formatMoney(Number(d.total))}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center border-t border-border pt-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{formatMoney(pedido.total)}</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {pedido.estado === "pedido_creado" && (
            <>
              <button
                disabled={busy}
                onClick={onAceptar}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Aceptar
              </button>
              <button
                disabled={busy}
                onClick={onRechazar}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Rechazar
              </button>
            </>
          )}
          {pedido.estado === "pedido_aceptado" && (
            <button
              disabled={busy}
              onClick={onDespachar}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <Truck className="h-4 w-4" /> Marcar despachado
            </button>
          )}
          {pedido.estado === "pedido_despachado" && (
            <p className="text-xs text-muted-foreground">Pedido despachado. Esperando entrega del moderador.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function RechazoModal({
  onClose,
  onSubmit,
  busy,
}: {
  onClose: () => void;
  onSubmit: (observaciones: string) => void;
  busy: boolean;
}) {
  const [motivo, setMotivo] = useState<MotivoRechazo>(MOTIVOS_RECHAZO[0]);
  const [nota, setNota] = useState("");
  const requiereNota = motivo === "Algunos productos sin stock";
  const observaciones = requiereNota ? nota.trim() : motivo;

  return (
    <Modal open onClose={onClose} title="Rechazar pedido" size="md">
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          {MOTIVOS_RECHAZO.map((m) => (
            <label
              key={m}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                motivo === m ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="motivo"
                checked={motivo === m}
                onChange={() => setMotivo(m)}
                className="mt-0.5"
              />
              <span>{m}</span>
            </label>
          ))}
        </div>

        {requiereNota && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Indica qué productos no hay en stock (obligatorio)
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              placeholder="Ej: No hay Corona 355ml ni Johnnie Walker Red"
              className="input w-full"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            disabled={busy || (requiereNota && !nota.trim())}
            onClick={() => onSubmit(observaciones)}
            className="rounded-md bg-rose-600 text-white px-4 py-2 text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
          >
            Confirmar rechazo
          </button>
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
