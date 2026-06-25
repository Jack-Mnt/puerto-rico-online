import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PanelLayout";
import { formatMoney } from "@/lib/csv";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-v2"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoToday = today.toISOString();

      const [pedidosHoyResp, productosResp, sedesResp] = await Promise.all([
        supabase
          .from("pedidos")
          .select("id,total,sede_id,estado,detalle_pedidos(cantidad,precio_venta,total,producto_id,productos(nombre,precio_costo))")
          .gte("created_at", isoToday)
          .neq("estado", "pedido_cancelado")
          .neq("estado", "pedido_rechazado"),
        supabase.from("productos").select("id", { count: "exact", head: true }).eq("activo", true),
        supabase.from("sedes").select("id,nombre"),
      ]);

      const pedidos = (pedidosHoyResp.data || []) as any[];
      const sedes = (sedesResp.data || []) as { id: string; nombre: string }[];

      let ventas = 0, utilidad = 0;
      const sedeMap = new Map<string, { sede: string; ventas: number }>();
      const prodVendidos = new Map<string, { nombre: string; cantidad: number; ventas: number }>();
      const prodRentables = new Map<string, { nombre: string; utilidad: number }>();

      for (const p of pedidos) {
        ventas += Number(p.total || 0);
        const sedeKey = p.sede_id || "sin-sede";
        const sedeNombre = sedes.find((s) => s.id === p.sede_id)?.nombre || "Sin sede";
        const cur = sedeMap.get(sedeKey) || { sede: sedeNombre, ventas: 0 };
        cur.ventas += Number(p.total || 0);
        sedeMap.set(sedeKey, cur);

        for (const d of p.detalle_pedidos || []) {
          const ganancia = (Number(d.precio_venta) - Number(d.productos?.precio_costo ?? 0)) * Number(d.cantidad);
          utilidad += ganancia;
          const k = d.producto_id || "?";
          const v = prodVendidos.get(k) || { nombre: d.productos?.nombre || "Producto", cantidad: 0, ventas: 0 };
          v.cantidad += Number(d.cantidad);
          v.ventas += Number(d.total);
          prodVendidos.set(k, v);
          const r = prodRentables.get(k) || { nombre: d.productos?.nombre || "Producto", utilidad: 0 };
          r.utilidad += ganancia;
          prodRentables.set(k, r);
        }
      }

      return {
        ventasHoy: ventas,
        utilidadHoy: utilidad,
        pedidosHoy: pedidos.length,
        productos: productosResp.count ?? 0,
        ventasPorSede: Array.from(sedeMap.values()).sort((a, b) => b.ventas - a.ventas),
        topVendidos: Array.from(prodVendidos.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5),
        topRentables: Array.from(prodRentables.values()).sort((a, b) => b.utilidad - a.utilidad).slice(0, 5),
      };
    },
  });

  const cards = [
    { label: "Ventas hoy", value: formatMoney(data?.ventasHoy ?? 0), tone: "from-emerald-500/15 to-emerald-500/0" },
    { label: "Utilidad hoy", value: formatMoney(data?.utilidadHoy ?? 0), tone: "from-amber-500/15 to-amber-500/0" },
    { label: "Pedidos hoy", value: data?.pedidosHoy ?? 0, tone: "from-blue-500/15 to-blue-500/0" },
    { label: "Productos activos", value: data?.productos ?? 0, tone: "from-violet-500/15 to-violet-500/0" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen del día — ventas, utilidad y top de productos." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border border-border bg-gradient-to-br ${c.tone} p-5`}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="mt-2 text-2xl font-bold">{isLoading ? "—" : c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Panel title="Ventas por sede (hoy)">
          <ul className="divide-y divide-border text-sm">
            {data?.ventasPorSede.map((s) => (
              <li key={s.sede} className="px-4 py-2.5 flex justify-between">
                <span className="font-medium">{s.sede}</span>
                <span className="font-semibold">{formatMoney(s.ventas)}</span>
              </li>
            ))}
            {!data?.ventasPorSede.length && <li className="px-4 py-4 text-muted-foreground text-center">Sin ventas hoy.</li>}
          </ul>
        </Panel>

        <Panel title="Productos más vendidos">
          <ul className="divide-y divide-border text-sm">
            {data?.topVendidos.map((p) => (
              <li key={p.nombre} className="px-4 py-2.5 flex justify-between">
                <span className="font-medium truncate mr-3">{p.nombre}</span>
                <span className="text-muted-foreground text-xs whitespace-nowrap">{p.cantidad} ud · {formatMoney(p.ventas)}</span>
              </li>
            ))}
            {!data?.topVendidos.length && <li className="px-4 py-4 text-muted-foreground text-center">—</li>}
          </ul>
        </Panel>

        <Panel title="Productos más rentables">
          <ul className="divide-y divide-border text-sm">
            {data?.topRentables.map((p) => (
              <li key={p.nombre} className="px-4 py-2.5 flex justify-between">
                <span className="font-medium truncate mr-3">{p.nombre}</span>
                <span className="font-semibold whitespace-nowrap">{formatMoney(p.utilidad)}</span>
              </li>
            ))}
            {!data?.topRentables.length && <li className="px-4 py-4 text-muted-foreground text-center">—</li>}
          </ul>
        </Panel>
      </div>
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
