import { PoolConnection } from "mysql2/promise";
import { pool } from "../config/db";
import { env } from "../config/env";
import { broadcastReservaEvent } from "./reservaRealtime";
import { StripeCheckoutService } from "./stripeCheckoutService";
import { PaymentPayload, PaymentStrategyFactory } from "./paymentStrategy";
import { AppError, getErrorDetails, getErrorMessage, logError } from "../utils/appError";

type CrearReservaInput = {
  canchaId: number;
  usuarioId: number;
  fecha: string;
  hora: string;
  duracion: number;
};

type CrearPagoReservaInput = CrearReservaInput & {
  metodoPago: string;
  datosPago: PaymentPayload;
};

type CrearEspacioAbiertoInput = CrearReservaInput & {
  gestorId: number;
  participantes: number;
};

type UnirseEspacioAbiertoInput = {
  espacioAbiertoId: number;
  usuarioId: number;
  metodoPago: string;
  datosPago: PaymentPayload;
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
    throw new AppError("Selecciona una fecha valida", {
      status: 400,
      code: "INVALID_RESERVATION_DATE",
      details: { fecha },
    });
  }

  if (![1, 2, 3].includes(duracion)) {
    throw new AppError("La duracion debe ser de 1 a 3 horas", {
      status: 400,
      code: "INVALID_RESERVATION_DURATION",
      details: { duracion },
    });
  }

  const { hours, minutes } = parseHora(hora);
  const [year, month, day] = fecha.split("-").map(Number);
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + duracion);

  if (start.getTime() < Date.now()) {
    throw new AppError("No puedes reservar un horario que ya paso", {
      status: 400,
      code: "PAST_RESERVATION_SLOT",
      details: { fecha, hora, duracion },
    });
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
      AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(e.evento_datos, '$.tipo')), '') != 'espacio_abierto'
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
    SELECT e.id_evento, e.fecha_inic, e.fecha_fin, p.estado AS estado_pago
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
    throw new AppError("La cancha ya esta reservada en ese horario", {
      status: 409,
      code: "RESERVATION_SLOT_UNAVAILABLE",
      details: {
        canchaId,
        fechaInicio,
        fechaFin,
        conflicto: conflicts[0],
      },
    });
  }
}

function normalizeReservaError(error: any, context: Record<string, unknown>) {
  if (error instanceof AppError) {
    return error;
  }

  const message = getErrorMessage(error);
  const details = getErrorDetails(error);
  const sqlMessage = String(details?.sqlMessage || "");

  if (message.includes("referencia_externa") || sqlMessage.includes("referencia_externa")) {
    return new AppError(
      "La base de datos no tiene la columna referencia_externa en PAGO. Ejecuta la migracion 003 o actualiza schema.sql.",
      {
        status: 500,
        code: "PAYMENT_SCHEMA_OUTDATED",
        details,
        cause: error,
      }
    );
  }

  if (
    message.includes("ESPACIO_ABIERTO") ||
    sqlMessage.includes("ESPACIO_ABIERTO")
  ) {
    return new AppError(
      "La base de datos no tiene las tablas de espacios abiertos. Ejecuta la migracion 005_espacios_abiertos_websockets_observer.sql.",
      {
        status: 500,
        code: "OPEN_SLOT_SCHEMA_OUTDATED",
        details: {
          ...details,
          context,
        },
        cause: error,
      }
    );
  }

  if (details?.code === "ER_BAD_FIELD_ERROR") {
    return new AppError(
      "La base de datos no coincide con el esquema esperado para reservas. Revisa las migraciones y columnas de ESPACIO/EVENTO/PAGO.",
      {
        status: 500,
        code: "RESERVATION_SCHEMA_MISMATCH",
        details: {
          ...details,
          context,
        },
        cause: error,
      }
    );
  }

  if (
    message.includes("disponible en ese horario") ||
    message.includes("Conflicto de horario") ||
    details?.sqlState === "45000"
  ) {
    return new AppError(
      "La base de datos rechazo el horario por solapamiento. Revisa si existe un EVENTO cruzado para esa cancha.",
      {
        status: 409,
        code: "DATABASE_SLOT_CONFLICT",
        details: {
          ...details,
          context,
        },
        cause: error,
      }
    );
  }

  return new AppError("No se pudo completar la reserva por un error interno", {
    status: 500,
    code: "RESERVATION_PAYMENT_FAILED",
    details: {
      ...details,
      message,
      context,
    },
    cause: error,
  });
}

export class ReservaService {
  static async getReservasUsuario(usuarioId: number) {
    const [rows]: any = await pool.query(
      `
      SELECT
        e.id_evento,
        e.fk_id_espacio,
        esp.nombre AS cancha_nombre,
        esp.tipo AS cancha_tipo,
        esp.ubicacion AS cancha_ubicacion,
        esp.imagen_principal AS cancha_imagen,
        DATE_FORMAT(e.fecha_inic, '%Y-%m-%d %H:%i:%s') AS fecha_inicio,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fecha_fin,
        e.precio AS subtotal,
        p.id_pago,
        p.total,
        p.metodo,
        p.estado AS estado_pago,
        p.referencia_externa,
        DATE_FORMAT(p.fecha_pago, '%Y-%m-%d %H:%i:%s') AS fecha_pago
      FROM EVENTO e
      INNER JOIN ESPACIO esp ON esp.id_espacio = e.fk_id_espacio
      INNER JOIN PAGO p ON p.id_pago = e.id_pago
      WHERE JSON_UNQUOTE(JSON_EXTRACT(e.evento_datos, '$.usuarioId')) = ?
      ORDER BY e.fecha_inic DESC
      `,
      [String(usuarioId)]
    );

    return rows.map((row: any) => ({
      idEvento: row.id_evento,
      canchaId: row.fk_id_espacio,
      canchaNombre: row.cancha_nombre,
      canchaTipo: row.cancha_tipo,
      canchaUbicacion: row.cancha_ubicacion,
      canchaImagen: row.cancha_imagen,
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin,
      subtotal: Number(row.subtotal || 0),
      pago: {
        idPago: row.id_pago,
        total: Number(row.total || 0),
        metodo: row.metodo,
        estado: row.estado_pago,
        referencia: row.referencia_externa,
        fechaPago: row.fecha_pago,
      },
    }));
  }

  static async getDisponibilidad(canchaId: number, fecha: string, usuarioId?: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await cleanupExpiredHolds(connection, canchaId);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      logError("ReservaService.getDisponibilidad.cleanupExpiredHolds", error, {
        canchaId,
        fecha,
      });
    } finally {
      connection.release();
    }

    const [rows]: any = await pool.query(
      `
      SELECT
        e.id_evento,
        DATE_FORMAT(e.fecha_inic, '%Y-%m-%d %H:%i:%s') AS fecha_inic,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fecha_fin,
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

    const reservas = rows.map((row: any) => ({
      idEvento: row.id_evento,
      fechaInicio: row.fecha_inic,
      fechaFin: row.fecha_fin,
      estado: row.estado_pago,
    }));

    const [openRows]: any = await pool.query(
      `
      SELECT
        ea.id_espacio_abierto,
        ea.fk_id_evento,
        ea.estado,
        ea.precio_total,
        ea.cuota_participante,
        ea.max_participantes,
        DATE_FORMAT(e.fecha_inic, '%Y-%m-%d %H:%i:%s') AS fecha_inic,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fecha_fin,
        COUNT(CASE WHEN eap.estado = 'pagado' THEN 1 END) AS participantes_actuales,
        MAX(CASE
          WHEN eap.fk_id_usuario = ? AND eap.estado IN ('pendiente', 'pagado')
          THEN 1
          ELSE 0
        END) AS inscrito
      FROM ESPACIO_ABIERTO ea
      INNER JOIN EVENTO e ON e.id_evento = ea.fk_id_evento
      LEFT JOIN ESPACIO_ABIERTO_PARTICIPANTE eap
        ON eap.fk_id_espacio_abierto = ea.id_espacio_abierto
      WHERE e.fk_id_espacio = ?
        AND DATE(e.fecha_inic) = ?
        AND ea.estado IN ('abierto', 'completo')
      GROUP BY
        ea.id_espacio_abierto,
        ea.fk_id_evento,
        ea.estado,
        ea.precio_total,
        ea.cuota_participante,
        ea.max_participantes,
        e.fecha_inic,
        e.fecha_fin
      ORDER BY e.fecha_inic ASC
      `,
      [usuarioId || 0, canchaId, fecha]
    );

    return {
      reservas,
      espaciosAbiertos: openRows.map((row: any) => ({
        idEspacioAbierto: row.id_espacio_abierto,
        idEvento: row.fk_id_evento,
        estado: row.estado,
        fechaInicio: row.fecha_inic,
        fechaFin: row.fecha_fin,
        precioTotal: Number(row.precio_total || 0),
        cuotaParticipante: Number(row.cuota_participante || 0),
        maxParticipantes: Number(row.max_participantes || 0),
        participantesActuales: Number(row.participantes_actuales || 0),
        inscrito: Boolean(row.inscrito),
        cuposDisponibles:
          Number(row.max_participantes || 0) - Number(row.participantes_actuales || 0),
      })),
    };
  }

  static async crearEspacioAbierto(input: CrearEspacioAbiertoInput) {
    const participantes = Number(input.participantes);

    if (!Number.isInteger(participantes) || participantes < 2 || participantes > 30) {
      throw new AppError("Define una cantidad de participantes entre 2 y 30", {
        status: 400,
        code: "INVALID_OPEN_SLOT_CAPACITY",
        details: { participantes },
      });
    }

    const { fechaInicio, fechaFin } = buildStartEnd(
      input.fecha,
      input.hora,
      input.duracion
    );
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [canchaRows]: any = await connection.query(
        `
        SELECT id_espacio, nombre, precio_hora, estado, fk_id_dueño AS owner_id
        FROM ESPACIO
        WHERE id_espacio = ?
        LIMIT 1
        FOR UPDATE
        `,
        [input.canchaId]
      );

      const cancha = canchaRows[0];

      if (!cancha) {
        throw new AppError("Cancha no encontrada", {
          status: 404,
          code: "COURT_NOT_FOUND",
        });
      }

      if (cancha.estado !== "activo") {
        throw new AppError("La cancha no esta disponible para espacios abiertos", {
          status: 400,
          code: "COURT_NOT_ACTIVE",
        });
      }

      if (Number(cancha.owner_id) !== input.gestorId) {
        throw new AppError("Solo el gestor de la cancha puede crear espacios abiertos", {
          status: 403,
          code: "OPEN_SLOT_OWNER_REQUIRED",
        });
      }

      await cleanupExpiredHolds(connection, input.canchaId);
      await assertSlotAvailable(connection, input.canchaId, fechaInicio, fechaFin);

      const precioTotal = Number(cancha.precio_hora || 0) * input.duracion;
      const cuotaParticipante = Number((precioTotal / participantes).toFixed(2));

      const eventoDatos = JSON.stringify({
        tipo: "espacio_abierto",
        gestorId: input.gestorId,
        duracionHoras: input.duracion,
        participantes,
        cuotaParticipante,
      });

      const [eventResult]: any = await connection.query(
        `
        INSERT INTO EVENTO
          (fk_id_espacio, precio, fecha_inic, fecha_fin, max_jugadores, evento_datos)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          input.canchaId,
          precioTotal,
          fechaInicio,
          fechaFin,
          participantes,
          eventoDatos,
        ]
      );

      const eventoId = eventResult.insertId;

      const [paymentResult]: any = await connection.query(
        `
        INSERT INTO PAGO (total, metodo, estado, fk_id_evento)
        VALUES (?, 'espacio_abierto', 'pendiente', ?)
        `,
        [precioTotal, eventoId]
      );

      await connection.query("UPDATE EVENTO SET id_pago = ? WHERE id_evento = ?", [
        paymentResult.insertId,
        eventoId,
      ]);

      const [openResult]: any = await connection.query(
        `
        INSERT INTO ESPACIO_ABIERTO
          (fk_id_evento, fk_id_gestor, precio_total, cuota_participante, max_participantes)
        VALUES (?, ?, ?, ?, ?)
        `,
        [eventoId, input.gestorId, precioTotal, cuotaParticipante, participantes]
      );

      await connection.commit();

      broadcastReservaEvent({
        type: "open-slot-created",
        canchaId: input.canchaId,
        fecha: input.fecha,
        espacioAbiertoId: openResult.insertId,
      });

      return {
        idEspacioAbierto: openResult.insertId,
        idEvento: eventoId,
        canchaId: input.canchaId,
        fechaInicio,
        fechaFin,
        precioTotal,
        cuotaParticipante,
        maxParticipantes: participantes,
        participantesActuales: 0,
        cuposDisponibles: participantes,
        estado: "abierto",
      };
    } catch (error) {
      await connection.rollback();
      throw normalizeReservaError(error, {
        canchaId: input.canchaId,
        gestorId: input.gestorId,
        fecha: input.fecha,
        hora: input.hora,
        duracion: input.duracion,
        participantes,
      });
    } finally {
      connection.release();
    }
  }

  static async unirseEspacioAbierto(input: UnirseEspacioAbiertoInput) {
    const strategy = PaymentStrategyFactory.get(input.metodoPago);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows]: any = await connection.query(
        `
        SELECT
          ea.id_espacio_abierto,
          ea.fk_id_evento,
          ea.estado,
          ea.cuota_participante,
          ea.max_participantes,
          e.fk_id_espacio,
          DATE(e.fecha_inic) AS fecha,
          COUNT(CASE WHEN eap.estado = 'pagado' THEN 1 END) AS participantes_actuales
        FROM ESPACIO_ABIERTO ea
        INNER JOIN EVENTO e ON e.id_evento = ea.fk_id_evento
        LEFT JOIN ESPACIO_ABIERTO_PARTICIPANTE eap
          ON eap.fk_id_espacio_abierto = ea.id_espacio_abierto
        WHERE ea.id_espacio_abierto = ?
        GROUP BY
          ea.id_espacio_abierto,
          ea.fk_id_evento,
          ea.estado,
          ea.cuota_participante,
          ea.max_participantes,
          e.fk_id_espacio,
          e.fecha_inic
        FOR UPDATE
        `,
        [input.espacioAbiertoId]
      );

      const espacioAbierto = rows[0];

      if (!espacioAbierto) {
        throw new AppError("Espacio abierto no encontrado", {
          status: 404,
          code: "OPEN_SLOT_NOT_FOUND",
        });
      }

      if (espacioAbierto.estado !== "abierto") {
        throw new AppError("Este espacio abierto ya no recibe jugadores", {
          status: 409,
          code: "OPEN_SLOT_CLOSED",
        });
      }

      if (
        Number(espacioAbierto.participantes_actuales || 0) >=
        Number(espacioAbierto.max_participantes || 0)
      ) {
        throw new AppError("El espacio abierto ya esta completo", {
          status: 409,
          code: "OPEN_SLOT_FULL",
        });
      }

      const [existingRows]: any = await connection.query(
        `
        SELECT id_participacion
        FROM ESPACIO_ABIERTO_PARTICIPANTE
        WHERE fk_id_espacio_abierto = ?
          AND fk_id_usuario = ?
          AND estado IN ('pendiente', 'pagado')
        LIMIT 1
        `,
        [input.espacioAbiertoId, input.usuarioId]
      );

      if (existingRows.length) {
        throw new AppError("Ya estas inscrito en este espacio abierto", {
          status: 409,
          code: "OPEN_SLOT_ALREADY_JOINED",
        });
      }

      const total = Number(espacioAbierto.cuota_participante || 0);
      const payment = strategy.pay(
        {
          eventoId: Number(espacioAbierto.fk_id_evento),
          total,
        },
        input.datosPago || {}
      );

      const [paymentResult]: any = await connection.query(
        `
        INSERT INTO PAGO
          (total, metodo, estado, referencia_externa, fecha_pago, fk_id_evento)
        VALUES (?, ?, 'pagado', ?, NOW(), ?)
        `,
        [total, input.metodoPago, payment.reference, espacioAbierto.fk_id_evento]
      );

      await connection.query(
        `
        INSERT INTO ESPACIO_ABIERTO_PARTICIPANTE
          (fk_id_espacio_abierto, fk_id_usuario, fk_id_pago, estado)
        VALUES (?, ?, ?, 'pagado')
        `,
        [input.espacioAbiertoId, input.usuarioId, paymentResult.insertId]
      );

      const nuevosParticipantes = Number(espacioAbierto.participantes_actuales || 0) + 1;
      const completo =
        nuevosParticipantes >= Number(espacioAbierto.max_participantes || 0);

      if (completo) {
        await connection.query(
          "UPDATE ESPACIO_ABIERTO SET estado = 'completo' WHERE id_espacio_abierto = ?",
          [input.espacioAbiertoId]
        );
        await connection.query(
          `
          UPDATE PAGO p
          INNER JOIN EVENTO e ON e.id_pago = p.id_pago
          SET p.estado = 'pagado', p.fecha_pago = NOW()
          WHERE e.id_evento = ?
          `,
          [espacioAbierto.fk_id_evento]
        );
      }

      await connection.commit();

      const fecha =
        espacioAbierto.fecha instanceof Date
          ? espacioAbierto.fecha.toISOString().slice(0, 10)
          : String(espacioAbierto.fecha).slice(0, 10);

      broadcastReservaEvent({
        type: "open-slot-joined",
        canchaId: Number(espacioAbierto.fk_id_espacio),
        fecha,
        espacioAbiertoId: input.espacioAbiertoId,
      });

      return {
        idEspacioAbierto: input.espacioAbiertoId,
        canchaId: Number(espacioAbierto.fk_id_espacio),
        total,
        estado: payment.status,
        metodo: input.metodoPago,
        referencia: payment.reference,
        message: payment.message,
        participantesActuales: nuevosParticipantes,
        cuposDisponibles: Number(espacioAbierto.max_participantes || 0) - nuevosParticipantes,
        completo,
      };
    } catch (error) {
      await connection.rollback();
      throw normalizeReservaError(error, {
        espacioAbiertoId: input.espacioAbiertoId,
        usuarioId: input.usuarioId,
        metodoPago: input.metodoPago,
      });
    } finally {
      connection.release();
    }
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

  static async pagarReserva(input: CrearPagoReservaInput) {
    const { fechaInicio, fechaFin } = buildStartEnd(
      input.fecha,
      input.hora,
      input.duracion
    );
    const strategy = PaymentStrategyFactory.get(input.metodoPago);
    const connection = await pool.getConnection();

    let eventoId = 0;
    let pagoId = 0;
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

      const cancha = canchaRows[0];

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
        VALUES (?, ?, 'pendiente', ?)
        `,
        [total, input.metodoPago, eventoId]
      );

      pagoId = paymentResult.insertId;

      await connection.query("UPDATE EVENTO SET id_pago = ? WHERE id_evento = ?", [
        pagoId,
        eventoId,
      ]);

      const payment = strategy.pay(
        {
          eventoId,
          total,
        },
        input.datosPago || {}
      );

      await connection.query(
        `
        UPDATE PAGO
        SET estado = 'pagado',
            metodo = ?,
            referencia_externa = ?,
            fecha_pago = NOW()
        WHERE id_pago = ?
        `,
        [input.metodoPago, payment.reference, pagoId]
      );

      await connection.commit();

      broadcastReservaEvent({
        type: "reservation-paid",
        canchaId: input.canchaId,
        fecha: input.fecha,
      });

      return {
        idEvento: eventoId,
        canchaId: input.canchaId,
        total,
        estado: payment.status,
        metodo: input.metodoPago,
        referencia: payment.reference,
        message: payment.message,
      };
    } catch (error) {
      await connection.rollback();
      logError("ReservaService.pagarReserva", error, {
        canchaId: input.canchaId,
        usuarioId: input.usuarioId,
        fecha: input.fecha,
        hora: input.hora,
        duracion: input.duracion,
        metodoPago: input.metodoPago,
        eventoId,
        pagoId,
      });
      throw normalizeReservaError(error, {
        canchaId: input.canchaId,
        usuarioId: input.usuarioId,
        fecha: input.fecha,
        hora: input.hora,
        duracion: input.duracion,
        metodoPago: input.metodoPago,
        eventoId,
        pagoId,
      });
    } finally {
      connection.release();
    }
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
