import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader, EmptyState } from "@/components/PanelLayout";
import { Modal } from "@/components/Modal";
import { formatMoney, formatDate } from "@/lib/csv";
import {
  ESTADOS,
  ESTADO_LABEL,
  ESTADO_COLOR,
  type EstadoPedido,
} from "@/lib/estados";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminPedidos,
});

type PedidoRow = {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  direccion: string | null;
  sede_id: string | null;
  estado: EstadoPedido;
  metodo_pago: string | null;
  tipo_entrega: string | null;
  total: number;
  observaciones: string | null;
  created_at: string;
  fecha_entrega: string | null;
  detalle_pedidos: {
    id: string;
    cantidad: number;
    precio_venta: number;
    subtotal: number;
    producto_id: string;
    productos?: { nombre: string | null } | null;
  }[];
};

type HistorialRow = {
  id: string;
  accion: string;
  descripcion: string | null;
  created_at: string;
  usuario_id: string | null;
  sede_anterior: string | null;
  sede_nueva: string | null;
};

function AdminPedidos() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [desde, setDesde] = useState(monthAgo);
  const [hasta, setHasta] = useState(today);
  const [sedeId, setSedeId] = useState("");
  const [estado, setEstado] = useState<"" | EstadoPedido>("");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<PedidoRow | null>(null);

  const { data: sedes = [] } = useQuery({
    queryKey: ["sedes-options"],
    queryFn: async () => (await supabase.from("sedes").select("id,nombre")).data || [],
  });

  const queryKey = ["admin-pedidos", desde, hasta, sedeId, estado];
  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let req = supabase
        .from("pedidos")
        .select("*, detalle_pedidos(*, productos(nombre))")
        .gte("created_at", desde + "T00:00:00")
        .lte("created_at", hasta + "T23:59:59")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (sedeId) req = req.eq("sede_id", sedeId);
      if (estado) req = req.eq("estado", estado);
      const { data, error } = await req;
      if (error) throw error;
      return (data || []) as PedidoRow[];
    },
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return data;
    return data.filter(
      (p) =>
        p.id.toLowerCase().includes(s) ||
        p.cliente_nombre?.toLowerCase().includes(s) ||
        (p.cliente_telefono || "").toLowerCase().includes(s),
    );
  }, [data, q]);

  const sedeNombre = (id: string | null) => sedes.find((s) => s.id === id)?.nombre || "";

  const { data: historial = [] } = useQuery({
    queryKey: ["historial", viewing?.id],
    enabled: !!viewing,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_pedidos")
        .select("*")
        .eq("pedido_id", viewing!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as HistorialRow[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Supervisión de pedidos: detalle, estado, cliente, sede e historial."
      />

      <div className="rounded-xl border border-border bg-card p-4 mb-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Desde</span>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input" />
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Hasta</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input" />
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Sede</span>
          <select className="input" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
            <option value="">Todas</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Estado</span>
          <select
            className="input"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoPedido | "")}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Buscar</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ID, cliente, teléfono…"
            className="input"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !filtered.length ? (
        <EmptyState title="Sin pedidos" description="No hay pedidos en este rango / filtros." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">ID</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Sede</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{formatDate(p.created_at)}</td>
                  <td className="p-3 font-mono text-xs">#{p.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <div className="font-medium">{p.cliente_nombre}</div>
                    <div className="text-xs text-muted-foreground">{p.cliente_telefono}</div>
                  </td>
                  <td className="p-3">{sedeNombre(p.sede_id) || "—"}</td>
                  <td className="p-3 font-semibold">{formatMoney(p.total)}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded-full border px-2 py-1 text-xs ${ESTADO_COLOR[p.estado]}`}>
                      {ESTADO_LABEL[p.estado]}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => setViewing(p)} className="p-1.5 hover:bg-muted rounded">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`Pedido #${viewing.id.slice(0, 8)}`} size="lg">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Cliente" value={viewing.cliente_nombre} />
              <Info label="Teléfono" value={viewing.cliente_telefono ?? "—"} />
              <Info label="Sede" value={sedeNombre(viewing.sede_id) || "—"} />
              <Info label="Estado" value={
                <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${ESTADO_COLOR[viewing.estado]}`}>
                  {ESTADO_LABEL[viewing.estado]}
                </span>
              } />
              <Info label="Método pago" value={viewing.metodo_pago ?? "—"} />
              <Info label="Tipo entrega" value={viewing.tipo_entrega ?? "—"} />
            </div>
            {viewing.direccion && <Info label="Dirección" value={viewing.direccion} />}
            {viewing.observaciones && <Info label="Observaciones" value={viewing.observaciones} />}

            <div className="border-t border-border pt-3">
              <div className="font-semibold mb-2">Productos</div>
              <ul className="text-sm space-y-1">
                {viewing.detalle_pedidos?.map((d) => (
                  <li key={d.id} className="flex justify-between">
                    <span>
                      {d.cantidad} × {d.productos?.nombre ?? d.producto_id}
                    </span>
                    <span className="font-medium">
                      {formatMoney(Number(d.subtotal))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatMoney(viewing.total)}</span>
            </div>

            <div className="border-t border-border pt-3">
              <div className="font-semibold mb-2">Historial</div>
              {!historial.length ? (
                <div className="text-xs text-muted-foreground">Sin eventos.</div>
              ) : (
                <ul className="space-y-2">
                  {historial.map((h) => (
                    <li key={h.id} className="text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">{ESTADO_LABEL[h.accion as EstadoPedido] ?? h.accion}</span>
                        <span className="text-muted-foreground">{formatDate(h.created_at)}</span>
                      </div>
                      {h.descripcion && <div className="text-muted-foreground">{h.descripcion}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
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
