export type Producto = {
  id: string;
  nombre: string;
  slug: string;
  marca_id: string | null;
  categoria_id: string | null;
  precio_venta: number;
  precio_costo: number | null;
  imagen: string | null;
  descripcion: string | null;
  destacado: boolean;
  activo: boolean;
  marca?: { nombre: string } | null;
  categoria?: { nombre: string; slug: string } | null;
};

export type Categoria = { id: string; nombre: string; slug: string; activo: boolean; orden?: number };
export type Marca = { id: string; nombre: string; activo: boolean };

export type Banner = {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  imagen_desktop: string | null;
  imagen_mobile: string | null;
  enlace: string | null;
  tipo: string | null;
  orden: number;
  activo: boolean;
  texto_visible?: boolean;
  texto_color?: string | null;
};

export type Sede = { id: string; nombre: string; activo: boolean; direccion?: string | null; google_maps_url?: string | null };

export type CartItem = {
  id: string;
  nombre: string;
  slug: string;
  precio_venta: number;
  precio_costo: number | null;
  imagen: string | null;
  cantidad: number;
};
