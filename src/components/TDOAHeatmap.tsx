import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';

function tdoaColor(value: number): string {
  const abs = Math.min(Math.abs(value), 50);
  const t = abs / 50;
  if (t < 0.5) {
    const r = Math.round(0 + t * 2 * 255);
    const g = Math.round(102 + t * 2 * (214 - 102));
    const b = Math.round(255 - t * 2 * (255 - 10));
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(255);
  const g = Math.round(214 - (t - 0.5) * 2 * (214 - 45));
  const b = Math.round(10 + (t - 0.5) * 2 * (85 - 10));
  return `rgb(${r},${g},${b})`;
}

export default function TDOAHeatmap() {
  const latestFrame = useStore((s) => s.latestFrame);
  const sensorConfig = useStore((s) => s.sensorConfig);
  const [hoverCell, setHoverCell] = useState<{ i: number; j: number } | null>(null);

  const matrix = useMemo(() => {
    const M = 8;
    const m: number[][] = Array.from({ length: M }, () => Array(M).fill(0));
    if (!latestFrame) return m;

    for (const ch of latestFrame.channels) {
      const i = sensorConfig.findIndex((s) => s.channelId === ch.channelId);
      if (i < 0) continue;
      for (const pulse of ch.pulses) {
        for (let j = 0; j < M; j++) {
          if (j === i) continue;
          m[i][j] = pulse.relativeTdoaNanos;
        }
      }
    }
    return m;
  }, [latestFrame, sensorConfig]);

  return (
    <div className="w-full h-full flex flex-col items-center p-1">
      <div className="mb-1">
        <span className="panel-title text-xs glow-text">TDOA 时差矩阵 (ns)</span>
      </div>
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(8, 1fr)`, width: 'min(100%, 320px)', aspectRatio: '1' }}
      >
        {matrix.flatMap((row, i) =>
          row.map((val, j) => {
            const isDiag = i === j;
            const bg = isDiag ? 'rgba(10,14,39,0.8)' : tdoaColor(val);
            return (
              <div
                key={`${i}-${j}`}
                className="flex items-center justify-center text-center cursor-default relative"
                style={{
                  backgroundColor: bg,
                  fontSize: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: isDiag ? 'rgba(0,212,255,0.3)' : 'rgba(232,240,255,0.9)',
                  border: hoverCell?.i === i && hoverCell?.j === j ? '1px solid #00d4ff' : '1px solid rgba(26,37,80,0.3)',
                }}
                onMouseEnter={() => setHoverCell({ i, j })}
                onMouseLeave={() => setHoverCell(null)}
              >
                {isDiag ? '0' : val.toFixed(1)}
                {hoverCell?.i === i && hoverCell?.j === j && !isDiag && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-deep-navy border border-arc-blue rounded px-1.5 py-0.5 text-arc-blue whitespace-nowrap z-20 text-[9px]">
                    CH{i + 1}→CH{j + 1}: {val.toFixed(2)} ns
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
