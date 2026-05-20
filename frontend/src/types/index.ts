
export interface Usuario {
  nombre: string;
  email: string;
  iniciales: string;
  avatarUrl?: string;
}

export interface Horario {
  dia: string;
  horas: string;
  esFinde?: boolean;
}

export interface Caracteristica {
  label: string;
  valor: string;
  icono?: string;
}

export interface Reseña {
  iniciales: string;
  nombre: string;
  fecha: string;
  estrellas: number;
  texto: string;
}

export interface Cancha {
  id: string;
  nombre: string;
  ubicacion: string;
  distancia: string;
  tipo: string;
  superficie: string;
  dimensiones: string;
  jugadoresPorEquipo: number;
  precioPorHora: number;
  tasaServicio: number;
  rating: number;
  totalReseñas: number;
  descripcion: string[];
  horarios: Horario[];
  caracteristicas: Caracteristica[];
  reseñas: Reseña[];
  disponibleHoy?: boolean;
  altaDemanda?: boolean;
}
