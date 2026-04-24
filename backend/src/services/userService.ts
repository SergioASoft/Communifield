// src/services/userService.ts
import { UserRepository } from '../repositories/userRepository';
import { UpdateUserDTO } from '../dtos/UpdateUserDTO';
import bcrypt from 'bcrypt';
import { CreateUserDTO } from '../dtos/CreateUserDTO';

export const UserService = {
  async createUser(data: CreateUserDTO) {
    const { password, ...rest } = data;

    const password_hash = await bcrypt.hash(password, 10);

    const userToSave = {
        ...rest,
        password_hash,
    };

    return await UserRepository.create(userToSave);
  },
  
  async getAllUsers() {
    return await UserRepository.findAll();
  },

  async getUserById(id: number) {
    return await UserRepository.findById(id);
  },

 async updateUser(id: number, data: UpdateUserDTO) {
  if (data.password) {
    data.password_hash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  return await UserRepository.update(id, data);
  },

  async deleteUser(id: number) {
    return await UserRepository.delete(id);
  }
};