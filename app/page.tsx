"use client";

import Chat from "@/components/Chat";
import LanguagePicker from "@/components/LanguagePicker";
import { useChat } from "@/lib/store";

export default function Home() {
  const sessionId = useChat((s) => s.sessionId);
  return sessionId ? <Chat /> : <LanguagePicker />;
}
