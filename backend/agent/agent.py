import re
from typing import Any

try:
    from .gemini_client import GeminiClient
    from .mcp_tools import MCPToolRegistry
except ImportError:  # pragma: no cover
    from gemini_client import GeminiClient
    from mcp_tools import MCPToolRegistry


class CommunifieldAdminAgent:
    def __init__(self, tools: MCPToolRegistry | None = None) -> None:
        self.tools = tools or MCPToolRegistry()
        self.llm = GeminiClient()

    def answer(
        self,
        message: str,
        conversation: list[dict[str, str]] | None = None,
        channel: str = "admin",
        user: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        text = message.lower()
        normalized_channel = "manager" if channel == "manager" else "admin"
        tool_results = self._select_tools(text, normalized_channel, user or {})
        if self._wants_only_images(text):
            reply = self._build_photo_reply(tool_results)
        else:
            reply = self._compose_with_gemini(message, conversation or [], tool_results, normalized_channel)
        reply = self._append_requested_photos(reply, text, tool_results)

        return {
            "reply": reply,
            "toolsUsed": [item["name"] for item in tool_results],
            "llm": "gemini",
            "channel": normalized_channel,
        }

    def _extract_court_id(self, text: str) -> int:
        match = re.search(r"(?:cancha|espacio)\s*(\d+)", text)
        return int(match.group(1)) if match else 0

    def _extract_int_after(self, text: str, words: list[str], default: int) -> int:
        for word in words:
            match = re.search(rf"{word}\s*(\d+)", text)
            if match:
                return int(match.group(1))
        return default

    def _wants_images(self, text: str) -> bool:
        return any(word in text for word in ["foto", "fotos", "imagen", "imagenes", "im\u00e1genes"])

    def _wants_only_images(self, text: str) -> bool:
        if not self._wants_images(text):
            return False

        other_intents = [
            "ingreso",
            "precio",
            "tarifa",
            "venta",
            "reserv",
            "demanda",
            "pico",
            "estado",
            "disponible",
            "mantenimiento",
            "superficie",
            "indumentaria",
            "guayo",
            "calzado",
            "partido",
            "semana",
            "recomendar",
            "recomendado",
            "reporte",
            "informe",
        ]
        return not any(intent in text for intent in other_intents)

    def _select_tools(self, text: str, channel: str, user: dict[str, Any]) -> list[dict[str, Any]]:
        if channel == "manager":
            return self._select_manager_tools(text, user)

        return self._select_admin_tools(text)

    def _tool_result(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        return {"name": name, "result": self.tools.call_tool(name, arguments)}

    def _select_manager_tools(self, text: str, user: dict[str, Any]) -> list[dict[str, Any]]:
        court_id = self._extract_court_id(text)
        owner_id = int(user.get("id") or user.get("user_id") or user.get("id_usuario") or 0)
        if owner_id <= 0:
            owner_id = -1
        tool_results: list[dict[str, Any]] = []

        should_use_revenue = any(
            word in text
            for word in ["ingreso", "precio", "tarifa", "venta", "reserv", "movimiento", "demanda", "pico"]
        )
        should_use_events = any(word in text for word in ["evento", "eventos", "registrado", "registrados", "cantidad", "cuantos", "cuántos"])
        should_use_snapshot = any(
            word in text
            for word in ["cancha", "estado", "disponible", "operacion", "mantenimiento", "proxim"]
        )
        should_use_catalog = any(
            word in text
            for word in [
                "cancha",
                "canchas",
                "evento",
                "eventos",
                "superficie",
                "cesped",
                "césped",
                "sintetica",
                "sintética",
                "natural",
                "foto",
                "fotos",
                "imagen",
                "imagenes",
                "imágenes",
                "indumentaria",
                "guayo",
                "guayos",
                "taches",
                "zapatilla",
                "zapatos",
                "calzado",
            ]
        )
        should_use_open_match_days = any(
            word in text
            for word in ["partido abierto", "partidos abiertos", "dia", "dias", "semana", "recomendar", "recomendado"]
        )

        if not any([should_use_revenue, should_use_events, should_use_snapshot, should_use_catalog, should_use_open_match_days]):
            should_use_revenue = True
            should_use_snapshot = True
            should_use_catalog = True

        if should_use_revenue:
            tool_results.append(self._tool_result("revenue_metrics_by_court", {"court_id": court_id, "owner_id": owner_id}))

        if should_use_events:
            tool_results.append(
                self._tool_result("manager_court_event_statistics", {"court_id": court_id, "owner_id": owner_id})
            )

        if should_use_snapshot and not self._wants_only_images(text):
            tool_results.append(self._tool_result("courts_operational_snapshot", {"days": 7, "owner_id": owner_id}))

        if should_use_catalog:
            tool_results.append(
                self._tool_result(
                    "court_catalog",
                    {"owner_id": owner_id, "court_id": court_id, "include_images": self._wants_images(text)},
                )
            )

        if should_use_open_match_days:
            tool_results.append(
                self._tool_result("open_match_day_recommendations", {"owner_id": owner_id, "court_id": court_id})
            )

        return tool_results

    def _select_admin_tools(self, text: str) -> list[dict[str, Any]]:
        days = self._extract_int_after(text, ["dias", "dias:", "proximos"], 30)
        months = self._extract_int_after(text, ["meses", "meses:", "ultimos"], 6)
        wants_report = any(word in text for word in ["reporte", "informe", "resumen general", "estadisticas generales"])

        if wants_report:
            return [self._tool_result("admin_global_report", {"days": days, "months": months})]

        tool_results: list[dict[str, Any]] = []
        wants_users = any(word in text for word in ["usuario", "usuarios", "jugador", "jugadores", "gestor", "gestores", "admin"])
        wants_subscriptions = any(word in text for word in ["suscripcion", "suscripciones", "membresia", "membresias", "plan", "planes"])
        wants_courts_events = any(word in text for word in ["cancha", "canchas", "evento", "eventos", "reserva", "reservas", "ocupacion"])
        wants_payments = any(word in text for word in ["ingreso", "ingresos", "pago", "pagos", "facturacion", "metodo"])
        wants_court_catalog = any(
            word in text
            for word in [
                "foto",
                "fotos",
                "imagen",
                "imagenes",
                "imágenes",
                "superficie",
                "indumentaria",
                "guayo",
                "guayos",
                "taches",
                "calzado",
            ]
        )
        wants_open_match_days = any(
            word in text for word in ["partido abierto", "partidos abiertos", "dias recomendados", "dias de la semana"]
        )

        if self._wants_only_images(text):
            wants_users = False
            wants_courts_events = False
            wants_payments = False
        elif not any([wants_users, wants_subscriptions, wants_courts_events, wants_payments]):
            wants_users = True
            wants_courts_events = True
            wants_payments = True

        if wants_users:
            tool_results.append(self._tool_result("admin_user_statistics", {"limit": 10}))

        if wants_subscriptions:
            tool_results.append(self._tool_result("admin_subscription_revenue_statistics", {}))

        if wants_courts_events:
            tool_results.append(self._tool_result("admin_court_event_statistics", {"days": days}))

        if wants_court_catalog:
            tool_results.append(
                self._tool_result(
                    "court_catalog",
                    {"owner_id": 0, "court_id": self._extract_court_id(text), "include_images": self._wants_images(text)},
                )
            )

        if wants_open_match_days:
            tool_results.append(
                self._tool_result("open_match_day_recommendations", {"owner_id": 0, "court_id": self._extract_court_id(text)})
            )

        if wants_payments:
            tool_results.append(self._tool_result("admin_payment_revenue_statistics", {"months": months}))

        return tool_results

    def _compose_with_gemini(
        self,
        message: str,
        conversation: list[dict[str, str]],
        tool_results: list[dict[str, Any]],
        channel: str,
    ) -> str:
        if not self.llm.enabled:
            raise RuntimeError("GEMINI_API_KEY no esta configurada. Crea backend/.env con esa variable.")

        prompt = self._build_llm_prompt(message, conversation, self._sanitize_tool_results_for_prompt(tool_results), channel)
        return self.llm.generate(prompt, self._system_instruction(channel))

    def _system_instruction(self, channel: str) -> str:
        if channel == "manager":
            return (
                "Eres el asistente IA para gestores de CommuniField. "
                "Ayudas a optimizar canchas, reservas, precios, demanda, superficies, fotos, indumentaria deportiva "
                "e ingresos operativos. Responde en espanol natural, con recomendaciones accionables y sin hablar "
                "de SQL ni detalles internos. Usa exclusivamente los datos de las canchas del gestor autenticado. "
                "Puedes usar Markdown basico para listas, tablas y enfasis."
            )

        return (
            "Eres el asistente IA para administradores de CommuniField. "
            "Tu trabajo es ayudar a gestionar usuarios, auditar datos, interpretar pagos, canchas y eventos, "
            "y generar reportes administrativos claros. Usa los datos de herramientas MCP como fuente principal. "
            "Si el usuario pide suscripciones y el modulo no existe, dilo con claridad y propone los campos/tablas necesarios. "
            "No inventes cifras, no expongas datos sensibles como hashes o claves, y no menciones SQL ni implementacion interna. "
            "Puedes usar Markdown basico para listas, tablas y enfasis."
        )

    def _build_llm_prompt(
        self,
        message: str,
        conversation: list[dict[str, str]],
        tool_results: list[dict[str, Any]],
        channel: str,
    ) -> str:
        recent_conversation = conversation[-6:]
        role_name = "administrador" if channel == "admin" else "gestor"
        return (
            "Contexto de conversacion reciente:\n"
            f"{recent_conversation}\n\n"
            "Resultados de herramientas MCP disponibles:\n"
            f"{tool_results}\n\n"
            f"Pregunta actual del {role_name}:\n"
            f"{message}\n\n"
            "Instrucciones de respuesta:\n"
            f"- Responde como un asistente para el {role_name} de CommuniField.\n"
            "- Si hay datos, interpreta tendencias y propone acciones concretas.\n"
            "- Si hay datos de superficie, recomienda indumentaria/calzado acorde a esa superficie.\n"
            "- Si hay recomendaciones de dias, prioriza dias con mayor demanda para partidos abiertos y dias flojos para promociones.\n"
            "- Si el usuario solo pide fotos, responde breve y no agregues recomendaciones ni metricas no solicitadas.\n"
            "- Si el usuario pide fotos y hay referencias de imagen, menciona que se muestran debajo sin escribir URLs ni base64.\n"
            "- Si faltan datos, dilo con naturalidad y sugiere que dato revisar.\n"
            "- Si te piden un reporte, estructuralo con titulo, hallazgos, metricas clave y recomendaciones.\n"
            "- Formatea con Markdown valido, sin bloques de codigo salvo que el usuario los pida.\n"
            "- Evita repetir siempre la misma estructura; adapta el formato a la pregunta.\n"
        )

    def _sanitize_tool_results_for_prompt(self, value: Any) -> Any:
        if isinstance(value, list):
            return [self._sanitize_tool_results_for_prompt(item) for item in value]

        if isinstance(value, dict):
            sanitized: dict[str, Any] = {}
            for key, item in value.items():
                if key == "images" and isinstance(item, list):
                    sanitized[key] = [f"foto {index + 1} disponible" for index, _ in enumerate(item)]
                elif key == "summary" and isinstance(item, str) and "data:image" in item:
                    sanitized[key] = "Resumen omitido porque contiene referencias de imagen."
                else:
                    sanitized[key] = self._sanitize_tool_results_for_prompt(item)
            return sanitized

        if isinstance(value, str) and value.startswith("data:image"):
            return "foto disponible"

        return value

    def _build_photo_reply(self, tool_results: list[dict[str, Any]]) -> str:
        total_images = 0
        total_courts = 0
        for item in tool_results:
            if item.get("name") != "court_catalog":
                continue
            courts = item.get("result", {}).get("courts") or []
            total_courts += len(courts)
            total_images += sum(len(court.get("images") or []) for court in courts)

        if total_images == 0:
            return "No encontre fotos registradas para las canchas consultadas."

        if total_courts == 1:
            return "Estas son las fotos registradas para la cancha consultada."

        return "Estas son las fotos registradas para las canchas consultadas."

    def _append_requested_photos(self, reply: str, text: str, tool_results: list[dict[str, Any]]) -> str:
        if not self._wants_images(text):
            return reply

        gallery_lines: list[str] = []
        for item in tool_results:
            if item.get("name") != "court_catalog":
                continue
            courts = item.get("result", {}).get("courts") or []
            for court in courts:
                images = court.get("images") or []
                for index, image in enumerate(images[:3], start=1):
                    if not isinstance(image, str) or not image.strip():
                        continue
                    label = f"{court.get('nombre') or 'Cancha'} - foto {index}"
                    gallery_lines.append(f"![{label}]({image.strip()})")

        if not gallery_lines:
            if "No encontre fotos registradas" in reply:
                return reply
            return f"{reply}\n\nNo encontre fotos registradas para las canchas consultadas."

        return f"{reply}\n\n**Fotos disponibles**\n\n" + "\n\n".join(gallery_lines[:9])
