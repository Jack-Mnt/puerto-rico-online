import { createFileRoute } from "@tanstack/react-router";
import { ModeradorKanban } from "./moderador.index";

export const Route = createFileRoute("/admin/operacion")({
  component: ModeradorKanban,
});
