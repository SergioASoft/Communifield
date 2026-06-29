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


def _parse_json_list(value: Any) -> list[Any]:
    if not value:
        return []

    if isinstance(value, list):
        return value

    try:
        parsed = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return [value] if isinstance(value, str) else []

    if isinstance(parsed, list):
        return parsed

    return [parsed] if parsed else []


def _compact_image_refs(row: dict[str, Any], limit: int = 4) -> list[str]:
    images: list[str] = []
    principal = row.get("imagen_principal")
    if isinstance(principal, str) and principal.strip():
        images.append(principal.strip())

    for image in _parse_json_list(row.get("imagenes")):
        if isinstance(image, str) and image.strip():
            images.append(image.strip())
        elif isinstance(image, dict):
            value = image.get("url") or image.get("src") or image.get("dataUrl") or image.get("image")
            if isinstance(value, str) and value.strip():
                images.append(value.strip())

    unique_images = list(dict.fromkeys(images))
    return unique_images[:limit]


def _surface_gear_tip(surface: str | None) -> str:
    normalized = (surface or "").lower()
    if "sint" in normalized or "artificial" in normalized:
        return "Guayos multitaco, turf o suela AG; evitar taches muy largos para cuidar la superficie y ganar traccion."
    if "natural" in normalized or "cesped" in normalized or "césped" in normalized:
        return "Guayos FG si el campo esta firme; SG o tache mas largo solo si la cancha esta humeda o blanda."
    if "cemento" in normalized or "asfalto" in normalized or "dura" in normalized:
        return "Tenis de futbol sala o suela lisa con buena amortiguacion; evitar guayos con taches."
    if "arena" in normalized:
        return "Calzado ligero o juego descalzo si la administracion lo permite; priorizar medias y proteccion contra friccion."
    if "madera" in normalized or "indoor" in normalized or "sala" in normalized:
        return "Tenis indoor de suela non-marking con buen agarre lateral."
    return "Revisar el agarre real de la superficie y recomendar suela estable, comoda y permitida por la cancha."


def _normalize_day_name(day_index: int) -> str:
    names = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
    return names[day_index] if 0 <= day_index < len(names) else str(day_index)


def court_catalog(arguments: dict[str, Any]) -> dict[str, Any]:
    owner_id = int(arguments.get("owner_id") or 0)
    court_id = int(arguments.get("court_id") or 0)
    include_images = bool(arguments.get("include_images"))

    rows = _query(
        """
        SELECT
          ES.id_espacio,
          ES.fk_id_dueño AS owner_id,
          ES.nombre,
          ES.tipo,
          ES.ubicacion,
          ES.distancia,
          ES.superficie,
          ES.precio_hora,
          ES.rating,
          ES.total_resenas,
          ES.disponible_hoy,
          ES.imagen_principal,
          ES.imagenes,
          ES.estado,
          COUNT(E.id_evento) AS reservas_totales,
          COALESCE(SUM(CASE WHEN P.estado = 'pagado' THEN P.total ELSE 0 END), 0) AS ingresos_pagados
        FROM ESPACIO ES
        LEFT JOIN EVENTO E ON E.fk_id_espacio = ES.id_espacio
        LEFT JOIN PAGO P ON P.fk_id_evento = E.id_evento
        WHERE (%s = 0 OR ES.fk_id_dueño = %s)
          AND (%s = 0 OR ES.id_espacio = %s)
        GROUP BY
          ES.id_espacio,
          ES.fk_id_dueño,
          ES.nombre,
          ES.tipo,
          ES.ubicacion,
          ES.distancia,
          ES.superficie,
          ES.precio_hora,
          ES.rating,
          ES.total_resenas,
          ES.disponible_hoy,
          ES.imagen_principal,
          ES.imagenes,
          ES.estado
        ORDER BY ES.estado = 'activo' DESC, ingresos_pagados DESC, ES.id_espacio DESC
        LIMIT 12;
        """,
        (owner_id, owner_id, court_id, court_id),
    )

    courts = []
    for row in rows:
        images = _compact_image_refs(row)
        court = {
            "id_espacio": row.get("id_espacio"),
            "owner_id": row.get("owner_id"),
            "nombre": row.get("nombre"),
            "tipo": row.get("tipo"),
            "ubicacion": row.get("ubicacion"),
            "superficie": row.get("superficie"),
            "precio_hora": row.get("precio_hora"),
            "rating": row.get("rating"),
            "total_resenas": row.get("total_resenas"),
            "disponible_hoy": row.get("disponible_hoy"),
            "estado": row.get("estado"),
            "reservas_totales": row.get("reservas_totales"),
            "ingresos_pagados": row.get("ingresos_pagados"),
            "gear_tip": _surface_gear_tip(row.get("superficie")),
            "image_count": len(images),
        }
        if include_images:
            court["images"] = images
        courts.append(court)

    return {
        "owner_id": owner_id,
        "court_id": court_id,
        "include_images": include_images,
        "courts": courts,
        "summary": json.dumps(courts, ensure_ascii=True, default=_json_default),
    }


def revenue_metrics_by_court(arguments: dict[str, Any]) -> dict[str, Any]:
    court_id = int(arguments.get("court_id") or 0)
    owner_id = int(arguments.get("owner_id") or 0)
    rows = _query(
        """
        SELECT
          DAYNAME(E.fecha_inic) AS dia_semana,
          WEEKDAY(E.fecha_inic) AS indice_dia,
          COUNT(E.id_evento) AS total_reservas,
          COALESCE(SUM(P.total), 0) AS ingresos_totales,
          COALESCE(AVG(P.total / GREATEST(TIMESTAMPDIFF(HOUR, E.fecha_inic, E.fecha_fin), 1)), 0) AS tarifa_promedio_hora
        FROM EVENTO E
        INNER JOIN ESPACIO ES ON ES.id_espacio = E.fk_id_espacio
        INNER JOIN PAGO P ON E.id_evento = P.fk_id_evento
        WHERE P.estado = 'pagado'
          AND (%s = 0 OR E.fk_id_espacio = %s)
          AND (%s = 0 OR ES.fk_id_dueño = %s)
        GROUP BY dia_semana, indice_dia
        ORDER BY indice_dia;
        """,
        (court_id, court_id, owner_id, owner_id),
    )

    return {
        "court_id": court_id,
        "owner_id": owner_id,
        "rows": rows,
        "summary": json.dumps(rows, ensure_ascii=True, default=_json_default),
    }


def courts_operational_snapshot(arguments: dict[str, Any]) -> dict[str, Any]:
    days = max(1, min(int(arguments.get("days") or 7), 30))
    owner_id = int(arguments.get("owner_id") or 0)
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
        WHERE (%s = 0 OR ES.fk_id_dueño = %s)
        GROUP BY ES.id_espacio, ES.nombre, ES.tipo, ES.estado, ES.precio_hora, ES.disponible_hoy
        ORDER BY ES.id_espacio;
        """,
        (days, owner_id, owner_id),
    )

    return {
        "days": days,
        "owner_id": owner_id,
        "rows": rows,
        "summary": json.dumps(rows, ensure_ascii=True, default=_json_default),
    }


def manager_court_event_statistics(arguments: dict[str, Any]) -> dict[str, Any]:
    owner_id = int(arguments.get("owner_id") or 0)
    court_id = int(arguments.get("court_id") or 0)
    rows = _query(
        """
        SELECT
          ES.id_espacio,
          ES.nombre,
          ES.estado,
          COUNT(E.id_evento) AS eventos_registrados,
          SUM(CASE WHEN E.fecha_inic >= NOW() THEN 1 ELSE 0 END) AS eventos_proximos,
          SUM(CASE WHEN E.fecha_inic < NOW() THEN 1 ELSE 0 END) AS eventos_historicos,
          COALESCE(SUM(CASE WHEN P.estado = 'pagado' THEN P.total ELSE 0 END), 0) AS ingresos_pagados
        FROM ESPACIO ES
        LEFT JOIN EVENTO E ON E.fk_id_espacio = ES.id_espacio
        LEFT JOIN PAGO P ON P.fk_id_evento = E.id_evento
        WHERE (%s = 0 OR ES.fk_id_dueño = %s)
          AND (%s = 0 OR ES.id_espacio = %s)
        GROUP BY ES.id_espacio, ES.nombre, ES.estado
        ORDER BY eventos_registrados DESC, ES.id_espacio DESC;
        """,
        (owner_id, owner_id, court_id, court_id),
    )
    total_events = sum(int(row.get("eventos_registrados") or 0) for row in rows)

    return {
        "owner_id": owner_id,
        "court_id": court_id,
        "total_eventos_registrados": total_events,
        "by_court": rows,
        "summary": json.dumps(
            {"total_eventos_registrados": total_events, "by_court": rows},
            ensure_ascii=True,
            default=_json_default,
        ),
    }


def open_match_day_recommendations(arguments: dict[str, Any]) -> dict[str, Any]:
    court_id = int(arguments.get("court_id") or 0)
    owner_id = int(arguments.get("owner_id") or 0)
    rows = _query(
        """
        SELECT
          WEEKDAY(E.fecha_inic) AS indice_dia,
          DAYNAME(E.fecha_inic) AS dia_semana,
          COUNT(E.id_evento) AS reservas,
          COALESCE(SUM(CASE WHEN P.estado = 'pagado' THEN P.total ELSE 0 END), 0) AS ingresos_pagados,
          COALESCE(AVG(TIMESTAMPDIFF(MINUTE, E.fecha_inic, E.fecha_fin)), 0) AS duracion_promedio_minutos,
          COALESCE(AVG(HOUR(E.fecha_inic)), 0) AS hora_promedio_inicio
        FROM EVENTO E
        INNER JOIN ESPACIO ES ON ES.id_espacio = E.fk_id_espacio
        LEFT JOIN PAGO P ON P.fk_id_evento = E.id_evento
        WHERE (%s = 0 OR E.fk_id_espacio = %s)
          AND (%s = 0 OR ES.fk_id_dueño = %s)
        GROUP BY indice_dia, dia_semana
        ORDER BY indice_dia;
        """,
        (court_id, court_id, owner_id, owner_id),
    )

    indexed = {int(row["indice_dia"]): row for row in rows if row.get("indice_dia") is not None}
    max_reservas = max((int(row.get("reservas") or 0) for row in rows), default=0)
    recommendations = []

    for index in range(7):
        row = indexed.get(index, {})
        reservas = int(row.get("reservas") or 0)
        ingresos = float(row.get("ingresos_pagados") or 0)
        if max_reservas <= 0:
            score = 70 if index in [4, 5, 6] else 55
        else:
            score = round((reservas / max_reservas) * 100)

        if score >= 75:
            reason = "alta demanda historica; ideal para partidos abiertos con lista de espera o cupos ampliados."
        elif score >= 45:
            reason = "demanda media; buen dia para activar partidos abiertos con promocion temprana."
        else:
            reason = "demanda baja; puede servir para llenar horarios flojos con precio o beneficio especial."

        recommendations.append(
            {
                "day_index": index,
                "day": _normalize_day_name(index),
                "reservas": reservas,
                "ingresos_pagados": ingresos,
                "score": score,
                "reason": reason,
                "hora_promedio_inicio": row.get("hora_promedio_inicio"),
            }
        )

    ranked = sorted(recommendations, key=lambda item: item["score"], reverse=True)
    return {
        "court_id": court_id,
        "owner_id": owner_id,
        "recommendations": ranked,
        "summary": json.dumps(ranked, ensure_ascii=True, default=_json_default),
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
            "manager_court_event_statistics": {
                "description": "Consulta eventos registrados por cancha, filtrado por gestor cuando owner_id esta presente.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner_id": {"type": "integer", "description": "Id del gestor. 0 para todas las canchas solo en contexto admin."},
                        "court_id": {"type": "integer", "description": "0 para todas las canchas del gestor."},
                    },
                },
                "handler": manager_court_event_statistics,
            },
            "court_catalog": {
                "description": "Consulta catalogo enriquecido de canchas con superficie, fotos, precio, estado y recomendacion de indumentaria.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "owner_id": {"type": "integer", "description": "0 para todas las canchas o id del gestor."},
                        "court_id": {"type": "integer", "description": "0 para todas las canchas."},
                        "include_images": {"type": "boolean", "description": "Incluye referencias de fotos para mostrarlas."},
                    },
                },
                "handler": court_catalog,
            },
            "open_match_day_recommendations": {
                "description": "Recomienda dias de la semana para partidos abiertos segun demanda historica e ingresos.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "court_id": {"type": "integer", "description": "0 para todas las canchas."},
                        "owner_id": {"type": "integer", "description": "0 para todas las canchas o id del gestor."},
                    },
                },
                "handler": open_match_day_recommendations,
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
