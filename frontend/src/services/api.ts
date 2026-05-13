const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type ApiError = { message: string; errors?: Record<string, string[]> };

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const token = localStorage.getItem("communifield_token");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data as ApiError;
  return data as T;
}

export const api = {
  login: (body: { email: string; password: string; role: "gestor" | "player" }) =>
    request<{ token: string; user: any; message: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: { name: string; username: string; email: string; phone: string; password: string; role: "gestor" | "player" }) =>
    request<{ message: string; userId: number }>("/users/register", { method: "POST", body: JSON.stringify(body) }),
};
