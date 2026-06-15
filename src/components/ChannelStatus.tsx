import { useStore } from '@/store/useStore';

export default function ChannelStatus() {
  const channelStatus = useStore((s) => s.channelStatus);

  const channels = channelStatus
    ? channelStatus.channels
    : Array.from({ length: 8 }, (_, i) => ({
        channelId: i,
        online: false,
        throughputHz: 0,
        snrDb: 0,
      }));

  return (
    <div className="flex items-stretch gap-1.5 w-full h-full px-2">
      {channels.map((ch) => {
        const online = ch.online;
        return (
          <div
            key={ch.channelId}
            className={`flex-1 panel-bg rounded px-2 py-1 flex flex-col items-center justify-center gap-0.5 transition-all ${online ? 'animate-border-pulse' : ''}`}
          >
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${online ? 'animate-pulse-glow' : ''}`}
                style={{
                  backgroundColor: online ? '#39ff14' : '#ff2d55',
                  boxShadow: online ? '0 0 4px #39ff14' : '0 0 4px #ff2d55',
                }}
              />
              <span className="font-mono-data text-[10px] text-info-white/70">
                CH{ch.channelId + 1}
              </span>
            </div>
            <span className="font-mono-data text-[9px] text-arc-blue">
              {ch.throughputHz > 0 ? `${(ch.throughputHz / 1000).toFixed(1)}k` : '—'}
              <span className="text-info-white/30">Hz</span>
            </span>
            <span className="font-mono-data text-[9px] text-info-white/40">
              {ch.snrDb !== 0 ? `${ch.snrDb.toFixed(0)}` : '—'}
              <span className="text-info-white/20">dB</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
