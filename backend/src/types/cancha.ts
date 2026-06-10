export interface Cancha {
  id_espacio?: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  distancia?: string | null;
  superficie?: string | null;
  descripcion: string[] | string | null;
  precio_hora: number;
  rating: number;
  total_resenas: number;
  disponible_hoy: boolean | number;
  imagen_principal?: string | null;
  imagenes: string[] | string | null;
  caracteristicas: any[] | string | null;
  horarios: any[] | string | null;
  resenas: any[] | string | null;
  estado: string;
}