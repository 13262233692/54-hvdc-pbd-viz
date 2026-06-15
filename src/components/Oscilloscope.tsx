import { useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';

const CHANNELS = 8;
const GREEN = '#39ff14';
const GRID_COLOR = 'rgba(26,37,80,0.4)';

interface WaveformBuffer {
  data: number[];
  offset: number;
}

export default function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buffersRef = useRef<WaveformBuffer[]>(
    Array.from({ length: CHANNELS }, () => ({ data: new Array(256).fill(0), offset: 0 }))
  );
  const frameRef = useRef<number>(0);
  const latestFrame = useStore((s) => s.latestFrame);

  useEffect(() => {
    if (latestFrame) {
      for (const ch of latestFrame.channels) {
        const idx = ch.channelId;
        if (idx >= CHANNELS) continue;
        const buf = buffersRef.current[idx];
        for (const pulse of ch.pulses) {
          buf.data[buf.offset % buf.data.length] = pulse.amplitude / 1000;
          buf.offset++;
        }
      }
    }
  }, [latestFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const chH = h / CHANNELS;

      ctx.clearRect(0, 0, w, h);

      for (let ch = 0; ch < CHANNELS; ch++) {
        const y0 = ch * chH;
        const midY = y0 + chH / 2;
        const buf = buffersRef.current[ch];

        ctx.fillStyle = 'rgba(10,14,39,0.9)';
        ctx.fillRect(0, y0, w, chH);

        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(w, midY);
        ctx.stroke();

        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1;
        ctx.beginPath();

        const len = buf.data.length;
        for (let i = 0; i < len; i++) {
          const idx = (buf.offset + i) % len;
          const x = (i / len) * w;
          const val = buf.data[idx];
          const y = midY - val * chH * 0.4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        let peakVal = 0;
        for (let i = 0; i < len; i++) {
          if (Math.abs(buf.data[i]) > Math.abs(peakVal)) peakVal = buf.data[i];
        }
        const peakIdx = ((buf.offset - 1) % len + len) % len;
        const peakX = (peakIdx / len) * w;
        const peakY = midY - peakVal * chH * 0.4;
        ctx.fillStyle = GREEN;
        ctx.beginPath();
        ctx.arc(peakX, peakY, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,212,255,0.7)';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`CH${ch + 1}`, 4, y0 + 12);

        ctx.fillStyle = 'rgba(57,255,20,0.7)';
        ctx.fillText(`${peakVal.toFixed(2)}`, 36, y0 + 12);

        if (ch < CHANNELS - 1) {
          ctx.strokeStyle = 'rgba(26,37,80,0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y0 + chH);
          ctx.lineTo(w, y0 + chH);
          ctx.stroke();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-1 left-2 z-10">
        <span className="panel-title text-xs glow-text">脉冲波形</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}
