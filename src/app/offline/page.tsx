"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

export default function OfflinePage() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f6f8] px-4 py-10 text-[#30343b]">
      <section className="w-full max-w-lg rounded-3xl border border-[#d6e4de] bg-white p-6 text-center shadow-[0_24px_70px_rgba(48,52,59,.11)] sm:p-8">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eef3f1] text-[#287a63]"><WifiOff className="h-8 w-8" /></span>
        <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-[#287a63]">Mất kết nối</p>
        <h1 className="mt-2 text-2xl font-bold">Bạn đang ngoại tuyến</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">Hãy kiểm tra Wi-Fi hoặc dữ liệu di động. Link sản phẩm đang chờ xử lý vẫn được giữ trên thiết bị và sẽ không bị mất.</p>
        <div className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${online ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {online ? "Đã có kết nối. Bạn có thể thử lại ngay." : "Chưa phát hiện kết nối mạng."}
        </div>
        <button type="button" onClick={() => window.location.href = "/"} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] px-4 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" /> {online ? "Tiếp tục với Em Ry" : "Kiểm tra lại kết nối"}</button>
      </section>
    </main>
  );
}
