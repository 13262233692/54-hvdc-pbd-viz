import { useStore } from '@/store/useStore';

const DISCHARGE_TYPE_MAP: Record<string, string> = {
  corona: '电晕',
  surface: '沿面',
  internal: '内部',
};

function StatCard({ label, value, unit, children }: {
  label: string;
  value: string | number;
  unit?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="panel-bg rounded-md p-3 relative overflow-hidden">
      <div className="text-xs text-arc-blue-dim font-display-heading tracking-wider mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="stat-value">{value}</span>
        {unit && <span className="text-xs text-info-white/50 font-mono-data">{unit}</span>}
      </div>
      {children}
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-2 mt-1">
      <svg width="44" height="44" className="transform -rotate-90">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="#1a2550" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={radius} fill="none"
          stroke="#00d4ff" strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="stat-value text-lg">{value.toFixed(1)}%</span>
    </div>
  );
}

function SNRBar({ value }: { value: number }) {
  const normalized = Math.min(100, Math.max(0, (value + 10) / 50 * 100));
  const color = normalized > 70 ? '#39ff14' : normalized > 40 ? '#ffd60a' : '#ff2d55';

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-panel-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${normalized}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono-data" style={{ color }}>
        {normalized > 70 ? '优' : normalized > 40 ? '中' : '差'}
      </span>
    </div>
  );
}

export default function StatsPanel() {
  const latestFrame = useStore((s) => s.latestFrame);
  const alerts = useStore((s) => s.alerts);

  const freq = latestFrame
    ? latestFrame.channels.reduce((sum, ch) => sum + ch.pulseCount, 0)
    : 0;

  const maxAmplitude = latestFrame
    ? Math.max(...latestFrame.channels.flatMap((ch) => ch.pulses.map((p) => p.amplitude)), 0)
    : 0;

  const latestAlert = alerts.length > 0 ? alerts[alerts.length - 1] : null;
  const location = latestAlert?.location ?? { x: 0, y: 0, z: 0 };
  const confidence = latestAlert?.confidence ?? 0;
  const dischargeType = latestAlert?.dischargeType ?? '';

  const snr = latestFrame
    ? (() => {
        const ch = latestFrame.channels.find((c) => c.pulses.length > 0);
        return ch ? 20 * Math.log10(Math.max(0.001, ch.pulses[0].amplitude / 10)) : 0;
      })()
    : 0;

  return (
    <div className="flex flex-col gap-2.5 p-2 h-full overflow-y-auto">
      <div className="mb-1">
        <h2 className="panel-title text-sm glow-text">实时监测</h2>
        <div className="h-px bg-gradient-to-r from-arc-blue to-transparent mt-1" />
      </div>

      <StatCard label="放电频次" value={freq} unit="次/秒" />

      <StatCard label="最大放电量" value={maxAmplitude.toFixed(1)} unit="mV" />

      <StatCard label="定位坐标" value="" >
        <div className="flex gap-3 font-mono-data text-sm mt-0.5">
          <span className="text-arc-blue">X:<span className="ml-1 text-info-white">{location.x.toFixed(2)}</span></span>
          <span className="text-arc-blue">Y:<span className="ml-1 text-info-white">{location.y.toFixed(2)}</span></span>
          <span className="text-arc-blue">Z:<span className="ml-1 text-info-white">{location.z.toFixed(2)}</span></span>
        </div>
      </StatCard>

      <StatCard label="信噪比" value={snr.toFixed(1)} unit="dB">
        <SNRBar value={snr} />
      </StatCard>

      <StatCard label="置信度" value="">
        <ConfidenceRing value={confidence * 100} />
      </StatCard>

      <StatCard label="放电类型" value={DISCHARGE_TYPE_MAP[dischargeType] ?? '—'}>
        {dischargeType && (
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className="w-2 h-2 rounded-full animate-pulse-glow"
              style={{
                backgroundColor: dischargeType === 'corona' ? '#00d4ff'
                  : dischargeType === 'surface' ? '#ffd60a' : '#ff6b35',
              }}
            />
          </div>
        )}
      </StatCard>
    </div>
  );
}
