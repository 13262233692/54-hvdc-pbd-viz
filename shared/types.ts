export interface Pulse {
  timestampNs: number;
  amplitude: number;
  relativeTdoaNanos: number;
}

export interface ChannelPulse {
  channelId: number;
  pulseCount: number;
  pulses: Pulse[];
}

export interface PulseFrame {
  type: "pulse_frame";
  timestamp: number;
  frameId: number;
  channels: ChannelPulse[];
}

export interface AlertEvent {
  type: "alert";
  alertId: string;
  timestamp: number;
  alertLevel: "warning" | "critical";
  dischargeType: "corona" | "surface" | "internal";
  amplitude: number;
  location: { x: number; y: number; z: number };
  confidence: number;
}

export interface ChannelStatus {
  type: "channel_status";
  channels: {
    channelId: number;
    online: boolean;
    throughputHz: number;
    snrDb: number;
  }[];
}

export type ServerMessage = PulseFrame | AlertEvent | ChannelStatus;

export interface ConfigUpdate {
  type: "config_update";
  musicResolution: number;
  signalSourceCount: number;
  searchStepSize: number;
}

export interface SensorCalibration {
  type: "sensor_calibration";
  sensors: {
    channelId: number;
    position: { x: number; y: number; z: number };
  }[];
}

export type ClientMessage = ConfigUpdate | SensorCalibration;

export interface SensorConfig {
  channelId: number;
  name: string;
  position: { x: number; y: number; z: number };
}

export interface AlgorithmConfig {
  musicResolution: number;
  signalSourceCount: number;
  searchStepSize: number;
}

export const DEFAULT_SENSORS: SensorConfig[] = [
  { channelId: 0, name: "CH1-顶部左前", position: { x: -1.5, y: 2.0, z: -1.0 } },
  { channelId: 1, name: "CH2-顶部右前", position: { x: 1.5, y: 2.0, z: -1.0 } },
  { channelId: 2, name: "CH3-顶部左后", position: { x: -1.5, y: 2.0, z: 1.0 } },
  { channelId: 3, name: "CH4-顶部右后", position: { x: 1.5, y: 2.0, z: 1.0 } },
  { channelId: 4, name: "CH5-底部左前", position: { x: -1.5, y: -2.0, z: -1.0 } },
  { channelId: 5, name: "CH6-底部右前", position: { x: 1.5, y: -2.0, z: -1.0 } },
  { channelId: 6, name: "CH7-底部左后", position: { x: -1.5, y: -2.0, z: 1.0 } },
  { channelId: 7, name: "CH8-底部右后", position: { x: 1.5, y: -2.0, z: 1.0 } },
];

export const DEFAULT_ALGORITHM: AlgorithmConfig = {
  musicResolution: 32,
  signalSourceCount: 2,
  searchStepSize: 0.05,
};
