import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import {
  sendManagerAssistantMessage,
  type AssistantChatMessage,
} from "../services/assistantService";
import "./ManagerAssistantLauncher.css";

type TokenPayload = {
  type?: string;
  role?: string;
  exp?: number;
};

const initialMessages: AssistantChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hola, soy tu asistente de gestion. Puedo ayudarte a analizar ingresos, reservas, demanda por cancha y decisiones de precio.",
  },
];

function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

function isManagerPayload(payload: TokenPayload | null) {
  if (!payload) return false;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowInSeconds) return false;

  return payload.type === "organizer" || payload.role === "gestor";
}

export function ManagerAssistantLauncher() {
  const [isManager, setIsManager] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("communifield_token");
    setIsManager(isManagerPayload(token ? decodeTokenPayload(token) : null));
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  if (!isManager) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();
    if (!content) return;

    const nextMessages: AssistantChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await sendManagerAssistantMessage(content, nextMessages);
      setMessages((current) => [...current, { role: "assistant", content: response.reply }]);
      window.setTimeout(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
      }, 0);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? "No se pudo contactar el asistente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="manager-assistant-fab"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente IA de gestor"
        title="Asistente IA"
      >
        <MessageCircle size={22} />
      </button>

      {open && (
        <div className="manager-assistant-overlay" role="presentation">
          <section
            className="manager-assistant-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Asistente IA para gestor"
          >
            <header className="manager-assistant-header">
              <div>
                <span className="manager-assistant-kicker">Gestor</span>
                <h2>Asistente IA</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar asistente">
                <X size={20} />
              </button>
            </header>

            <div className="manager-assistant-thread" ref={threadRef}>
              {messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`manager-message ${message.role}`}>
                  <div className="manager-message-avatar" aria-hidden="true">
                    {message.role === "assistant" ? <Bot size={17} /> : "T"}
                  </div>
                  <p>{message.content}</p>
                </article>
              ))}

              {loading && (
                <article className="manager-message assistant">
                  <div className="manager-message-avatar" aria-hidden="true">
                    <LoaderCircle className="manager-spin" size={17} />
                  </div>
                  <p>Consultando Gemini y datos de CommuniField...</p>
                </article>
              )}
            </div>

            {error && <p className="manager-assistant-error">{error}</p>}

            <form className="manager-assistant-composer" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pregunta por ingresos, reservas o precios"
                disabled={loading}
              />
              <button type="submit" disabled={!canSend} aria-label="Enviar mensaje">
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
