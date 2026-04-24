import { User } from "../models/user";

export type UpdateUserDTO = Partial<User> & {
  password?: string;
};