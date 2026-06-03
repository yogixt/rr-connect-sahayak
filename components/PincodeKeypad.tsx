"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Icon from "./Icon";
import { useChat } from "@/lib/store";
import type { LangCode } from "@/lib/types";

const TITLE: Record<LangCode, string> = {
  hi: "अपना 6 अंकों का पिनकोड डालें",
  en: "Enter your 6-digit pincode",
};
const OK: Record<LangCode, string> = { hi: "ठीक है", en: "OK" };

export default function PincodeKeypad({ language }: { language: LangCode }) {
  const { pincodeOpen, submitPincode, closePincode, busy } = useChat();
  const [digits, setDigits] = useState("");

  function press(d: string) {
    if (digits.length < 6) setDigits(digits + d);
  }
  function backspace() {
    setDigits(digits.slice(0, -1));
  }
  function confirm() {
    if (digits.length === 6) {
      submitPincode(digits);
      setDigits("");
    }
  }

  return (
    <AnimatePresence>
      {pincodeOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={closePincode}
        >
          <motion.div
            initial={{ y: 320 }}
            animate={{ y: 0 }}
            exit={{ y: 320 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white px-5 pb-7 pt-4 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-200" />
            <p className="mb-4 text-center text-lg font-semibold text-stone-800">{TITLE[language]}</p>

            {/* Six-box display */}
            <div className="mb-5 flex justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-12 w-11 items-center justify-center rounded-xl border-2 text-2xl font-bold ${
                    digits[i] ? "border-red-500 text-stone-900" : "border-stone-200 text-stone-300"
                  }`}
                >
                  {digits[i] ?? ""}
                </div>
              ))}
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-2.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => press(d)}
                  className="rounded-2xl bg-stone-100 py-4 text-2xl font-bold text-stone-800 active:bg-amber-100"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={backspace}
                className="flex items-center justify-center rounded-2xl bg-stone-100 py-4 text-stone-600 active:bg-stone-200"
                aria-label="backspace"
              >
                <Icon name="back" size={26} />
              </button>
              <button
                type="button"
                onClick={() => press("0")}
                className="rounded-2xl bg-stone-100 py-4 text-2xl font-bold text-stone-800 active:bg-amber-100"
              >
                0
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={digits.length !== 6 || busy}
                className="rounded-2xl bg-red-600 py-4 text-xl font-bold text-white active:bg-red-700 disabled:opacity-40"
              >
                {OK[language]}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
