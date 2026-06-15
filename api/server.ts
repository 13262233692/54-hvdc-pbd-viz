import { createServer } from 'http';
import app from './app.js';
import { WSBridge } from './wsBridge.js';
import { Simulator } from './simulator.js';
import { dataStore } from './dataStore.js';
import type { ServerMessage, ClientMessage, AlertEvent } from '../shared/types.js';

const PORT = process.env.PORT || 3001;

const server = createServer(app);

const wsBridge = new WSBridge();
const simulator = new Simulator();

wsBridge.onClientMessage((msg: ClientMessage) => {
  if (msg.type === 'config_update') {
    dataStore.setAlgorithm({
      musicResolution: msg.musicResolution,
      signalSourceCount: msg.signalSourceCount,
      searchStepSize: msg.searchStepSize,
    });
    console.log('[Server] Algorithm config updated');
  } else if (msg.type === 'sensor_calibration') {
    dataStore.setSensors(
      msg.sensors.map((s) => ({
        channelId: s.channelId,
        name: `CH${s.channelId + 1}`,
        position: s.position,
      }))
    );
    simulator.setSensors(dataStore.getSensors());
    console.log('[Server] Sensor calibration updated');
  }
});

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);

  wsBridge.start(server);
  console.log('[Server] WebSocket bridge started');

  simulator.start((msg: ServerMessage) => {
    if (msg.type === 'pulse_frame') {
      dataStore.incrementFrameCount();
    } else if (msg.type === 'alert') {
      dataStore.addAlert(msg as AlertEvent);
    } else if (msg.type === 'channel_status') {
      dataStore.updateChannelStatus(msg);
    }
    wsBridge.broadcast(msg);
  });
  console.log('[Server] Simulator started');
});

function gracefulShutdown(signal: string) {
  console.log(`${signal} signal received`);
  simulator.stop();
  wsBridge.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
