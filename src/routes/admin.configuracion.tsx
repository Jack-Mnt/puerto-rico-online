import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PanelLayout";

export const Route = createFileRoute("/admin/configuracion")({
  component: ConfigPage,
});

type ConfigRow = { clave: string; valor: string | null };

function ConfigPage() {
  const qc = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-config-rows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion")
        .select("clave,valor")
        .order("clave");
      if (error) throw error;
      return (data ?? []) as ConfigRow[];
    },
  });

  const [selectedClave, setSelectedClave] = useState<string>("");
  const [valor, setValor] = useState<string>("");

  const selectedRow = useMemo(
    () => rows?.find((r) => r.clave === selectedClave),
    [rows, selectedClave],
  );

  useEffect(() => {
    if (rows && rows.length && !selectedClave) {
      setSelectedClave(rows[0].clave);
    }
  }, [rows, selectedClave]);

  useEffect(() => {
    setValor(selectedRow?.valor ?? "");
  }, [selectedRow]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!selectedRow) throw new Error("Selecciona una clave");
      const { error } = await supabase
        .from("configuracion")
        .update({ valor })
        .eq("clave", selectedRow.clave);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuración guardada correctamente");
      qc.invalidateQueries({ queryKey: ["admin-config-rows"] });
      qc.invalidateQueries({ queryKey: ["configuracion"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <PageHeader title="Configuración" description="Edita los valores institucionales de la tienda" />
      <div className="rounded-xl border border-border bg-card p-5 max-w-2xl space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            Cargando configuración...
          </div>
        ) : !rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay claves de configuración disponibles.</p>
        ) : (
          <>
            <label className="block text-sm">
              <span className="block mb-1 font-medium">Clave</span>
              <select
                className="input w-full"
                value={selectedClave}
                onChange={(e) => setSelectedClave(e.target.value)}
              >
                {rows.map((r) => (
                  <option key={r.clave} value={r.clave}>
                    {r.clave}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="block mb-1 font-medium">Valor</span>
              <textarea
                className="input w-full min-h-[96px]"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Valor de la configuración"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending || !selectedRow || valor === (selectedRow?.valor ?? "")}
                className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50"
              >
                {saveMut.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
