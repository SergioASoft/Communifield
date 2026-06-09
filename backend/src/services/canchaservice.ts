import { pool } from "../config/db";

export class CanchaService {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT *
      FROM ESPACIO
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

  static async create(data: any) {
    const {
      nombre,
      tipo,
      ubicacion,
      distancia,
      superficie,
      precio_hora,
      rating,
      total_resenas,
      disponible_hoy,
      imagen_principal,
      estado,
    } = data;

    const [result]: any = await pool.query(
      `
      INSERT INTO ESPACIO (
        nombre,
        tipo,
        ubicacion,
        distancia,
        superficie,
        precio_hora,
        rating,
        total_resenas,
        disponible_hoy,
        imagen_principal,
        estado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nombre,
        tipo,
        ubicacion,
        distancia ?? null,
        superficie ?? null,
        precio_hora ?? 0,
        rating ?? 0,
        total_resenas ?? 0,
        disponible_hoy ?? true,
        imagen_principal ?? null,
        estado ?? "activo",
      ]
    );

    return this.getById(result.insertId);
  }

  static async update(id: number, data: any) {
    const {
      nombre,
      tipo,
      ubicacion,
      distancia,
      superficie,
      precio_hora,
      rating,
      total_resenas,
      disponible_hoy,
      imagen_principal,
      estado,
    } = data;

    await pool.query(
      `
      UPDATE ESPACIO
      SET
        nombre = ?,
        tipo = ?,
        ubicacion = ?,
        distancia = ?,
        superficie = ?,
        precio_hora = ?,
        rating = ?,
        total_resenas = ?,
        disponible_hoy = ?,
        imagen_principal = ?,
        estado = ?
      WHERE id_espacio = ?
      `,
      [
        nombre,
        tipo,
        ubicacion,
        distancia ?? null,
        superficie ?? null,
        precio_hora ?? 0,
        rating ?? 0,
        total_resenas ?? 0,
        disponible_hoy ?? true,
        imagen_principal ?? null,
        estado ?? "activo",
        id,
      ]
    );

    return this.getById(id);
  }

  static async delete(id: number) {
    await pool.query(
      `
      DELETE FROM ESPACIO
      WHERE id_espacio = ?
      `,
      [id]
    );

    return true;
  }
}