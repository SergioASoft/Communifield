import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


class GeminiClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest").strip()

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str, system_instruction: str | None = None) -> str:
        if not self.enabled:
            raise RuntimeError("GEMINI_API_KEY no esta configurada.")

        model = urllib.parse.quote(self.model, safe="")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
        payload = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": system_instruction or (
                            "Eres el asistente IA administrativo de CommuniField. "
                            "Responde en espanol claro, profesional y accionable. "
                            "Usa los datos de herramientas MCP como fuente principal. "
                            "No menciones SQL, joins, implementacion interna ni claves API."
                        )
                    }
                ]
            },
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.75,
                "topP": 0.9,
                "maxOutputTokens": 700,
            },
        }

        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Gemini rechazo la solicitud: {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"No se pudo conectar con Gemini: {exc.reason}") from exc

        return self._extract_text(data)

    def _extract_text(self, data: dict[str, Any]) -> str:
        candidates = data.get("candidates") or []
        for candidate in candidates:
            parts = candidate.get("content", {}).get("parts") or []
            text = "\n".join(str(part.get("text", "")).strip() for part in parts if part.get("text"))
            if text:
                return text

        raise RuntimeError("Gemini no devolvio texto util.")
