import type { Metadata } from "next";
import { ChatApp } from "@/components/chat-app";
import { InstallAppPrompt } from "@/components/install-app-prompt";

export const metadata: Metadata = {
  title: "Trang chủ cũ",
  robots: { index: false, follow: false }
};

export default function ClassicHomepageArchive() {
  return <><ChatApp /><InstallAppPrompt /></>;
}
