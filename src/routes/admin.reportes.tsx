import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PanelLayout";
import { formatMoney, formatDate } from "@/lib/csv";
import { labelTipoEntrega } from "@/lib/tipo-entrega";
import { downloadXlsx } from "@/lib/xlsx-export";
import { ESTADOS, ESTADO_LABEL, type EstadoPedido } from "@/lib/estados";

export const Route = createFileRoute("/admin/reportes")({
  component: ReportesPage,
});

type PedidoRich = {
  id: string;
  numero_pedido: number;
  total: number;
  sede_id: string | null;
  estado: EstadoPedido;
  metodo_pago: string | null;
  tipo_entrega: string | null;
  cliente_nombre: string;
  cliente_telefono: string | null;
  created_at: string;
  fecha_entrega: string | null;
  detalle_pedidos: {
    cantidad: number;
    precio_venta: number;
    total: number;
    producto_id: string;
    productos?: { nombre: string | null; precio_costo: number | null } | null;
  }[];
};

function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const [desde, setDesde] = useState(monthAgo);
  const [hasta, setHasta] = useState(today);
  const [sedeId, setSedeId] = useState("");
  const [estado, setEstado] = useState<"" | EstadoPedido>("");
  const [metodoPago, setMetodoPago] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState("");

  const { data: sedes = [] } = useQuery({
    queryKey: ["rep-sedes"],
    queryFn: async () => (await supabase.from("sedes").select("id,nombre")).data || [],
  });

  const queryKey = ["reportes", desde, hasta, sedeId, estado, metodoPago, tipoEntrega];
  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from("pedidos")
        .select("id,numero_pedido,total,sede_id,estado,metodo_pago,tipo_entrega,cliente_nombre,cliente_telefono,created_at,fecha_entrega,detalle_pedidos(cantidad,precio_venta,total,producto_id,productos(nombre,precio_costo))")
        .gte("created_at", desde + "T00:00:00")
        .lte("created_at", hasta + "T23:59:59")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (sedeId) q = q.eq("sede_id", sedeId);
      if (estado) q = q.eq("estado", estado);
      if (metodoPago) q = q.eq("metodo_pago", metodoPago);
      if (tipoEntrega) q = q.eq("tipo_entrega", tipoEntrega);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as PedidoRich[];
    },
  });

  const enriched = useMemo(() => {
    return data.map((p) => {
      const utilidad = (p.detalle_pedidos || []).reduce((s, d) => {
        const costo = Number(d.productos?.precio_costo ?? 0);
        return s + (Number(d.precio_venta) - costo) * Number(d.cantidad);
      }, 0);
      const productosStr = (p.detalle_pedidos || [])
        .map((d) => `${d.cantidad}x ${d.productos?.nombre ?? d.producto_id}`)
        .join(" | ");
      return { ...p, _utilidad: utilidad, _productosStr: productosStr };
    });
  }, [data]);

  const totals = useMemo(() => {
    let ventas = 0, utilidad = 0;
    for (const p of enriched) {
      ventas += Number(p.total || 0);
      utilidad += p._utilidad;
    }
    return { ventas, utilidad, cantidad: enriched.length, ticket: enriched.length ? ventas / enriched.length : 0 };
  }, [enriched]);

  const sedeNombre = (id: string | null) => sedes.find((s) => s.id === id)?.nombre || "Sin sede";

  function descargarPedidos() {
    if (!enriched.length) return toast.error("No hay pedidos para exportar");
    const rows = enriched.map((p) => ({
      "Fecha pedido": formatDate(p.created_at),
      "ID pedido": p.numero_pedido,
      Cliente: p.cliente_nombre,
      Teléfono: p.cliente_telefono ?? "",
      Sede: sedeNombre(p.sede_id),
      Estado: ESTADO_LABEL[p.estado] ?? p.estado,
      "Método pago": p.metodo_pago ?? "",
      "Tipo entrega": labelTipoEntrega(p.tipo_entrega),
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
      const cur = map.get(key) || { sede: sedeNombre(p.sede_id), pedidos: 0, ventas: 0, utilidad: 0 };
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

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Filtra y descarga reportes de pedidos en Excel."
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

      <div className="rounded-xl border border-border bg-card p-4 mb-4 grid grid-cols-2 lg:grid-cols-6 gap-3">
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Desde</span>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input" />
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Hasta</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input" />
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Estado</span>
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value as EstadoPedido | "")}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Sede</span>
          <select className="input" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
            <option value="">Todas</option>
            {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Método de pago</span>
          <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Tipo de entrega</span>
          <select className="input" value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
            <option value="">Todos</option>
            <option value="domicilio">Domicilio</option>
            <option value="recoger">Recoger en sede</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <Card label="Pedidos" value={isLoading ? "—" : totals.cantidad} />
        <Card label="Ventas totales" value={formatMoney(totals.ventas)} />
        <Card label="Utilidad estimada" value={formatMoney(totals.utilidad)} />
        <Card label="Ticket promedio" value={formatMoney(totals.ticket)} />
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Las descargas respetan los filtros activos.
      </p>
    </div>
  );
}

function Card({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
