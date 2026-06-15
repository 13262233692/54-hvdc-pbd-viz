import type { Pulse, ChannelPulse, PulseFrame } from "../shared/types.js";

const FRAME_HEADER = Buffer.from([0xaa, 0x55, 0xf0, 0x01]);
const HEADER_SIZE = 4;
const CHANNEL_ID_SIZE = 2;
const TIMESTAMP_SIZE = 8;
const PULSE_COUNT_SIZE = 2;
const FRAME_META_SIZE = HEADER_SIZE + CHANNEL_ID_SIZE + TIMESTAMP_SIZE + PULSE_COUNT_SIZE;
const PULSE_SIZE = 16;
const PULSE_TIMESTAMP_SIZE = 8;
const PULSE_AMPLITUDE_SIZE = 4;
const PULSE_TDOA_SIZE = 4;

export function parseBinaryFrame(buf: Buffer): PulseFrame | null {
  if (buf.length < FRAME_META_SIZE) return null;

  for (let i = 0; i < HEADER_SIZE; i++) {
    if (buf[i] !== FRAME_HEADER[i]) return null;
  }

  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let offset = HEADER_SIZE;

  const channelId = view.getUint16(offset, false);
  offset += CHANNEL_ID_SIZE;

  const timestampHigh = view.getUint32(offset, false);
  const timestampLow = view.getUint32(offset + 4, false);
  const timestampNs = timestampHigh * 0x100000000 + timestampLow;
  offset += TIMESTAMP_SIZE;

  const pulseCount = view.getUint16(offset, false);
  offset += PULSE_COUNT_SIZE;

  const expectedSize = FRAME_META_SIZE + pulseCount * PULSE_SIZE;
  if (buf.length < expectedSize) return null;

  const pulses: Pulse[] = [];

  for (let i = 0; i < pulseCount; i++) {
    const pulseOffset = offset + i * PULSE_SIZE;

    const ptHigh = view.getUint32(pulseOffset, false);
    const ptLow = view.getUint32(pulseOffset + 4, false);
    const pulseTimestampNs = ptHigh * 0x100000000 + ptLow;

    const amplitude = view.getFloat32(pulseOffset + PULSE_TIMESTAMP_SIZE, false);
    const relativeTdoaNanos = view.getFloat32(pulseOffset + PULSE_TIMESTAMP_SIZE + PULSE_AMPLITUDE_SIZE, false);

    pulses.push({
      timestampNs: pulseTimestampNs,
      amplitude,
      relativeTdoaNanos,
    });
  }

  const channel: ChannelPulse = {
    channelId,
    pulseCount,
    pulses,
  };

  return {
    type: "pulse_frame",
    timestamp: Date.now(),
    frameId: 0,
    channels: [channel],
  };
}

export function findFrameBoundary(buf: Buffer): number {
  for (let i = 0; i <= buf.length - HEADER_SIZE; i++) {
    let match = true;
    for (let j = 0; j < HEADER_SIZE; j++) {
      if (buf[i + j] !== FRAME_HEADER[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}
