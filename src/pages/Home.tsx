import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMUSIC } from '@/hooks/useMUSIC';
import Scene3D from '@/components/Scene3D';
import StatsPanel from '@/components/StatsPanel';
import AlertPanel from '@/components/AlertPanel';
import Oscilloscope from '@/components/Oscilloscope';
import TDOAHeatmap from '@/components/TDOAHeatmap';
import ChannelStatus from '@/components/ChannelStatus';

export default function Home() {
  const { pulseFrame, alerts, channelStatus, isConnected } = useWebSocket();
  const sensorConfig = useStore((s) => s.sensorConfig);
  const algorithmConfig = useStore((s) => s.algorithmConfig);

  const { spectrumData, resolution, isComputing } = useMUSIC(
    pulseFrame,
    sensorConfig,
    algorithmConfig,
  );

  const setLatestFrame = useStore((s) => s.setLatestFrame);
  const addAlert = useStore((s) => s.addAlert);
  const setChannelStatus = useStore((s) => s.setChannelStatus);
  const setSpectrumData = useStore((s) => s.setSpectrumData);
  const setSpectrumResolution = useStore((s) => s.setSpectrumResolution);
  const setIsComputing = useStore((s) => s.setIsComputing);
  const setWsConnected = useStore((s) => s.setWsConnected);
  const wsConnected = useStore((s) => s.wsConnected);

  useEffect(() => { setWsConnected(isConnected); }, [isConnected, setWsConnected]);
  useEffect(() => { setLatestFrame(pulseFrame); }, [pulseFrame, setLatestFrame]);
  useEffect(() => { setChannelStatus(channelStatus); }, [channelStatus, setChannelStatus]);
  useEffect(() => { setSpectrumData(spectrumData); }, [spectrumData, setSpectrumData]);
  useEffect(() => { setSpectrumResolution(resolution); }, [resolution, setSpectrumResolution]);
  useEffect(() => { setIsComputing(isComputing); }, [isComputing, setIsComputing]);

  useEffect(() => {
    for (const alert of alerts) {
      addAlert(alert);
    }
  }, [alerts, addAlert]);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-deep-navy overflow-hidden">
      <header className="h-10 flex items-center justify-between px-4 panel-bg border-b border-panel-border shrink-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="font-display-heading text-base tracking-wider text-info-white glow-text">
            HVDC 三维局放定位监控系统
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: wsConnected ? '#39ff14' : '#ff2d55',
                boxShadow: wsConnected ? '0 0 6px #39ff14' : '0 0 6px #ff2d55',
              }}
            />
            <span className="font-mono-data text-[10px] text-info-white/50">
              {wsConnected ? '已连接' : '断开'}
            </span>
          </div>
          <span className="font-mono-data text-xs text-info-white/40">
            {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </div>
      </header>

      <div className="h-9 shrink-0 panel-bg border-b border-panel-border">
        <ChannelStatus />
      </div>

      <div className="flex-1 flex min-h-0">
        <aside className="w-[280px] shrink-0 panel-bg border-r border-panel-border">
          <StatsPanel />
        </aside>

        <main className="flex-1 min-w-0">
          <Scene3D />
        </main>

        <aside className="w-[280px] shrink-0 panel-bg border-l border-panel-border">
          <AlertPanel />
        </aside>
      </div>

      <div className="h-[180px] shrink-0 flex panel-bg border-t border-panel-border">
        <div className="w-[70%] border-r border-panel-border">
          <Oscilloscope />
        </div>
        <div className="w-[30%]">
          <TDOAHeatmap />
        </div>
      </div>
    </div>
  );
}
