import { useEffect, useMemo, useState, type ComponentType, type FormEvent } from "react";
import { CheckCircle2, CreditCard, Landmark, Lock, Smartphone, X } from "lucide-react";

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

type ApiErrorBody = {
  message?: string;
  code?: string;
  details?: unknown;
};

class ApiRequestError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(message: string, status: number, body: ApiErrorBody) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

type MetodoPago = "nequi" | "pse" | "tarjeta";

type PagoForm = {
  phone: string;
  bank: string;
  documentType: string;
  documentNumber: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  holderName: string;
  cardType: "debito" | "credito";
};

const METODOS_PAGO: Array<{
  id: MetodoPago;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  {
    id: "nequi",
    label: "Nequi",
    description: "Confirma con tu numero celular",
    icon: Smartphone,
  },
  {
    id: "pse",
    label: "PSE",
    description: "Debito desde cuenta bancaria",
    icon: Landmark,
  },
  {
    id: "tarjeta",
    label: "Visa / Mastercard",
    description: "Tarjeta debito o credito",
    icon: CreditCard,
  },
];

const initialPagoForm: PagoForm = {
  phone: "",
  bank: "",
  documentType: "CC",
  documentNumber: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  holderName: "",
  cardType: "debito",
};

async function readJsonResponse(res: Response) {
  try {
    return await res.json();
  } catch (error) {
    console.error("[ReservaPanel] La API no devolvio JSON valido", {
      status: res.status,
      url: res.url,
      error,
    });
    return {};
  }
}

function logReservaError(scope: string, error: unknown, context?: Record<string, unknown>) {
  if (error instanceof ApiRequestError) {
    console.error(`[ReservaPanel] ${scope}`, {
      message: error.message,
      status: error.status,
      code: error.body.code,
      details: error.body.details,
      context,
    });
    return;
  }

  console.error(`[ReservaPanel] ${scope}`, {
    message: error instanceof Error ? error.message : String(error),
    error,
    context,
  });
}

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

function formatTime(value: string) {
  const normalized = value.includes("T") ? value.slice(0, 19).replace("T", " ") : value;
  const [, timePart = "00:00:00"] = normalized.split(" ");
  return timePart.slice(0, 5);
}

export default function ReservaPanel({ cancha }: ReservaPanelProps) {
  const [duracion, setDuracion] = useState<Duracion>(1);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [reservasOcupadas, setReservasOcupadas] = useState<ReservaOcupada[]>([]);
  const [mensajeReserva, setMensajeReserva] = useState("");
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("nequi");
  const [pagoForm, setPagoForm] = useState<PagoForm>(initialPagoForm);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [mensajePago, setMensajePago] = useState("");

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

  const horariosOcupados = useMemo(
    () =>
      reservasOcupadas.map((reserva) => ({
        idEvento: reserva.idEvento,
        label: `${formatTime(reserva.fechaInicio)} - ${formatTime(reserva.fechaFin)}`,
        estado: reserva.estado,
      })),
    [reservasOcupadas]
  );

  async function cargarDisponibilidad(fechaReserva = fecha) {
    if (!canchaId || !fechaReserva) {
      setReservasOcupadas([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/reservas/canchas/${canchaId}/disponibilidad?fecha=${fechaReserva}`
      );
      const data = await readJsonResponse(res);

      if (!res.ok) {
        throw new ApiRequestError(
          data.message || "No se pudo consultar disponibilidad",
          res.status,
          data
        );
      }

      setReservasOcupadas(data.reservas || []);
    } catch (error: any) {
      logReservaError("Error consultando disponibilidad", error, {
        canchaId,
        fechaReserva,
      });
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
      } catch (error) {
        console.error("[ReservaPanel] Evento SSE de reservas no tiene JSON valido", {
          raw: event.data,
          error,
        });
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

  function abrirModalPago() {
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

    setMensajeReserva("");
    setMensajePago("");
    setModalPagoAbierto(true);
  }

  function updatePagoForm<K extends keyof PagoForm>(key: K, value: PagoForm[K]) {
    setPagoForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function getDatosPago() {
    if (metodoPago === "nequi") {
      return {
        phone: pagoForm.phone,
      };
    }

    if (metodoPago === "pse") {
      return {
        bank: pagoForm.bank,
        documentType: pagoForm.documentType,
        documentNumber: pagoForm.documentNumber,
      };
    }

    return {
      cardNumber: pagoForm.cardNumber,
      expiry: pagoForm.expiry,
      cvv: pagoForm.cvv,
      holderName: pagoForm.holderName,
      cardType: pagoForm.cardType,
    };
  }

  async function pagarReserva(e: FormEvent) {
    e.preventDefault();

    if (procesandoPago) return;

    const token = localStorage.getItem("communifield_token");

    if (!token) {
      setMensajeReserva("Debes iniciar sesion para reservar una cancha.");
      setModalPagoAbierto(false);
      return;
    }

    setProcesandoPago(true);
    setMensajeReserva("");
    setMensajePago("");

    const payload = {
      fecha,
      hora,
      duracion,
      metodoPago,
      datosPago: getDatosPago(),
    };

    try {
      const res = await fetch(`/api/reservas/canchas/${canchaId}/pagar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        throw new ApiRequestError(
          data.message || "No se pudo completar el pago",
          res.status,
          data
        );
      }

      setMensajeReserva(
        `Reserva confirmada. ${data.message || "Pago aprobado"} Ref: ${data.referencia}`
      );
      setModalPagoAbierto(false);
      setPagoForm(initialPagoForm);
      await cargarDisponibilidad();
    } catch (error: any) {
      logReservaError("Error completando pago", error, {
        canchaId,
        payload,
      });
      setMensajePago(error.message || "No se pudo completar la reserva.");
      await cargarDisponibilidad();
    } finally {
      setProcesandoPago(false);
    }
  }

  function renderCamposPago() {
    if (metodoPago === "nequi") {
      return (
        <div className="campo-grupo">
          <label className="campo-label" htmlFor="nequi-phone">
            Numero Nequi
          </label>
          <input
            id="nequi-phone"
            className="campo-input"
            inputMode="numeric"
            placeholder="3001234567"
            value={pagoForm.phone}
            required
            onChange={(e) => updatePagoForm("phone", e.target.value)}
          />
        </div>
      );
    }

    if (metodoPago === "pse") {
      return (
        <>
          <div className="campo-grupo">
            <label className="campo-label" htmlFor="pse-bank">
              Banco
            </label>
            <select
              id="pse-bank"
              className="campo-input"
              value={pagoForm.bank}
              required
              onChange={(e) => updatePagoForm("bank", e.target.value)}
            >
              <option value="">Selecciona tu banco</option>
              <option value="bancolombia">Bancolombia</option>
              <option value="davivienda">Davivienda</option>
              <option value="bbva">BBVA</option>
              <option value="banco-bogota">Banco de Bogota</option>
            </select>
          </div>

          <div className="pago-grid">
            <div className="campo-grupo">
              <label className="campo-label" htmlFor="pse-doc-type">
                Tipo
              </label>
              <select
                id="pse-doc-type"
                className="campo-input"
                value={pagoForm.documentType}
                required
                onChange={(e) => updatePagoForm("documentType", e.target.value)}
              >
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="NIT">NIT</option>
              </select>
            </div>

            <div className="campo-grupo">
              <label className="campo-label" htmlFor="pse-doc-number">
                Documento
              </label>
              <input
                id="pse-doc-number"
                className="campo-input"
                inputMode="numeric"
                value={pagoForm.documentNumber}
                required
                onChange={(e) => updatePagoForm("documentNumber", e.target.value)}
              />
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="campo-grupo">
          <label className="campo-label" htmlFor="card-holder">
            Titular
          </label>
          <input
            id="card-holder"
            className="campo-input"
            placeholder="Nombre como aparece en la tarjeta"
            value={pagoForm.holderName}
            required
            onChange={(e) => updatePagoForm("holderName", e.target.value)}
          />
        </div>

        <div className="campo-grupo">
          <label className="campo-label" htmlFor="card-number">
            Numero de tarjeta
          </label>
          <input
            id="card-number"
            className="campo-input"
            inputMode="numeric"
            placeholder="4111111111111111"
            value={pagoForm.cardNumber}
            required
            onChange={(e) => updatePagoForm("cardNumber", e.target.value)}
          />
        </div>

        <div className="pago-grid">
          <div className="campo-grupo">
            <label className="campo-label" htmlFor="card-expiry">
              Vence
            </label>
            <input
              id="card-expiry"
              className="campo-input"
              placeholder="MM/AA"
              value={pagoForm.expiry}
              required
              onChange={(e) => updatePagoForm("expiry", e.target.value)}
            />
          </div>

          <div className="campo-grupo">
            <label className="campo-label" htmlFor="card-cvv">
              CVV
            </label>
            <input
              id="card-cvv"
              className="campo-input"
              inputMode="numeric"
              value={pagoForm.cvv}
              required
              onChange={(e) => updatePagoForm("cvv", e.target.value)}
            />
          </div>
        </div>

        <div className="tipo-tarjeta">
          <label>
            <input
              type="radio"
              name="cardType"
              checked={pagoForm.cardType === "debito"}
              onChange={() => updatePagoForm("cardType", "debito")}
            />
            Debito
          </label>
          <label>
            <input
              type="radio"
              name="cardType"
              checked={pagoForm.cardType === "credito"}
              onChange={() => updatePagoForm("cardType", "credito")}
            />
            Credito
          </label>
        </div>
      </>
    );
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

        {fecha && (
          <div className="horarios-ocupados">
            <div className="horarios-ocupados-header">
              <span>Horarios ocupados</span>
              <strong>{horariosOcupados.length}</strong>
            </div>

            {horariosOcupados.length > 0 ? (
              <div className="horarios-ocupados-lista">
                {horariosOcupados.map((reserva) => (
                  <span key={reserva.idEvento} className="horario-ocupado-chip">
                    {reserva.label}
                    <small>{reserva.estado}</small>
                  </span>
                ))}
              </div>
            ) : (
              <p>No hay reservas registradas para esta fecha.</p>
            )}
          </div>
        )}

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
          disabled={!fecha || !hora || slotOcupado(hora, duracion)}
          onClick={abrirModalPago}
        >
          Pagar y reservar
        </button>

        <p className="reserva-nota">Pago seguro con Nequi, PSE o tarjeta.</p>
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

      {modalPagoAbierto && (
        <div className="pago-modal-backdrop" role="presentation">
          <form className="pago-modal" onSubmit={pagarReserva}>
            <div className="pago-modal-header">
              <div>
                <p className="pago-eyebrow">Pago de reserva</p>
                <h2>Completa tu pago</h2>
              </div>
              <button
                type="button"
                className="pago-close"
                onClick={() => setModalPagoAbierto(false)}
                aria-label="Cerrar modal de pago"
              >
                <X size={20} />
              </button>
            </div>

            <div className="pago-resumen">
              <div>
                <span>Fecha y hora</span>
                <strong>
                  {fecha} - {hora}
                </strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCOP(total)}</strong>
              </div>
            </div>

            <div className="metodos-pago">
              {METODOS_PAGO.map((metodo) => {
                const Icon = metodo.icon;

                return (
                  <button
                    key={metodo.id}
                    type="button"
                    className={`metodo-pago${metodoPago === metodo.id ? " active" : ""}`}
                    onClick={() => {
                      setMetodoPago(metodo.id);
                      setMensajePago("");
                    }}
                  >
                    <Icon size={20} />
                    <span>
                      <strong>{metodo.label}</strong>
                      <small>{metodo.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pago-formulario">{renderCamposPago()}</div>

            {mensajePago && <p className="pago-error">{mensajePago}</p>}

            <div className="pago-seguridad">
              <Lock size={16} />
              <span>Transaccion protegida en ambiente sandbox.</span>
            </div>

            <button className="btn-reservar" type="submit" disabled={procesandoPago}>
              {procesandoPago ? (
                "Procesando pago..."
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Confirmar pago
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
