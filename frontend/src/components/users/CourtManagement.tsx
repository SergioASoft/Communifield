import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  createCourt,
  deleteCourt,
  getCourts,
  updateCourt,
} from "../../services/courtService";
import type {
  Court,
  CourtFormPayload,
  CourtStatus,
} from "../../services/courtService";
import { CourtCard } from "./CourtCard";
import "./UserManagement.css";

const emptyForm: CourtFormPayload = {
  nombre: "",
  tipo: "",
  ubicacion: "",
  distancia: "",
  superficie: "",
  precio_hora: 0,
  rating: 0,
  total_resenas: 0,
  disponible_hoy: true,
  imagen_principal: "",
  estado: "activo",
};

const statusOptions: CourtStatus[] = ["activo", "inactivo", "mantenimiento"];

export const CourtManagement: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CourtFormPayload>(emptyForm);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  const formPanelRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCourts = async (currentPage: number, replace = false) => {
    try {
      setLoading(true);
      setError("");

      const data = await getCourts(currentPage, 8);

      setCourts((prev) => (replace ? data.content : [...prev, ...data.content]));
      setPage(data.page);
      setLastPage(data.last);
    } catch (err) {
      setError("No se pudieron cargar las canchas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts(0, true);
  }, []);

  const filteredCourts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return courts;
    }

    return courts.filter((court) =>
      [
        court.nombre,
        court.tipo,
        court.ubicacion,
        court.distancia ?? "",
        court.superficie ?? "",
        court.estado,
      ].some((value) => value.toLowerCase().includes(term))
    );
  }, [search, courts]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCourt(null);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.nombre.trim()) {
      setError("El nombre de la cancha es obligatorio.");
      return;
    }

    if (!form.tipo.trim()) {
      setError("El tipo de cancha es obligatorio.");
      return;
    }

    if (!form.ubicacion.trim()) {
      setError("La ubicación es obligatoria.");
      return;
    }

    if (Number(form.precio_hora) < 0) {
      setError("El precio por hora no puede ser negativo.");
      return;
    }

    setSaving(true);

    const payload: CourtFormPayload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo.trim(),
      ubicacion: form.ubicacion.trim(),
      distancia: form.distancia?.trim() || null,
      superficie: form.superficie?.trim() || null,
      precio_hora: Number(form.precio_hora),
      rating: Number(form.rating ?? 0),
      total_resenas: Number(form.total_resenas ?? 0),
      disponible_hoy: Boolean(form.disponible_hoy),
      imagen_principal: form.imagen_principal?.trim() || null,
      estado: form.estado,
    };

    try {
      if (editingCourt) {
        const updatedCourt = await updateCourt(editingCourt.id_espacio, payload);

        setCourts((prev) =>
          prev.map((court) =>
            court.id_espacio === updatedCourt.id_espacio ? updatedCourt : court
          )
        );
      } else {
        const createdCourt = await createCourt(payload);
        setCourts((prev) => [createdCourt, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError("No se pudo guardar la cancha.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    setError("");

    setForm({
      nombre: court.nombre,
      tipo: court.tipo,
      ubicacion: court.ubicacion,
      distancia: court.distancia ?? "",
      superficie: court.superficie ?? "",
      precio_hora: court.precio_hora,
      rating: court.rating ?? 0,
      total_resenas: court.total_resenas ?? 0,
      disponible_hoy: court.disponible_hoy,
      imagen_principal: court.imagen_principal ?? "",
      estado: court.estado,
    });

    window.setTimeout(() => {
      formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      firstInputRef.current?.focus();
    }, 0);
  };

  const handleDelete = async (courtId: number) => {
    const shouldDelete = window.confirm("¿Deseas eliminar esta cancha?");

    if (!shouldDelete) {
      return;
    }

    try {
      setError("");
      await deleteCourt(courtId);
      setCourts((prev) => prev.filter((court) => court.id_espacio !== courtId));
    } catch (err) {
      setError("No se pudo eliminar la cancha.");
    }
  };

  const loadMore = () => {
    if (!loading && !lastPage) {
      fetchCourts(page + 1);
    }
  };

  return (
    <>
      <section className="page-header">
        <div>
          <h2>Gestión de Canchas</h2>
          <p>Administra canchas, precios, disponibilidad y estado de cada espacio deportivo.</p>
        </div>
      </section>

      <section className="management-panel" ref={formPanelRef}>
        <form className="user-form" onSubmit={handleSubmit}>
          <h3>{editingCourt ? "Editar cancha" : "Nueva cancha"}</h3>

          <div className="form-grid">
            <label>
              Nombre
              <input
                ref={firstInputRef}
                type="text"
                value={form.nombre}
                onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                placeholder="Ej: Maracaná 5"
                required
              />
            </label>

            <label>
              Tipo
              <input
                type="text"
                value={form.tipo}
                onChange={(event) => setForm({ ...form, tipo: event.target.value })}
                placeholder="Ej: Fútbol 5"
                required
              />
            </label>

            <label>
              Ubicación
              <input
                type="text"
                value={form.ubicacion}
                onChange={(event) => setForm({ ...form, ubicacion: event.target.value })}
                placeholder="Ej: Av. Principal #450"
                required
              />
            </label>

            <label>
              Distancia
              <input
                type="text"
                value={form.distancia ?? ""}
                onChange={(event) => setForm({ ...form, distancia: event.target.value })}
                placeholder="Ej: 2 km"
              />
            </label>

            <label>
              Superficie
              <input
                type="text"
                value={form.superficie ?? ""}
                onChange={(event) => setForm({ ...form, superficie: event.target.value })}
                placeholder="Ej: Sintética Premium"
              />
            </label>

            <label>
              Precio por hora
              <input
                type="number"
                value={form.precio_hora}
                onChange={(event) =>
                  setForm({ ...form, precio_hora: Number(event.target.value) })
                }
                min={0}
                required
              />
            </label>

            <label>
              Rating
              <input
                type="number"
                value={form.rating ?? 0}
                onChange={(event) =>
                  setForm({ ...form, rating: Number(event.target.value) })
                }
                min={0}
                max={5}
                step={0.1}
              />
            </label>

            <label>
              Total reseñas
              <input
                type="number"
                value={form.total_resenas ?? 0}
                onChange={(event) =>
                  setForm({ ...form, total_resenas: Number(event.target.value) })
                }
                min={0}
              />
            </label>

            <label>
              Disponible hoy
              <select
                value={form.disponible_hoy ? "true" : "false"}
                onChange={(event) =>
                  setForm({ ...form, disponible_hoy: event.target.value === "true" })
                }
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={form.estado}
                onChange={(event) =>
                  setForm({ ...form, estado: event.target.value as CourtStatus })
                }
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="wide-field">
              Imagen principal
              <input
                type="text"
                value={form.imagen_principal ?? ""}
                onChange={(event) =>
                  setForm({ ...form, imagen_principal: event.target.value })
                }
                placeholder="URL de la imagen principal"
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? "Guardando..." : editingCourt ? "Actualizar" : "Crear"}
            </button>

            {editingCourt && (
              <button type="button" className="secondary-btn" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {error && <p className="error-message">{error}</p>}

      <section className="management-panel">
        <input
          type="search"
          placeholder="Buscar por nombre, tipo, ubicación, superficie o estado"
          className="global-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      <section className="users-grid">
        {filteredCourts.map((court) => (
          <CourtCard
            key={court.id_espacio}
            court={court}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </section>

      <section className="pagination-section">
        {!lastPage ? (
          <button className="load-more-btn" type="button" onClick={loadMore} disabled={loading}>
            {loading ? "Cargando..." : "Cargar más canchas"}
          </button>
        ) : (
          <p className="end-message">No hay más canchas para mostrar</p>
        )}
      </section>
    </>
  );
};