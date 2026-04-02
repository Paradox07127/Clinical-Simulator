import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface MotionGraphProps {
  data: { time: number; y: number }[];
  peaks: { time: number; y: number }[];
  currentRate?: number;
  compressionCount?: number;
  compact?: boolean;
}

function rateColor(rate: number): string {
  if (rate >= 100 && rate <= 120) return '#10b981'; // emerald-500
  if ((rate >= 90 && rate < 100) || (rate > 120 && rate <= 130)) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

export default function MotionGraph({
  data,
  peaks,
  currentRate = 0,
  compressionCount,
  compact = false,
}: MotionGraphProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
      // Draw placeholder text
      ctx.fillStyle = '#141414';
      ctx.globalAlpha = 0.2;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t('cpr.awaitingData'), width / 2, height / 2);
      ctx.globalAlpha = 1;
      return;
    }

    const now = performance.now();
    const timeWindow = 5000;
    const minTime = now - timeWindow;
    let minY = Math.min(...data.map(point => point.y));
    let maxY = Math.max(...data.map(point => point.y));
    const range = Math.max(maxY - minY, 0.1);
    minY -= range * 0.2;
    maxY += range * 0.2;

    const getX = (time: number) => ((time - minTime) / timeWindow) * width;
    const getY = (y: number) => height - ((y - minY) / (maxY - minY)) * height;

    // Target depth zone (green band in middle 40-60% of y range)
    const targetTop = getY(minY + (maxY - minY) * 0.6);
    const targetBottom = getY(minY + (maxY - minY) * 0.4);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(0, targetTop, width, targetBottom - targetTop);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, targetTop);
    ctx.lineTo(width, targetTop);
    ctx.moveTo(0, targetBottom);
    ctx.lineTo(width, targetBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center line
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Waveform line colored by current rate
    const lineColor = currentRate > 0 ? rateColor(currentRate) : '#ef4444';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let first = true;
    for (const point of data) {
      if (point.time < minTime) continue;
      const x = getX(point.time);
      const y = getY(point.y);
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Peak dots
    ctx.fillStyle = '#141414';
    for (const peak of peaks) {
      if (peak.time < minTime) continue;
      ctx.beginPath();
      ctx.arc(getX(peak.time), getY(peak.y), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title label (top-left)
    ctx.fillStyle = '#141414';
    ctx.globalAlpha = 0.3;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(t('cpr.compressionMotion').toUpperCase(), 8, 16);
    ctx.globalAlpha = 1;

    // Time axis label (bottom-right)
    ctx.fillStyle = '#141414';
    ctx.globalAlpha = 0.2;
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(t('cpr.window5s'), width - 8, height - 8);
    ctx.globalAlpha = 1;

    // Compression count (top-right)
    if (compressionCount != null && compressionCount > 0) {
      ctx.fillStyle = '#141414';
      ctx.globalAlpha = 0.5;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`#${compressionCount}`, width - 8, 16);
      ctx.globalAlpha = 1;
    }
  }, [data, peaks, currentRate, compressionCount, t]);

  if (compact) {
    return (
      <div className="bg-[#EDEBE7] rounded-lg overflow-hidden h-16">
        <canvas ref={canvasRef} width={600} height={64} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#141414] rounded-2xl p-4 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest">{t('cpr.compressionMotion')}</h3>
        {currentRate > 0 && (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: rateColor(currentRate) }}
            />
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-50">
              {currentRate >= 100 && currentRate <= 120
                ? t('cpr.onTarget')
                : currentRate < 100
                  ? t('cpr.tooSlow')
                  : t('cpr.tooFast')}
            </span>
          </div>
        )}
      </div>
      <div className="bg-[#EDEBE7] rounded-xl overflow-hidden aspect-[3/1]">
        <canvas ref={canvasRef} width={600} height={200} className="w-full h-full" />
      </div>
    </div>
  );
}
