"use client";

import { motion } from "framer-motion";
import Icon from "./Icon";
import type { ChatOption } from "@/lib/types";

export default function OptionButton({
  option,
  index,
  disabled,
  onSelect,
}: {
  option: ChatOption;
  index: number;
  disabled: boolean;
  onSelect: (option: ChatOption) => void;
}) {
  const isCall = option.action?.type === "call";
  const isNav = option.id === "main_menu" || option.id === "back";

  const tone = isCall
    ? "bg-red-600 text-white border-red-600 active:bg-red-700"
    : isNav
      ? "bg-stone-100 text-stone-600 border-stone-200 active:bg-stone-200"
      : "bg-white text-stone-800 border-stone-200 active:bg-amber-50 active:border-amber-300";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.25 }}
      whileTap={{ scale: 0.97 }}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left shadow-sm transition-colors disabled:opacity-50 ${tone}`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          isCall ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
        }`}
      >
        <Icon name={option.icon} size={26} />
      </span>
      <span className="text-lg font-semibold leading-snug">{option.label}</span>
    </motion.button>
  );
}
