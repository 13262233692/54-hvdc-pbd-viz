import type {
  ServerMessage,
  PulseFrame,
  AlertEvent,
  ChannelStatus,
  SensorConfig,
} from "../shared/types.js";
import { DEFAULT_SENSORS } from "../shared/types.js";

const SPEED_OF_LIGHT_M_NS = 0.3;
const FRAME_INTERVAL_MS = 100;
const ALERT_AMPLITUDE_THRESHOLD = 200;

interface DischargeSource {
  position: { x: number; y: number; z: number };
  dischargeType: "corona" | "surface" | "internal";
  baseAmplitude: number;
  pulseRate: number;
  active: boolean;
}

function weibullRandom(shape: number, scale: number): number {
  const u = 1 - Math.random();
  return scale * Math.pow(-Math.log(u), 1 / shape);
}

function computeTdoaNs(
  sensorPos: { x: number; y: number; z: number },
  sourcePos: { x: number; y: number; z: number },
  referencePos: { x: number; y: number; z: number }
): number {
  const distToSensor = Math.sqrt(
    Math.pow(sensorPos.x - sourcePos.x, 2) +
    Math.pow(sensorPos.y - sourcePos.y, 2) +
    Math.pow(sensorPos.z - sourcePos.z, 2)
  );
  const distToRef = Math.sqrt(
    Math.pow(referencePos.x - sourcePos.x, 2) +
    Math.pow(referencePos.y - sourcePos.y, 2) +
    Math.pow(referencePos.z - sourcePos.z, 2)
  );
  return ((distToSensor - distToRef) / SPEED_OF_LIGHT_M_NS);
}

export class Simulator {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private frameId = 0;
  private sources: DischargeSource[] = [];
  private sensors: SensorConfig[] = [...DEFAULT_SENSORS];

  constructor() {
    this.initSources();
  }

  private initSources(): void {
    const sourceCount = 1 + Math.floor(Math.random() * 3);
    const types: Array<"corona" | "surface" | "internal"> = [
      "corona",
      "surface",
      "internal",
    ];

    this.sources = [];
    for (let i = 0; i < sourceCount; i++) {
      this.sources.push({
        position: {
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 4,
          z: (Math.random() - 0.5) * 2,
        },
        dischargeType: types[Math.floor(Math.random() * types.length)],
        baseAmplitude: 50 + Math.random() * 200,
        pulseRate: 5 + Math.random() * 20,
        active: true,
      });
    }
  }

  private generatePulseFrame(): PulseFrame {
    const now = Date.now();
    const channels = this.sensors.map((sensor) => {
      const pulses = [];

      for (const source of this.sources) {
        if (!source.active) continue;

        const expectedPulses = source.pulseRate * (FRAME_INTERVAL_MS / 1000);
        const pulseCount = Math.floor(expectedPulses + (Math.random() - 0.5) * expectedPulses);

        for (let i = 0; i < pulseCount; i++) {
          const amplitude = weibullRandom(2, source.baseAmplitude) * (0.8 + Math.random() * 0.4);
          const tdoa = computeTdoaNs(sensor.position, source.position, this.sensors[0].position);
          const jitter = (Math.random() - 0.5) * 0.5;

          pulses.push({
            timestampNs: now * 1e6 + Math.floor(Math.random() * FRAME_INTERVAL_MS * 1e6),
            amplitude: Math.round(amplitude * 100) / 100,
            relativeTdoaNanos: Math.round((tdoa + jitter) * 100) / 100,
          });
        }
      }

      pulses.sort((a, b) => a.relativeTdoaNanos - b.relativeTdoaNanos);

      return {
        channelId: sensor.channelId,
        pulseCount: pulses.length,
        pulses,
      };
    });

    return {
      type: "pulse_frame",
      timestamp: now,
      frameId: this.frameId++,
      channels,
    };
  }

  private checkAlerts(frame: PulseFrame): AlertEvent[] {
    const alerts: AlertEvent[] = [];

    for (const source of this.sources) {
      if (!source.active) continue;

      const maxAmplitude = Math.max(
        ...frame.channels.flatMap((ch) => ch.pulses.map((p) => p.amplitude))
      );

      if (maxAmplitude > ALERT_AMPLITUDE_THRESHOLD && Math.random() < 0.3) {
        const isCritical = maxAmplitude > ALERT_AMPLITUDE_THRESHOLD * 2;
        const alert: AlertEvent = {
          type: "alert",
          alertId: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
          alertLevel: isCritical ? "critical" : "warning",
          dischargeType: source.dischargeType,
          amplitude: maxAmplitude,
          location: { ...source.position },
          confidence: 0.7 + Math.random() * 0.25,
        };
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private generateChannelStatus(): ChannelStatus {
    return {
      type: "channel_status",
      channels: this.sensors.map((sensor) => ({
        channelId: sensor.channelId,
        online: true,
        throughputHz: Math.floor(800 + Math.random() * 400),
        snrDb: Math.round((25 + Math.random() * 20) * 100) / 100,
      })),
    };
  }

  start(callback: (msg: ServerMessage) => void): void {
    if (this.intervalId !== null) return;

    let statusCounter = 0;

    this.intervalId = setInterval(() => {
      const frame = this.generatePulseFrame();
      callback(frame);

      const alerts = this.checkAlerts(frame);
      for (const alert of alerts) {
        callback(alert);
      }

      statusCounter++;
      if (statusCounter >= 10) {
        statusCounter = 0;
        callback(this.generateChannelStatus());
      }
    }, FRAME_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setSensors(sensors: SensorConfig[]): void {
    this.sensors = [...sensors];
  }
}
