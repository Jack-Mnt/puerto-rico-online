import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
export const BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string) || "PuertoRicoOnline";

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function storageUrl(path?: string | null) {
  if (!path) return "";
  const clean = path.replace(/^\/+/, "");
  return `${url}/storage/v1/object/public/${BUCKET}/${clean}`;
}
