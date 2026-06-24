import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader, EmptyState } from "./PanelLayout";
import { Modal, ConfirmDialog } from "./Modal";

export type CrudField = {
  name: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  required?: boolean;
  defaultValue?: any;
  options?: { label: string; value: string }[];
};

export function SimpleCrud({
  title,
  table,
  fields,
  listColumns,
  orderBy,
  renderCell,
}: {
  title: string;
  table: string;
  fields: CrudField[];
  listColumns: string[];
  orderBy?: string;
  renderCell?: Record<string, (row: Record<string, any>) => React.ReactNode>;
}) {
  const qc = useQueryClient();
  const queryKey = ["crud", table];
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [deleting, setDeleting] = useState<Record<string, any> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase.from(table).select("*");
      if (orderBy) q = q.order(orderBy);
      const { data, error } = await q;
      if (error) throw error;
      return data as Record<string, any>[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Eliminado");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <PageHeader
        title={title}
        action={
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        }
      />
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !data?.length ? (
        <EmptyState title="Sin registros" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {listColumns.map((c) => (
                  <th key={c} className="p-3 capitalize">
                    {c.replace(/_/g, " ")}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  {listColumns.map((c) => (
                    <td key={c} className="p-3">
                      {typeof row[c] === "boolean" ? (row[c] ? "Sí" : "No") : row[c] ?? "—"}
                    </td>
                  ))}
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(row)} className="p-1.5 hover:bg-muted rounded">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleting(row)} className="p-1.5 hover:bg-muted rounded text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <CrudForm
          table={table}
          fields={fields}
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => qc.invalidateQueries({ queryKey })}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && delMut.mutate(deleting.id)}
        title="Eliminar registro"
      />
    </div>
  );
}

function CrudForm({
  table,
  fields,
  initial,
  onClose,
  onSaved,
}: {
  table: string;
  fields: CrudField[];
  initial: Record<string, any> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const out: Record<string, any> = {};
    fields.forEach((f) => {
      out[f.name] = initial?.[f.name] ?? f.defaultValue ?? (f.type === "boolean" ? false : f.type === "number" ? 0 : "");
    });
    return out;
  });
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !form[f.name]) {
        toast.error(`${f.label} es obligatorio`);
        return;
      }
    }
    setSaving(true);
    try {
      if (initial) {
        const { error } = await supabase.from(table).update(form).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert(form);
        if (error) throw error;
      }
      toast.success("Guardado");
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={initial ? "Editar" : "Nuevo"}>
      <form onSubmit={onSubmit} className="space-y-3">
        {fields.map((f) => (
          <label key={f.name} className="block text-sm">
            <span className="block mb-1 font-medium">{f.label}</span>
            {f.type === "boolean" ? (
              <input
                type="checkbox"
                checked={!!form[f.name]}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
              />
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                className="input"
                value={form[f.name] ?? ""}
                onChange={(e) =>
                  setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })
                }
              />
            )}
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
