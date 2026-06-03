"use client";

import { motion } from "framer-motion";

export default function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-5 py-4" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2.5 w-2.5 rounded-full bg-stone-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}
