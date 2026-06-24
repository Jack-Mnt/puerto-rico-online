import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Banner, Categoria, Marca, Producto, Sede } from "./types";

export const bannersQuery = queryOptions({
  queryKey: ["banners"],
  queryFn: async (): Promise<Banner[]> => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Banner[];
  },
});

export const categoriasQuery = queryOptions({
  queryKey: ["categorias"],
  queryFn: async (): Promise<Categoria[]> => {
    const { data, error } = await supabase
      .from("categorias")
      .select("id,nombre,slug,activo,grupo")
      .eq("activo", true)
      .order("nombre");
    if (error) throw error;
    return (data ?? []) as Categoria[];
  },
});

export const marcasQuery = queryOptions({
  queryKey: ["marcas"],
  queryFn: async (): Promise<Marca[]> => {
    const { data, error } = await supabase
      .from("marcas")
      .select("id,nombre,activo")
      .eq("activo", true)
      .order("nombre");
    if (error) throw error;
    return (data ?? []) as Marca[];
  },
});

const PRODUCTO_SELECT =
  "id,nombre,slug,marca_id,categoria_id,precio_venta,precio_costo,imagen,descripcion,destacado,activo,marca:marcas(nombre),categoria:categorias(nombre,slug)";

export const destacadosQuery = queryOptions({
  queryKey: ["productos", "destacados"],
  queryFn: async (): Promise<Producto[]> => {
    const { data, error } = await supabase
      .from("productos")
      .select(PRODUCTO_SELECT)
      .eq("activo", true)
      .eq("destacado", true)
      .order("nombre")
      .limit(12);
    if (error) throw error;
    return (data ?? []) as unknown as Producto[];
  },
});

export const productosQuery = queryOptions({
  queryKey: ["productos", "all"],
  queryFn: async (): Promise<Producto[]> => {
    const { data, error } = await supabase
      .from("productos")
      .select(PRODUCTO_SELECT)
      .eq("activo", true)
      .order("nombre");
    if (error) throw error;
    return (data ?? []) as unknown as Producto[];
  },
});

// Lightweight: solo marca_id + categoria_id para calcular marcas disponibles según el scope
export const productosScopeMarcasQuery = (categoriaIds: string[] | null) =>
  queryOptions({
    queryKey: ["productos", "scope-marcas", categoriaIds ?? "all"],
    queryFn: async (): Promise<string[]> => {
      let q = supabase.from("productos").select("marca_id").eq("activo", true).not("marca_id", "is", null);
      if (categoriaIds && categoriaIds.length > 0) q = q.in("categoria_id", categoriaIds);
      const { data, error } = await q;
      if (error) throw error;
      const set = new Set<string>();
      for (const r of (data ?? []) as Array<{ marca_id: string | null }>) {
        if (r.marca_id) set.add(r.marca_id);
      }
      return Array.from(set);
    },
  });

export type ProductosPageFilters = {
  categoriaIds?: string[];
  marcaId?: string;
  search?: string;
};

export type ProductosPage = { rows: Producto[]; total: number; from: number; to: number };

async function searchProductoIdsFallback(term: string): Promise<string[]> {
  const like = `%${term}%`;
  const [marcasRes, catsRes] = await Promise.all([
    supabase.from("marcas").select("id").ilike("nombre", like),
    supabase.from("categorias").select("id").ilike("nombre", like),
  ]);
  const marcaIds = (marcasRes.data ?? []).map((m: { id: string }) => m.id);
  const catIds = (catsRes.data ?? []).map((c: { id: string }) => c.id);
  const orParts = [`nombre.ilike.${like}`];
  if (marcaIds.length > 0) orParts.push(`marca_id.in.(${marcaIds.join(",")})`);
  if (catIds.length > 0) orParts.push(`categoria_id.in.(${catIds.join(",")})`);
  const { data, error } = await supabase
    .from("productos")
    .select("id")
    .eq("activo", true)
    .or(orParts.join(","));
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
}

export async function fetchProductosPage(
  filters: ProductosPageFilters,
  from: number,
  to: number,
): Promise<ProductosPage> {
  // Caso con búsqueda: usar RPC pg_trgm (ilike + similarity) para ranking flexible
  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    let orderedIds: string[] = [];
    const rpc = await supabase.rpc("buscar_productos", { termino: term });
    if (rpc.error) {
      // Fallback: ilike sobre productos / marcas / categorías
      orderedIds = await searchProductoIdsFallback(term);
    } else {
      orderedIds = ((rpc.data ?? []) as Array<{ id: string; score: number }>).map((r) => r.id);
    }
    if (orderedIds.length === 0) {
      return { rows: [], total: 0, from, to };
    }
    // Aplicar filtros adicionales (categoría / marca) sobre los IDs encontrados
    let q2 = supabase
      .from("productos")
      .select(PRODUCTO_SELECT)
      .eq("activo", true)
      .in("id", orderedIds);
    if (filters.categoriaIds && filters.categoriaIds.length > 0) {
      q2 = q2.in("categoria_id", filters.categoriaIds);
    }
    if (filters.marcaId) q2 = q2.eq("marca_id", filters.marcaId);
    const { data, error } = await q2;
    if (error) throw error;
    const rank = new Map(orderedIds.map((id, i) => [id, i] as const));
    const sorted = ((data ?? []) as unknown as Producto[]).sort(
      (a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9),
    );
    const total = sorted.length;
    return { rows: sorted.slice(from, to + 1), total, from, to };
  }

  // Caso sin búsqueda: paginación normal en servidor
  let q = supabase
    .from("productos")
    .select(PRODUCTO_SELECT, { count: "exact" })
    .eq("activo", true);
  if (filters.categoriaIds && filters.categoriaIds.length > 0) {
    q = q.in("categoria_id", filters.categoriaIds);
  }
  if (filters.marcaId) q = q.eq("marca_id", filters.marcaId);
  const { data, error, count } = await q.order("nombre").range(from, to);
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as Producto[],
    total: count ?? 0,
    from,
    to,
  };
}


export const productoBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["producto", slug],
    queryFn: async (): Promise<Producto | null> => {
      const { data, error } = await supabase
        .from("productos")
        .select(PRODUCTO_SELECT)
        .eq("slug", slug)
        .eq("activo", true)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Producto) ?? null;
    },
  });

export const sedesQuery = queryOptions({
  queryKey: ["sedes"],
  queryFn: async (): Promise<Sede[]> => {
    const { data, error } = await supabase
      .from("sedes")
      .select("*")
      .eq("activo", true)
      .order("nombre");
    if (error) throw error;
    return (data ?? []) as Sede[];
  },
});

export const configQuery = queryOptions({
  queryKey: ["configuracion"],
  queryFn: async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from("configuracion").select("clave,valor");
    if (error) throw error;
    const out: Record<string, string> = {};
    for (const row of data ?? []) out[(row as { clave: string }).clave] = (row as { valor: string }).valor;
    return out;
  },
});

export function whatsappUrl(num?: string | null, text?: string) {
  const clean = (num || "").replace(/\D/g, "");
  if (!clean) return "";
  const base = `https://wa.me/${clean}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function formatPhone(num?: string | null) {
  const clean = (num || "").replace(/\D/g, "");
  const digits = clean.length > 9 ? clean.slice(-9) : clean;
  return digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

