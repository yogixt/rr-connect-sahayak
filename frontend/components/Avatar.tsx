"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * The electrician mascot as a round badge. Idle animation: a gentle "breathing"
 * scale plus an occasional friendly tilt/wiggle. When `draggable`, the user can
 * grab and fling the badge and it springs back — the drag transform lives on the
 * outer layer so it never fights the idle animation on the inner layer.
 */
export default function Avatar({
  size = 120,
  draggable = false,
}: {
  size?: number;
  draggable?: boolean;
}) {
  const badge = (
    <motion.div
      animate={{ rotate: [0, -5, 5, -3, 0], scale: [1, 1.04, 1] }}
      transition={{
        rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 },
        scale: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{ width: size, height: size }}
      className="relative overflow-hidden rounded-full bg-gradient-to-b from-amber-100 to-white shadow-lg ring-4 ring-white"
    >
      <Image
        src="/electrician.png"
        alt="Sahayak"
        fill
        sizes={`${size}px`}
        priority
        draggable={false}
        style={{ objectFit: "cover", objectPosition: "50% 16%", pointerEvents: "none", userSelect: "none" }}
      />
    </motion.div>
  );

  if (!draggable) return badge;

  return (
    <motion.div
      drag
      dragSnapToOrigin
      dragElastic={0.5}
      whileTap={{ scale: 0.94 }}
      whileDrag={{ scale: 1.08 }}
      style={{ width: size, height: size, cursor: "grab", touchAction: "none" }}
      className="active:cursor-grabbing"
    >
      {badge}
    </motion.div>
  );
}
