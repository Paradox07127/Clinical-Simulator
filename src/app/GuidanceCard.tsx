import React from 'react';
import { motion } from 'motion/react';
import { Info, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

export interface GuidanceCardProps {
  title: string;
  description: string;
  tips?: string[];
  variant?: 'info' | 'action' | 'success' | 'warning';
}

const VARIANT_CONFIG = {
  info: {
    bar: 'bg-[#141414]',
    bg: 'bg-white',
    border: 'border-[#141414]/15',
    title: 'text-[#141414]',
    text: 'text-[#141414]/75',
    icon: Info,
  },
  action: {
    bar: 'bg-[#0d9488]',
    bg: 'bg-[#0d9488]/[0.06]',
    border: 'border-[#0d9488]/20',
    title: 'text-[#0d9488]',
    text: 'text-[#0d9488]/90',
    icon: Zap,
  },
  success: {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    title: 'text-emerald-800',
    text: 'text-emerald-700',
    icon: CheckCircle,
  },
  warning: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'text-amber-800',
    text: 'text-amber-700',
    icon: AlertTriangle,
  },
} as const;

export default function GuidanceCard({
  title,
  description,
  tips,
  variant = 'info',
}: GuidanceCardProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className={`flex overflow-hidden rounded-xl border shadow-[4px_4px_0px_0px_rgba(20,20,20,0.08)] ${config.border} ${config.bg}`}
    >
      <div className={`w-1 shrink-0 ${config.bar}`} />
      <div className="min-w-0 space-y-2 p-3.5">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${config.title}`} />
          <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${config.title}`}>
            {title}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${config.text}`}>{description}</p>
        {tips && tips.length > 0 && (
          <ul className="space-y-1 pt-0.5">
            {tips.map((tip, i) => (
              <li key={i} className={`flex items-start gap-2 text-xs ${config.text} opacity-85`}>
                <span className="mt-0.5 shrink-0">&#8226;</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
