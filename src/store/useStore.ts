import { create } from 'zustand';
import {
  SensorConfig,
  AlgorithmConfig,
  PulseFrame,
  AlertEvent,
  ChannelStatus,
  DEFAULT_SENSORS,
  DEFAULT_ALGORITHM,
} from '../../shared/types';

interface StoreState {
  sensorConfig: SensorConfig[];
  algorithmConfig: AlgorithmConfig;
  latestFrame: PulseFrame | null;
  alerts: AlertEvent[];
  channelStatus: ChannelStatus | null;
  spectrumData: Float32Array | null;
  spectrumResolution: number;
  spectrumVersion: number;
  isComputing: boolean;
  wsConnected: boolean;
  intensity: number;

  setSensorConfig: (config: SensorConfig[]) => void;
  setAlgorithmConfig: (config: AlgorithmConfig) => void;
  setLatestFrame: (frame: PulseFrame | null) => void;
  addAlert: (alert: AlertEvent) => void;
  clearAlerts: () => void;
  setChannelStatus: (status: ChannelStatus | null) => void;
  setSpectrumData: (data: Float32Array | null) => void;
  setSpectrumResolution: (res: number) => void;
  setSpectrumVersion: (v: number) => void;
  setIsComputing: (val: boolean) => void;
  setWsConnected: (val: boolean) => void;
  setIntensity: (val: number) => void;
}

export const useStore = create<StoreState>((set) => ({
  sensorConfig: DEFAULT_SENSORS,
  algorithmConfig: DEFAULT_ALGORITHM,
  latestFrame: null,
  alerts: [],
  channelStatus: null,
  spectrumData: null,
  spectrumResolution: DEFAULT_ALGORITHM.musicResolution,
  spectrumVersion: 0,
  isComputing: false,
  wsConnected: false,
  intensity: 0.5,

  setSensorConfig: (config) => set({ sensorConfig: config }),
  setAlgorithmConfig: (config) => set({ algorithmConfig: config }),
  setLatestFrame: (frame) => set({ latestFrame: frame }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [...state.alerts.slice(-49), alert] })),
  clearAlerts: () => set({ alerts: [] }),
  setChannelStatus: (status) => set({ channelStatus: status }),
  setSpectrumData: (data) => set({ spectrumData: data }),
  setSpectrumResolution: (res) => set({ spectrumResolution: res }),
  setSpectrumVersion: (v) => set({ spectrumVersion: v }),
  setIsComputing: (val) => set({ isComputing: val }),
  setWsConnected: (val) => set({ wsConnected: val }),
  setIntensity: (val) => set({ intensity: val }),
}));
