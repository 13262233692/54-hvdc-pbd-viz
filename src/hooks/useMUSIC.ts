import { useRef, useState, useEffect, useCallback } from 'react';
import { PulseFrame, SensorConfig, AlgorithmConfig } from '../../shared/types';
import { MUSIC3DEngine } from '@/algorithms/music3d';

interface UseMUSICReturn {
  spectrumData: Float32Array | null;
  resolution: number;
  isComputing: boolean;
  spectrumVersion: number;
}

export function useMUSIC(
  frame: PulseFrame | null,
  sensors: SensorConfig[],
  config: AlgorithmConfig,
): UseMUSICReturn {
  const engineRef = useRef<MUSIC3DEngine | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const lastComputeRef = useRef(0);
  const pendingFrameRef = useRef<PulseFrame | null>(null);
  const computingRef = useRef(false);
  const tdoaMatrixRef = useRef<number[][] | null>(null);
  const amplitudesRef = useRef<number[] | null>(null);
  const [spectrumVersion, setSpectrumVersion] = useState(0);
  const [resolution, setResolution] = useState(config.musicResolution);
  const [isComputing, setIsComputing] = useState(false);

  if (!engineRef.current) {
    engineRef.current = new MUSIC3DEngine(sensors, config);
    const size = engineRef.current.getBufferSize();
    bufferRef.current = new Float32Array(size);
    setResolution(config.musicResolution);
    tdoaMatrixRef.current = Array.from({ length: sensors.length }, () => Array(sensors.length).fill(0));
    amplitudesRef.current = Array(sensors.length).fill(0);
  }

  const compute = useCallback((pulseFrame: PulseFrame) => {
    if (!engineRef.current || !bufferRef.current || !tdoaMatrixRef.current || !amplitudesRef.current) return;

    const M = sensors.length;
    const tdoaMatrix = tdoaMatrixRef.current;
    const amplitudes = amplitudesRef.current;

    for (let i = 0; i < M; i++) {
      tdoaMatrix[i].fill(0);
      amplitudes[i] = 0;
    }

    for (const ch of pulseFrame.channels) {
      const idx = sensors.findIndex((s) => s.channelId === ch.channelId);
      if (idx < 0) continue;

      if (ch.pulses.length > 0) {
        let sum = 0;
        for (let k = 0; k < ch.pulses.length; k++) sum += ch.pulses[k].amplitude;
        amplitudes[idx] = sum / ch.pulses.length;
      }

      for (const pulse of ch.pulses) {
        for (let j = 0; j < M; j++) {
          if (j === idx) continue;
          const otherCh = pulseFrame.channels.find((c) => c.channelId === sensors[j].channelId);
          if (otherCh && otherCh.pulses.length > 0) {
            tdoaMatrix[idx][j] = pulse.relativeTdoaNanos;
          }
        }
      }
    }

    computingRef.current = true;
    setIsComputing(true);

    try {
      engineRef.current.computeSpectrum(tdoaMatrix, amplitudes, bufferRef.current);
      setSpectrumVersion((v) => v + 1);
    } finally {
      computingRef.current = false;
      setIsComputing(false);
    }
  }, [sensors]);

  useEffect(() => {
    if (!frame) return;

    if (computingRef.current) {
      pendingFrameRef.current = frame;
      return;
    }

    const now = performance.now();
    const elapsed = now - lastComputeRef.current;
    const minInterval = 150;

    const runCompute = () => {
      compute(frame);
      lastComputeRef.current = performance.now();
      if (pendingFrameRef.current) {
        const next = pendingFrameRef.current;
        pendingFrameRef.current = null;
        const delayTimer = setTimeout(() => {
          if (!computingRef.current) {
            compute(next);
            lastComputeRef.current = performance.now();
          }
        }, minInterval);
        return () => clearTimeout(delayTimer);
      }
    };

    if (elapsed < minInterval) {
      const timer = setTimeout(runCompute, minInterval - elapsed);
      return () => clearTimeout(timer);
    }

    runCompute();
  }, [frame, compute]);

  return { spectrumData: bufferRef.current, resolution, isComputing, spectrumVersion };
}
