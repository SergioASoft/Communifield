import { CreateUserDTO } from '../dtos/CreateUserDTO';
import { UpdateUserDTO } from '../dtos/UpdateUserDTO';
import { UserRepository } from '../repositories/userRepository';
import { hashPassword } from '../utils/password';
import { getPhotoDataUrl } from '../utils/photo';

export const UserService = {
  async createUser(data: CreateUserDTO) {
    const { password, photoFile, ...rest } = data;
    const password_hash = await hashPassword(password);
    const photoDataUrl = getPhotoDataUrl(photoFile);

    return await UserRepository.create({
      ...rest,
      phone: rest.phone ?? null,
      bio: rest.bio ?? null,
      photo: photoDataUrl ?? rest.photo ?? null,
      position: rest.position ?? null,
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
    const { password, photoFile, ...updates } = data;
    const photoDataUrl = getPhotoDataUrl(photoFile);

    return await UserRepository.update(id, {
      ...updates,
      ...(photoDataUrl ? { photo: photoDataUrl } : {}),
      ...(password ? { password_hash: await hashPassword(password) } : {}),
    });
  },

  async deleteUser(id: number) {
    return await UserRepository.delete(id);
  },
};
