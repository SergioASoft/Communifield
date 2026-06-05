import json
import os
from contextlib import contextmanager
from decimal import Decimal
from typing import Any, Callable

try:
    import mysql.connector
except ImportError:  # pragma: no cover
    mysql = None


def _db_config() -> dict[str, Any]:
    return {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", "root"),
        "database": os.getenv("DB_NAME", "communifield"),
    }


def _json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    return str(value)


@contextmanager
def _connection():
    if mysql is None:
        raise RuntimeError("Instala dependencias Python con `pip install -r agent/requirements.txt`.")

    conn = mysql.connector.connect(**_db_config())
    try:
        yield conn
    finally:
        conn.close()


def _query(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with _connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(sql, params)
            return list(cursor.fetchall())
        finally:
            cursor.close()


def _table_exists(table_name: str) -> bool:
    rows = _query(
        """
        SELECT COUNT(*) AS total
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = %s;
        """,
        (table_name,),
    )
    return bool(rows and int(rows[0].get("total") or 0) > 0)


def revenue_metrics_by_court(arguments: dict[str, Any]) -> dict[str, Any]:
    court_id = int(arguments.get("court_id") or 0)
    rows = _query(
        """
        SELECT
          DAYNAME(E.fecha_inic) AS dia_semana,
          WEEKDAY(E.fecha_inic) AS indice_dia,
          COUNT(E.id_evento) AS total_reservas,
          COALESCE(SUM(P.total), 0) AS ingresos_totales,
          COALESCE(AVG(P.total / GREATEST(TIMESTAMPDIFF(HOUR, E.fecha_inic, E.fecha_fin), 1)), 0) AS tarifa_promedio_hora
        FROM EVENTO E
        INNER JOIN PAGO P ON E.id_evento = P.fk_id_evento
        WHERE P.estado = 'pagado'
          AND (%s = 0 OR E.fk_id_espacio = %s)
        GROUP BY dia_semana, indice_dia
        ORDER BY indice_dia;
        """,
        (court_id, court_id),
    )

    return {
        "court_id": court_id,
        "rows": rows,
        "summary": json.dumps(rows, ensure_ascii=True, default=_json_default),
    }


def courts_operational_snapshot(arguments: dict[str, Any]) -> dict[str, Any]:
    days = max(1, min(int(arguments.get("days") or 7), 30))
    rows = _query(
        """
        SELECT
          ES.id_espacio,
          ES.nombre,
          ES.tipo,
          ES.estado,
          ES.precio_hora,
          ES.disponible_hoy,
          COUNT(E.id_evento) AS reservas_proximas,
          COALESCE(SUM(CASE WHEN P.estado = 'pagado' THEN P.total ELSE 0 END), 0) AS ingresos_proximos
        FROM ESPACIO ES
        LEFT JOIN EVENTO E
          ON E.fk_id_espacio = ES.id_espacio
         AND E.fecha_inic >= NOW()
         AND E.fecha_inic < DATE_ADD(NOW(), INTERVAL %s DAY)
        LEFT JOIN PAGO P ON P.fk_id_evento = E.id_evento
        GROUP BY ES.id_espacio, ES.nombre, ES.tipo, ES.estado, ES.precio_hora, ES.disponible_hoy
        ORDER BY ES.id_espacio;
        """,
        (days,),
    )

    return {
        "days": days,
        "rows": rows,
        "summary": json.dumps(rows, ensure_ascii=True, default=_json_default),
    }


def admin_user_statistics(arguments: dict[str, Any]) -> dict[str, Any]:
    limit = max(1, min(int(arguments.get("limit") or 8), 20))
    counts_by_type = _query(
        """
        SELECT Tipo AS tipo, COUNT(*) AS total
        FROM USUARIO
        GROUP BY Tipo
        ORDER BY total DESC;
        """
    )
    quality = _query(
        """
        SELECT
          COUNT(*) AS total_usuarios,
          SUM(CASE WHEN tel IS NULL OR tel = '' THEN 1 ELSE 0 END) AS sin_telefono,
          SUM(CASE WHEN foto IS NULL OR foto = '' THEN 1 ELSE 0 END) AS sin_foto,
          SUM(CASE WHEN biografia IS NULL OR biografia = '' THEN 1 ELSE 0 END) AS sin_biografia,
          SUM(CASE WHEN posicion IS NULL OR posicion = '' THEN 1 ELSE 0 END) AS sin_posicion
        FROM USUARIO;
        """
    )
    sample = _query(
        """
        SELECT id_usuario, nombre, email, tel, Tipo AS tipo, posicion
        FROM USUARIO
        ORDER BY id_usuario DESC
        LIMIT %s;
        """,
        (limit,),
    )

    return {
        "counts_by_type": counts_by_type,
        "profile_quality": quality[0] if quality else {},
        "recent_or_latest_users": sample,
        "summary": json.dumps(
            {"counts_by_type": counts_by_type, "profile_quality": quality, "latest_users": sample},
            ensure_ascii=True,
            default=_json_default,
        ),
    }


def admin_court_event_statistics(arguments: dict[str, Any]) -> dict[str, Any]:
    days = max(1, min(int(arguments.get("days") or 30), 365))
    overview = _query(
        """
        SELECT
          COUNT(*) AS total_canchas,
          SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) AS canchas_activas,
          SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) AS canchas_mantenimiento,
          SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) AS canchas_inactivas,
          AVG(precio_hora) AS precio_promedio_hora
        FROM ESPACIO;
        """
    )
    events = _query(
        """
        SELECT
          COUNT(*) AS eventos_total,
          SUM(CASE WHEN fecha_inic >= NOW() THEN 1 ELSE 0 END) AS eventos_proximos,
          SUM(CASE WHEN fecha_inic < NOW() THEN 1 ELSE 0 END) AS eventos_historicos,
          COALESCE(AVG(TIMESTAMPDIFF(MINUTE, fecha_inic, fecha_fin)), 0) AS duracion_promedio_minutos
        FROM EVENTO;
        """
    )
    top_courts = _query(
        """
        SELECT
          ES.id_espacio,
          ES.nombre,
          ES.estado,
          COUNT(E.id_evento) AS total_eventos,
          COALESCE(SUM(CASE WHEN P.estado = 'pagado' THEN P.total ELSE 0 END), 0) AS ingresos_pagados
        FROM ESPACIO ES
        LEFT JOIN EVENTO E ON E.fk_id_espacio = ES.id_espacio
        LEFT JOIN PAGO P ON P.fk_id_evento = E.id_evento
        GROUP BY ES.id_espacio, ES.nombre, ES.estado
        ORDER BY ingresos_pagados DESC, total_eventos DESC
        LIMIT 10;
        """
    )
    upcoming = _query(
        """
        SELECT
          DATE(E.fecha_inic) AS fecha,
          COUNT(*) AS eventos,
          COALESCE(SUM(CASE WHEN P.estado = 'pagado' THEN P.total ELSE 0 END), 0) AS ingresos_confirmados
        FROM EVENTO E
        LEFT JOIN PAGO P ON P.fk_id_evento = E.id_evento
        WHERE E.fecha_inic >= NOW()
          AND E.fecha_inic < DATE_ADD(NOW(), INTERVAL %s DAY)
        GROUP BY DATE(E.fecha_inic)
        ORDER BY fecha;
        """,
        (days,),
    )

    return {
        "days": days,
        "court_overview": overview[0] if overview else {},
        "event_overview": events[0] if events else {},
        "top_courts": top_courts,
        "upcoming_by_day": upcoming,
        "summary": json.dumps(
            {
                "days": days,
                "court_overview": overview,
                "event_overview": events,
                "top_courts": top_courts,
                "upcoming_by_day": upcoming,
            },
            ensure_ascii=True,
            default=_json_default,
        ),
    }


def admin_payment_revenue_statistics(arguments: dict[str, Any]) -> dict[str, Any]:
    months = max(1, min(int(arguments.get("months") or 6), 24))
    totals = _query(
        """
        SELECT
          COUNT(*) AS total_pagos,
          SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) AS pagos_aprobados,
          SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pagos_pendientes,
          SUM(CASE WHEN estado IN ('fallido', 'cancelado') THEN 1 ELSE 0 END) AS pagos_no_exitosos,
          COALESCE(SUM(CASE WHEN estado = 'pagado' THEN total ELSE 0 END), 0) AS ingresos_pagados
        FROM PAGO;
        """
    )
    by_method = _query(
        """
        SELECT metodo, estado, COUNT(*) AS pagos, COALESCE(SUM(total), 0) AS valor
        FROM PAGO
        GROUP BY metodo, estado
        ORDER BY valor DESC;
        """
    )
    by_month = _query(
        """
        SELECT
          DATE_FORMAT(fecha_pago, '%Y-%m') AS mes,
          COUNT(*) AS pagos,
          COALESCE(SUM(CASE WHEN estado = 'pagado' THEN total ELSE 0 END), 0) AS ingresos_pagados
        FROM PAGO
        WHERE fecha_pago >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
        GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m')
        ORDER BY mes;
        """,
        (months,),
    )

    return {
        "months": months,
        "totals": totals[0] if totals else {},
        "by_method": by_method,
        "by_month": by_month,
        "summary": json.dumps(
            {"months": months, "totals": totals, "by_method": by_method, "by_month": by_month},
            ensure_ascii=True,
            default=_json_default,
        ),
    }


def admin_subscription_revenue_statistics(arguments: dict[str, Any]) -> dict[str, Any]:
    candidate_tables = ["SUSCRIPCION", "SUSCRIPCIONES", "PLAN", "PLANES", "MEMBRESIA", "MEMBRESIAS"]
    existing = [table for table in candidate_tables if _table_exists(table)]

    if not existing:
        organizers = _query("SELECT COUNT(*) AS gestores FROM USUARIO WHERE Tipo = 'organizer';")
        return {
            "configured": False,
            "existing_tables": [],
            "organizers": organizers[0].get("gestores", 0) if organizers else 0,
            "message": (
                "No existe una tabla de suscripciones, planes o membresias en la base de datos actual. "
                "El agente puede reportar cuantos gestores existen, pero no ingresos por suscripciones hasta crear ese modulo."
            ),
        }

    return {
        "configured": True,
        "existing_tables": existing,
        "message": "Se detectaron tablas candidatas de suscripciones. Configura la consulta especifica segun sus columnas.",
    }


def admin_global_report(arguments: dict[str, Any]) -> dict[str, Any]:
    days = max(1, min(int(arguments.get("days") or 30), 365))
    months = max(1, min(int(arguments.get("months") or 6), 24))
    return {
        "users": admin_user_statistics({"limit": 8}),
        "courts_events": admin_court_event_statistics({"days": days}),
        "payments": admin_payment_revenue_statistics({"months": months}),
        "subscriptions": admin_subscription_revenue_statistics({}),
    }


class MCPToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, dict[str, Any]] = {
            "revenue_metrics_by_court": {
                "description": "Consulta ingresos, reservas y tarifa promedio por dia de la semana.",
                "inputSchema": {
                    "type": "object",
                    "properties": {"court_id": {"type": "integer", "description": "0 para todas las canchas."}},
                },
                "handler": revenue_metrics_by_court,
            },
            "courts_operational_snapshot": {
                "description": "Consulta estado operativo, precio e ingresos proximos de las canchas.",
                "inputSchema": {
                    "type": "object",
                    "properties": {"days": {"type": "integer", "description": "Ventana de analisis entre 1 y 30 dias."}},
                },
                "handler": courts_operational_snapshot,
            },
            "admin_user_statistics": {
                "description": "Estadisticas administrativas de usuarios por tipo, calidad de perfil y ultimos usuarios.",
                "inputSchema": {
                    "type": "object",
                    "properties": {"limit": {"type": "integer", "description": "Cantidad de usuarios recientes a incluir."}},
                },
                "handler": admin_user_statistics,
            },
            "admin_court_event_statistics": {
                "description": "Reporte administrativo de canchas, eventos, ocupacion futura e ingresos por cancha.",
                "inputSchema": {
                    "type": "object",
                    "properties": {"days": {"type": "integer", "description": "Ventana futura en dias."}},
                },
                "handler": admin_court_event_statistics,
            },
            "admin_payment_revenue_statistics": {
                "description": "Estadisticas administrativas de pagos e ingresos por metodo y mes.",
                "inputSchema": {
                    "type": "object",
                    "properties": {"months": {"type": "integer", "description": "Cantidad de meses historicos."}},
                },
                "handler": admin_payment_revenue_statistics,
            },
            "admin_subscription_revenue_statistics": {
                "description": "Diagnostica ingresos de suscripciones de gestores si existe el modulo en la base de datos.",
                "inputSchema": {"type": "object", "properties": {}},
                "handler": admin_subscription_revenue_statistics,
            },
            "admin_global_report": {
                "description": "Genera un paquete de datos para reporte administrativo de usuarios, canchas, eventos, pagos y suscripciones.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "days": {"type": "integer", "description": "Ventana futura para eventos."},
                        "months": {"type": "integer", "description": "Meses historicos para pagos."},
                    },
                },
                "handler": admin_global_report,
            },
        }

    def list_tools(self) -> list[dict[str, Any]]:
        return [
            {
                "name": name,
                "description": tool["description"],
                "inputSchema": tool["inputSchema"],
            }
            for name, tool in self._tools.items()
        ]

    def call_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        tool = self._tools.get(name)
        if not tool:
            raise ValueError(f"Herramienta MCP no registrada: {name}")

        handler: Callable[[dict[str, Any]], dict[str, Any]] = tool["handler"]
        return handler(arguments)
