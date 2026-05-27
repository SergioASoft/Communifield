import { api } from "./api";

export type UserType = "organizer" | "player" | "admin";

export interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  type: UserType;
  created_at?: string;
}

export type UserFormPayload = {
  name: string;
  email: string;
  phone?: string | null;
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

export const createUser = async (payload: Required<UserFormPayload>) => {
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
