"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import Avatar from "./Avatar";
import { useChat } from "@/lib/store";
import type { LangCode } from "@/lib/types";

const PROMPT: Record<LangCode, string> = {
  hi: "अपनी भाषा चुनें",
  en: "Choose your language",
};

export default function LanguagePicker() {
  const { languages, loadLanguages, begin, busy } = useChat();

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-3"
      >
        <Avatar size={160} draggable />
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">RR Connect Sahayak</h1>
        <p className="text-lg text-stone-500">{PROMPT.hi} · {PROMPT.en}</p>
      </motion.div>

      <div className="grid w-full max-w-sm gap-3">
        {languages.map((lang, i) => (
          <motion.button
            key={lang.code}
            type="button"
            disabled={busy}
            onClick={() => begin(lang.code)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-between rounded-2xl border-2 border-stone-200 bg-white px-6 py-5 shadow-sm transition-colors active:border-amber-300 active:bg-amber-50 disabled:opacity-50"
          >
            <span className="text-2xl font-bold text-stone-900">{lang.native}</span>
            <span className="text-base font-medium text-stone-400">{lang.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
