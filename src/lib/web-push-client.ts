"use client";

const publicKey =
  process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_KEY ||
  "BM_6jbbW8ANIcPRXq_khHdmFYxr26lvh6CrDcceZ0yS13npv4Bs8d1KhG_WqO-c1hpPLuBsGqB3ppRTyUIMvMBc";
const subscriptionVersionKey = "tranquan_web_push_v1";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = window.atob(base64);
  return Uint8Array.from(bytes, (char) => char.charCodeAt(0));
}

export function isWebPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getCurrentPushSubscription() {
  if (!isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const subscription = await registration.pushManager.getSubscription();
  if (subscription && window.localStorage.getItem(subscriptionVersionKey) !== "1") {
    await subscription.unsubscribe();
    return null;
  }
  return subscription;
}

export async function registerForPushNotifications() {
  if (!isWebPushSupported()) throw new Error("Trình duyệt này chưa hỗ trợ Web Push.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Bạn chưa cho phép nhận thông báo.");

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(publicKey)
    }));
  window.localStorage.setItem(subscriptionVersionKey, "1");
  return subscription;
}

export async function unregisterFromPushNotifications() {
  const subscription = await getCurrentPushSubscription();
  if (subscription) await subscription.unsubscribe();
  window.localStorage.removeItem(subscriptionVersionKey);
  return subscription?.endpoint ?? null;
}
