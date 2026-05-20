import { UserType } from "../models/user";

export type UpdateUserDTO = {
  name?: string;
  email?: string;
  phone?: string | null;
  type?: UserType;
  password?: string;
};
