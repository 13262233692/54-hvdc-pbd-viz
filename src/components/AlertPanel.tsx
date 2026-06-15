import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { AlertEvent } from '../../shared/types';

const DISCHARGE_MAP: Record<string, string> = {
  corona: '电晕',
  surface: '沿面',
  internal: '内部',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour12: false });
}

function AlertCard({ alert }: { alert: AlertEvent }) {
  const isCritical = alert.alertLevel === 'critical';
  const borderColor = isCritical ? '#ff6b35' : '#ffd60a';
  const icon = isCritical ? '🔴' : '⚠️';

  return (
    <div
      className={`rounded p-2.5 mb-2 transition-all ${isCritical ? 'glow-orange' : ''}`}
      style={{
        background: 'rgba(13,18,53,0.7)',
        borderLeft: `3px solid ${borderColor}`,
        border: `1px solid ${borderColor}22`,
        borderLeftWidth: '3px',
        borderLeftColor: borderColor,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">{icon}</span>
        <span className="font-mono-data text-xs text-info-white/50">
          {formatTime(alert.timestamp)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span
          className="px-1.5 py-0.5 rounded font-display-heading"
          style={{
            backgroundColor: isCritical ? 'rgba(255,107,53,0.2)' : 'rgba(255,214,10,0.2)',
            color: borderColor,
          }}
        >
          {DISCHARGE_MAP[alert.dischargeType] ?? alert.dischargeType}
        </span>
        <span className="font-mono-data text-info-white/80">
          {alert.amplitude.toFixed(1)} mV
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 font-mono-data text-[10px] text-info-white/40">
        <span>
          ({alert.location.x.toFixed(1)}, {alert.location.y.toFixed(1)}, {alert.location.z.toFixed(1)})
        </span>
        <span className="text-arc-blue-dim">
          {(alert.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default function AlertPanel() {
  const alerts = useStore((s) => s.alerts);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [alerts.length]);

  return (
    <div className="flex flex-col h-full p-2">
      <div className="mb-2">
        <h2 className="panel-title text-sm glow-text-orange">告警事件</h2>
        <div className="h-px bg-gradient-to-r from-discharge-orange to-transparent mt-1" />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-info-white/20 text-sm">暂无告警</span>
          </div>
        ) : (
          [...alerts].reverse().map((alert) => (
            <AlertCard key={alert.alertId} alert={alert} />
          ))
        )}
      </div>

      <div className="mt-1 text-[10px] font-mono-data text-info-white/20 text-right">
        {alerts.length} / 50
      </div>
    </div>
  );
}
