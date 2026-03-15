import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'outline' | 'ghost';
  size?: 'default' | 'compact';
  className?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function BackActionButton({
  label,
  onClick,
  variant = 'outline',
  size = 'default',
  className,
}: BackActionButtonProps) {
  const sizeClass = size === 'compact'
    ? 'px-3.5 py-2 text-[10px] tracking-[0.16em]'
    : 'px-5 py-3 text-[11px] tracking-[0.18em]';

  const variantClass = variant === 'ghost'
    ? 'border border-[#141414]/15 bg-white/70 text-[#141414] hover:border-[#141414]/35 hover:bg-white'
    : 'border border-[#141414] bg-white text-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:bg-[#141414] hover:text-[#E4E3E0] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]';

  return (
    <button
      onClick={onClick}
      className={joinClasses(
        'inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase transition-all',
        sizeClass,
        variantClass,
        className,
      )}
    >
      <ArrowLeft className={size === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{label}</span>
    </button>
  );
}
