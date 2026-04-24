import { RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { User } from '../models/user';
import { CreateUserDTO } from '../dtos/CreateUserDTO';

export const UserRepository = {
  async create(userData: Omit<User, 'user_id'>) {
    const { name, email, password_hash, phone, type } = userData;
    const [result] = await pool.query(
      'INSERT INTO user (name, email, password_hash, phone, type) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, phone, type]
    );
    return result;
  },

  async findAll() {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM user');
    return rows as User[];
  },

  async findById(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM user WHERE user_id = ?',
      [id]
    );

    return (rows as User[])[0];
  },
  
  async findByEmail(email: string){
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM user WHERE email = ?', [email]);
    return (rows as User[])[0];
  },

  async update(id: number, userData: Partial<User>) {
    const fields = Object.keys(userData)
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.values(userData);

    const [result] = await pool.query(
      `UPDATE user SET ${fields} WHERE user_id = ?`,
      [...values, id]
    );
    return result;
  },
    
  async delete(id: number) {
    const [result] = await pool.query('DELETE FROM user WHERE user_id = ?', [id]);
    return result;
  }
};