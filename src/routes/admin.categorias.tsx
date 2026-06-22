import { createFileRoute } from "@tanstack/react-router";
import { SimpleCrud } from "@/components/SimpleCrud";

export const Route = createFileRoute("/admin/categorias")({
  component: () => (
    <SimpleCrud
      title="Categorías"
      table="categorias"
      fields={[
        { name: "nombre", label: "Nombre", type: "text", required: true },
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "orden", label: "Orden", type: "number" },
        { name: "activo", label: "Activo", type: "boolean", defaultValue: true },
      ]}
      listColumns={["nombre", "slug", "orden", "activo"]}
      orderBy="nombre"
    />
  ),
});
