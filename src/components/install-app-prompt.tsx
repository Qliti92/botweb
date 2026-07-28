"use client";

import { useEffect, useState } from "react";
import { Check, Download, PlusSquare, Share2, Smartphone, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const dismissedKey = "install_prompt_dismissed_at";
const dismissDuration = 3 * 24 * 60 * 60 * 1000;
const iosSteps = [
  "Mở ứng dụng Safari trên iPhone.",
  "Nhập qbot.vn rồi chạm nút menu phía dưới.",
  "Chạm Chia sẻ.",
  "Chạm Thêm vào Màn hình chính.",
  "Chạm Thêm. Sau đó mở Em Ry từ màn hình iPhone."
];

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIos(ios);
    if (!mobile || isStandalone()) return;

    const dismissedAt = Number(window.localStorage.getItem(dismissedKey) || 0);
    if (Date.now() - dismissedAt < dismissDuration) return;

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setTimeout(() => setVisible(true), 1200);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function close() {
    window.localStorage.setItem(dismissedKey, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (isIos || !installEvent) {
      setShowInstructions(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    } else {
      close();
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="install-app-title">
      <section className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <img src="/api/site-assets/logo" alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-white object-cover ring-1 ring-neutral-200" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#287a63]">Em Ry trên điện thoại</p>
            <h2 id="install-app-title" className="mt-1 text-lg font-bold leading-6 text-[#30343b]">{isIos ? "Đưa Em Ry ra màn hình iPhone" : "Cài đặt ứng dụng để nhận hoàn tiền nhanh hơn"}</h2>
          </div>
          <button type="button" onClick={close} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!showInstructions ? (
          <>
            <div className="mt-5 grid gap-3 text-base text-neutral-700">
              <p className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[#287a63]" /> Không tốn dung lượng</p>
              <p className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[#287a63]" /> Không mất phí cài đặt</p>
              <p className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[#287a63]" /> Chạm biểu tượng để mở nhanh</p>
            </div>
            {isIos ? <p className="mt-4 rounded-xl bg-[#f1f7f4] p-3 text-sm leading-6 text-neutral-700">iPhone không có nút cài tự động. Hãy xem hình và làm lần lượt theo hướng dẫn.</p> : null}
            <button type="button" onClick={install} className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#287a63] px-5 text-base font-bold text-white shadow-lg">
              {isIos ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
              {isIos ? "Xem cách cài trên iPhone" : "Cài đặt ngay"}
            </button>
            <button type="button" onClick={close} className="mt-2 h-12 w-full rounded-xl text-sm font-semibold text-neutral-500">Để sau</button>
          </>
        ) : (
          <div className="mt-5">
            <p className="text-base font-bold text-[#30343b]">{isIos ? "Cài Em Ry trên iPhone" : "Cài Em Ry trên Android"}</p>
            {isIos ? (
              <>
                <p className="mt-1 text-sm leading-6 text-neutral-600">Mỗi bước chỉ cần chạm vào chỗ có vòng màu cam.</p>
                <img
                  src="/images/tutorials/install-iphone-pwa.webp"
                  alt="Cách thêm Em Ry vào màn hình chính trên iPhone"
                  className="mt-4 h-auto w-full rounded-2xl border border-neutral-200"
                />
                <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {iosSteps.map((step, index) => (
                    <li key={step} className="flex gap-3 rounded-xl bg-neutral-50 p-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#287a63] text-sm font-bold text-white">{index + 1}</span>
                      <p className="pt-1 text-sm leading-5 text-neutral-700">{step}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 rounded-xl border border-[#d6e4de] bg-[#f1f7f4] p-3 text-sm font-semibold leading-6 text-[#216653]">Cài xong, bạn chỉ cần chạm biểu tượng Em Ry trên màn hình iPhone để truy cập như ứng dụng bình thường.</p>
              </>
            ) : (
              <div className="mt-3 grid gap-3">
                <div className="flex gap-3 rounded-xl bg-neutral-50 p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#287a63] shadow-sm"><Share2 className="h-5 w-5" /></span>
                  <p className="text-sm leading-6 text-neutral-700">Mở menu ⋮ của Chrome ở góc trên.</p>
                </div>
                <div className="flex gap-3 rounded-xl bg-neutral-50 p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#287a63] shadow-sm"><PlusSquare className="h-5 w-5" /></span>
                  <p className="text-sm leading-6 text-neutral-700">Chọn <strong>Thêm vào Màn hình chính</strong>, sau đó bấm <strong>Thêm</strong>.</p>
                </div>
              </div>
            )}
            <button type="button" onClick={close} className="sticky bottom-0 mt-5 h-14 w-full rounded-xl bg-[#287a63] text-base font-bold text-white shadow-lg">{isIos ? "Đã hiểu, tôi sẽ làm theo" : "Tôi đã hiểu"}</button>
          </div>
        )}
      </section>
    </div>
  );
}
