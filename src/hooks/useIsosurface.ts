import { useRef, useState, useEffect, useCallback } from 'react';
import { IsosurfaceResult } from '../algorithms/marchingTetrahedra';

const WORKER_URL = new URL('../workers/marchingTetrahedra.worker.ts', import.meta.url);

interface UseIsosurfaceReturn {
  vertices: Float32Array | null;
  normals: Float32Array | null;
  triangleCount: number;
  isComputing: boolean;
  hasResult: boolean;
}

export function useIsosurface(
  volume: Float32Array | null,
  resolution: number,
  isoValue: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number },
  spectrumVersion: number,
): UseIsosurfaceReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestRef = useRef(false);
  const queuedRequestRef = useRef<boolean>(false);
  const requestIdRef = useRef(0);
  const [result, setResult] = useState<{
    vertices: Float32Array;
    normals: Float32Array;
    triangleCount: number;
  } | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const ensureWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(WORKER_URL, { type: 'module' });
      workerRef.current.onmessage = (e) => {
        const { id, type } = e.data;

        if (type === 'done') {
          const { vertices: vBuffer, normals: nBuffer, triangleCount } = e.data.result;
          const vertices = new Float32Array(vBuffer);
          const normals = new Float32Array(nBuffer);
          setResult({ vertices, normals, triangleCount });
          setIsComputing(false);
          pendingRequestRef.current = false;

          if (queuedRequestRef.current) {
            queuedRequestRef.current = false;
            if (volumeRef.current) {
              dispatchRequest(volumeRef.current, resolutionRef.current, isoRef.current, boundsRef.current);
            }
          }
        } else if (type === 'error') {
          setIsComputing(false);
          pendingRequestRef.current = false;
          console.error('Isosurface worker error:', e.data.message);
        }
      };
    }
    return workerRef.current;
  }, []);

  const volumeRef = useRef(volume);
  const resolutionRef = useRef(resolution);
  const isoRef = useRef(isoValue);
  const boundsRef = useRef(bounds);

  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { resolutionRef.current = resolution; }, [resolution]);
  useEffect(() => { isoRef.current = isoValue; }, [isoValue]);
  useEffect(() => { boundsRef.current = bounds; }, [bounds]);

  const dispatchRequest = useCallback((vol: Float32Array, res: number, iso: number, bnds: typeof bounds) => {
    const worker = ensureWorker();
    pendingRequestRef.current = true;
    setIsComputing(true);
    requestIdRef.current++;

    const volumeCopy = new Float32Array(vol);

    worker.postMessage({
      id: requestIdRef.current,
      volume: volumeCopy,
      resolution: res,
      isoValue: iso,
      bounds: bnds,
    }, [volumeCopy.buffer]);
  }, [ensureWorker]);

  useEffect(() => {
    if (!volume || spectrumVersion === 0) return;

    if (pendingRequestRef.current) {
      queuedRequestRef.current = true;
      return;
    }

    dispatchRequest(volume, resolution, isoValue, bounds);
  }, [spectrumVersion, volume, resolution, isoValue, bounds, dispatchRequest]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return {
    vertices: result?.vertices ?? null,
    normals: result?.normals ?? null,
    triangleCount: result?.triangleCount ?? 0,
    isComputing,
    hasResult: !!result,
  };
}
