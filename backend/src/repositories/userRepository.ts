import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { PublicUser, User, UserType } from '../models/user';

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  type: UserType;
  created_at: Date;
}

type CreateUserRecord = Pick<User, 'name' | 'email' | 'password_hash' | 'phone' | 'type'>;
type UpdateUserRecord = Partial<CreateUserRecord>;

const publicUserColumns = 'user_id, name, email, phone, type, created_at';
const editableFields = new Set(['name', 'email', 'password_hash', 'phone', 'type']);

export const UserRepository = {
  async create(userData: CreateUserRecord) {
    const { name, email, password_hash, phone, type } = userData;
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password_hash, phone, type) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, phone, type]
    );

    return await this.findById(result.insertId);
  },

  async findAll() {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT ${publicUserColumns} FROM users ORDER BY created_at DESC`
    );
    return rows as PublicUser[];
  },

  async findById(id: number) {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT ${publicUserColumns} FROM users WHERE user_id = ?`,
      [id]
    );

    return (rows as PublicUser[])[0];
  },

  async findByEmail(email: string) {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    return (rows as User[])[0];
  },

  async update(id: number, userData: UpdateUserRecord) {
    const filteredData = Object.fromEntries(
      Object.entries(userData).filter(([key, value]) => editableFields.has(key) && value !== undefined)
    );

    if (Object.keys(filteredData).length === 0) {
      return await this.findById(id);
    }

    const fields = Object.keys(filteredData)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(filteredData);

    await pool.query(`UPDATE users SET ${fields} WHERE user_id = ?`, [...values, id]);

    return await this.findById(id);
  },

  async delete(id: number) {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM users WHERE user_id = ?', [id]);
    return result;
  },

  async findAllPaginated(page: number, limit: number) {
    const offset = page * limit;

    const [users] = await pool.query<UserRow[]>(
      `SELECT ${publicUserColumns} FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
    const total = countRows[0].count as number;

    return {
      content: users as PublicUser[],
      page,
      totalPages: Math.ceil(total / limit),
      totalElements: total,
      last: offset + users.length >= total,
    };
  },
};
