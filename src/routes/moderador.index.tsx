import { createFileRoute } from "@tanstack/react-router";
import { PedidosTable } from "@/components/PedidosTable";

export const Route = createFileRoute("/moderador/")({
  component: () => <PedidosTable scope="all" canChangeEstado />,
});
