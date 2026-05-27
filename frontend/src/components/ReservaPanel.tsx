import { useState } from "react";

import { Cancha } from "../types";

import { HORARIOS_SELECT } from "../data/canchaData";

interface ReservaPanelProps {
  cancha: any;
}

const DURACIONES = [1, 2, 3] as const;

type Duracion = typeof DURACIONES[number];

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

export default function ReservaPanel({
  cancha,
}: ReservaPanelProps) {
  const [duracion, setDuracion] =
    useState<Duracion>(1);

  const [fecha, setFecha] = useState("");

  const [hora, setHora] = useState("");

  const precioHora = Number(
    cancha.precioHora ||
      cancha.precioPorHora ||
      cancha.precio_hora ||
      0
  );

  const tasaServicio = Number(
    cancha.tasaServicio || 5000
  );

  const altaDemanda = Boolean(
    cancha.altaDemanda || false
  );

  const subtotal = precioHora * duracion;

  const total = subtotal + tasaServicio;

  const fechaMin = new Date()
    .toISOString()
    .split("T")[0];

  return (
    <aside className="reserva-panel">
      <div className="reserva-card">
        <div className="precio-wrap">
          <div>
            <span className="precio-monto">
              {formatCOP(precioHora)}
            </span>

            <span className="precio-unidad">
              / hora
            </span>
          </div>

          {altaDemanda && (
            <div className="precio-badge">
              Alta demanda
            </div>
          )}
        </div>

        <hr className="divider" />

        <div className="campo-grupo">
          <label
            className="campo-label"
            htmlFor="fecha-reserva"
          >
            Fecha
          </label>

          <input
            id="fecha-reserva"
            type="date"
            className="campo-input"
            min={fechaMin}
            value={fecha}
            onChange={(e) =>
              setFecha(e.target.value)
            }
          />
        </div>

        <div className="campo-grupo">
          <label
            className="campo-label"
            htmlFor="hora-reserva"
          >
            Hora de inicio
          </label>

          <select
            id="hora-reserva"
            className="campo-input"
            value={hora}
            onChange={(e) =>
              setHora(e.target.value)
            }
          >
            <option value="">
              Selecciona un horario
            </option>

            {HORARIOS_SELECT.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-grupo">
          <label className="campo-label">
            Duración
          </label>

          <div className="duracion-opciones">
            {DURACIONES.map((d) => (
              <button
                key={d}
                type="button"
                className={`duracion-btn${
                  duracion === d ? " active" : ""
                }`}
                onClick={() => setDuracion(d)}
              >
                {d} hora{d > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="resumen-precio">
          <div className="resumen-fila">
            <span>
              {formatCOP(precioHora)} × {duracion}{" "}
              hora{duracion > 1 ? "s" : ""}
            </span>

            <span>{formatCOP(subtotal)}</span>
          </div>

          <div className="resumen-fila">
            <span>Servicio CommuniField</span>

            <span>
              {formatCOP(tasaServicio)}
            </span>
          </div>

          <hr
            className="divider"
            style={{ margin: "10px 0" }}
          />

          <div className="resumen-fila resumen-total">
            <span>Total</span>

            <span>{formatCOP(total)}</span>
          </div>
        </div>

        <button className="btn-reservar">
          Reservar ahora
        </button>

        <p className="reserva-nota">
          No se realiza ningún cobro hasta
          confirmar
        </p>
      </div>

      <div className="info-rapida">
        <div className="info-item">
          <span>✅</span>

          <span>Confirmación inmediata</span>
        </div>

        <div className="info-item">
          <span>🔄</span>

          <span>
            Cancelación gratis hasta 24h antes
          </span>
        </div>

        <div className="info-item">
          <span>🔒</span>

          <span>Pago 100% seguro</span>
        </div>
      </div>
    </aside>
  );
}