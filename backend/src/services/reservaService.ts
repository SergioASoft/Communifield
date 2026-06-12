import { PoolConnection } from "mysql2/promise";
import { pool } from "../config/db";
import { env } from "../config/env";
import { broadcastReservaEvent } from "./reservaRealtime";
import { StripeCheckoutService } from "./stripeCheckoutService";

type CrearReservaInput = {
  canchaId: number;
  usuarioId: number;
  fecha: string;
  hora: string;
  duracion: number;
};

function parseHora(hora: string) {
  const match = hora.match(/(\d{2}):(\d{2})/);

  if (!match) {
    throw new Error("Selecciona una hora valida");
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toMysqlDatetime(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:00`;
}

function buildStartEnd(fecha: string, hora: string, duracion: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error("Selecciona una fecha valida");
  }

  if (![1, 2, 3].includes(duracion)) {
    throw new Error("La duracion debe ser de 1 a 3 horas");
  }

  const { hours, minutes } = parseHora(hora);
  const [year, month, day] = fecha.split("-").map(Number);
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + duracion);

  if (start.getTime() < Date.now()) {
    throw new Error("No puedes reservar un horario que ya paso");
  }

  return {
    start,
    end,
    fechaInicio: toMysqlDatetime(start),
    fechaFin: toMysqlDatetime(end),
  };
}

async function cleanupExpiredHolds(connection: PoolConnection, canchaId: number) {
  const [expiredRows]: any = await connection.query(
    `
    SELECT e.id_evento, e.id_pago
    FROM EVENTO e
    INNER JOIN PAGO p ON p.id_pago = e.id_pago
    WHERE e.fk_id_espacio = ?
      AND p.estado = 'pendiente'
      AND p.fecha_pago < DATE_SUB(NOW(), INTERVAL ? MINUTE)
    FOR UPDATE
    `,
    [canchaId, env.stripe.checkoutTtlMinutes]
  );

  for (const row of expiredRows) {
    await connection.query("UPDATE EVENTO SET id_pago = NULL WHERE id_evento = ?", [
      row.id_evento,
    ]);
    await connection.query("DELETE FROM PAGO WHERE id_pago = ?", [row.id_pago]);
    await connection.query("DELETE FROM EVENTO WHERE id_evento = ?", [row.id_evento]);
  }
}

async function assertSlotAvailable(
  connection: PoolConnection,
  canchaId: number,
  fechaInicio: string,
  fechaFin: string
) {
  const [conflicts]: any = await connection.query(
    `
    SELECT e.id_evento
    FROM EVENTO e
    INNER JOIN PAGO p ON p.id_pago = e.id_pago
    WHERE e.fk_id_espacio = ?
      AND p.estado IN ('pendiente', 'pagado')
      AND e.fecha_inic < ?
      AND e.fecha_fin > ?
    LIMIT 1
    FOR UPDATE
    `,
    [canchaId, fechaFin, fechaInicio]
  );

  if (conflicts.length) {
    throw new Error("La cancha ya esta reservada en ese horario");
  }
}

export class ReservaService {
  static async getDisponibilidad(canchaId: number, fecha: string) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await cleanupExpiredHolds(connection, canchaId);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [rows]: any = await pool.query(
      `
      SELECT
        e.id_evento,
        e.fecha_inic,
        e.fecha_fin,
        p.estado AS estado_pago
      FROM EVENTO e
      INNER JOIN PAGO p ON p.id_pago = e.id_pago
      WHERE e.fk_id_espacio = ?
        AND p.estado IN ('pendiente', 'pagado')
        AND DATE(e.fecha_inic) = ?
      ORDER BY e.fecha_inic ASC
      `,
      [canchaId, fecha]
    );

    return rows.map((row: any) => ({
      idEvento: row.id_evento,
      fechaInicio: row.fecha_inic,
      fechaFin: row.fecha_fin,
      estado: row.estado_pago,
    }));
  }

  static async crearCheckout(input: CrearReservaInput) {
    const { fechaInicio, fechaFin } = buildStartEnd(
      input.fecha,
      input.hora,
      input.duracion
    );
    const connection = await pool.getConnection();

    let eventoId = 0;
    let cancha: any;
    let total = 0;

    try {
      await connection.beginTransaction();

      const [canchaRows]: any = await connection.query(
        `
        SELECT id_espacio, nombre, precio_hora, estado
        FROM ESPACIO
        WHERE id_espacio = ?
        LIMIT 1
        FOR UPDATE
        `,
        [input.canchaId]
      );

      cancha = canchaRows[0];

      if (!cancha) {
        throw new Error("Cancha no encontrada");
      }

      if (cancha.estado !== "activo") {
        throw new Error("La cancha no esta disponible para reservas");
      }

      await cleanupExpiredHolds(connection, input.canchaId);
      await assertSlotAvailable(connection, input.canchaId, fechaInicio, fechaFin);

      const precioHora = Number(cancha.precio_hora || 0);
      const subtotal = precioHora * input.duracion;
      const tasaServicio = 5000;
      total = subtotal + tasaServicio;

      const eventoDatos = JSON.stringify({
        tipo: "reserva_usuario",
        usuarioId: input.usuarioId,
        duracionHoras: input.duracion,
        tasaServicio,
      });

      const [eventResult]: any = await connection.query(
        `
        INSERT INTO EVENTO
          (fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores, evento_datos)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [input.canchaId, subtotal, fechaInicio, fechaFin, 1, eventoDatos]
      );

      eventoId = eventResult.insertId;

      const [paymentResult]: any = await connection.query(
        `
        INSERT INTO PAGO (total, metodo, estado, fk_id_evento)
        VALUES (?, 'stripe', 'pendiente', ?)
        `,
        [total, eventoId]
      );

      await connection.query("UPDATE EVENTO SET id_pago = ? WHERE id_evento = ?", [
        paymentResult.insertId,
        eventoId,
      ]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const session = await StripeCheckoutService.createSession({
      canchaId: input.canchaId,
      eventoId,
      nombreCancha: cancha.nombre,
      total,
    });

    await pool.query(
      `
      UPDATE PAGO p
      INNER JOIN EVENTO e ON e.id_pago = p.id_pago
      SET p.referencia_externa = ?
      WHERE e.id_evento = ?
      `,
      [session.id, eventoId]
    );

    broadcastReservaEvent({
      type: "availability-updated",
      canchaId: input.canchaId,
      fecha: input.fecha,
    });

    return {
      eventoId,
      checkoutUrl: session.url,
      stripeSessionId: session.id,
      stripeMock: session.mock,
      total,
    };
  }

  static async confirmarPago(sessionId: string) {
    const session: any = await StripeCheckoutService.getSession(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("El pago aun no fue aprobado por Stripe");
    }

    const eventoId = Number(session.metadata?.eventoId || sessionId.replace("mock_", ""));

    if (!eventoId) {
      throw new Error("La sesion de Stripe no esta asociada a una reserva");
    }

    const [rows]: any = await pool.query(
      `
      SELECT e.id_evento, e.fk_id_espacio, DATE(e.fecha_inic) AS fecha
      FROM EVENTO e
      INNER JOIN PAGO p ON p.id_pago = e.id_pago
      WHERE e.id_evento = ?
        AND p.estado = 'pendiente'
      LIMIT 1
      `,
      [eventoId]
    );

    const reserva = rows[0];

    if (!reserva) {
      return { alreadyConfirmed: true };
    }

    await pool.query(
      `
      UPDATE PAGO p
      INNER JOIN EVENTO e ON e.id_pago = p.id_pago
      SET p.estado = 'pagado',
          p.fecha_pago = NOW()
      WHERE e.id_evento = ?
      `,
      [eventoId]
    );

    const fecha =
      reserva.fecha instanceof Date
        ? reserva.fecha.toISOString().slice(0, 10)
        : String(reserva.fecha).slice(0, 10);

    broadcastReservaEvent({
      type: "reservation-paid",
      canchaId: reserva.fk_id_espacio,
      fecha,
    });

    return {
      idEvento: eventoId,
      canchaId: reserva.fk_id_espacio,
      fecha,
      estado: "pagado",
    };
  }

  static async cancelarPendiente(eventoId: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows]: any = await connection.query(
        `
        SELECT e.id_evento, e.id_pago, e.fk_id_espacio, DATE(e.fecha_inic) AS fecha, p.estado
        FROM EVENTO e
        INNER JOIN PAGO p ON p.id_pago = e.id_pago
        WHERE e.id_evento = ?
        LIMIT 1
        FOR UPDATE
        `,
        [eventoId]
      );

      const reserva = rows[0];

      if (!reserva || reserva.estado !== "pendiente") {
        await connection.commit();
        return null;
      }

      await connection.query("UPDATE EVENTO SET id_pago = NULL WHERE id_evento = ?", [
        eventoId,
      ]);
      await connection.query("DELETE FROM PAGO WHERE id_pago = ?", [reserva.id_pago]);
      await connection.query("DELETE FROM EVENTO WHERE id_evento = ?", [eventoId]);

      await connection.commit();

      const fecha =
        reserva.fecha instanceof Date
          ? reserva.fecha.toISOString().slice(0, 10)
          : String(reserva.fecha).slice(0, 10);

      broadcastReservaEvent({
        type: "reservation-cancelled",
        canchaId: reserva.fk_id_espacio,
        fecha,
      });

      return { canchaId: reserva.fk_id_espacio, fecha };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
