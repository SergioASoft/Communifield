import { useEffect, useMemo, useState } from "react";

import { HORARIOS_SELECT } from "../data/canchaData";

interface ReservaPanelProps {
  cancha: any;
}

const DURACIONES = [1, 2, 3] as const;

type Duracion = (typeof DURACIONES)[number];

type ReservaOcupada = {
  idEvento: number;
  fechaInicio: string;
  fechaFin: string;
  estado: "pendiente" | "pagado";
};

function formatCOP(valor?: number): string {
  if (!valor || isNaN(valor)) {
    return "$0";
  }

  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default function ReservaPanel({ cancha }: ReservaPanelProps) {
  const [duracion, setDuracion] = useState<Duracion>(1);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [reservasOcupadas, setReservasOcupadas] = useState<ReservaOcupada[]>([]);
  const [mensajeReserva, setMensajeReserva] = useState("");
  const [creandoCheckout, setCreandoCheckout] = useState(false);

  const precioHora = Number(
    cancha.precioHora || cancha.precioPorHora || cancha.precio_hora || 0
  );
  const tasaServicio = Number(cancha.tasaServicio || 5000);
  const altaDemanda = Boolean(cancha.altaDemanda || false);
  const subtotal = precioHora * duracion;
  const total = subtotal + tasaServicio;
  const fechaMin = new Date().toISOString().split("T")[0];
  const canchaId = Number(cancha.id_espacio || cancha.id);

  const horarios = useMemo(
    () =>
      HORARIOS_SELECT.map((label) => ({
        label,
        value: label.match(/\d{2}:\d{2}/)?.[0] || label,
      })),
    []
  );

  function parseReservaDate(value: string) {
    const normalized = value.includes("T") ? value.slice(0, 19).replace("T", " ") : value;
    const [datePart, timePart = "00:00:00"] = normalized.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds || 0);
  }

  function buildSlot(horaInicio: string, horasDuracion: number) {
    if (!fecha || !horaInicio) return null;

    const [hours, minutes] = horaInicio.split(":").map(Number);
    const [year, month, day] = fecha.split("-").map(Number);
    const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + horasDuracion);

    return { start, end };
  }

  function slotOcupado(horaInicio: string, horasDuracion = 1) {
    const slot = buildSlot(horaInicio, horasDuracion);
    if (!slot) return false;

    return reservasOcupadas.some((reserva) => {
      const inicio = parseReservaDate(reserva.fechaInicio);
      const fin = parseReservaDate(reserva.fechaFin);
      return slot.start < fin && slot.end > inicio;
    });
  }

  async function cargarDisponibilidad(fechaReserva = fecha) {
    if (!canchaId || !fechaReserva) {
      setReservasOcupadas([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/reservas/canchas/${canchaId}/disponibilidad?fecha=${fechaReserva}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo consultar disponibilidad");
      }

      setReservasOcupadas(data.reservas || []);
    } catch (error: any) {
      setMensajeReserva(error.message || "No se pudo consultar disponibilidad.");
    }
  }

  useEffect(() => {
    cargarDisponibilidad();
  }, [canchaId, fecha]);

  useEffect(() => {
    const source = new EventSource("/api/reservas/stream");

    const onUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (Number(data.canchaId) === canchaId && (!fecha || data.fecha === fecha)) {
          cargarDisponibilidad(fecha);
        }
      } catch {
        cargarDisponibilidad(fecha);
      }
    };

    source.addEventListener("availability-updated", onUpdate);
    source.addEventListener("reservation-paid", onUpdate);
    source.addEventListener("reservation-cancelled", onUpdate);

    return () => {
      source.close();
    };
  }, [canchaId, fecha]);

  async function reservar() {
    const token = localStorage.getItem("communifield_token");

    if (!token) {
      setMensajeReserva("Debes iniciar sesion para reservar una cancha.");
      return;
    }

    if (!fecha || !hora) {
      setMensajeReserva("Selecciona fecha y hora para reservar.");
      return;
    }

    if (slotOcupado(hora, duracion)) {
      setMensajeReserva("Ese horario ya esta ocupado. Elige otro disponible.");
      return;
    }

    setCreandoCheckout(true);
    setMensajeReserva("");

    try {
      const res = await fetch(`/api/reservas/canchas/${canchaId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fecha, hora, duracion }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo iniciar el pago");
      }

      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      setMensajeReserva(error.message || "No se pudo iniciar la reserva.");
      await cargarDisponibilidad();
    } finally {
      setCreandoCheckout(false);
    }
  }

  return (
    <aside className="reserva-panel">
      <div className="reserva-card">
        <div className="precio-wrap">
          <div>
            <span className="precio-monto">{formatCOP(precioHora)}</span>
            <span className="precio-unidad">/ hora</span>
          </div>

          {altaDemanda && <div className="precio-badge">Alta demanda</div>}
        </div>

        <hr className="divider" />

        <div className="campo-grupo">
          <label className="campo-label" htmlFor="fecha-reserva">
            Fecha
          </label>
          <input
            id="fecha-reserva"
            type="date"
            className="campo-input"
            min={fechaMin}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setHora("");
              setMensajeReserva("");
            }}
          />
        </div>

        <div className="campo-grupo">
          <label className="campo-label" htmlFor="hora-reserva">
            Hora de inicio
          </label>
          <select
            id="hora-reserva"
            className="campo-input"
            value={hora}
            onChange={(e) => {
              setHora(e.target.value);
              setMensajeReserva("");
            }}
          >
            <option value="">Selecciona un horario</option>
            {horarios.map((h) => {
              const ocupado = slotOcupado(h.value);
              return (
                <option key={h.value} value={h.value} disabled={ocupado}>
                  {h.label}
                  {ocupado ? " - ocupado" : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className="campo-grupo">
          <label className="campo-label">Duracion</label>
          <div className="duracion-opciones">
            {DURACIONES.map((d) => (
              <button
                key={d}
                type="button"
                className={`duracion-btn${duracion === d ? " active" : ""}`}
                onClick={() => setDuracion(d)}
                disabled={Boolean(hora) && slotOcupado(hora, d)}
              >
                {d} hora{d > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="resumen-precio">
          <div className="resumen-fila">
            <span>
              {formatCOP(precioHora)} x {duracion} hora{duracion > 1 ? "s" : ""}
            </span>
            <span>{formatCOP(subtotal)}</span>
          </div>

          <div className="resumen-fila">
            <span>Servicio CommuniField</span>
            <span>{formatCOP(tasaServicio)}</span>
          </div>

          <hr className="divider" style={{ margin: "10px 0" }} />

          <div className="resumen-fila resumen-total">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
        </div>

        {mensajeReserva && <p className="reserva-mensaje">{mensajeReserva}</p>}

        <button
          className="btn-reservar"
          type="button"
          disabled={creandoCheckout || !fecha || !hora || slotOcupado(hora, duracion)}
          onClick={reservar}
        >
          {creandoCheckout ? "Preparando pago..." : "Pagar y reservar"}
        </button>

        <p className="reserva-nota">Pago completo con Stripe en modo sandbox.</p>
      </div>

      <div className="info-rapida">
        <div className="info-item">
          <span>OK</span>
          <span>Confirmacion inmediata</span>
        </div>
        <div className="info-item">
          <span>24h</span>
          <span>Cancelacion gratis hasta 24h antes</span>
        </div>
        <div className="info-item">
          <span>SSL</span>
          <span>Pago 100% seguro</span>
        </div>
      </div>
    </aside>
  );
}
