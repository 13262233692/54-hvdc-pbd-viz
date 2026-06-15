import type {
  AlertEvent,
  SensorConfig,
  AlgorithmConfig,
  ChannelStatus,
} from "../shared/types.js";
import { DEFAULT_SENSORS, DEFAULT_ALGORITHM } from "../shared/types.js";

const MAX_ALERT_HISTORY = 1000;

export class DataStore {
  private alerts: AlertEvent[] = [];
  private sensors: SensorConfig[] = [...DEFAULT_SENSORS];
  private algorithm: AlgorithmConfig = { ...DEFAULT_ALGORITHM };
  private channelStatus: ChannelStatus = {
    type: "channel_status",
    channels: DEFAULT_SENSORS.map((s) => ({
      channelId: s.channelId,
      online: true,
      throughputHz: 0,
      snrDb: 30 + Math.random() * 20,
    })),
  };
  private frameCount = 0;
  private startTime = Date.now();

  addAlert(alert: AlertEvent): void {
    this.alerts.push(alert);
    if (this.alerts.length > MAX_ALERT_HISTORY) {
      this.alerts = this.alerts.slice(-MAX_ALERT_HISTORY);
    }
  }

  getAlerts(startTs?: number, endTs?: number): AlertEvent[] {
    let result = this.alerts;
    if (startTs !== undefined) {
      result = result.filter((a) => a.timestamp >= startTs);
    }
    if (endTs !== undefined) {
      result = result.filter((a) => a.timestamp <= endTs);
    }
    return result;
  }

  getAlertById(id: string): AlertEvent | undefined {
    return this.alerts.find((a) => a.alertId === id);
  }

  getSensors(): SensorConfig[] {
    return [...this.sensors];
  }

  setSensors(sensors: SensorConfig[]): void {
    this.sensors = [...sensors];
  }

  getAlgorithm(): AlgorithmConfig {
    return { ...this.algorithm };
  }

  setAlgorithm(config: AlgorithmConfig): void {
    this.algorithm = { ...config };
  }

  getChannelStatus(): ChannelStatus {
    return {
      ...this.channelStatus,
      channels: this.channelStatus.channels.map((c) => ({ ...c })),
    };
  }

  updateChannelStatus(status: ChannelStatus): void {
    this.channelStatus = {
      ...status,
      channels: status.channels.map((c) => ({ ...c })),
    };
  }

  incrementFrameCount(): void {
    this.frameCount++;
  }

  getSystemStatus() {
    return {
      uptime: Date.now() - this.startTime,
      frameCount: this.frameCount,
      alertCount: this.alerts.length,
      channelsOnline: this.channelStatus.channels.filter((c) => c.online).length,
      totalChannels: this.channelStatus.channels.length,
      algorithm: this.getAlgorithm(),
      sensors: this.getSensors(),
    };
  }
}

export const dataStore = new DataStore();
