export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  photo?: string | null;
  favoriteSport?: string;
  level?: string;
  zone?: string;
  position?: string;
}

