import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mất kết nối",
  robots: { index: false, follow: false }
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
