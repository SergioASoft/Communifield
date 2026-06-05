import { UserType } from "../models/user";

export type CreateUserDTO = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  bio?: string | null;
  photo?: string | null;
  photoFile?: {
    name: string;
    type: string;
    dataUrl: string;
  } | null;
  position?: string | null;
  type: UserType;
};
