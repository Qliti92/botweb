"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ServiceWorkerRegistration() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.startsWith("/webview")) return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {
      // The website remains usable when service workers are unavailable.
    });
  }, [pathname]);

  return null;
}
