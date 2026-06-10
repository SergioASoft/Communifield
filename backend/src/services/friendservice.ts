import { pool } from "../config/db";

export class FriendService {
  static async getFriends(userId: number) {
    const [rows] = await pool.query(
      `
   SELECT 
      a.id_amistad,
      u.id_usuario,
      u.nombre,
      u.email,
      u.foto,
      u.Tipo
      FROM AMISTAD a
      INNER JOIN USUARIO u
        ON u.id_usuario = CASE
          WHEN a.id_dueño = ? THEN a.id_amigo
          ELSE a.id_dueño
        END
      WHERE (a.id_dueño = ? OR a.id_amigo = ?)
      AND a.estado = 'aceptada'
      ORDER BY u.nombre ASC
      `,
      [userId, userId, userId]
    );

    return rows;
  }

  static async searchUsers(userId: number, q: string) {
    const search = `%${q}%`;

    const [rows] = await pool.query(
      `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.email,
        u.foto,
        u.Tipo,
        a.id_amistad,
        a.estado,
        a.id_dueño,
        a.id_amigo
      FROM USUARIO u
      LEFT JOIN AMISTAD a
        ON (
          (a.id_dueño = ? AND a.id_amigo = u.id_usuario)
          OR
          (a.id_amigo = ? AND a.id_dueño = u.id_usuario)
        )
      WHERE u.id_usuario != ?
      AND u.Tipo = 'player'
      AND (
        u.nombre LIKE ?
        OR u.email LIKE ?
      )
      AND (
        a.id_amistad IS NULL
        OR a.estado = 'pendiente'
      )
      ORDER BY u.nombre ASC
      LIMIT 10
      `,
      [userId, userId, userId, search, search]
    );

    return rows;
  }

  static async getRequests(userId: number) {
    const [rows] = await pool.query(
      `
      SELECT 
        a.id_amistad,
        u.id_usuario,
        u.nombre,
        u.email,
        u.foto,
        u.Tipo
      FROM AMISTAD a
      INNER JOIN USUARIO u 
        ON u.id_usuario = a.id_dueño
      WHERE a.id_amigo = ?
      AND a.estado = 'pendiente'
      ORDER BY u.nombre ASC
      `,
      [userId]
    );

    return rows;
  }

  static async addFriend(userId: number, friendId: number) {
    const [target]: any = await pool.query(
      `
      SELECT id_usuario
      FROM USUARIO
      WHERE id_usuario = ?
      AND Tipo = 'player'
      LIMIT 1
      `,
      [friendId]
    );

    if (target.length === 0) {
      throw new Error("Solo puedes agregar usuarios tipo jugador.");
    }

    const [existing]: any = await pool.query(
      `
      SELECT id_amistad, estado
      FROM AMISTAD
      WHERE 
        (id_dueño = ? AND id_amigo = ?)
        OR
        (id_dueño = ? AND id_amigo = ?)
      LIMIT 1
      `,
      [userId, friendId, friendId, userId]
    );

    if (existing.length > 0) {
      return existing[0];
    }

    const [result] = await pool.query(
      `
      INSERT INTO AMISTAD (id_dueño, id_amigo, estado)
      VALUES (?, ?, 'pendiente')
      `,
      [userId, friendId]
    );

    return result;
  }

  static async cancelRequest(requestId: number, userId: number) {
    const [result] = await pool.query(
      `
      DELETE FROM AMISTAD
      WHERE id_amistad = ?
      AND id_dueño = ?
      AND estado = 'pendiente'
      `,
      [requestId, userId]
    );

    return result;
  }

  static async acceptRequest(requestId: number, userId: number) {
    const [result] = await pool.query(
      `
      UPDATE AMISTAD
      SET estado = 'aceptada'
      WHERE id_amistad = ?
      AND id_amigo = ?
      AND estado = 'pendiente'
      `,
      [requestId, userId]
    );

    return result;
  }

  static async rejectRequest(requestId: number, userId: number) {
    const [result] = await pool.query(
      `
      UPDATE AMISTAD
      SET estado = 'rechazada'
      WHERE id_amistad = ?
      AND id_amigo = ?
      AND estado = 'pendiente'
      `,
      [requestId, userId]
    );

    return result;
  }
  static async deleteFriend(friendshipId: number, userId: number) {
  const [result] = await pool.query(
    `
    DELETE FROM AMISTAD
    WHERE id_amistad = ?
    AND estado = 'aceptada'
    AND (id_dueño = ? OR id_amigo = ?)
    `,
    [friendshipId, userId, userId]
  );

  return result;
}
}