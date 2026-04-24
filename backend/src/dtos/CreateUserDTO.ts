export type CreateUserDTO = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  type: 'organizer' | 'player' | 'admin';
};