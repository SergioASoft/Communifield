export type UserType = 'organizer' | 'player' | 'admin';

export interface User {
  user_id: number;
  id_usuario: number;
  name: string;
  nombre: string;
  email: string;
  password_hash: string;
  'contraseña_hash': string;
  phone: string | null;
  tel: string | null;
  bio: string | null;
  biografia: string | null;
  photo: string | null;
  foto: string | null;
  position: string | null;
  posicion: string | null;
  type: UserType;
  Tipo: UserType;
  fk_id_evento: number | null;
}

export type PublicUser = Omit<User, 'password_hash' | 'contraseña_hash'>;
