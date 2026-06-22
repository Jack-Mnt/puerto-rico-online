import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Download, Eye, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PageHeader, EmptyState } from "@/components/PanelLayout";
import { Modal } from "@/components/Modal";
import { formatMoney, formatDate } from "@/lib/csv";
import { downloadXlsx } from "@/lib/xlsx-export";
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
  created_at: string;
  fecha_entrega: string | null;
  motivo_rechazo?: string | null;
  nota_rechazo?: string | null;
  detalle_pedidos: {
    id: string;
    cantidad: number;
    precio_unitario: number;
    producto_id: string;
    productos?: { nombre: string | null; precio_costo: number | null } | null;
  }[];
};

function AdminPedidos() {
  const qc = useQueryClient();
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
        .select("*, detalle_pedidos(*, productos(nombre, precio_costo))")
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

  const enriched = useMemo(() => {
    return filtered.map((p) => {
      const utilidad = (p.detalle_pedidos || []).reduce((s, d) => {
        const costo = Number(d.productos?.precio_costo ?? 0);
        const precio = Number(d.precio_unitario ?? 0);
        const cant = Number(d.cantidad ?? 0);
        return s + (precio - costo) * cant;
      }, 0);
      const productosStr = (p.detalle_pedidos || [])
        .map((d) => `${d.cantidad}x ${d.productos?.nombre ?? d.producto_id}`)
        .join(" | ");
      return { ...p, _utilidad: utilidad, _productosStr: productosStr };
    });
  }, [filtered]);

  const sedeNombre = (id: string | null) => sedes.find((s) => s.id === id)?.nombre || "";

  function descargarPedidos() {
    if (!enriched.length) return toast.error("No hay pedidos para exportar");
    const rows = enriched.map((p) => ({
      "Fecha pedido": formatDate(p.created_at),
      "ID pedido": p.id,
      Cliente: p.cliente_nombre,
      Teléfono: p.cliente_telefono ?? "",
      Sede: sedeNombre(p.sede_id),
      Estado: ESTADO_LABEL[p.estado] ?? p.estado,
      "Método pago": p.metodo_pago ?? "",
      "Tipo entrega": p.tipo_entrega ?? "",
      Total: Number(p.total ?? 0),
      Productos: p._productosStr,
      "Utilidad estimada": Number(p._utilidad.toFixed(2)),
      "Fecha entrega": p.fecha_entrega ? formatDate(p.fecha_entrega) : "",
    }));
    downloadXlsx(`pedidos-${desde}-a-${hasta}.xlsx`, "Pedidos", rows);
  }

  function descargarResumen() {
    if (!enriched.length) return toast.error("No hay datos para exportar");
    const map = new Map<string, { sede: string; pedidos: number; ventas: number; utilidad: number }>();
    enriched.forEach((p) => {
      const key = p.sede_id || "sin-sede";
      const cur = map.get(key) || {
        sede: sedeNombre(p.sede_id) || "Sin sede",
        pedidos: 0,
        ventas: 0,
        utilidad: 0,
      };
      cur.pedidos += 1;
      cur.ventas += Number(p.total ?? 0);
      cur.utilidad += p._utilidad;
      map.set(key, cur);
    });
    const rows = Array.from(map.values()).map((r) => ({
      Sede: r.sede,
      "Cantidad de pedidos": r.pedidos,
      "Ventas totales": Number(r.ventas.toFixed(2)),
      "Utilidad estimada": Number(r.utilidad.toFixed(2)),
      "Ticket promedio": Number((r.pedidos ? r.ventas / r.pedidos : 0).toFixed(2)),
    }));
    downloadXlsx(`resumen-${desde}-a-${hasta}.xlsx`, "Resumen", rows);
  }

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoPedido }) => {
      const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
      if (error) throw error;
      await supabase.from("historial_pedidos").insert({
        pedido_id: id,
        accion: estado,
        descripcion: "Cambio manual desde admin",
      });
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Lista completa, filtrable y exportable a Excel."
        action={
          <div className="flex gap-2">
            <button
              onClick={descargarPedidos}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> Descargar Pedidos
            </button>
            <button
              onClick={descargarResumen}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <FileSpreadsheet className="h-4 w-4" /> Descargar Resumen
            </button>
          </div>
        }
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
      ) : !enriched.length ? (
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
                <th className="p-3">Entrega</th>
                <th className="p-3">Total</th>
                <th className="p-3">Utilidad</th>
                <th className="p-3">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {enriched.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{formatDate(p.created_at)}</td>
                  <td className="p-3 font-mono text-xs">#{p.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <div className="font-medium">{p.cliente_nombre}</div>
                    <div className="text-xs text-muted-foreground">{p.cliente_telefono}</div>
                  </td>
                  <td className="p-3">{sedeNombre(p.sede_id) || "—"}</td>
                  <td className="p-3 capitalize">{p.tipo_entrega}</td>
                  <td className="p-3 font-semibold">{formatMoney(p.total)}</td>
                  <td className="p-3">{formatMoney(p._utilidad)}</td>
                  <td className="p-3">
                    <select
                      value={p.estado}
                      onChange={(e) =>
                        cambiarEstado.mutate({ id: p.id, estado: e.target.value as EstadoPedido })
                      }
                      className={`rounded-full border px-2 py-1 text-xs ${ESTADO_COLOR[p.estado]}`}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
                      ))}
                    </select>
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
              <Info label="Estado" value={ESTADO_LABEL[viewing.estado]} />
              <Info label="Método pago" value={viewing.metodo_pago ?? "—"} />
              <Info label="Tipo entrega" value={viewing.tipo_entrega ?? "—"} />
            </div>
            {viewing.direccion && <Info label="Dirección" value={viewing.direccion} />}
            <div className="border-t border-border pt-3">
              <div className="font-semibold mb-2">Productos</div>
              <ul className="text-sm space-y-1">
                {viewing.detalle_pedidos?.map((d) => (
                  <li key={d.id} className="flex justify-between">
                    <span>
                      {d.cantidad} × {d.productos?.nombre ?? d.producto_id}
                    </span>
                    <span className="font-medium">
                      {formatMoney(Number(d.cantidad) * Number(d.precio_unitario))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatMoney(viewing.total)}</span>
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
