import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PanelLayout";

export const Route = createFileRoute("/admin/configuracion")({
  component: ConfigPage,
});

function ConfigPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracion").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return (data as Record<string, any>) || {};
    },
  });

  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const id = form.id;
      if (id) {
        const { error } = await supabase.from("configuracion").update(form).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("configuracion").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      qc.invalidateQueries({ queryKey: ["admin-config"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando...</div>;

  const fields = Object.keys(form).filter((k) => !["id", "created_at", "updated_at"].includes(k));

  return (
    <div>
      <PageHeader title="Configuración" description="Ajustes generales de la tienda" />
      <div className="rounded-xl border border-border bg-card p-5 max-w-2xl space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay configuración. Inicializa con los campos básicos.</p>
        )}
        {fields.map((k) => (
          <label key={k} className="block text-sm">
            <span className="block mb-1 font-medium capitalize">{k.replace(/_/g, " ")}</span>
            {typeof form[k] === "boolean" ? (
              <input
                type="checkbox"
                checked={!!form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
              />
            ) : (
              <input
                className="input"
                value={form[k] ?? ""}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            )}
          </label>
        ))}
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50"
        >
          {saveMut.isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
