import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListOrdered, History } from "lucide-react";
import { PanelLayout, type NavItem } from "@/components/PanelLayout";

const nav: NavItem[] = [
  { to: "/moderador", label: "Operaciones", icon: ListOrdered },
  { to: "/moderador/historial", label: "Historial", icon: History },
];

export const Route = createFileRoute("/moderador")({
  component: () => (
    <PanelLayout rolesPermitidos={["moderador", "admin"]} titulo="Centro operativo" nav={nav}>
      <Outlet />
    </PanelLayout>
  ),
});
