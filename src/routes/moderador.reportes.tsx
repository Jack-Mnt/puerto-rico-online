import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PanelLayout";
import { downloadCsv, formatMoney, formatDate } from "@/lib/csv";

export const Route = createFileRoute("/moderador/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const [desde, setDesde] = useState(monthAgo);
  const [hasta, setHasta] = useState(today);
  const [sedeId, setSedeId] = useState("");
  const [estado, setEstado] = useState("");

  const { data: sedes } = useQuery({
    queryKey: ["reportes-sedes"],
    queryFn: async () => (await supabase.from("sedes").select("id,nombre")).data || [],
  });

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["reportes-pedidos", desde, hasta, sedeId, estado],
    queryFn: async () => {
      let q = supabase
        .from("pedidos")
        .select("*, detalle_pedidos(*, productos(nombre, precio_costo))")
        .gte("created_at", desde + "T00:00:00")
        .lte("created_at", hasta + "T23:59:59")
        .order("created_at", { ascending: false });
      if (sedeId) q = q.eq("sede_id", sedeId);
      if (estado) q = q.eq("estado", estado);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

  const enriched = useMemo(() => {
    return (pedidos || []).map((p) => {
      const utilidad = (p.detalle_pedidos || []).reduce((s: number, d: any) => {
        const costo = Number(d.productos?.precio_costo ?? 0);
        const precio = Number(d.precio_unitario ?? 0);
        const cant = Number(d.cantidad ?? 0);
        return s + (precio - costo) * cant;
      }, 0);
      const productos = (p.detalle_pedidos || [])
        .map((d: any) => `${d.cantidad}x ${d.productos?.nombre ?? d.producto_id}`)
        .join(" | ");
      return { ...p, _utilidad: utilidad, _productos: productos };
    });
  }, [pedidos]);

  const totals = useMemo(() => {
    const ventas = enriched.reduce((s, p) => s + Number(p.total || 0), 0);
    const utilidad = enriched.reduce((s, p) => s + p._utilidad, 0);
    const cantidad = enriched.length;
    return { ventas, utilidad, cantidad, ticket: cantidad ? ventas / cantidad : 0 };
  }, [enriched]);

  const porSede = useMemo(() => {
    const map = new Map<string, { sede: string; pedidos: number; ventas: number; utilidad: number }>();
    enriched.forEach((p) => {
      const key = p.sede_id || "sin-sede";
      const nombre = sedes?.find((s) => s.id === p.sede_id)?.nombre || "Sin sede";
      const cur = map.get(key) || { sede: nombre, pedidos: 0, ventas: 0, utilidad: 0 };
      cur.pedidos += 1;
      cur.ventas += Number(p.total || 0);
      cur.utilidad += p._utilidad;
      map.set(key, cur);
    });
    return Array.from(map.values()).map((r) => ({
      ...r,
      ticket: r.pedidos ? r.ventas / r.pedidos : 0,
    }));
  }, [enriched, sedes]);

  function downloadResumen() {
    const rows = enriched.map((p) => ({
      fecha_pedido: formatDate(p.created_at),
      id_pedido: p.id,
      cliente: p.cliente_nombre,
      telefono: p.cliente_telefono,
      sede: sedes?.find((s) => s.id === p.sede_id)?.nombre || "",
      estado: p.estado,
      metodo_pago: p.metodo_pago,
      tipo_entrega: p.tipo_entrega,
      total: p.total,
      productos: p._productos,
      utilidad_estimada: p._utilidad.toFixed(2),
      fecha_entrega: p.fecha_entrega ? formatDate(p.fecha_entrega) : "",
    }));
    downloadCsv(`resumen-${desde}-${hasta}.csv`, rows);
  }

  function downloadPorSede() {
    downloadCsv(
      `por-sede-${desde}-${hasta}.csv`,
      porSede.map((s) => ({
        sede: s.sede,
        cantidad_de_pedidos: s.pedidos,
        ventas_totales: s.ventas.toFixed(2),
        utilidad_estimada: s.utilidad.toFixed(2),
        ticket_promedio: s.ticket.toFixed(2),
      }))
    );
  }

  return (
    <div>
      <PageHeader title="Reportes" description="Métricas de ventas, utilidad y rendimiento por sede" />

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
            {sedes?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Estado</span>
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="en_preparacion">En preparación</option>
            <option value="listo">Listo</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button onClick={downloadResumen} className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm flex items-center gap-1">
            <Download className="h-4 w-4" /> Resumen
          </button>
          <button onClick={downloadPorSede} className="rounded-md border border-border px-3 py-2 text-sm flex items-center gap-1">
            <Download className="h-4 w-4" /> Por sede
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Pedidos" value={totals.cantidad} />
        <Card label="Ventas totales" value={formatMoney(totals.ventas)} />
        <Card label="Utilidad estimada" value={formatMoney(totals.utilidad)} />
        <Card label="Ticket promedio" value={formatMoney(totals.ticket)} />
      </div>

      <h2 className="font-semibold mb-2">Por sede</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Sede</th>
              <th className="p-3">Pedidos</th>
              <th className="p-3">Ventas totales</th>
              <th className="p-3">Utilidad estimada</th>
              <th className="p-3">Ticket promedio</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="p-3 text-muted-foreground" colSpan={5}>Cargando...</td></tr>
            )}
            {!isLoading && porSede.length === 0 && (
              <tr><td className="p-3 text-muted-foreground" colSpan={5}>Sin datos en el rango.</td></tr>
            )}
            {porSede.map((s) => (
              <tr key={s.sede} className="border-t border-border">
                <td className="p-3 font-medium">{s.sede}</td>
                <td className="p-3">{s.pedidos}</td>
                <td className="p-3">{formatMoney(s.ventas)}</td>
                <td className="p-3">{formatMoney(s.utilidad)}</td>
                <td className="p-3">{formatMoney(s.ticket)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
