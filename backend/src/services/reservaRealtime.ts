import { Response } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import { Observable } from "./observer";

export type ReservaEvent = {
  canchaId: number;
  fecha?: string;
  type:
    | "availability-updated"
    | "reservation-paid"
    | "reservation-cancelled"
    | "open-slot-created"
    | "open-slot-joined";
  espacioAbiertoId?: number;
};

const clients = new Set<Response>();
const realtimeBus = new Observable<ReservaEvent>();

export function addReservaClient(res: Response) {
  clients.add(res);

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  return () => {
    clients.delete(res);
  };
}

export function broadcastReservaEvent(event: ReservaEvent) {
  realtimeBus.notify(event);
}

realtimeBus.subscribe((event) => {
  const payload = JSON.stringify(event);

  clients.forEach((client) => {
    client.write(`event: ${event.type}\n`);
    client.write(`data: ${payload}\n\n`);
  });
});

export function attachReservaWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/reservas" });

  realtimeBus.subscribe((event) => {
    const payload = JSON.stringify(event);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "connected", ok: true }));
  });

  return wss;
}
