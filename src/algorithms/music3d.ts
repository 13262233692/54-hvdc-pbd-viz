import { Matrix, EVD } from 'ml-matrix';
import { SensorConfig, AlgorithmConfig } from '../../shared/types';

const SPEED_OF_LIGHT_NS = 0.2998;

export class MUSIC3DEngine {
  private sensorPositions: { x: number; y: number; z: number }[];
  private resolution: number;
  private signalSourceCount: number;
  private spectrumData: Float32Array;

  constructor(sensors: SensorConfig[], config: AlgorithmConfig) {
    this.sensorPositions = sensors.map(s => s.position);
    this.resolution = config.musicResolution;
    this.signalSourceCount = config.signalSourceCount;
    this.spectrumData = new Float32Array(this.resolution ** 3);
  }

  computeSpectrum(tdoaMatrix: number[][], amplitudes: number[], targetBuffer?: Float32Array): Float32Array {
    const M = this.sensorPositions.length;
    const K = this.signalSourceCount;
    const outBuffer = targetBuffer ?? this.spectrumData;

    const covMatrix = this.buildCovarianceMatrix(tdoaMatrix, amplitudes, M);

    const evd = new EVD(covMatrix, { assumeSymmetric: true });
    const eigenvalues = evd.realEigenvalues;
    const eigenvectors = evd.eigenvectorMatrix;

    const sortedIndices = eigenvalues
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .map(item => item.idx);

    const noiseSubspace = new Matrix(M, M - K);
    for (let i = K; i < M; i++) {
      const col = sortedIndices[i];
      for (let row = 0; row < M; row++) {
        noiseSubspace.set(row, i - K, eigenvectors.get(row, col));
      }
    }

    const UnUnH = noiseSubspace.mmul(noiseSubspace.transpose());

    const N = this.resolution;
    const halfSize = 2.5;
    let maxVal = 0;

    for (let iz = 0; iz < N; iz++) {
      for (let iy = 0; iy < N; iy++) {
        for (let ix = 0; ix < N; ix++) {
          const x = (ix / (N - 1) - 0.5) * 2 * halfSize;
          const y = (iy / (N - 1) - 0.5) * 2 * halfSize;
          const z = (iz / (N - 1) - 0.5) * 2 * halfSize;

          const steeringVec = this.computeSteeringVector(x, y, z, M);
          const aH = Matrix.rowVector(steeringVec);
          const a = aH.transpose();

          const denom = aH.mmul(UnUnH).mmul(a);
          const val = 1.0 / Math.max(denom.get(0, 0), 1e-10);

          outBuffer[iz * N * N + iy * N + ix] = val;
          if (val > maxVal) maxVal = val;
        }
      }
    }

    if (maxVal > 0) {
      for (let i = 0; i < outBuffer.length; i++) {
        outBuffer[i] /= maxVal;
      }
    }

    return outBuffer;
  }

  private buildCovarianceMatrix(tdoaMatrix: number[][], amplitudes: number[], M: number): Matrix {
    const cov = new Matrix(M, M);
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < M; j++) {
        const val = amplitudes[i] * amplitudes[j] * Math.cos(2 * Math.PI * tdoaMatrix[i][j] * 0.5);
        cov.set(i, j, val);
      }
    }
    for (let i = 0; i < M; i++) {
      cov.set(i, i, cov.get(i, i) + 1e-6);
    }
    return cov;
  }

  private computeSteeringVector(x: number, y: number, z: number, M: number): number[] {
    const a: number[] = [];
    for (let i = 0; i < M; i++) {
      const dx = x - this.sensorPositions[i].x;
      const dy = y - this.sensorPositions[i].y;
      const dz = z - this.sensorPositions[i].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const tau = dist / SPEED_OF_LIGHT_NS;
      a.push(Math.cos(2 * Math.PI * tau * 0.5));
    }
    return a;
  }

  getSpectrumData(): Float32Array {
    return this.spectrumData;
  }

  getResolution(): number {
    return this.resolution;
  }

  getBufferSize(): number {
    return this.resolution ** 3;
  }
}
