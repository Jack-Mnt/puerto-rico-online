import { create } from "zustand";
import { useEffect } from "react";
import { supabase } from "./supabase";

export type Rol = "admin" | "moderador" | "cajero";

export type Perfil = {
  id: string;
  email: string;
  nombre: string | null;
  rol: Rol;
  sede_id: string | null;
};

type AuthState = {
  initialized: boolean;
  loading: boolean;
  userId: string | null;
  perfil: Perfil | null;
  setPerfil: (p: Perfil | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  init: () => Promise<void>;
};

async function fetchPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, email, nombre, rol, sede_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[auth] fetchPerfil", error);
    return null;
  }
  return (data as Perfil) ?? null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  loading: false,
  userId: null,
  perfil: null,
  setPerfil: (p) => set({ perfil: p }),
  async signIn(email, password) {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const uid = data.user?.id ?? null;
      const perfil = uid ? await fetchPerfil(uid) : null;
      set({ userId: uid, perfil });
    } finally {
      set({ loading: false });
    }
  },
  async signOut() {
    await supabase.auth.signOut();
    set({ userId: null, perfil: null });
  },
  async init() {
    if (get().initialized) return;
    set({ initialized: true });
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id ?? null;
    const perfil = uid ? await fetchPerfil(uid) : null;
    set({ userId: uid, perfil });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const newUid = session?.user.id ?? null;
      const newPerfil = newUid ? await fetchPerfil(newUid) : null;
      set({ userId: newUid, perfil: newPerfil });
    });
  },
}));

export function useAuthInit() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
}

export function rolHome(rol: Rol | null | undefined): string {
  switch (rol) {
    case "admin":
      return "/admin";
    case "moderador":
      return "/moderador";
    case "cajero":
      return "/cajero";
    default:
      return "/";
  }
}
