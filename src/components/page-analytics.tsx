"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const visitorKey = "qbot_visitor_id";

export function PageAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/webview")) return;

    let visitorId = localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(visitorKey, visitorId);
    }
    document.cookie = `qbot_vid=${encodeURIComponent(visitorId)}; Path=/; Max-Age=31536000; SameSite=Lax`;

    const startedAt = Date.now();
    let visitId = "";
    let interacted = false;
    let stopped = false;

    const markInteraction = () => { interacted = true; };
    const interactionEvents = ["click", "input", "scroll", "keydown"] as const;
    interactionEvents.forEach((event) => window.addEventListener(event, markInteraction, { passive: true, once: true }));

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "start",
        visitorId,
        path: pathname,
        referrer: document.referrer
      })
    }).then((response) => response.ok ? response.json() : null)
      .then((data) => { visitId = String(data?.visitId || ""); })
      .catch(() => {});

    const update = (keepalive = false) => {
      if (!visitId || stopped) return;
      void fetch("/api/analytics/visit", {
        method: "POST",
        keepalive,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "update",
          visitorId,
          visitId,
          durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
          interacted
        })
      }).catch(() => {});
    };

    const timer = window.setInterval(() => update(), 15_000);
    const onPageHide = () => update(true);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      update(true);
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
      interactionEvents.forEach((event) => window.removeEventListener(event, markInteraction));
    };
  }, [pathname]);

  return null;
}
