import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import type { ServerMessage, ClientMessage } from "../shared/types.js";

export class WSBridge {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private onMessage: ((msg: ClientMessage, ws: WebSocket) => void) | null = null;

  onClientMessage(handler: (msg: ClientMessage, ws: WebSocket) => void): void {
    this.onMessage = handler;
  }

  start(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      console.log(`[WSBridge] Client connected. Total: ${this.clients.size}`);

      ws.on("message", (raw) => {
        try {
          const msg: ClientMessage = JSON.parse(raw.toString());
          if (this.onMessage) {
            this.onMessage(msg, ws);
          }
        } catch {
          console.warn("[WSBridge] Invalid message received");
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(`[WSBridge] Client disconnected. Total: ${this.clients.size}`);
      });

      ws.on("error", (err) => {
        console.error("[WSBridge] Client error:", err.message);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  stop(): void {
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}
