import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Eye, Search } from "lucide-react";
import { supabase, storageUrl } from "@/lib/supabase";
import { PageHeader, EmptyState } from "./PanelLayout";
import { Modal } from "./Modal";
import { formatMoney, formatDate } from "@/lib/csv";
import { useAuthStore } from "@/lib/auth";

type Pedido = {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  sede_id: string | null;
  estado: string;
  metodo_pago: string;
  tipo_entrega: string;
  total: number;
  created_at: string;
  fecha_entrega?: string | null;
  direccion?: string | null;
  notas?: string | null;
};

const ESTADOS = ["pendiente", "confirmado", "en_preparacion", "listo", "entregado", "cancelado"];

export function PedidosTable({
  scope,
  canChangeEstado,
}: {
  scope: "all" | "today-sede";
  canChangeEstado: boolean;
}) {
  const qc = useQueryClient();
  const { perfil } = useAuthStore();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [viewing, setViewing] = useState<Pedido | null>(null);

  const queryKey = ["pedidos", scope, perfil?.sede_id, estado];

  const { data: sedes } = useQuery({
    queryKey: ["sedes-options"],
    queryFn: async () => (await supabase.from("sedes").select("id,nombre")).data || [],
  });

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let req = supabase.from("pedidos").select("*").order("created_at", { ascending: false });
      if (scope === "today-sede") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        req = req.gte("created_at", today.toISOString());
        if (perfil?.sede_id) req = req.eq("sede_id", perfil.sede_id);
      }
      if (estado) req = req.eq("estado", estado);
      const { data, error } = await req;
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: scope === "all" || !!perfil,
  });

  const updateEstadoMut = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
      if (error) throw error;
      await supabase.from("historial_pedidos").insert({
        pedido_id: id,
        estado,
        usuario_id: perfil?.id,
        nota: `Cambio a ${estado}`,
      }).then(({ error: e }) => {
        if (e) console.warn("[historial]", e.message);
      });
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return (data || []).filter(
      (p) =>
        !s ||
        p.id.toLowerCase().includes(s) ||
        p.cliente_nombre?.toLowerCase().includes(s) ||
        p.cliente_telefono?.includes(s)
    );
  }, [data, q]);

  return (
    <div>
      <PageHeader
        title={scope === "today-sede" ? "Pedidos del día" : "Pedidos"}
        description={scope === "today-sede" ? "Cola de pedidos para atender hoy" : "Todos los pedidos"}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ID, cliente o teléfono..."
            className="rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm w-full sm:w-72"
          />
        </div>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="input sm:w-44">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !filtered.length ? (
        <EmptyState title="Sin pedidos" description="Cuando lleguen pedidos, aparecerán aquí." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Sede</th>
                <th className="p-3">Entrega</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{formatDate(p.created_at)}</td>
                  <td className="p-3">
                    <div className="font-medium">{p.cliente_nombre}</div>
                    <div className="text-xs text-muted-foreground">{p.cliente_telefono}</div>
                  </td>
                  <td className="p-3">{sedes?.find((s) => s.id === p.sede_id)?.nombre || "—"}</td>
                  <td className="p-3 capitalize">{p.tipo_entrega}</td>
                  <td className="p-3 font-semibold">{formatMoney(p.total)}</td>
                  <td className="p-3">
                    {canChangeEstado ? (
                      <select
                        value={p.estado}
                        onChange={(e) => updateEstadoMut.mutate({ id: p.id, estado: e.target.value })}
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>
                            {e.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs capitalize">{p.estado}</span>
                    )}
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

      {viewing && <PedidoDetail pedido={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function PedidoDetail({ pedido, onClose }: { pedido: Pedido; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["pedido-detail", pedido.id],
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
    <Modal open onClose={onClose} title={`Pedido ${pedido.id.slice(0, 8)}`} size="lg">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Info label="Cliente" value={pedido.cliente_nombre} />
          <Info label="Teléfono" value={pedido.cliente_telefono} />
          <Info label="Método pago" value={pedido.metodo_pago} />
          <Info label="Tipo entrega" value={pedido.tipo_entrega} />
          <Info label="Estado" value={pedido.estado} />
          <Info label="Total" value={formatMoney(pedido.total)} />
        </div>
        {pedido.direccion && <Info label="Dirección" value={pedido.direccion} />}
        {pedido.notas && <Info label="Notas" value={pedido.notas} />}

        <div className="pt-3">
          <div className="font-semibold mb-2">Productos</div>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-2">
              {data?.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2 border border-border rounded">
                  {d.productos?.imagen ? (
                    <img src={storageUrl(d.productos.imagen)} className="h-10 w-10 object-cover rounded" alt="" />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{d.productos?.nombre || d.producto_id}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.cantidad} × {formatMoney(d.precio_unitario)}
                    </div>
                  </div>
                  <div className="font-semibold">{formatMoney(Number(d.cantidad) * Number(d.precio_unitario))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium capitalize">{value}</div>
    </div>
  );
}
