'use client';

import { motion } from 'framer-motion';

const COLORS: Record<string, string> = {
  APPROVED: 'text-forest',
  RELEASED: 'text-forest',
  DISPUTED: 'text-seal',
  RESOLVED: 'text-forest',
  REFUNDED: 'text-seal',
};

export default function StampBadge({ label }: { label: string }) {
  const color = COLORS[label.toUpperCase()] ?? 'text-ink';
  return (
    <motion.span
      key={label}
      initial={{ scale: 2.2, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: -6, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      className={`seal-stamp ${color} text-xs sm:text-sm`}
    >
      {label}
    </motion.span>
  );
}
