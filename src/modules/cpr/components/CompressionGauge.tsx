import { motion } from 'motion/react';

interface CompressionGaugeProps {
  currentRate: number;
  targetMin?: number;
  targetMax?: number;
}

export default function CompressionGauge({
  currentRate,
  targetMin = 100,
  targetMax = 120,
}: CompressionGaugeProps) {
  // Gauge range: 60 to 160 CPM
  const gaugeMin = 60;
  const gaugeMax = 160;
  const range = gaugeMax - gaugeMin;

  // Convert values to percentages (bottom = 0%, top = 100%)
  const rateToPercent = (rate: number) =>
    Math.max(0, Math.min(100, ((rate - gaugeMin) / range) * 100));

  const greenStart = rateToPercent(targetMin);
  const greenEnd = rateToPercent(targetMax);
  const markerPos = rateToPercent(currentRate);

  const isInTarget = currentRate >= targetMin && currentRate <= targetMax;
  const isClose =
    (currentRate >= targetMin - 10 && currentRate < targetMin) ||
    (currentRate > targetMax && currentRate <= targetMax + 10);

  const rateColor = isInTarget
    ? 'text-emerald-600'
    : isClose
      ? 'text-amber-500'
      : 'text-red-500';

  return (
    <div className="bg-white border border-[#141414] rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-3">
        Rate Gauge
      </div>

      <div className="flex items-center gap-4">
        {/* Vertical bar */}
        <div className="relative w-8 h-40 bg-[#141414]/5 rounded-full overflow-hidden border border-[#141414]/10">
          {/* Red zone bottom */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-red-200"
            style={{ height: `${greenStart}%` }}
          />
          {/* Green zone */}
          <div
            className="absolute left-0 right-0 bg-emerald-200"
            style={{ bottom: `${greenStart}%`, height: `${greenEnd - greenStart}%` }}
          />
          {/* Red zone top */}
          <div
            className="absolute left-0 right-0 top-0 bg-red-200"
            style={{ height: `${100 - greenEnd}%` }}
          />
          {/* Marker */}
          {currentRate > 0 && (
            <motion.div
              animate={{ bottom: `${markerPos}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`absolute left-0 right-0 h-1 ${
                isInTarget ? 'bg-emerald-600' : isClose ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ marginBottom: '-2px' }}
            />
          )}
        </div>

        {/* Rate display */}
        <div className="flex-1 text-center">
          <motion.div
            key={currentRate}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className={`text-4xl font-bold ${rateColor}`}
          >
            {currentRate}
          </motion.div>
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mt-1">
            CPM
          </div>
          <div className="text-[9px] opacity-40 mt-2">
            Target: {targetMin}-{targetMax} CPM
          </div>
        </div>
      </div>
    </div>
  );
}
