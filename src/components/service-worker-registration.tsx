"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {
      // The website remains usable when service workers are unavailable.
    });
  }, []);

  return null;
}
