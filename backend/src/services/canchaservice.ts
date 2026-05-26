import { pool } from "../config/db";

export class CanchaService {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT * FROM space
    `);

    return rows;
  }

  static async getById(id: number) {
    const [rows]: any = await pool.query(
      `
      SELECT * FROM space
      WHERE space_id = ?
      `,
      [id]
    );

    return rows[0];
  }
}