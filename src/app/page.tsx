import { ChatApp } from "@/components/chat-app";
import { InstallAppPrompt } from "@/components/install-app-prompt";

export default function HomePage() {
  return (
    <>
      <ChatApp />
      <InstallAppPrompt />
    </>
  );
}
