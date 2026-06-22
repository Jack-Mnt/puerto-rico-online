import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore, useAuthInit, rolHome, type Rol } from "@/lib/auth";

export type NavItem = { to: string; label: string; icon?: React.ComponentType<{ className?: string }> };

export function PanelLayout({
  rolesPermitidos,
  titulo,
  nav,
  children,
}: {
  rolesPermitidos: Rol[];
  titulo: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  useAuthInit();
  const navigate = useNavigate();
  const { perfil, userId, signOut, initialized } = useAuthStore();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!initialized) return;
    if (!userId) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (perfil && !rolesPermitidos.includes(perfil.rol)) {
      navigate({ to: rolHome(perfil.rol), replace: true });
    }
  }, [initialized, userId, perfil, navigate, rolesPermitidos]);

  if (!initialized || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-sm text-muted-foreground">Tu cuenta no tiene un perfil asignado.</p>
          <button onClick={signOut} className="mt-4 text-sm underline">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (!rolesPermitidos.includes(perfil.rol)) return null;

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar desktop + drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 border-b border-border px-5 flex items-center justify-between">
          <div>
            <div className="font-bold tracking-tight">Puerto Rico</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{titulo}</div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm text-muted-foreground hidden lg:block">{titulo}</div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{perfil.nombre || perfil.email}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{perfil.rol}</div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/login", replace: true });
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
