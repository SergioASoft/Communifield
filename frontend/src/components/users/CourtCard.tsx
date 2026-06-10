import React from "react";
import type { Court } from "../../services/courtService";
import "./UserManagement.css";

interface Props {
  court: Court;
  onEdit: (court: Court) => void;
  onDelete: (courtId: number) => void;
}

export const CourtCard: React.FC<Props> = ({ court, onEdit, onDelete }) => {
  return (
    <article className="user-card">
      <div className={`role-badge ${court.estado === "activo" ? "player" : "admin"}`}>
        {court.estado}
      </div>

      <div className="user-image">
        {court.imagen_principal ? (
          <img src={court.imagen_principal} alt={court.nombre} />
        ) : (
          "⚽"
        )}
      </div>

      <h3>{court.nombre}</h3>

      <p className="user-email">{court.tipo}</p>
      <p className="user-phone">{court.ubicacion}</p>
      <p className="user-position">{court.superficie ?? "Sin superficie"}</p>

      <p className="user-bio">
        ${court.precio_hora} / hora · ⭐ {court.rating ?? 0} ·{" "}
        {court.disponible_hoy ? "Disponible hoy" : "No disponible hoy"}
      </p>

      <div className="card-divider" />

      <div className="card-actions" aria-label={`Acciones para ${court.nombre}`}>
        <button type="button" onClick={() => onEdit(court)} title="Editar cancha">
          Editar
        </button>

        <button
          type="button"
          className="delete-btn"
          onClick={() => onDelete(court.id_espacio)}
          title="Eliminar cancha"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
};