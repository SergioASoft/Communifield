import { Response } from "express";

type ReservaEvent = {
  canchaId: number;
  fecha?: string;
  type: "availability-updated" | "reservation-paid" | "reservation-cancelled";
};

const clients = new Set<Response>();

export function addReservaClient(res: Response) {
  clients.add(res);

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  return () => {
    clients.delete(res);
  };
}

export function broadcastReservaEvent(event: ReservaEvent) {
  const payload = JSON.stringify(event);

  clients.forEach((client) => {
    client.write(`event: ${event.type}\n`);
    client.write(`data: ${payload}\n\n`);
  });
}
