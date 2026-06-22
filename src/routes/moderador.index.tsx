import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, MessageCircle, Repeat, Ban, CheckCircle2 } from "lucide-react";
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

export const Route = createFileRoute("/moderador/")({
  component: ModeradorKanban,
});

type Pedido = {
  id: string;
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
  motivo_rechazo?: string | null;
  nota_rechazo?: string | null;
};

const COLUMNAS: EstadoPedido[] = [
  "pedido_creado",
  "pedido_aceptado",
  "pedido_rechazado",
  "pedido_despachado",
  "pedido_entregado",
];

const COLUMNA_TITLE: Record<EstadoPedido, string> = {
  pedido_creado: "Nuevos",
  pedido_aceptado: "Aceptados",
  pedido_rechazado: "Rechazados",
  pedido_despachado: "Despachados",
  pedido_entregado: "Entregados",
  pedido_cancelado: "Cancelados",
};

function ModeradorKanban() {
  const qc = useQueryClient();
  const { perfil } = useAuthStore();
  const [viewing, setViewing] = useState<Pedido | null>(null);

  const { data: sedes = [] } = useQuery({
    queryKey: ["sedes-options"],
    queryFn: async () => (await supabase.from("sedes").select("id,nombre")).data || [],
  });

  const queryKey = ["mod-pedidos"];
  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .in("estado", COLUMNAS)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });

  async function logHistorial(args: {
    pedido_id: string;
    accion: AccionHistorial;
    descripcion?: string | null;
    sede_anterior?: string | null;
    sede_nueva?: string | null;
  }) {
    const { error } = await supabase.from("historial_pedidos").insert({
      pedido_id: args.pedido_id,
      usuario_id: perfil?.id,
      accion: args.accion,
      descripcion: args.descripcion ?? null,
      sede_anterior: args.sede_anterior ?? null,
      sede_nueva: args.sede_nueva ?? null,
    });
    if (error) console.warn("[historial]", error.message);
  }

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoPedido }) => {
      const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
      if (error) throw error;
      await logHistorial({ pedido_id: id, accion: estado });
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["pedido-historial"] });
      setViewing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const reasignar = useMutation({
    mutationFn: async ({ p, nuevaSede }: { p: Pedido; nuevaSede: string }) => {
      const sede_anterior = p.sede_id;
      const { error } = await supabase
        .from("pedidos")
        .update({ sede_id: nuevaSede })
        .eq("id", p.id);
      if (error) throw error;
      const nombre_ant = sedes.find((s) => s.id === sede_anterior)?.nombre || "Sin sede";
      const nombre_nuev = sedes.find((s) => s.id === nuevaSede)?.nombre || "—";
      await logHistorial({
        pedido_id: p.id,
        accion: "pedido_reasignado",
        descripcion: `${nombre_ant} → ${nombre_nuev}`,
        sede_anterior,
        sede_nueva: nuevaSede,
      });
    },
    onSuccess: () => {
      toast.success("Sede reasignada");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["pedido-historial"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const grupos = COLUMNAS.map((e) => ({
    estado: e,
    items: data.filter((p) => p.estado === e),
  }));

  return (
    <div>
      <PageHeader
        title="Centro de operaciones"
        description="Vista logística de todos los pedidos en curso."
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !data.length ? (
        <EmptyState title="Sin pedidos" />
      ) : (
        <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 pb-2">
          <div className="grid grid-flow-col auto-cols-[280px] gap-3 min-w-min">
            {grupos.map((g) => (
              <div key={g.estado} className="rounded-xl border border-border bg-card flex flex-col">
                <div className="px-3 py-2.5 border-b border-border flex items-center justify-between sticky top-0 bg-card rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${ESTADO_COLOR[g.estado].split(" ")[0]}`} />
                    <h3 className="font-semibold text-sm">{COLUMNA_TITLE[g.estado]}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{g.items.length}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                  {g.items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setViewing(p)}
                      className="w-full text-left p-3 rounded-lg border border-border bg-background hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">#{p.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(p.created_at)}</span>
                      </div>
                      <div className="font-medium mt-1 truncate text-sm">{p.cliente_nombre}</div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {sedes.find((s) => s.id === p.sede_id)?.nombre || "Sin sede"}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] capitalize text-muted-foreground">{p.tipo_entrega}</span>
                        <span className="font-semibold text-sm">{formatMoney(p.total)}</span>
                      </div>
                    </button>
                  ))}
                  {g.items.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center py-6">—</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewing && (
        <PedidoModeradorModal
          pedido={viewing}
          sedes={sedes}
          onClose={() => setViewing(null)}
          onCancelar={() => cambiarEstado.mutate({ id: viewing.id, estado: "pedido_cancelado" })}
          onEntregado={() => cambiarEstado.mutate({ id: viewing.id, estado: "pedido_entregado" })}
          onReasignar={(nuevaSede) => reasignar.mutate({ p: viewing, nuevaSede })}
          busy={cambiarEstado.isPending || reasignar.isPending}
        />
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
        `Hola ${pedido.cliente_nombre}, te escribo de Puerto Rico sobre tu pedido #${pedido.id.slice(0, 8)}.`,
      )}`
    : null;

  return (
    <Modal open onClose={onClose} title={`Pedido #${pedido.id.slice(0, 8)}`} size="xl">
      <div className="grid lg:grid-cols-3 gap-5 text-sm">
        {/* IZQUIERDA: cliente + productos */}
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
          {pedido.motivo_rechazo && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-800 text-xs">
              <div className="font-semibold mb-0.5">Motivo de rechazo</div>
              <div>{pedido.motivo_rechazo}</div>
              {pedido.nota_rechazo && <div className="mt-1 italic">{pedido.nota_rechazo}</div>}
            </div>
          )}

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
                  <div className="font-semibold">
                    {formatMoney(Number(d.subtotal))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-border mt-3 pt-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatMoney(pedido.total)}</span>
            </div>
          </div>
        </div>

        {/* DERECHA: acciones + timeline */}
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

// reference unused symbol so eslint doesn't whine
void ESTADOS;
