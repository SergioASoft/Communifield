import { pool } from "../config/db";

export type EstadoSuscripcion = "sin_suscripcion" | "activa" | "vencida" | "cancelada";

export interface EstadoSuscripcionGestor {
  estado: EstadoSuscripcion;
  suscrito: boolean;
  id_suscripcion: number | null;
  plan: string | null;
  precio: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export class SuscripcionGestorService {
  static async getEstadoGestor(gestorId: number): Promise<EstadoSuscripcionGestor> {
    await this.marcarVencidas();

    const [rows]: any = await pool.query(
      `
      SELECT id_suscripcion, plan, precio, estado, fecha_inicio, fecha_fin
      FROM SUSCRIPCION_GESTOR
      WHERE fk_id_gestor = ?
      ORDER BY id_suscripcion DESC
      LIMIT 1
      `,
      [gestorId]
    );

    const suscripcion = rows[0];

    if (!suscripcion) {
      return {
        estado: "sin_suscripcion",
        suscrito: false,
        id_suscripcion: null,
        plan: null,
        precio: 0,
        fecha_inicio: null,
        fecha_fin: null,
      };
    }

    const activa =
      suscripcion.estado === "activa" &&
      (!suscripcion.fecha_fin || new Date(suscripcion.fecha_fin) >= new Date());

    return {
      estado: activa ? "activa" : suscripcion.estado,
      suscrito: activa,
      id_suscripcion: suscripcion.id_suscripcion,
      plan: suscripcion.plan,
      precio: Number(suscripcion.precio || 0),
      fecha_inicio: suscripcion.fecha_inicio,
      fecha_fin: suscripcion.fecha_fin,
    };
  }

  static async activarSuscripcion(params: {
    gestorId: number;
    plan?: string;
    precio: number;
    metodo: string;
  }) {
    const plan = params.plan || "mensual";
    const fechaInicio = new Date();
    const fechaFin = addMonths(fechaInicio, 1);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `
        UPDATE SUSCRIPCION_GESTOR
        SET estado = 'vencida'
        WHERE fk_id_gestor = ?
          AND estado = 'activa'
        `,
        [params.gestorId]
      );

      const [result]: any = await connection.query(
        `
        INSERT INTO SUSCRIPCION_GESTOR
        (fk_id_gestor, plan, precio, estado, fecha_inicio, fecha_fin)
        VALUES (?, ?, ?, 'activa', ?, ?)
        `,
        [params.gestorId, plan, params.precio, fechaInicio, fechaFin]
      );

      const suscripcionId = result.insertId;

      await connection.query(
        `
        INSERT INTO PAGO_SUSCRIPCION
        (fk_id_suscripcion, total, metodo, estado, fecha_pago)
        VALUES (?, ?, ?, 'pagado', NOW())
        `,
        [suscripcionId, params.precio, params.metodo]
      );

      await connection.commit();

      return this.getEstadoGestor(params.gestorId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async marcarVencidas() {
    await pool.query(
      `
      UPDATE SUSCRIPCION_GESTOR
      SET estado = 'vencida'
      WHERE estado = 'activa'
        AND fecha_fin IS NOT NULL
        AND fecha_fin < NOW()
      `
    );
  }
}