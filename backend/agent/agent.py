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
    ) -> dict[str, Any]:
        text = message.lower()
        normalized_channel = "manager" if channel == "manager" else "admin"
        tool_results = self._select_tools(text, normalized_channel)
        reply = self._compose_with_gemini(message, conversation or [], tool_results, normalized_channel)

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

    def _select_tools(self, text: str, channel: str) -> list[dict[str, Any]]:
        if channel == "manager":
            return self._select_manager_tools(text)

        return self._select_admin_tools(text)

    def _tool_result(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        return {"name": name, "result": self.tools.call_tool(name, arguments)}

    def _select_manager_tools(self, text: str) -> list[dict[str, Any]]:
        court_id = self._extract_court_id(text)
        tool_results: list[dict[str, Any]] = []

        should_use_revenue = any(
            word in text
            for word in ["ingreso", "precio", "tarifa", "venta", "reserv", "movimiento", "demanda", "pico"]
        )
        should_use_snapshot = any(
            word in text
            for word in ["cancha", "estado", "disponible", "operacion", "mantenimiento", "proxim"]
        )

        if not should_use_revenue and not should_use_snapshot:
            should_use_revenue = True
            should_use_snapshot = True

        if should_use_revenue:
            tool_results.append(self._tool_result("revenue_metrics_by_court", {"court_id": court_id}))

        if should_use_snapshot:
            tool_results.append(self._tool_result("courts_operational_snapshot", {"days": 7}))

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

        if not any([wants_users, wants_subscriptions, wants_courts_events, wants_payments]):
            wants_users = True
            wants_courts_events = True
            wants_payments = True

        if wants_users:
            tool_results.append(self._tool_result("admin_user_statistics", {"limit": 10}))

        if wants_subscriptions:
            tool_results.append(self._tool_result("admin_subscription_revenue_statistics", {}))

        if wants_courts_events:
            tool_results.append(self._tool_result("admin_court_event_statistics", {"days": days}))

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

        prompt = self._build_llm_prompt(message, conversation, tool_results, channel)
        return self.llm.generate(prompt, self._system_instruction(channel))

    def _system_instruction(self, channel: str) -> str:
        if channel == "manager":
            return (
                "Eres el asistente IA para gestores de CommuniField. "
                "Ayudas a optimizar canchas, reservas, precios, demanda e ingresos operativos. "
                "Responde en espanol natural, con recomendaciones accionables y sin hablar de SQL ni detalles internos."
            )

        return (
            "Eres el asistente IA para administradores de CommuniField. "
            "Tu trabajo es ayudar a gestionar usuarios, auditar datos, interpretar pagos, canchas y eventos, "
            "y generar reportes administrativos claros. Usa los datos de herramientas MCP como fuente principal. "
            "Si el usuario pide suscripciones y el modulo no existe, dilo con claridad y propone los campos/tablas necesarios. "
            "No inventes cifras, no expongas datos sensibles como hashes o claves, y no menciones SQL ni implementacion interna."
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
            "- Si faltan datos, dilo con naturalidad y sugiere que dato revisar.\n"
            "- Si te piden un reporte, estructuralo con titulo, hallazgos, metricas clave y recomendaciones.\n"
            "- Evita repetir siempre la misma estructura; adapta el formato a la pregunta.\n"
        )
