import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";

export type DashboardPeriod = "today" | "week" | "month" | "all";

type CountRow = RowDataPacket & { total: number };
type SumRow = RowDataPacket & { total: number | string | null };

const periodStartSql: Record<Exclude<DashboardPeriod, "all">, string> = {
  today: "CURRENT_DATE()",
  week: "DATE_SUB(NOW(), INTERVAL 7 DAY)",
  month: "DATE_SUB(NOW(), INTERVAL 1 MONTH)",
};

function normalizePeriod(period?: string): DashboardPeriod {
  if (period === "today" || period === "week" || period === "month" || period === "all") {
    return period;
  }

  return "month";
}

function dateCondition(column: string, period: DashboardPeriod) {
  if (period === "all") return "";
  return ` AND ${column} >= ${periodStartSql[period]}`;
}

function dateWhere(column: string, period: DashboardPeriod) {
  if (period === "all") return "";
  return ` WHERE ${column} >= ${periodStartSql[period]}`;
}

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

async function tableExists(tableName: string) {
  const [rows] = await pool.query<CountRow[]>(
    `
    SELECT COUNT(*) AS total
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
    `,
    [tableName]
  );

  return Number(rows[0]?.total || 0) > 0;
}

async function getCourtOwnerColumn() {
  const [rows] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM ESPACIO");
  const fields = rows.map((row) => String(row.Field));
  const candidates = ["fk_id_dueno", "fk_id_dueño", "fk_id_dueÃ±o"];
  const ownerColumn = candidates.find((candidate) => fields.includes(candidate));

  if (!ownerColumn) {
    throw new Error("La tabla ESPACIO no tiene columna de gestor.");
  }

  return `\`${ownerColumn.replace(/`/g, "``")}\``;
}

export class DashboardService {
  static normalizePeriod = normalizePeriod;

  static async getAdminStats(periodParam?: string) {
    const period = normalizePeriod(periodParam);
    const hasSubscriptionPayments = await tableExists("PAGO_SUSCRIPCION");

    const [
      userTotals,
      usersByType,
      courtTotals,
      courtStatus,
      eventTotals,
      eventRevenue,
      paymentMethods,
      eventsByDay,
      topCourts,
      subscriptionRevenue,
      activeSubscriptions,
    ] = await Promise.all([
      pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM USUARIO"),
      pool.query<RowDataPacket[]>(
        `
        SELECT Tipo AS label, COUNT(*) AS value
        FROM USUARIO
        GROUP BY Tipo
        ORDER BY value DESC
        `
      ),
      pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM ESPACIO"),
      pool.query<RowDataPacket[]>(
        `
        SELECT estado AS label, COUNT(*) AS value
        FROM ESPACIO
        GROUP BY estado
        ORDER BY value DESC
        `
      ),
      pool.query<CountRow[]>(
        `
        SELECT COUNT(*) AS total
        FROM EVENTO
        WHERE 1=1 ${dateCondition("fecha_inic", period)}
        `
      ),
      pool.query<SumRow[]>(
        `
        SELECT COALESCE(SUM(total), 0) AS total
        FROM PAGO
        WHERE estado = 'pagado' ${dateCondition("fecha_pago", period)}
        `
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT metodo AS label, COUNT(*) AS value, COALESCE(SUM(total), 0) AS total
        FROM PAGO
        WHERE estado = 'pagado' ${dateCondition("fecha_pago", period)}
        GROUP BY metodo
        ORDER BY value DESC
        `
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT DATE_FORMAT(fecha_inic, '%Y-%m-%d') AS label, COUNT(*) AS value
        FROM EVENTO
        ${dateWhere("fecha_inic", period)}
        GROUP BY DATE_FORMAT(fecha_inic, '%Y-%m-%d')
        ORDER BY MIN(fecha_inic)
        `
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT e.nombre AS label, COUNT(ev.id_evento) AS value, COALESCE(SUM(p.total), 0) AS total
        FROM ESPACIO e
        LEFT JOIN EVENTO ev ON ev.fk_id_espacio = e.id_espacio ${dateCondition("ev.fecha_inic", period)}
        LEFT JOIN PAGO p ON p.fk_id_evento = ev.id_evento AND p.estado = 'pagado'
        GROUP BY e.id_espacio, e.nombre
        ORDER BY value DESC, total DESC
        LIMIT 6
        `
      ),
      hasSubscriptionPayments
        ? pool.query<SumRow[]>(
            `
            SELECT COALESCE(SUM(total), 0) AS total
            FROM PAGO_SUSCRIPCION
            WHERE estado = 'pagado' ${dateCondition("fecha_pago", period)}
            `
          )
        : Promise.resolve([[{ total: 0 } as SumRow], []] as any),
      hasSubscriptionPayments
        ? pool.query<CountRow[]>(
            `
            SELECT COUNT(*) AS total
            FROM SUSCRIPCION_GESTOR
            WHERE estado = 'activa'
            `
          )
        : Promise.resolve([[{ total: 0 } as CountRow], []] as any),
    ]);

    return {
      period,
      summary: {
        users: numberValue(userTotals[0][0]?.total),
        courts: numberValue(courtTotals[0][0]?.total),
        events: numberValue(eventTotals[0][0]?.total),
        eventRevenue: numberValue(eventRevenue[0][0]?.total),
        subscriptionRevenue: numberValue(subscriptionRevenue[0][0]?.total),
        activeSubscriptions: numberValue(activeSubscriptions[0][0]?.total),
      },
      usersByType: usersByType[0],
      courtStatus: courtStatus[0],
      paymentMethods: paymentMethods[0],
      eventsByDay: eventsByDay[0],
      topCourts: topCourts[0],
    };
  }

  static async getManagerStats(ownerId: number, periodParam?: string) {
    const period = normalizePeriod(periodParam);
    const ownerColumn = await getCourtOwnerColumn();

    const [
      courtTotals,
      eventTotals,
      revenueTotals,
      courtsByStatus,
      eventsByCourt,
      revenueByCourt,
      eventsByDay,
      paymentMethods,
      reviewStats,
      upcomingEvents,
    ] = await Promise.all([
      pool.query<CountRow[]>(
        `SELECT COUNT(*) AS total FROM ESPACIO WHERE ${ownerColumn} = ?`,
        [ownerId]
      ),
      pool.query<CountRow[]>(
        `
        SELECT COUNT(*) AS total
        FROM EVENTO ev
        INNER JOIN ESPACIO e ON e.id_espacio = ev.fk_id_espacio
        WHERE e.${ownerColumn} = ? ${dateCondition("ev.fecha_inic", period)}
        `,
        [ownerId]
      ),
      pool.query<SumRow[]>(
        `
        SELECT COALESCE(SUM(p.total), 0) AS total
        FROM PAGO p
        INNER JOIN EVENTO ev ON ev.id_evento = p.fk_id_evento
        INNER JOIN ESPACIO e ON e.id_espacio = ev.fk_id_espacio
        WHERE e.${ownerColumn} = ? AND p.estado = 'pagado' ${dateCondition("p.fecha_pago", period)}
        `,
        [ownerId]
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT estado AS label, COUNT(*) AS value
        FROM ESPACIO
        WHERE ${ownerColumn} = ?
        GROUP BY estado
        ORDER BY value DESC
        `,
        [ownerId]
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT e.nombre AS label, COUNT(ev.id_evento) AS value
        FROM ESPACIO e
        LEFT JOIN EVENTO ev ON ev.fk_id_espacio = e.id_espacio ${dateCondition("ev.fecha_inic", period)}
        WHERE e.${ownerColumn} = ?
        GROUP BY e.id_espacio, e.nombre
        ORDER BY value DESC
        `,
        [ownerId]
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT e.nombre AS label, COALESCE(SUM(p.total), 0) AS value
        FROM ESPACIO e
        LEFT JOIN EVENTO ev ON ev.fk_id_espacio = e.id_espacio
        LEFT JOIN PAGO p ON p.fk_id_evento = ev.id_evento
          AND p.estado = 'pagado' ${dateCondition("p.fecha_pago", period)}
        WHERE e.${ownerColumn} = ?
        GROUP BY e.id_espacio, e.nombre
        ORDER BY value DESC
        `,
        [ownerId]
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT DATE_FORMAT(ev.fecha_inic, '%Y-%m-%d') AS label, COUNT(*) AS value
        FROM EVENTO ev
        INNER JOIN ESPACIO e ON e.id_espacio = ev.fk_id_espacio
        WHERE e.${ownerColumn} = ? ${dateCondition("ev.fecha_inic", period)}
        GROUP BY DATE_FORMAT(ev.fecha_inic, '%Y-%m-%d')
        ORDER BY MIN(ev.fecha_inic)
        `,
        [ownerId]
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT p.metodo AS label, COUNT(*) AS value, COALESCE(SUM(p.total), 0) AS total
        FROM PAGO p
        INNER JOIN EVENTO ev ON ev.id_evento = p.fk_id_evento
        INNER JOIN ESPACIO e ON e.id_espacio = ev.fk_id_espacio
        WHERE e.${ownerColumn} = ? AND p.estado = 'pagado' ${dateCondition("p.fecha_pago", period)}
        GROUP BY p.metodo
        ORDER BY value DESC
        `,
        [ownerId]
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT COALESCE(AVG(rating), 0) AS averageRating, COALESCE(SUM(total_resenas), 0) AS totalReviews
        FROM ESPACIO
        WHERE ${ownerColumn} = ?
        `,
        [ownerId]
      ),
      pool.query<RowDataPacket[]>(
        `
        SELECT ev.id_evento, e.nombre AS courtName, ev.fecha_inic AS startsAt, ev.fecha_fin AS endsAt, ev.max_jugadores AS maxPlayers
        FROM EVENTO ev
        INNER JOIN ESPACIO e ON e.id_espacio = ev.fk_id_espacio
        WHERE e.${ownerColumn} = ? AND ev.fecha_inic >= NOW()
        ORDER BY ev.fecha_inic ASC
        LIMIT 5
        `,
        [ownerId]
      ),
    ]);

    const reviews = reviewStats[0][0] || {};

    return {
      period,
      summary: {
        courts: numberValue(courtTotals[0][0]?.total),
        events: numberValue(eventTotals[0][0]?.total),
        revenue: numberValue(revenueTotals[0][0]?.total),
        averageRating: Number(numberValue(reviews.averageRating).toFixed(1)),
        totalReviews: numberValue(reviews.totalReviews),
      },
      courtsByStatus: courtsByStatus[0],
      eventsByCourt: eventsByCourt[0],
      revenueByCourt: revenueByCourt[0],
      eventsByDay: eventsByDay[0],
      paymentMethods: paymentMethods[0],
      upcomingEvents: upcomingEvents[0],
    };
  }
}
