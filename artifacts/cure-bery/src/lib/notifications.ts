export type NotifPermission = "granted" | "denied" | "default";

export async function requestNotifPermission(): Promise<NotifPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

export function getNotifPermission(): NotifPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission as NotifPermission;
}

interface ShowNotifOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function showNotification({ title, body, icon, tag, onClick }: ShowNotifOptions): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notif = new Notification(title, {
    body,
    icon: icon ?? "/favicon.ico",
    tag: tag ?? "curebery-notif",
    badge: "/favicon.ico",
  });

  if (onClick) {
    notif.onclick = () => {
      window.focus();
      notif.close();
      onClick();
    };
  }

  setTimeout(() => notif.close(), 8000);
}

export function notifyNurseNewOrder(patientName: string, service: string, onClick?: () => void): void {
  showNotification({
    title: "🔔 Order Baru Masuk!",
    body: `${patientName} membutuhkan ${service}. Segera konfirmasi!`,
    tag: "new-order",
    onClick,
  });
}

export function notifyNurseConnectRequest(nurseName: string, onClick?: () => void): void {
  showNotification({
    title: "👋 Ajakan Terhubung",
    body: `${nurseName} ingin terhubung dengan Anda`,
    tag: "connect-request",
    onClick,
  });
}
