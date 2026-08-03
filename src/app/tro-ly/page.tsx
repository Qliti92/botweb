import type { Metadata } from "next";
import { ChatApp } from "@/components/chat-app";
import { InstallAppPrompt } from "@/components/install-app-prompt";

export const metadata: Metadata = {
  title: "Em Ry - Trợ lý hoàn tiền",
  robots: { index: false, follow: false }
};

export default function AssistantPage() {
  return <><ChatApp /><InstallAppPrompt /></>;
}
