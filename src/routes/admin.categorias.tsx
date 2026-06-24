import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { SimpleCrud } from "@/components/SimpleCrud";

export const Route = createFileRoute("/admin/categorias")({
  component: () => (
    <SimpleCrud
      title="Categorías"
      table="categorias"
      fields={[
        { name: "nombre", label: "Nombre", type: "text", required: true },
        {
          name: "grupo",
          label: "Grupo",
          type: "select",
          required: true,
          options: [
            { label: "Licores", value: "Licores" },
            { label: "Bebidas", value: "Bebidas" },
            { label: "Cigarros y Vapes", value: "Cigarros y Vapes" },
            { label: "Complementos", value: "Complementos" },
          ],
        },
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "orden", label: "Orden", type: "number" },
        { name: "activo", label: "Activo", type: "boolean", defaultValue: true },
      ]}
      listColumns={["nombre", "grupo", "slug", "orden", "activo"]}
      orderBy="nombre"
      renderCell={{
        activo: (row) =>
          row.activo ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          ),
      }}
    />
  ),
});
