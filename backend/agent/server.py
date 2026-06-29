import json
import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

try:
    from .agent import CommunifieldAdminAgent
    from .mcp_tools import MCPToolRegistry
except ImportError:  # pragma: no cover
    from agent import CommunifieldAdminAgent
    from mcp_tools import MCPToolRegistry


def load_env_file(path: str | None = None) -> None:
    env_path = Path(path) if path else Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    with env_path.open("r", encoding="utf-8") as env_file:
        for line in env_file:
            clean = line.strip()
            if not clean or clean.startswith("#") or "=" not in clean:
                continue
            key, value = clean.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()
tools = MCPToolRegistry()
agent = CommunifieldAdminAgent(tools)


class AgentHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json(
                200,
                {
                    "status": "ok",
                    "service": "communifield-python-agent",
                    "geminiConfigured": agent.llm.enabled,
                    "geminiModel": agent.llm.model,
                },
            )
            return

        if self.path == "/mcp/tools":
            self._send_json(200, {"tools": tools.list_tools()})
            return

        self._send_json(404, {"message": "Ruta no encontrada."})

    def do_POST(self) -> None:
        try:
            payload = self._read_json()

            if self.path == "/chat":
                message = str(payload.get("message") or "").strip()
                if not message:
                    self._send_json(400, {"message": "El mensaje es obligatorio."})
                    return

                channel = str(payload.get("channel") or "admin")
                self._send_json(
                    200,
                    agent.answer(
                        message,
                        payload.get("conversation") or [],
                        channel,
                        payload.get("user") or None,
                    ),
                )
                return

            if self.path == "/mcp/call":
                name = str(payload.get("name") or "")
                arguments = payload.get("arguments") or {}
                self._send_json(200, {"result": tools.call_tool(name, arguments)})
                return

            self._send_json(404, {"message": "Ruta no encontrada."})
        except RuntimeError as exc:
            self._send_json(502, {"message": str(exc), "llm": "gemini"})
        except Exception as exc:
            self._send_json(500, {"message": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:
        return


if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("AI_AGENT_PORT", "8001")))
    server = ThreadingHTTPServer(("0.0.0.0", port), AgentHandler)
    print(f"CommuniField Python AI agent running on port {port}")
    server.serve_forever()
