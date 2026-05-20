export type UserType = 'organizer' | 'player' | 'admin';

export interface User {
  user_id: number;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  type: UserType;
  created_at: Date;
}

export type PublicUser = Omit<User, 'password_hash'>;
