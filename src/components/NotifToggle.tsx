import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import {
  isSoundEnabled,
  setSoundEnabled,
  requestNotificationPermission,
  playNewOrderChime,
} from "@/lib/notif-sound";

export function NotifToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => isSoundEnabled());

  useEffect(() => {
    const onChange = (e: Event) => {
      const v = (e as CustomEvent<boolean>).detail;
      setEnabled(typeof v === "boolean" ? v : isSoundEnabled());
    };
    window.addEventListener("pro-notif-sound-changed", onChange as EventListener);
    return () => window.removeEventListener("pro-notif-sound-changed", onChange as EventListener);
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      // Reproducir un chime corto sirve además para "desbloquear" el AudioContext.
      playNewOrderChime();
      const perm = await requestNotificationPermission();
      if (perm === "denied") {
        toast.message("Notificaciones del navegador bloqueadas", {
          description: "El sonido seguirá funcionando dentro de la página.",
        });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={enabled ? "Sonido activado" : "Sonido desactivado"}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        enabled
          ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          : "border-border bg-card text-muted-foreground hover:bg-muted"
      }`}
    >
      {enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{enabled ? "Sonido activado" : "Sonido desactivado"}</span>
    </button>
  );
}
