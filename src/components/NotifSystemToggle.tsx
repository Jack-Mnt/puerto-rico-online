import { useEffect, useState } from "react";
import { MonitorSpeaker, MonitorOff } from "lucide-react";
import { toast } from "sonner";
import {
  isSystemNotifEnabled,
  setSystemNotifEnabled,
  requestNotificationPermission,
  tryBrowserNotification,
} from "@/lib/notif-sound";

export function NotifSystemToggle() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "Notification" in window);
    setEnabled(isSystemNotifEnabled());
    const onChange = () => setEnabled(isSystemNotifEnabled());
    window.addEventListener("pro-notif-system-changed", onChange);
    return () => window.removeEventListener("pro-notif-system-changed", onChange);
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    if (enabled) {
      setSystemNotifEnabled(false);
      return;
    }
    const perm = await requestNotificationPermission();
    if (perm === "granted") {
      setSystemNotifEnabled(true);
      tryBrowserNotification("Notificaciones activadas", "Te avisaremos cuando entre un nuevo pedido.");
    } else if (perm === "denied") {
      toast.error("Notificaciones bloqueadas", {
        description: "Habilítalas desde la configuración del navegador para este sitio.",
      });
    } else {
      toast.message("Permiso no concedido");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={enabled ? "Notificaciones del sistema activadas" : "Activar notificaciones"}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        enabled
          ? "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
          : "border-border bg-card text-muted-foreground hover:bg-muted"
      }`}
    >
      {enabled ? <MonitorSpeaker className="h-3.5 w-3.5" /> : <MonitorOff className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">
        {enabled ? "Notificaciones activadas" : "Activar notificaciones"}
      </span>
    </button>
  );
}
