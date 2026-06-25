import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Tags,
  Award,
  Image,
  Building2,
  Users,
  Settings,
  ListOrdered,
  BarChart3,
  Radio,
} from "lucide-react";
import { PanelLayout, type NavItem } from "@/components/PanelLayout";

const nav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/pedidos", label: "Pedidos", icon: ListOrdered },
  { to: "/admin/operacion", label: "Centro de operaciones", icon: Radio },
  { to: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/categorias", label: "Categorías", icon: Tags },
  { to: "/admin/marcas", label: "Marcas", icon: Award },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/sedes", label: "Sedes", icon: Building2 },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  component: () => (
    <PanelLayout rolesPermitidos={["admin"]} titulo="Panel Admin" nav={nav}>
      <Outlet />
    </PanelLayout>
  ),
});
