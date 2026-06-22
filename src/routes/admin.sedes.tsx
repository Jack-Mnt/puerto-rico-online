import { createFileRoute } from "@tanstack/react-router";
import { SimpleCrud } from "@/components/SimpleCrud";

export const Route = createFileRoute("/admin/sedes")({
  component: () => (
    <SimpleCrud
      title="Sedes"
      table="sedes"
      fields={[
        { name: "nombre", label: "Nombre", type: "text", required: true },
        { name: "direccion", label: "Dirección", type: "text" },
        { name: "telefono", label: "Teléfono", type: "text" },
        { name: "whatsapp", label: "WhatsApp", type: "text" },
        { name: "activo", label: "Activo", type: "boolean", defaultValue: true },
      ]}
      listColumns={["nombre", "direccion", "telefono", "activo"]}
      orderBy="nombre"
    />
  ),
});
