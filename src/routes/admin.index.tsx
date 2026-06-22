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
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoToday = today.toISOString();

      const [pedidosHoy, productos, sedes, ventasHoy] = await Promise.all([
        supabase.from("pedidos").select("id", { count: "exact", head: true }).gte("created_at", isoToday),
        supabase.from("productos").select("id", { count: "exact", head: true }).eq("activo", true),
        supabase.from("sedes").select("id", { count: "exact", head: true }),
        supabase.from("pedidos").select("total").gte("created_at", isoToday),
      ]);

      const totalVentas = (ventasHoy.data || []).reduce((s, p: any) => s + Number(p.total || 0), 0);
      return {
        pedidosHoy: pedidosHoy.count ?? 0,
        productos: productos.count ?? 0,
        sedes: sedes.count ?? 0,
        ventasHoy: totalVentas,
      };
    },
  });

  const cards = [
    { label: "Pedidos hoy", value: data?.pedidosHoy ?? 0 },
    { label: "Ventas hoy", value: formatMoney(data?.ventasHoy ?? 0) },
    { label: "Productos activos", value: data?.productos ?? 0 },
    { label: "Sedes", value: data?.sedes ?? 0 },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general del negocio" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="mt-2 text-2xl font-bold">{isLoading ? "—" : c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
