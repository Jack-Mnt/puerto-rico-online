import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListOrdered } from "lucide-react";
import { PanelLayout, type NavItem } from "@/components/PanelLayout";

const nav: NavItem[] = [
  { to: "/moderador", label: "Pedidos", icon: ListOrdered },
];

export const Route = createFileRoute("/moderador")({
  component: () => (
    <PanelLayout rolesPermitidos={["moderador", "admin"]} titulo="Centro operativo" nav={nav}>
      <Outlet />
    </PanelLayout>
  ),
});
