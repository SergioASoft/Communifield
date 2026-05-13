
import { useState } from 'react';
import { Cancha } from '../types';
import { HORARIOS_SELECT } from '../data/canchaData';

interface ReservaPanelProps {
  cancha: Cancha;
}

const DURACIONES = [1, 2, 3] as const;
type Duracion = typeof DURACIONES[number];

function formatCOP(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`;
}

export default function ReservaPanel({ cancha }: ReservaPanelProps) {
  const [duracion, setDuracion]  = useState<Duracion>(1);
  const [fecha,    setFecha]     = useState('');
  const [hora,     setHora]      = useState('');

  const subtotal = cancha.precioPorHora * duracion;
  const total    = subtotal + cancha.tasaServicio;
  const fechaMin = new Date().toISOString().split('T')[0];

  return (
    <aside className="reserva-panel">
      <div className="reserva-card">
        {/* Precio */}
        <div className="precio-wrap">
          <div>
            <span className="precio-monto">{formatCOP(cancha.precioPorHora)}</span>
            <span className="precio-unidad">/ hora</span>
          </div>
          {cancha.altaDemanda && (
            <div className="precio-badge"> Alta demanda</div>
          )}
        </div>

        <hr className="divider" />

        {/* Fecha */}
        <div className="campo-grupo">
          <label className="campo-label" htmlFor="fecha-reserva">Fecha</label>
          <input
            id="fecha-reserva"
            type="date"
            className="campo-input"
            min={fechaMin}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        {/* Hora */}
        <div className="campo-grupo">
          <label className="campo-label" htmlFor="hora-reserva">Hora de inicio</label>
          <select
            id="hora-reserva"
            className="campo-input"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          >
            <option value="">Selecciona un horario</option>
            {HORARIOS_SELECT.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* Duración */}
        <div className="campo-grupo">
          <label className="campo-label">Duración</label>
          <div className="duracion-opciones">
            {DURACIONES.map((d) => (
              <button
                key={d}
                className={`duracion-btn${duracion === d ? ' active' : ''}`}
                onClick={() => setDuracion(d)}
              >
                {d} hora{d > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="resumen-precio">
          <div className="resumen-fila">
            <span>{formatCOP(cancha.precioPorHora)} × {duracion} hora{duracion > 1 ? 's' : ''}</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="resumen-fila">
            <span>Servicio CommuniField</span>
            <span>{formatCOP(cancha.tasaServicio)}</span>
          </div>
          <hr className="divider" style={{ margin: '10px 0' }} />
          <div className="resumen-fila resumen-total">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
        </div>

        <button className="btn-reservar">Reservar ahora</button>
        <p className="reserva-nota">No se realiza ningún cobro hasta confirmar</p>
      </div>

      {/* Info rápida */}
      <div className="info-rapida">
        <div className="info-item">
          <span>✅</span>
          <span>Confirmación inmediata</span>
        </div>
        <div className="info-item">
          <span>🔄</span>
          <span>Cancelación gratis hasta 24h antes</span>
        </div>
        <div className="info-item">
          <span>🔒</span>
          <span>Pago 100% seguro</span>
        </div>
      </div>
    </aside>
  );
}
