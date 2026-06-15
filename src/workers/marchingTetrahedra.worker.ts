import { marchingTetrahedra, IsosurfaceResult } from '../algorithms/marchingTetrahedra';

interface WorkerRequest {
  id: number;
  volume: Float32Array;
  resolution: number;
  isoValue: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
}

interface WorkerResponseProgress {
  id: number;
  type: 'progress';
  progress: number;
}

interface WorkerResponseDone {
  id: number;
  type: 'done';
  result: {
    vertices: ArrayBuffer;
    normals: ArrayBuffer;
    triangleCount: number;
  };
}

interface WorkerResponseError {
  id: number;
  type: 'error';
  message: string;
}

type WorkerResponse = WorkerResponseProgress | WorkerResponseDone | WorkerResponseError;

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, volume, resolution, isoValue, bounds } = e.data;

  try {
    const result: IsosurfaceResult = marchingTetrahedra(volume, resolution, isoValue, bounds);

    const response: WorkerResponseDone = {
      id,
      type: 'done',
      result: {
        vertices: result.vertices.buffer,
        normals: result.normals.buffer,
        triangleCount: result.triangleCount,
      },
    };

    (self as unknown as Worker).postMessage(response, [result.vertices.buffer, result.normals.buffer]);
  } catch (err) {
    const errorResponse: WorkerResponseError = {
      id,
      type: 'error',
      message: (err as Error).message,
    };
    (self as unknown as Worker).postMessage(errorResponse);
  }
};

export {};
