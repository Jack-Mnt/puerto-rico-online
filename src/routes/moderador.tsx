import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListOrdered, BarChart3 } from "lucide-react";
import { PanelLayout, type NavItem } from "@/components/PanelLayout";

const nav: NavItem[] = [
  { to: "/moderador", label: "Pedidos", icon: ListOrdered },
  { to: "/moderador/reportes", label: "Reportes", icon: BarChart3 },
];

export const Route = createFileRoute("/moderador")({
  component: () => (
    <PanelLayout rolesPermitidos={["moderador", "admin"]} titulo="Panel Moderador" nav={nav}>
      <Outlet />
    </PanelLayout>
  ),
});
