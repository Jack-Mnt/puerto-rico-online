import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Server route to manage staff users with service role.
// Auth: requires Bearer token of an authenticated admin user.

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function getAdminContext(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Missing bearer token", status: 401 as const };

  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.PRO_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) return { error: "Server not configured", status: 500 as const };

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return { error: "Invalid token", status: 401 as const };

  const { data: perfil, error: pErr } = await admin
    .from("usuarios")
    .select("rol")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (pErr) return { error: pErr.message, status: 500 as const };
  if (!perfil || perfil.rol !== "admin") return { error: "Forbidden", status: 403 as const };

  return { admin, callerId: userData.user.id };
}

export const Route = createFileRoute("/api/staff-users")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ctx = await getAdminContext(request);
        if ("error" in ctx) return json({ error: ctx.error }, ctx.status);

        const body = await request.json();
        const { email, password, nombre, rol, sede_id } = body || {};

        if (!email || !password || !nombre || !rol) {
          return json({ error: "Faltan campos" }, 400);
        }
        if (!["admin", "moderador", "cajero"].includes(rol)) {
          return json({ error: "Rol inválido" }, 400);
        }

        const { data: created, error: createErr } = await ctx.admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nombre },
        });
        if (createErr || !created.user) return json({ error: createErr?.message || "No se pudo crear" }, 400);

        const { error: insertErr } = await ctx.admin.from("usuarios").insert({
          id: created.user.id,
          email,
          nombre,
          rol,
          sede_id: sede_id || null,
        });
        if (insertErr) {
          await ctx.admin.auth.admin.deleteUser(created.user.id).catch(() => {});
          return json({ error: insertErr.message }, 400);
        }

        return json({ ok: true, id: created.user.id });
      },

      DELETE: async ({ request }) => {
        const ctx = await getAdminContext(request);
        if ("error" in ctx) return json({ error: ctx.error }, ctx.status);

        const body = await request.json();
        const { id } = body || {};
        if (!id) return json({ error: "id requerido" }, 400);
        if (id === ctx.callerId) return json({ error: "No puedes eliminar tu propia cuenta" }, 400);

        await ctx.admin.from("usuarios").delete().eq("id", id);
        const { error } = await ctx.admin.auth.admin.deleteUser(id);
        if (error) return json({ error: error.message }, 400);

        return json({ ok: true });
      },
    },
  },
});
