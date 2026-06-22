import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase, SUPABASE_URL } from "@/lib/supabase";
import { PageHeader, EmptyState } from "@/components/PanelLayout";
import { Modal, ConfirmDialog } from "@/components/Modal";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosAdmin,
});

type Usuario = { id: string; email: string; nombre: string | null; rol: "admin" | "moderador" | "cajero"; sede_id: string | null };

function UsuariosAdmin() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Usuario | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("usuarios").select("*").order("nombre");
      if (error) throw error;
      return data as Usuario[];
    },
  });

  const { data: sedes } = useQuery({
    queryKey: ["admin-sedes-options"],
    queryFn: async () => (await supabase.from("sedes").select("id,nombre").order("nombre")).data || [],
  });

  const delMut = useMutation({
    mutationFn: async (u: Usuario) => {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch("/api/staff-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id: u.id }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestiona el personal con acceso a los paneles"
        action={
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nuevo usuario
          </button>
        }
      />
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !data?.length ? (
        <EmptyState title="Sin usuarios" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Sede</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.nombre || "—"}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 capitalize">{u.rol}</td>
                  <td className="p-3">{sedes?.find((s) => s.id === u.sede_id)?.nombre || "—"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setDeleting(u)} className="p-1.5 hover:bg-muted rounded text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <UsuarioForm
          sedes={sedes || []}
          onClose={() => setCreating(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-usuarios"] })}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && delMut.mutate(deleting)}
        title="Eliminar usuario"
        description={`¿Eliminar a ${deleting?.email}? Pierde acceso inmediatamente.`}
      />
    </div>
  );
}

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  nombre: z.string().min(2),
  rol: z.enum(["admin", "moderador", "cajero"]),
  sede_id: z.string().uuid().nullable(),
});

function UsuarioForm({
  sedes,
  onClose,
  onSaved,
}: {
  sedes: { id: string; nombre: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    rol: "cajero" as "admin" | "moderador" | "cajero",
    sede_id: "",
  });
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = userSchema.safeParse({
      ...form,
      sede_id: form.sede_id || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch("/api/staff-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Usuario creado");
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Nuevo usuario">
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Contraseña (min 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as any })}>
          <option value="admin">Admin</option>
          <option value="moderador">Moderador</option>
          <option value="cajero">Cajero</option>
        </select>
        {form.rol === "cajero" && (
          <select className="input" value={form.sede_id} onChange={(e) => setForm({ ...form, sede_id: e.target.value })}>
            <option value="">— Seleccionar sede —</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50">
            {saving ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
