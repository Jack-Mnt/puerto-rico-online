import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListOrdered } from "lucide-react";
import { PanelLayout, type NavItem } from "@/components/PanelLayout";

const nav: NavItem[] = [
  { to: "/cajero", label: "Pedidos del día", icon: ListOrdered },
];

export const Route = createFileRoute("/cajero")({
  component: () => (
    <PanelLayout rolesPermitidos={["cajero", "admin"]} titulo="Panel Cajero" nav={nav}>
      <Outlet />
    </PanelLayout>
  ),
});
