import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase, storageUrl, uploadToBucket } from "@/lib/supabase";
import { PageHeader, EmptyState } from "@/components/PanelLayout";
import { Modal, ConfirmDialog } from "@/components/Modal";

export const Route = createFileRoute("/admin/banners")({
  component: BannersAdmin,
});

type Banner = {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  imagen_desktop: string | null;
  imagen_mobile: string | null;
  enlace: string | null;
  orden: number;
  activo: boolean;
};

function BannersAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("orden");
      if (error) throw error;
      return data as Banner[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner eliminado");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <PageHeader
        title="Banners"
        action={
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nuevo banner
          </button>
        }
      />
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : !data?.length ? (
        <EmptyState title="Sin banners" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {b.imagen_desktop ? (
                <img src={storageUrl(b.imagen_desktop)} alt="" className="aspect-[16/7] w-full object-cover" />
              ) : (
                <div className="aspect-[16/7] bg-muted" />
              )}
              <div className="p-3">
                <div className="font-medium text-sm">{b.titulo || "(sin título)"}</div>
                <div className="text-xs text-muted-foreground">Orden: {b.orden} · {b.activo ? "Activo" : "Inactivo"}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditing(b)} className="text-xs px-2 py-1 rounded border border-border flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button onClick={() => setDeleting(b)} className="text-xs px-2 py-1 rounded border border-border text-destructive flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <BannerForm
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-banners"] })}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && delMut.mutate(deleting.id)}
        title="Eliminar banner"
      />
    </div>
  );
}

function BannerForm({ initial, onClose, onSaved }: { initial: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    titulo: initial?.titulo ?? "",
    subtitulo: initial?.subtitulo ?? "",
    enlace: initial?.enlace ?? "",
    orden: initial?.orden ?? 0,
    activo: initial?.activo ?? true,
  });
  const [imgDesk, setImgDesk] = useState<string | null>(initial?.imagen_desktop ?? null);
  const [imgMob, setImgMob] = useState<string | null>(initial?.imagen_mobile ?? null);
  const [fileDesk, setFileDesk] = useState<File | null>(null);
  const [fileMob, setFileMob] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let d = imgDesk;
      let m = imgMob;
      if (fileDesk) d = await uploadToBucket("banners", fileDesk);
      if (fileMob) m = await uploadToBucket("banners", fileMob);
      const payload = { ...form, imagen_desktop: d, imagen_mobile: m };
      if (initial) {
        const { error } = await supabase.from("banners").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Banner actualizado");
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
        toast.success("Banner creado");
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
    <Modal open onClose={onClose} title={initial ? "Editar banner" : "Nuevo banner"} size="lg">
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        <input className="input" placeholder="Subtítulo" value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} />
        <input className="input" placeholder="Enlace (opcional)" value={form.enlace} onChange={(e) => setForm({ ...form, enlace: e.target.value })} />
        <input type="number" className="input" placeholder="Orden" value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} />
        <div>
          <span className="text-sm font-medium block mb-1">Imagen desktop</span>
          {imgDesk && <img src={storageUrl(imgDesk)} className="h-20 object-cover rounded mb-1" alt="" />}
          <input type="file" accept="image/*" onChange={(e) => setFileDesk(e.target.files?.[0] || null)} />
        </div>
        <div>
          <span className="text-sm font-medium block mb-1">Imagen mobile</span>
          {imgMob && <img src={storageUrl(imgMob)} className="h-20 object-cover rounded mb-1" alt="" />}
          <input type="file" accept="image/*" onChange={(e) => setFileMob(e.target.files?.[0] || null)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
          Activo
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
