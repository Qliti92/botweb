import type { Metadata } from "next";
import { DoiDiemWebView } from "@/components/doidiem-webview";

export const metadata: Metadata = {
  title: "Rút tiền hoàn",
  robots: { index: false, follow: false }
};

export default function DoiDiemPage() {
  return <DoiDiemWebView />;
}
