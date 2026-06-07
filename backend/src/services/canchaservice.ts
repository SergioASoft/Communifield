import { pool } from "../config/db";

export class CanchaService {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT *
      FROM ESPACIO
      WHERE estado = 'activo'
      ORDER BY id_espacio DESC
    `);

    return rows;
  }

  static async getById(id: number) {
    const [rows]: any = await pool.query(
      `
      SELECT *
      FROM ESPACIO
      WHERE id_espacio = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0];
  }
}