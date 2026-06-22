export type ReservaRealtimeEvent = {
  type:
    | "connected"
    | "availability-updated"
    | "reservation-paid"
    | "reservation-cancelled"
    | "open-slot-created"
    | "open-slot-joined";
  canchaId?: number;
  fecha?: string;
  espacioAbiertoId?: number;
};

type ReservaObserver = (event: ReservaRealtimeEvent) => void;

class ReservaRealtimeClient {
  private observers = new Set<ReservaObserver>();
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;

  subscribe(observer: ReservaObserver) {
    this.observers.add(observer);
    this.connect();

    return () => {
      this.observers.delete(observer);
      if (this.observers.size === 0) this.disconnect();
    };
  }

  private notify(event: ReservaRealtimeEvent) {
    this.observers.forEach((observer) => observer(event));
  }

  private connect() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    const configuredUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL;
    const baseUrl =
      configuredUrl ||
      (window.location.port === "5173"
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : window.location.origin);
    const wsUrl = new URL("/ws/reservas", baseUrl);
    wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";

    this.socket = new WebSocket(wsUrl);

    this.socket.onmessage = (message) => {
      try {
        this.notify(JSON.parse(message.data));
      } catch {
        this.notify({ type: "availability-updated" });
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.observers.size > 0) {
        this.reconnectTimer = window.setTimeout(() => this.connect(), 2000);
      }
    };
  }

  private disconnect() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.close();
    this.socket = null;
  }
}

export const reservaRealtime = new ReservaRealtimeClient();
