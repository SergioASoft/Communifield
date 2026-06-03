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
