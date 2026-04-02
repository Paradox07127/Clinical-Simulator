import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Heart, Camera, Cpu, Activity, ShieldCheck } from 'lucide-react';

export default function CprLoadingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const steps = [
    { icon: <Cpu className="w-3 h-3" />, text: t('cpr.loadingPoseModel') },
    { icon: <Camera className="w-3 h-3" />, text: t('cpr.requestingCamera') },
    { icon: <Activity className="w-3 h-3" />, text: t('cpr.calibrating') },
    { icon: <Heart className="w-3 h-3" />, text: t('cpr.preparingScenario') },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="absolute inset-0 z-50 bg-[#E4E3E0] flex flex-col border-2 border-[#141414] rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
      {/* Header */}
      <div className="bg-[#141414] p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#E4E3E0] animate-pulse" />
          <span className="text-[10px] font-mono text-[#E4E3E0] uppercase tracking-widest font-bold">
            {t('cpr.preparingTraining')}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#E4E3E0]/30" />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col relative">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex-1 flex flex-col">
          {/* Spinner */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <div className="relative w-32 h-32">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-2 border-[#141414] border-dashed rounded-xl"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 border border-[#141414]/20 rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="w-8 h-8 text-[#141414] opacity-20" />
              </div>
              <motion.div
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-2 right-2 h-[2px] bg-[#141414] z-20 shadow-[0_0_10px_rgba(20,20,20,0.2)]"
              />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <span className="text-[9px] font-mono text-[#141414]/40 uppercase tracking-widest">
                  {t('cpr.setupProgress')}
                </span>
                <span className="text-[10px] font-mono text-[#141414] font-bold">
                  {Math.round(((step + 1) / steps.length) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-white border-2 border-[#141414] rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-[#141414] rounded-full"
                />
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-opacity duration-300 ${
                    i > step ? 'opacity-10' : 'opacity-100'
                  }`}
                >
                  <div
                    className={`w-5 h-5 border border-[#141414] flex items-center justify-center rounded ${
                      i === step
                        ? 'bg-[#141414] text-[#E4E3E0]'
                        : 'bg-white text-[#141414]'
                    }`}
                  >
                    {i < step ? <ShieldCheck className="w-3 h-3" /> : s.icon}
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider ${
                      i === step ? 'font-bold' : ''
                    }`}
                  >
                    {s.text}
                  </span>
                  {i === step && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="ml-auto w-1.5 h-1.5 bg-[#141414] rounded-full"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/50 border-t border-[#141414]/10 p-3 flex justify-between items-center">
        <div className="text-[7px] font-mono text-[#141414]/30 uppercase tracking-tighter">
          {t('cpr.visionModel')}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <div className="text-[7px] font-mono text-[#141414]/30 uppercase tracking-tighter">
            {t('cpr.cameraCheck')}
          </div>
        </div>
      </div>
    </div>
  );
}
