"use client";

import { motion } from "framer-motion";
import Icon from "./Icon";
import RichText from "./RichText";
import type { Message } from "@/lib/store";

export default function MessageBubble({ message }: { message: Message }) {
  if (message.role !== "bot") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-3xl rounded-br-md bg-red-600 px-5 py-3 text-lg font-medium text-white shadow-sm">
          {message.text}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-2"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Icon name={message.icon} size={20} />
      </span>
      <div className="max-w-[82%] rounded-3xl rounded-bl-md border border-stone-200 bg-white px-5 py-3.5 shadow-sm">
        <RichText text={message.text} />
      </div>
    </motion.div>
  );
}
