import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { supabase, storageUrl } from "@/lib/supabase";
import { PageHeader, EmptyState } from "@/components/PanelLayout";
import { Modal } from "@/components/Modal";
import { useAuthStore } from "@/lib/auth";
import { formatMoney, formatDate } from "@/lib/csv";
import { labelTipoEntrega } from "@/lib/tipo-entrega";
import {
  ESTADO_LABEL,
  ESTADO_COLOR,
  type EstadoPedido,
  type AccionHistorial,
  ACCION_LABEL,
} from "@/lib/estados";
import { useRealtimePedidos } from "@/hooks/useRealtimePedidos";

export const Route = createFileRoute("/cajero/historial")({
  component: CajeroHistorial,
});

type Pedido = {
  id: string;
  numero_pedido: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  sede_id: string | null;
  estado: EstadoPedido;
  metodo_pago: string | null;
  tipo_entrega: string | null;
  total: number;
  observaciones: string | null;
  created_at: string;
  updated_at?: string | null;
};

function CajeroHistorial() {
  const { perfil } = useAuthStore();
  const [fecha, setFecha] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [viewing, setViewing] = useState<Pedido | null>(null);

  useRealtimePedidos([
    ["cajero-historial", perfil?.sede_id],
    ["cajero-pedido-items"],
    ["pedido-historial"],
  ]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["cajero-historial", perfil?.sede_id],
    enabled: !!perfil?.sede_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("sede_id", perfil!.sede_id)
        .eq("estado", "pedido_entregado")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });

  // Fechas de entrega: timestamp de la acción pedido_entregado en historial_pedidos.
  const { data: entregaMap = {} as Record<string, string> } = useQuery({
    queryKey: ["cajero-historial-entrega-map", perfil?.sede_id, data.map((p) => p.id).join(",")],
    enabled: !!perfil?.sede_id && data.length > 0,
    queryFn: async () => {
      const ids = data.map((p) => p.id);
      const { data: rows, error } = await supabase
        .from("historial_pedidos")
        .select("pedido_id, created_at, accion")
        .in("pedido_id", ids)
        .eq("accion", "pedido_entregado");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const r of rows || []) {
        // Quedarse con la más reciente.
        if (!map[r.pedido_id] || new Date(r.created_at) > new Date(map[r.pedido_id])) {
          map[r.pedido_id] = r.created_at;
        }
      }
      return map;
    },
  });

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (tipoEntrega && p.tipo_entrega !== tipoEntrega) return false;
      if (metodoPago && p.metodo_pago !== metodoPago) return false;
      if (fecha) {
        const d = new Date(p.created_at).toISOString().slice(0, 10);
        if (d !== fecha) return false;
      }
      return true;
    });
  }, [data, fecha, tipoEntrega, metodoPago]);

  if (!perfil?.sede_id) {
    return <EmptyState title="Sin sede asignada" description="Solicita a un administrador que te asigne una sede." />;
  }

  return (
    <div>
      <PageHeader
        title="Historial de pedidos"
        description="Pedidos entregados de tu sede."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <input
          type="date"
          className="input"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <select
          className="input"
          value={tipoEntrega}
          onChange={(e) => setTipoEntrega(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Recojo en tienda</option>
        </select>
        <select
          className="input"
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
        >
          <option value="">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="yape">Yape</option>
          <option value="plin">Plin</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !filtered.length ? (
        <EmptyState title="Sin pedidos entregados" />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold bg-muted/40">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Cliente</div>
            <div className="col-span-1">Pago</div>
            <div className="col-span-1">Entrega</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-3">Fecha pedido</div>
            <div className="col-span-2">Fecha entrega</div>
            <div className="col-span-1 text-right">Acción</div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((p) => {
              const entrega = entregaMap[p.id];
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-2 md:grid-cols-12 gap-2 px-3 py-2.5 text-sm items-center"
                >
                  <div className="md:col-span-1 font-mono text-xs">#{p.numero_pedido}</div>
                  <div className="md:col-span-2 truncate">{p.cliente_nombre}</div>
                  <div className="md:col-span-1 text-xs capitalize text-muted-foreground">
                    {p.metodo_pago || "—"}
                  </div>
                  <div className="md:col-span-1 text-xs capitalize text-muted-foreground">
                    {labelTipoEntrega(p.tipo_entrega)}
                  </div>
                  <div className="md:col-span-1 font-semibold">{formatMoney(p.total)}</div>
                  <div className="md:col-span-3 text-xs text-muted-foreground">
                    {formatDate(p.created_at)}
                  </div>
                  <div className="md:col-span-2 text-xs text-muted-foreground">
                    {entrega ? formatDate(entrega) : "—"}
                  </div>
                  <div className="md:col-span-1 md:text-right col-span-2">
                    <button
                      onClick={() => setViewing(p)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver detalle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewing && <PedidoDetalleModal pedido={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function PedidoDetalleModal({ pedido, onClose }: { pedido: Pedido; onClose: () => void }) {
  const { data: items } = useQuery({
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

  return (
    <Modal open onClose={onClose} title={`Pedido #${pedido.numero_pedido}`} size="xl">
      <div className="grid lg:grid-cols-3 gap-5 text-sm">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs ${ESTADO_COLOR[pedido.estado]}`}
            >
              {ESTADO_LABEL[pedido.estado]}
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(pedido.created_at)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info label="Cliente" value={pedido.cliente_nombre} />
            <Info label="Teléfono" value={pedido.cliente_telefono ?? "—"} />
            <Info label="Método pago" value={pedido.metodo_pago ?? "—"} />
            <Info label="Tipo entrega" value={labelTipoEntrega(pedido.tipo_entrega)} />
          </div>

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
                  <div className="font-semibold">{formatMoney(Number(d.total))}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-border mt-3 pt-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatMoney(pedido.total)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Historial
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
              <li className="ml-4 text-xs text-muted-foreground">Sin eventos.</li>
            )}
          </ol>
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
