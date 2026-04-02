import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const YOUTUBE_VIDEO_ID = 'M4ACYp75mjU';

export default function DemoVideoModal({ isOpen, onClose }: DemoVideoModalProps) {
  const { t } = useTranslation();

  const keyPoints = [
    { time: '0:00', text: t('cpr.keyPoint1') },
    { time: '0:15', text: t('cpr.keyPoint2') },
    { time: '0:25', text: t('cpr.keyPoint3') },
    { time: '0:35', text: t('cpr.keyPoint4') },
  ];
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
                <h2 className="text-lg font-bold uppercase tracking-widest text-[#E4E3E0]">{t('cpr.cprDemo')}</h2>
                <p className="text-[9px] font-mono uppercase tracking-widest text-[#E4E3E0]/50">{t('cpr.ahaCpr')}</p>
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
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('cpr.keyPoints')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {keyPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-[#141414]/10">
                    <span className="text-[9px] font-mono bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded shrink-0">{point.time}</span>
                    <span className="text-[10px] leading-tight">{point.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#141414]/10">
                <p className="text-[8px] font-mono uppercase opacity-40">{t('cpr.ahaSource')}</p>
                <a
                  href="https://cpr.heart.org/en/cpr-courses-and-kits/hands-only-cpr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity"
                >
                  {t('cpr.ahaResources')} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
