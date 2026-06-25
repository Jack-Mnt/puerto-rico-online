import { createFileRoute } from "@tanstack/react-router";
import { ModeradorHistorial } from "./moderador.historial";

export const Route = createFileRoute("/admin/operacion/historial")({
  component: ModeradorHistorial,
});
