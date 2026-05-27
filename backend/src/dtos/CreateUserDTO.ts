import { UserType } from "../models/user";

export type CreateUserDTO = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  type: UserType;
};
