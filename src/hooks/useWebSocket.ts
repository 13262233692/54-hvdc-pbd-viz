import { useEffect, useRef, useCallback, useState } from 'react';
import {
  ServerMessage,
  PulseFrame,
  AlertEvent,
  ChannelStatus,
  ClientMessage,
} from '../../shared/types';

interface UseWebSocketReturn {
  pulseFrame: PulseFrame | null;
  alerts: AlertEvent[];
  channelStatus: ChannelStatus | null;
  isConnected: boolean;
  send: (msg: ClientMessage) => void;
}

export function useWebSocket(url = `ws://${window.location.host}/ws`): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const [pulseFrame, setPulseFrame] = useState<PulseFrame | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [channelStatus, setChannelStatus] = useState<ChannelStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimer.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'pulse_frame':
            setPulseFrame(msg);
            break;
          case 'alert':
            setAlerts((prev) => [...prev.slice(-49), msg]);
            break;
          case 'channel_status':
            setChannelStatus(msg);
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    wsRef.current = ws;
  }, [url]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { pulseFrame, alerts, channelStatus, isConnected, send };
}
