"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import Icon from "./Icon";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import OptionButton from "./OptionButton";
import PincodeKeypad from "./PincodeKeypad";
import TypingDots from "./TypingDots";
import { useChat } from "@/lib/store";

export default function Chat() {
  const { messages, busy, language, languages, role, choose, switchLanguage, begin, reset, error } =
    useChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const lastBot = [...messages].reverse().find((m) => m.role === "bot");
  const options = !busy ? lastBot?.options ?? [] : [];

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-amber-50/40">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <Avatar size={44} src="/electrician-classic.png" />
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight text-stone-900">RR Connect Sahayak</h1>
          {role ? (
            <span className="inline-block rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {role === "KD" ? (language === "hi" ? "इलेक्ट्रिशियन" : "Electrician") : "Retailer"}
            </span>
          ) : (
            <p className="text-xs text-stone-400">Always here to help</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => switchLanguage(l.code)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                  l.code === language
                    ? "bg-red-600 text-white"
                    : "bg-stone-100 text-stone-500 active:bg-stone-200"
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => language && begin(language)}
            disabled={busy}
            aria-label="Restart chat"
            title="Restart chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 active:bg-stone-200 disabled:opacity-50"
          >
            <Icon name="refresh" size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Icon name="chat" size={20} className="text-amber-700" />
              </span>
              <div className="rounded-3xl rounded-bl-md border border-stone-200 bg-white shadow-sm">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div ref={endRef} />
      </div>

      {/* Options */}
      <div className="space-y-2.5 border-t border-stone-200 bg-white px-4 py-4">
        <AnimatePresence mode="popLayout">
          {options.map((opt, i) => (
            <OptionButton key={opt.id} option={opt} index={i} disabled={busy} onSelect={choose} />
          ))}
        </AnimatePresence>
        {options.length === 0 && !busy && (
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-2xl border-2 border-stone-200 px-5 py-3 text-base font-semibold text-stone-500 active:bg-stone-100"
          >
            Restart
          </button>
        )}
      </div>

      <PincodeKeypad language={language ?? "hi"} />
    </div>
  );
}
