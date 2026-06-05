export interface Cancha {
  space_id?: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  distancia: string;
  descripcion: string[];
  precio_hora: number;
  rating: number;
  total_resenas: number;
  disponible_hoy: boolean;
  imagen_principal: string;
  imagenes: string[];
  caracteristicas: any[];
  horarios: any[];
  resenas: any[];
  estado: string;
}