import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase, storageUrl, uploadToBucket } from "@/lib/supabase";
import { PageHeader, EmptyState } from "@/components/PanelLayout";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { formatMoney } from "@/lib/csv";

export const Route = createFileRoute("/admin/productos")({
  component: ProductosAdmin,
});

type Producto = {
  id: string;
  slug: string;
  nombre: string;
  marca_id: string | null;
  categoria_id: string | null;
  precio_venta: number;
  precio_costo: number | null;
  imagen: string | null;
  descripcion: string | null;
  destacado: boolean;
  activo: boolean;
};

const schema = z.object({
  nombre: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  marca_id: z.string().uuid().nullable(),
  categoria_id: z.string().uuid().nullable(),
  precio_venta: z.coerce.number().min(0),
  precio_costo: z.coerce.number().min(0).nullable(),
  descripcion: z.string().max(2000).nullable(),
  destacado: z.boolean(),
  activo: z.boolean(),
});

function ProductosAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Producto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Producto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data as Producto[];
    },
  });

  const { data: marcas } = useQuery({
    queryKey: ["admin-marcas-options"],
    queryFn: async () => (await supabase.from("marcas").select("id,nombre").order("nombre")).data || [],
  });
  const { data: categorias } = useQuery({
    queryKey: ["admin-categorias-options"],
    queryFn: async () => (await supabase.from("categorias").select("id,nombre").order("nombre")).data || [],
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Producto eliminado");
      qc.invalidateQueries({ queryKey: ["admin-productos"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = (data || []).filter((p) =>
    p.nombre.toLowerCase().includes(q.toLowerCase()) || p.slug.includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo"
        action={
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nuevo producto
          </button>
        }
      />
      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o slug..."
          className="w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin productos" description="Crea tu primer producto para empezar." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3"></th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Estado</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 w-14">
                    {p.imagen ? (
                      <img src={storageUrl(p.imagen)} alt="" className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded" />
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="p-3">{formatMoney(p.precio_venta)}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.activo ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                    {p.destacado && (
                      <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700">
                        Destacado
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(p)} className="p-1.5 hover:bg-muted rounded">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleting(p)} className="p-1.5 hover:bg-muted rounded text-destructive">
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
        <ProductoForm
          initial={editing}
          marcas={marcas || []}
          categorias={categorias || []}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-productos"] })}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && delMut.mutate(deleting.id)}
        title="Eliminar producto"
        description={`¿Eliminar "${deleting?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}

function ProductoForm({
  initial,
  marcas,
  categorias,
  onClose,
  onSaved,
}: {
  initial: Producto | null;
  marcas: { id: string; nombre: string }[];
  categorias: { id: string; nombre: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    slug: initial?.slug ?? "",
    marca_id: initial?.marca_id ?? "",
    categoria_id: initial?.categoria_id ?? "",
    precio_venta: initial?.precio_venta ?? 0,
    precio_costo: initial?.precio_costo ?? 0,
    descripcion: initial?.descripcion ?? "",
    destacado: initial?.destacado ?? false,
    activo: initial?.activo ?? true,
  });
  const [imagen, setImagen] = useState<string | null>(initial?.imagen ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      nombre: form.nombre,
      slug: form.slug,
      marca_id: form.marca_id || null,
      categoria_id: form.categoria_id || null,
      precio_venta: form.precio_venta,
      precio_costo: form.precio_costo || null,
      descripcion: form.descripcion || null,
      destacado: form.destacado,
      activo: form.activo,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      let imgPath = imagen;
      if (file) imgPath = await uploadToBucket("productos", file);
      const payload = { ...parsed.data, imagen: imgPath };
      if (initial) {
        const { error } = await supabase.from("productos").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Producto actualizado");
      } else {
        const { error } = await supabase.from("productos").insert(payload);
        if (error) throw error;
        toast.success("Producto creado");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={initial ? "Editar producto" : "Nuevo producto"} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre">
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Marca">
            <select
              value={form.marca_id}
              onChange={(e) => setForm({ ...form, marca_id: e.target.value })}
              className="input"
            >
              <option value="">— Sin marca —</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Categoría">
            <select
              value={form.categoria_id}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              className="input"
            >
              <option value="">— Sin categoría —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Precio venta (S/)">
            <input
              type="number"
              step="0.01"
              value={form.precio_venta}
              onChange={(e) => setForm({ ...form, precio_venta: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="Precio costo (S/)">
            <input
              type="number"
              step="0.01"
              value={form.precio_costo || 0}
              onChange={(e) => setForm({ ...form, precio_costo: Number(e.target.value) })}
              className="input"
            />
          </Field>
        </div>
        <Field label="Descripción">
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="input min-h-[80px]"
          />
        </Field>
        <Field label="Imagen">
          <div className="flex items-center gap-3">
            {imagen && <img src={storageUrl(imagen)} alt="" className="h-16 w-16 object-cover rounded" />}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
          </div>
        </Field>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.destacado}
              onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
            />
            Destacado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Activo
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 font-medium">{label}</span>
      {children}
    </label>
  );
}
