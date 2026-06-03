import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bot, LoaderCircle, Send, UserRound } from "lucide-react";
import {
  sendAdminAssistantMessage,
  type AssistantChatMessage,
} from "../../services/assistantService";

const initialMessages: AssistantChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hola. Soy el asistente administrativo de CommuniField. Puedo revisar ingresos, reservas y estado de las canchas para sugerir decisiones de precio u operacion.",
  },
];

export function AdminAssistant() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

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
      const response = await sendAdminAssistantMessage(content, nextMessages);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.reply,
        },
      ]);
      window.setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 0);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? "No se pudo contactar el asistente. Verifica que el backend y el servicio Python esten activos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="assistant-panel" aria-label="Asistente IA administrativo">
      <div className="assistant-window">
        <div className="assistant-thread" ref={listRef}>
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`assistant-message ${message.role}`}>
              <div className="assistant-message-icon" aria-hidden="true">
                {message.role === "assistant" ? <Bot size={18} /> : <UserRound size={18} />}
              </div>
              <p>{message.content}</p>
            </article>
          ))}

          {loading && (
            <article className="assistant-message assistant">
              <div className="assistant-message-icon" aria-hidden="true">
                <LoaderCircle className="spin-icon" size={18} />
              </div>
              <p>Analizando datos de CommuniField...</p>
            </article>
          )}
        </div>

        {error && <p className="assistant-error">{error}</p>}

        <form className="assistant-composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pregunta por ingresos, reservas o estado de canchas"
            disabled={loading}
          />
          <button type="submit" disabled={!canSend} aria-label="Enviar mensaje">
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  );
}
