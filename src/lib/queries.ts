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
      .select("id,nombre,slug,activo")
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
      .select("id,nombre,activo")
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
