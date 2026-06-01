import { api } from "./api";

export type UserType = "organizer" | "player" | "admin";

export type PhotoFilePayload = {
  name: string;
  type: string;
  dataUrl: string;
};

export interface User {
  user_id: number;
  id_usuario?: number;
  name: string;
  nombre?: string;
  email: string;
  phone: string | null;
  tel?: string | null;
  bio?: string | null;
  biografia?: string | null;
  photo?: string | null;
  foto?: string | null;
  position?: string | null;
  posicion?: string | null;
  fk_id_evento?: number | null;
  type: UserType;
  Tipo?: UserType;
}

export type UserFormPayload = {
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  photo?: string | null;
  photoFile?: PhotoFilePayload | null;
  position?: string | null;
  type: UserType;
  password?: string;
};

export interface PaginatedUsersResponse {
  content: User[];
  page: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
}

export const getUsers = async (page = 0, limit = 8) => {
  const response = await api.get<PaginatedUsersResponse>("/users", {
    params: { page, limit },
  });

  return response.data;
};

export const createUser = async (payload: UserFormPayload) => {
  const response = await api.post<{ message: string; data: User }>("/users", payload);
  return response.data.data;
};

export const updateUser = async (userId: number, payload: UserFormPayload) => {
  const response = await api.put<{ message: string; data: User }>(`/users/${userId}`, payload);
  return response.data.data;
};

export const deleteUser = async (userId: number) => {
  await api.delete(`/users/${userId}`);
};

export function resolvePhotoUrl(photo?: string | null) {
  if (!photo) return "";
  if (/^(https?:|data:|blob:)/.test(photo)) return photo;
  return "";
}
