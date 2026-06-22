import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
export const SUPABASE_URL = url;
export const BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string) || "PuertoRicoOnline";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "pro-auth",
  },
});

export function storageUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.replace(/^\/+/, "");
  return `${url}/storage/v1/object/public/${BUCKET}/${clean}`;
}

export async function uploadToBucket(folder: "productos" | "banners" | "branding", file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}
