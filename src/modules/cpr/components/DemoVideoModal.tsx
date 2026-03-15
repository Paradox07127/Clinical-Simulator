import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const YOUTUBE_VIDEO_ID = 'M4ACYp75mjU';

const KEY_POINTS = [
  { time: '0:00', text: 'Call 911 first (or have someone else call)' },
  { time: '0:15', text: 'Push hard and fast in the center of the chest' },
  { time: '0:25', text: 'Rate: 100-120 compressions per minute' },
  { time: '0:35', text: 'Continue until help arrives' },
];

export default function DemoVideoModal({ isOpen, onClose }: DemoVideoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#141414]/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[#E4E3E0] border-2 border-[#141414] rounded-2xl overflow-hidden shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
          >
            {/* Header */}
            <div className="bg-[#141414] p-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-widest text-[#E4E3E0]">CPR Demonstration</h2>
                <p className="text-[9px] font-mono uppercase tracking-widest text-[#E4E3E0]/50">AHA Hands-Only CPR</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#E4E3E0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
                title="AHA Hands-Only CPR Demonstration"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Key Points */}
            <div className="p-5 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Key Points</h3>
              <div className="grid grid-cols-2 gap-2">
                {KEY_POINTS.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-[#141414]/10">
                    <span className="text-[9px] font-mono bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded shrink-0">{point.time}</span>
                    <span className="text-[10px] leading-tight">{point.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#141414]/10">
                <p className="text-[8px] font-mono uppercase opacity-40">Source: American Heart Association</p>
                <a
                  href="https://cpr.heart.org/en/cpr-courses-and-kits/hands-only-cpr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity"
                >
                  AHA Resources <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
