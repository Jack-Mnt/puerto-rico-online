import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PanelLayout";
import { formatMoney } from "@/lib/csv";

export const Route = createFileRoute("/admin/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const [desde, setDesde] = useState(monthAgo);
  const [hasta, setHasta] = useState(today);
  const [sedeId, setSedeId] = useState("");

  const { data: sedes = [] } = useQuery({
    queryKey: ["rep-sedes"],
    queryFn: async () => (await supabase.from("sedes").select("id,nombre")).data || [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["reportes-rich", desde, hasta, sedeId],
    queryFn: async () => {
      let q = supabase
        .from("pedidos")
        .select("id,total,sede_id,estado,created_at,detalle_pedidos(cantidad,precio_unitario,producto_id,productos(nombre,precio_costo))")
        .gte("created_at", desde + "T00:00:00")
        .lte("created_at", hasta + "T23:59:59")
        .neq("estado", "pedido_cancelado")
        .neq("estado", "pedido_rechazado")
        .limit(5000);
      if (sedeId) q = q.eq("sede_id", sedeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const totals = useMemo(() => {
    let ventas = 0, utilidad = 0;
    for (const p of data || []) {
      ventas += Number(p.total || 0);
      for (const d of p.detalle_pedidos || []) {
        utilidad += (Number(d.precio_unitario) - Number(d.productos?.precio_costo ?? 0)) * Number(d.cantidad);
      }
    }
    return { ventas, utilidad, cantidad: data?.length ?? 0, ticket: data?.length ? ventas / data.length : 0 };
  }, [data]);

  const porSede = useMemo(() => {
    const map = new Map<string, { sede: string; pedidos: number; ventas: number; utilidad: number }>();
    for (const p of data || []) {
      const key = p.sede_id || "sin-sede";
      const cur = map.get(key) || {
        sede: sedes.find((s) => s.id === p.sede_id)?.nombre || "Sin sede",
        pedidos: 0, ventas: 0, utilidad: 0,
      };
      cur.pedidos += 1;
      cur.ventas += Number(p.total || 0);
      for (const d of p.detalle_pedidos || []) {
        cur.utilidad += (Number(d.precio_unitario) - Number(d.productos?.precio_costo ?? 0)) * Number(d.cantidad);
      }
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.ventas - a.ventas);
  }, [data, sedes]);

  const topVendidos = useMemo(() => {
    const m = new Map<string, { nombre: string; cantidad: number; ventas: number }>();
    for (const p of data || []) {
      for (const d of p.detalle_pedidos || []) {
        const key = d.producto_id || "?";
        const cur = m.get(key) || { nombre: d.productos?.nombre || "Producto", cantidad: 0, ventas: 0 };
        cur.cantidad += Number(d.cantidad);
        cur.ventas += Number(d.precio_unitario) * Number(d.cantidad);
        m.set(key, cur);
      }
    }
    return Array.from(m.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
  }, [data]);

  const topRentables = useMemo(() => {
    const m = new Map<string, { nombre: string; utilidad: number }>();
    for (const p of data || []) {
      for (const d of p.detalle_pedidos || []) {
        const key = d.producto_id || "?";
        const cur = m.get(key) || { nombre: d.productos?.nombre || "Producto", utilidad: 0 };
        cur.utilidad += (Number(d.precio_unitario) - Number(d.productos?.precio_costo ?? 0)) * Number(d.cantidad);
        m.set(key, cur);
      }
    }
    return Array.from(m.values()).sort((a, b) => b.utilidad - a.utilidad).slice(0, 10);
  }, [data]);

  return (
    <div>
      <PageHeader title="Reportes" description="Indicadores de venta y rentabilidad." />

      <div className="rounded-xl border border-border bg-card p-4 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Pedidos" value={isLoading ? "—" : totals.cantidad} />
        <Card label="Ventas totales" value={formatMoney(totals.ventas)} />
        <Card label="Utilidad estimada" value={formatMoney(totals.utilidad)} />
        <Card label="Ticket promedio" value={formatMoney(totals.ticket)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Ventas por sede">
          <Table headers={["Sede", "Pedidos", "Ventas", "Utilidad"]}>
            {porSede.map((s) => (
              <tr key={s.sede} className="border-t border-border">
                <td className="p-2 font-medium">{s.sede}</td>
                <td className="p-2">{s.pedidos}</td>
                <td className="p-2">{formatMoney(s.ventas)}</td>
                <td className="p-2">{formatMoney(s.utilidad)}</td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Productos más vendidos">
          <Table headers={["Producto", "Cantidad", "Ventas"]}>
            {topVendidos.map((p) => (
              <tr key={p.nombre} className="border-t border-border">
                <td className="p-2 font-medium">{p.nombre}</td>
                <td className="p-2">{p.cantidad}</td>
                <td className="p-2">{formatMoney(p.ventas)}</td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Productos más rentables">
          <Table headers={["Producto", "Utilidad"]}>
            {topRentables.map((p) => (
              <tr key={p.nombre} className="border-t border-border">
                <td className="p-2 font-medium">{p.nombre}</td>
                <td className="p-2">{formatMoney(p.utilidad)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>{headers.map((h) => <th key={h} className="p-2">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
