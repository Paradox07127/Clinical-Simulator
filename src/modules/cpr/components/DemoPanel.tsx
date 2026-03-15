import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowDownUp,
  RotateCcw,
  Timer,
  Hand,
  Grip,
  BookOpen,
} from 'lucide-react';
import { AHA_BLS_GUIDELINES } from '../data/GuidelineReference';

interface DemoPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  compression_rate: <Activity className="w-4 h-4" />,
  compression_depth: <ArrowDownUp className="w-4 h-4" />,
  chest_recoil: <RotateCcw className="w-4 h-4" />,
  compression_fraction: <Timer className="w-4 h-4" />,
  hand_position: <Hand className="w-4 h-4" />,
  arm_position: <Grip className="w-4 h-4" />,
  cycle_switch: <Timer className="w-4 h-4" />,
};

export default function DemoPanel({ isOpen, onToggle }: DemoPanelProps) {
  return (
    <div className="pt-4 border-t border-[#141414]/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-[#141414]/5 rounded-xl border border-[#141414]/10 hover:bg-[#141414]/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            CPR Quick Reference
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-2">
              {AHA_BLS_GUIDELINES.map(param => (
                <div
                  key={param.id}
                  className="p-3 bg-white border border-[#141414]/10 rounded-xl space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-[#141414]/60">
                      {ICON_MAP[param.id] ?? <Activity className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {param.name}
                    </span>
                    <span className="ml-auto text-[10px] font-mono font-bold text-emerald-700">
                      {param.target}
                      {param.unit ? ` ${param.unit}` : ''}
                    </span>
                  </div>
                  <p className="text-[9px] opacity-60 pl-6">{param.description}</p>
                </div>
              ))}

              <div className="p-2 text-center">
                <span className="text-[8px] font-mono uppercase tracking-widest opacity-30">
                  Source: AHA 2020 BLS Guidelines
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
