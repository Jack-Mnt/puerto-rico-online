import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Subscribe to realtime changes on pedidos, detalle_pedidos e historial_pedidos.
 * Invalida las queries indicadas para refrescar el panel sin recargar.
 */
export function useRealtimePedidos(invalidateKeys: (string | (string | undefined)[])[]) {
  const qc = useQueryClient();

  // Serializa las keys para que el effect no se reejecute en cada render.
  const keysSerialized = JSON.stringify(invalidateKeys);

  useEffect(() => {
    const keys = JSON.parse(keysSerialized) as (string | (string | undefined)[])[];

    const invalidateAll = () => {
      for (const k of keys) {
        qc.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] });
      }
    };

    const channel = supabase
      .channel(`pedidos-realtime-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        invalidateAll,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "detalle_pedidos" },
        invalidateAll,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "historial_pedidos" },
        invalidateAll,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, keysSerialized]);
}
