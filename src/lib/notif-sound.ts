// Utilidades para sonido + preferencia de notificaciones de nuevos pedidos.

const STORAGE_KEY = "pro-notif-sound-enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const v = window.localStorage.getItem(STORAGE_KEY);
  // Por defecto activado.
  return v === null ? true : v === "1";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  window.dispatchEvent(new CustomEvent("pro-notif-sound-changed", { detail: enabled }));
}

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Reproduce un "ding" corto y elegante (dos notas). */
export function playNewOrderChime() {
  const ac = getCtx();
  if (!ac) return;
  try {
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const now = ac.currentTime;
    const notes = [
      { f: 880, t: 0, d: 0.18 },   // A5
      { f: 1318.5, t: 0.14, d: 0.28 }, // E6
    ];
    const master = ac.createGain();
    master.gain.value = 0.0001;
    master.connect(ac.destination);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    for (const n of notes) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = n.f;
      g.gain.value = 0.0001;
      g.gain.setValueAtTime(0.0001, now + n.t);
      g.gain.exponentialRampToValueAtTime(0.6, now + n.t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(g).connect(master);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }
  } catch {
    /* noop */
  }
}

export function tryBrowserNotification(title: string, body: string) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const n = new Notification(title, { body, tag: "nuevo-pedido", silent: true });
    setTimeout(() => n.close(), 6000);
  } catch {
    /* noop */
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}
