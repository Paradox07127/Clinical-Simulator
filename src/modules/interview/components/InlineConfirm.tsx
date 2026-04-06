import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface InlineConfirmProps {
  message: string;
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'warning' | 'danger';
}

export default function InlineConfirm({
  message,
  isVisible,
  onConfirm,
  onCancel,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'warning',
}: InlineConfirmProps) {
  const colors = variant === 'danger'
    ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-500', btn: 'bg-red-500 hover:bg-red-600 text-white', btnBorder: 'border-red-300 text-red-700 hover:bg-red-50' }
    : { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600 text-white', btnBorder: 'border-amber-300 text-amber-700 hover:bg-amber-50' };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={`${colors.bg} ${colors.border} border rounded-xl p-3 space-y-2.5`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 ${colors.icon} shrink-0 mt-0.5`} />
              <p className={`text-xs leading-relaxed ${colors.text} flex-1`}>{message}</p>
              <button onClick={onCancel} className="opacity-40 hover:opacity-80 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <button
                onClick={onConfirm}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${colors.btn}`}
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-colors ${colors.btnBorder}`}
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
