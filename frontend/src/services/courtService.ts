import { api } from "./api";

export type CourtStatus = "activo" | "inactivo" | "mantenimiento";

export interface Court {
  id_espacio: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  distancia?: string | null;
  superficie?: string | null;
  precio_hora: number;
  rating: number;
  total_resenas: number;
  disponible_hoy: boolean;
  imagen_principal?: string | null;
  estado: CourtStatus;
}

export interface CourtFormPayload {
  nombre: string;
  tipo: string;
  ubicacion: string;
  distancia?: string | null;
  superficie?: string | null;
  precio_hora: number;
  rating?: number;
  total_resenas?: number;
  disponible_hoy: boolean;
  imagen_principal?: string | null;
  estado: CourtStatus;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  last: boolean;
}

export const getCourts = async (
  page = 0,
  size = 8
): Promise<PageResponse<Court>> => {
  const { data } = await api.get<Court[]>("/api/canchas", {
    params: { page, size },
  });

  const normalizedCourts = data.map((court) => ({
    ...court,
    precio_hora: Number(court.precio_hora),
    rating: Number(court.rating),
    disponible_hoy: Boolean(court.disponible_hoy),
  }));

  return {
    content: normalizedCourts,
    page,
    last: true,
  };
};

export const createCourt = async (payload: CourtFormPayload) => {
  const { data } = await api.post<Court>(
    "/api/canchas",
    payload
  );

  return data;
};

export const updateCourt = async (
  id: number,
  payload: CourtFormPayload
) => {
  const { data } = await api.put<Court>(
    `/api/canchas/${id}`,
    payload
  );

  return data;
};

export const deleteCourt = async (id: number) => {
  await api.delete(`/api/canchas/${id}`);
};