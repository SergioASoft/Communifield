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

    def answer(self, message: str, conversation: list[dict[str, str]] | None = None) -> dict[str, Any]:
        text = message.lower()
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
            tool_results.append(
                {
                    "name": "revenue_metrics_by_court",
                    "result": self.tools.call_tool("revenue_metrics_by_court", {"court_id": court_id}),
                }
            )

        if should_use_snapshot:
            tool_results.append(
                {
                    "name": "courts_operational_snapshot",
                    "result": self.tools.call_tool("courts_operational_snapshot", {"days": 7}),
                }
            )

        reply = self._compose_with_gemini(message, conversation or [], tool_results)

        return {
            "reply": reply,
            "toolsUsed": [item["name"] for item in tool_results],
            "llm": "gemini",
        }

    def _extract_court_id(self, text: str) -> int:
        match = re.search(r"(?:cancha|espacio)\s*(\d+)", text)
        return int(match.group(1)) if match else 0

    def _compose_with_gemini(
        self,
        message: str,
        conversation: list[dict[str, str]],
        tool_results: list[dict[str, Any]],
    ) -> str:
        if not self.llm.enabled:
            raise RuntimeError("GEMINI_API_KEY no esta configurada. Crea backend/.env con esa variable.")

        prompt = self._build_llm_prompt(message, conversation, tool_results)
        return self.llm.generate(prompt)

    def _build_llm_prompt(
        self,
        message: str,
        conversation: list[dict[str, str]],
        tool_results: list[dict[str, Any]],
    ) -> str:
        recent_conversation = conversation[-6:]
        return (
            "Contexto de conversacion reciente:\n"
            f"{recent_conversation}\n\n"
            "Resultados de herramientas MCP disponibles:\n"
            f"{tool_results}\n\n"
            "Pregunta actual del administrador:\n"
            f"{message}\n\n"
            "Instrucciones de respuesta:\n"
            "- Responde como un asistente de administracion de canchas.\n"
            "- Si hay datos, interpreta tendencias y propone acciones concretas.\n"
            "- Si faltan datos, dilo con naturalidad y sugiere que dato revisar.\n"
            "- Evita repetir siempre la misma estructura; adapta el formato a la pregunta.\n"
        )
