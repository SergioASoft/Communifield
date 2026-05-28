const API_URL = import.meta.env.VITE_API_URL || "";

export type ApiError = { message: string; errors?: Record<string, string[]> };

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined | null>;
};

type ApiResponse<T> = {
  data: T;
};

function buildPath(path: string, params?: RequestOptions["params"]) {
  if (!params) return path;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("communifield_token");
  const { params, ...fetchOptions } = options;
  const res = await fetch(`${API_URL}${buildPath(path, params)}`, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data as ApiError;
  return data as T;
}

async function requestResponse<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const data = await request<T>(path, options);
  return { data };
}

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) => requestResponse<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    requestResponse<T>(path, { ...options, method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    requestResponse<T>(path, { ...options, method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T = unknown>(path: string, options: RequestOptions = {}) => requestResponse<T>(path, { ...options, method: "DELETE" }),
  getMe: async () => {
    const data = await request<{ user: any }>("/auth/me", { method: "GET" });
    return data.user;
  },
  updateMe: async (body: { name?: string; phone?: string; bio?: string; position?: string }) => {
    const storedUser = localStorage.getItem("communifield_user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const id = user?.user_id || user?.id;
    if (!id) throw { message: "No se encontro el usuario autenticado" } as ApiError;

    const data = await request<{ data: any }>(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) });
    return data.data;
  },
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: any; message: string; redirectTo: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: { name: string; email: string; phone: string; password: string; type: "organizer" | "player" }) =>
    request<{ message: string; userId: number }>("/users/register", { method: "POST", body: JSON.stringify(body) }),
};
