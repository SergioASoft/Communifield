import { pool } from "../config/db";

function toJson(value: any) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

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

  static async getByOwner(ownerId: number) {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM ESPACIO
      WHERE fk_id_dueño = ?
      ORDER BY id_espacio DESC
      `,
      [ownerId]
    );

    return rows;
  }

  static async create(data: any) {
    const {
      fk_id_dueño,
      nombre,
      tipo,
      ubicacion,
      distancia,
      superficie,
      descripcion,
      caracteristicas,
      precio_hora,
      rating,
      total_resenas,
      disponible_hoy,
      imagen_principal,
      imagenes,
      estado,
    } = data;

    const [result]: any = await pool.query(
      `
      INSERT INTO ESPACIO (
        fk_id_dueño,
        nombre,
        tipo,
        ubicacion,
        distancia,
        superficie,
        descripcion,
        caracteristicas,
        precio_hora,
        rating,
        total_resenas,
        disponible_hoy,
        imagen_principal,
        imagenes,
        estado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        fk_id_dueño,
        nombre,
        tipo,
        ubicacion,
        distancia || null,
        superficie || null,
        toJson(descripcion),
        toJson(caracteristicas),
        precio_hora || 0,
        rating || 0,
        total_resenas || 0,
        disponible_hoy ?? true,
        imagen_principal || null,
        toJson(imagenes),
        estado || "activo",
      ]
    );

    return this.getById(result.insertId);
  }

  static async update(id: number, data: any, ownerId?: number) {
    const {
      nombre,
      tipo,
      ubicacion,
      distancia,
      superficie,
      descripcion,
      caracteristicas,
      precio_hora,
      rating,
      total_resenas,
      disponible_hoy,
      imagen_principal,
      imagenes,
      estado,
    } = data;

    const [result]: any = await pool.query(
      `
      UPDATE ESPACIO
      SET
        nombre = ?,
        tipo = ?,
        ubicacion = ?,
        distancia = ?,
        superficie = ?,
        descripcion = ?,
        caracteristicas = ?,
        precio_hora = ?,
        rating = ?,
        total_resenas = ?,
        disponible_hoy = ?,
        imagen_principal = ?,
        imagenes = ?,
        estado = ?
      WHERE id_espacio = ?
        AND (? IS NULL OR fk_id_dueño = ?)
      `,
      [
        nombre,
        tipo,
        ubicacion,
        distancia ?? null,
        superficie ?? null,
        toJson(descripcion),
        toJson(caracteristicas),
        precio_hora ?? 0,
        rating ?? 0,
        total_resenas ?? 0,
        disponible_hoy ?? true,
        imagen_principal ?? null,
        toJson(imagenes),
        estado ?? "activo",
        id,
        ownerId ?? null,
        ownerId ?? null,
      ]
    );

    if (!result.affectedRows) return null;

    return this.getById(id);
  }

  static async delete(id: number, ownerId?: number) {
    const cancha: any = ownerId ? await this.getByIdForOwner(id, ownerId) : await this.getById(id);
    if (!cancha) return { found: false, deleted: false, archived: false };

    const [eventRows]: any = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM EVENTO
      WHERE fk_id_espacio = ?
      `,
      [id]
    );
    const totalEventos = Number(eventRows?.[0]?.total || 0);

    if (totalEventos > 0) {
      await pool.query(
        `
        UPDATE ESPACIO
        SET estado = 'inactivo',
            disponible_hoy = FALSE,
            fecha_desact = COALESCE(fecha_desact, NOW())
        WHERE id_espacio = ?
          AND (? IS NULL OR fk_id_dueño = ?)
        `,
        [id, ownerId ?? null, ownerId ?? null]
      );

      return { found: true, deleted: false, archived: true, events: totalEventos };
    }

    const [result]: any = await pool.query(
      `
      DELETE FROM ESPACIO
      WHERE id_espacio = ?
        AND (? IS NULL OR fk_id_dueño = ?)
      `,
      [id, ownerId ?? null, ownerId ?? null]
    );

    return { found: true, deleted: true, archived: false, events: 0 };
  }

  private static async getByIdForOwner(id: number, ownerId: number) {
    const [rows]: any = await pool.query(
      `
      SELECT *
      FROM ESPACIO
      WHERE id_espacio = ?
        AND fk_id_dueño = ?
      LIMIT 1
      `,
      [id, ownerId]
    );

    return rows[0];
  }

  static async addReview(id: number, data: any) {
  const cancha: any = await this.getById(id);

  if (!cancha) return null;

  const resenas = this.parseJson(cancha.resenas);

  const nuevaResena = {
    nombre: data.nombre || "Usuario",
    email: data.email || "",
    iniciales: data.iniciales || "U",
    foto: data.foto || null,
    estrellas: Number(data.estrellas),
    texto: data.texto,
    fecha: data.fecha || new Date().toLocaleDateString("es-CO"),
  };

  resenas.unshift(nuevaResena);

  const totalResenas = resenas.length;

  const suma = resenas.reduce(
    (acc: number, item: any) => acc + Number(item.estrellas || 0),
    0
  );

  const rating = Number((suma / totalResenas).toFixed(1));

  await pool.query(
    `
    UPDATE ESPACIO
    SET resenas = ?, rating = ?, total_resenas = ?
    WHERE id_espacio = ?
    `,
    [JSON.stringify(resenas), rating, totalResenas, id]
    );

    return this.getById(id);
  }
  static async updateReview(
  id: number,
  index: number,
  data: {
    texto: string;
    estrellas: number;
    email?: string;
  }
) {
  const cancha: any = await this.getById(id);

  if (!cancha) {
    throw new Error("Cancha no encontrada");
  }

  const resenas = this.parseJson(cancha.resenas);

  if (!resenas[index]) {
    throw new Error("Reseña no encontrada");
  }

  if (data.email && resenas[index].email && resenas[index].email !== data.email) {
    throw new Error("No puedes editar una reseña que no es tuya");
  }

  resenas[index] = {
    ...resenas[index],
    texto: data.texto,
    estrellas: Number(data.estrellas),
    editada: true,
  };

  const totalResenas = resenas.length;

  const rating =
    totalResenas > 0
      ? resenas.reduce(
          (sum: number, r: any) => sum + Number(r.estrellas || 0),
          0
        ) / totalResenas
      : 0;

  await pool.query(
    `
    UPDATE ESPACIO
    SET resenas = ?,
        total_resenas = ?,
        rating = ?
    WHERE id_espacio = ?
    `,
    [
      JSON.stringify(resenas),
      totalResenas,
      Number(rating.toFixed(1)),
      id,
    ]
  );

  return this.getById(id);
}

static async deleteReview(id: number, index: number, email?: string) {
  const cancha: any = await this.getById(id);

  if (!cancha) {
    throw new Error("Cancha no encontrada");
  }

  const resenas = this.parseJson(cancha.resenas);

  if (!resenas[index]) {
    throw new Error("Reseña no encontrada");
  }

  if (email && resenas[index].email && resenas[index].email !== email) {
    throw new Error("No puedes eliminar una reseña que no es tuya");
  }

  resenas.splice(index, 1);

  const totalResenas = resenas.length;

  const rating =
    totalResenas > 0
      ? resenas.reduce(
          (sum: number, r: any) => sum + Number(r.estrellas || 0),
          0
        ) / totalResenas
      : 0;

  await pool.query(
    `
    UPDATE ESPACIO
    SET resenas = ?,
        total_resenas = ?,
        rating = ?
    WHERE id_espacio = ?
    `,
    [
      JSON.stringify(resenas),
      totalResenas,
      Number(rating.toFixed(1)),
      id,
    ]
  );

  return this.getById(id);
}

private static parseJson(value: any) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
}
