import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { PublicUser, User, UserType } from '../models/user';

interface UserRow extends RowDataPacket {
  user_id: number;
  id_usuario: number;
  name: string;
  nombre: string;
  email: string;
  phone: string | null;
  tel: string | null;
  bio: string | null;
  biografia: string | null;
  photo: string | null;
  foto: string | null;
  position: string | null;
  posicion: string | null;
  type: UserType;
  Tipo: UserType;
  fk_id_evento: number | null;
}

type CreateUserRecord = Pick<User, 'name' | 'email' | 'password_hash' | 'phone' | 'bio' | 'photo' | 'position' | 'type'>;
type UpdateUserRecord = Partial<CreateUserRecord>;

const userTable = 'USUARIO';
const publicUserColumns = `
  id_usuario AS user_id,
  id_usuario,
  nombre AS name,
  nombre,
  email,
  tel AS phone,
  tel,
  biografia AS bio,
  biografia,
  foto AS photo,
  foto,
  posicion AS position,
  posicion,
  Tipo AS type,
  Tipo,
  fk_id_evento
`;
const editableFields: Record<string, string> = {
  name: 'nombre',
  email: 'email',
  password_hash: '`contraseña_hash`',
  phone: 'tel',
  bio: 'biografia',
  photo: 'foto',
  position: 'posicion',
  type: 'Tipo',
};

export const UserRepository = {
  async create(userData: CreateUserRecord) {
    const { name, email, password_hash, phone, bio, photo, position, type } = userData;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO ${userTable} (nombre, email, \`contraseña_hash\`, tel, biografia, foto, posicion, Tipo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, password_hash, phone, bio, photo, position, type]
    );

    return await this.findById(result.insertId);
  },

  async findAll() {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT ${publicUserColumns} FROM ${userTable} ORDER BY id_usuario DESC`
    );
    return rows as PublicUser[];
  },

  async findById(id: number) {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT ${publicUserColumns} FROM ${userTable} WHERE id_usuario = ?`,
      [id]
    );

    return (rows as PublicUser[])[0];
  },

  async findByEmail(email: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        id_usuario AS user_id,
        id_usuario,
        nombre AS name,
        nombre,
        email,
        \`contraseña_hash\` AS password_hash,
        \`contraseña_hash\`,
        tel AS phone,
        tel,
        biografia AS bio,
        biografia,
        foto AS photo,
        foto,
        posicion AS position,
        posicion,
        Tipo AS type,
        Tipo,
        fk_id_evento
      FROM ${userTable}
      WHERE email = ?
      LIMIT 1`,
      [email]
    );
    return (rows as User[])[0];
  },

  async update(id: number, userData: UpdateUserRecord) {
    const filteredData = Object.fromEntries(
      Object.entries(userData).filter(([key, value]) => editableFields[key] && value !== undefined)
    );

    if (Object.keys(filteredData).length === 0) {
      return await this.findById(id);
    }

    const fields = Object.keys(filteredData)
      .map((key) => `${editableFields[key]} = ?`)
      .join(', ');
    const values = Object.values(filteredData);

    await pool.query(`UPDATE ${userTable} SET ${fields} WHERE id_usuario = ?`, [...values, id]);

    return await this.findById(id);
  },

  async delete(id: number) {
    const [result] = await pool.query<ResultSetHeader>(`DELETE FROM ${userTable} WHERE id_usuario = ?`, [id]);
    return result;
  },

  async findAllPaginated(page: number, limit: number) {
    const offset = page * limit;

    const [users] = await pool.query<UserRow[]>(
      `SELECT ${publicUserColumns} FROM ${userTable} ORDER BY id_usuario DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM ${userTable}`);
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
