import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/csv";
import { isSoundEnabled, playNewOrderChime, tryBrowserNotification } from "@/lib/notif-sound";

type Pedido = {
  id: string;
  numero_pedido: number;
  sede_id: string | null;
  estado: string;
  total: number | string;
};

type Opts = {
  /** Si está definido, sólo notifica pedidos de esta sede. */
  sedeFilterId?: string | null;
  /** Resuelve el nombre de la sede para el toast. */
  getSedeNombre?: (sedeId: string | null) => string | undefined;
  /** Mensaje para el cajero (oculta sede). */
  variant?: "cajero" | "general";
};

/**
 * Notifica (sonido + toast + notificación del navegador) cuando llegan
 * pedidos nuevos en estado `pedido_creado` o cuando un pedido vuelve a
 * `pedido_creado` por reasignación. No notifica al cargar la página.
 */
export function useNuevoPedidoNotifier(opts: Opts = {}) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  // Evita disparar dos veces el mismo evento si llegan duplicados.
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handle = (pedido: Pedido, motivo: "nuevo" | "reasignado") => {
      const o = optsRef.current;
      if (o.sedeFilterId !== undefined && o.sedeFilterId !== null) {
        if (pedido.sede_id !== o.sedeFilterId) return;
      }
      const dedupeKey = `${pedido.id}:${motivo}:${pedido.sede_id ?? ""}`;
      if (seenRef.current.has(dedupeKey)) return;
      seenRef.current.add(dedupeKey);
      // Limpieza ligera.
      if (seenRef.current.size > 500) {
        seenRef.current = new Set(Array.from(seenRef.current).slice(-200));
      }

      const total = formatMoney(Number(pedido.total) || 0);
      const sedeNombre = o.getSedeNombre?.(pedido.sede_id) || "Sede";
      const title =
        o.variant === "cajero"
          ? motivo === "reasignado"
            ? "Pedido reasignado a tu sede"
            : "Nuevo pedido en tu sede"
          : motivo === "reasignado"
          ? "Pedido reasignado"
          : "Nuevo pedido recibido";
      const body =
        o.variant === "cajero"
          ? `Pedido #${pedido.numero_pedido} · S/ ${total.replace(/^S\/\s?/, "")}`
          : `Pedido #${pedido.numero_pedido} · ${sedeNombre} · S/ ${total.replace(/^S\/\s?/, "")}`;

      if (isSoundEnabled()) {
        playNewOrderChime();
        tryBrowserNotification(title, body);
      }
      toast.success(title, { description: body });
    };

    const channel = supabase
      .channel(`nuevo-pedido-notifier-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos" },
        (payload) => {
          const p = payload.new as Pedido;
          if (p?.estado === "pedido_creado") handle(p, "nuevo");
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos" },
        (payload) => {
          const nuevo = payload.new as Pedido;
          const viejo = payload.old as Partial<Pedido>;
          if (!nuevo) return;
          if (nuevo.estado !== "pedido_creado") return;
          if (viejo?.estado === "pedido_creado" && viejo?.sede_id === nuevo.sede_id) return;
          handle(nuevo, "reasignado");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
