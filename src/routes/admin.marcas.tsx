import { createFileRoute } from "@tanstack/react-router";
import { SimpleCrud } from "@/components/SimpleCrud";

export const Route = createFileRoute("/admin/marcas")({
  component: () => (
    <SimpleCrud
      title="Marcas"
      table="marcas"
      fields={[
        { name: "nombre", label: "Nombre", type: "text", required: true },
        { name: "activo", label: "Activo", type: "boolean", defaultValue: true },
      ]}
      listColumns={["nombre", "activo"]}
      orderBy="nombre"
    />
  ),
});
