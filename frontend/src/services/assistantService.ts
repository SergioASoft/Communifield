import { api } from "./api";

export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatResponse = {
  reply: string;
  toolsUsed: string[];
};

export async function sendAdminAssistantMessage(
  message: string,
  conversation: AssistantChatMessage[]
) {
  const { data } = await api.post<AssistantChatResponse>("/api/assistant/admin/chat", {
    message,
    conversation,
  });

  return data;
}
