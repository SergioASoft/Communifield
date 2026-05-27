import { CreateUserDTO } from '../dtos/CreateUserDTO';
import { UpdateUserDTO } from '../dtos/UpdateUserDTO';
import { UserRepository } from '../repositories/userRepository';
import { hashPassword } from '../utils/password';

export const UserService = {
  async createUser(data: CreateUserDTO) {
    const { password, ...rest } = data;
    const password_hash = await hashPassword(password);

    return await UserRepository.create({
      ...rest,
      phone: rest.phone ?? null,
      password_hash,
    });
  },

  async getAllUsers(page: number, limit: number) {
    return await UserRepository.findAllPaginated(page, limit);
  },

  async getUserById(id: number) {
    return await UserRepository.findById(id);
  },

  async updateUser(id: number, data: UpdateUserDTO) {
    const { password, ...updates } = data;

    return await UserRepository.update(id, {
      ...updates,
      ...(password ? { password_hash: await hashPassword(password) } : {}),
    });
  },

  async deleteUser(id: number) {
    return await UserRepository.delete(id);
  },
};
