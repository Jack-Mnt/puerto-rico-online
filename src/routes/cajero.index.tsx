import { createFileRoute } from "@tanstack/react-router";
import { PedidosTable } from "@/components/PedidosTable";

export const Route = createFileRoute("/cajero/")({
  component: () => <PedidosTable scope="today-sede" canChangeEstado />,
});
