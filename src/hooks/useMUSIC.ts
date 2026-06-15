import { useRef, useState, useEffect, useCallback } from 'react';
import { PulseFrame, SensorConfig, AlgorithmConfig } from '../../shared/types';
import { MUSIC3DEngine } from '@/algorithms/music3d';

interface UseMUSICReturn {
  spectrumData: Float32Array | null;
  resolution: number;
  isComputing: boolean;
}

export function useMUSIC(
  frame: PulseFrame | null,
  sensors: SensorConfig[],
  config: AlgorithmConfig,
): UseMUSICReturn {
  const engineRef = useRef<MUSIC3DEngine | null>(null);
  const lastComputeRef = useRef(0);
  const [spectrumData, setSpectrumData] = useState<Float32Array | null>(null);
  const [resolution, setResolution] = useState(config.musicResolution);
  const [isComputing, setIsComputing] = useState(false);

  if (!engineRef.current) {
    engineRef.current = new MUSIC3DEngine(sensors, config);
    setResolution(config.musicResolution);
  }

  const compute = useCallback(() => {
    if (!frame || !engineRef.current) return;

    const M = sensors.length;
    const tdoaMatrix: number[][] = Array.from({ length: M }, () => Array(M).fill(0));
    const amplitudes: number[] = Array(M).fill(0);

    for (const ch of frame.channels) {
      const idx = sensors.findIndex((s) => s.channelId === ch.channelId);
      if (idx < 0) continue;

      if (ch.pulses.length > 0) {
        amplitudes[idx] = ch.pulses.reduce((sum, p) => sum + p.amplitude, 0) / ch.pulses.length;
      }

      for (const pulse of ch.pulses) {
        for (let j = 0; j < M; j++) {
          if (j === idx) continue;
          const otherCh = frame.channels.find((c) => c.channelId === sensors[j].channelId);
          if (otherCh && otherCh.pulses.length > 0) {
            tdoaMatrix[idx][j] = pulse.relativeTdoaNanos;
          }
        }
      }
    }

    const result = engineRef.current.computeSpectrum(tdoaMatrix, amplitudes);
    setSpectrumData(new Float32Array(result));
    setResolution(engineRef.current.getResolution());
  }, [frame, sensors]);

  useEffect(() => {
    if (!frame) return;

    const now = performance.now();
    const elapsed = now - lastComputeRef.current;
    const minInterval = 100;

    if (elapsed < minInterval) {
      const timer = setTimeout(() => {
        setIsComputing(true);
        compute();
        lastComputeRef.current = performance.now();
        setIsComputing(false);
      }, minInterval - elapsed);
      return () => clearTimeout(timer);
    }

    setIsComputing(true);
    compute();
    lastComputeRef.current = now;
    setIsComputing(false);
  }, [frame, compute]);

  return { spectrumData, resolution, isComputing };
}
