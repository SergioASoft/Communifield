import React from "react";
import { resolvePhotoUrl, type User } from "../../services/userService";
import "./UserManagement.css";

interface Props {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

const typeLabel: Record<User["type"], string> = {
  organizer: "Organizador",
  player: "Jugador",
  admin: "Admin",
};

export const UserCard: React.FC<Props> = ({ user, onEdit, onDelete }) => {
  const initial = user.name.trim().charAt(0).toUpperCase() || "U";
  const photoUrl = resolvePhotoUrl(user.photo);

  return (
    <article className="user-card">
      <div className={`role-badge ${user.type}`}>{typeLabel[user.type]}</div>

      <div className="user-image">
        {photoUrl ? <img src={photoUrl} alt={user.name} /> : initial}
      </div>

      <h3>{user.name}</h3>

      <p className="user-email">{user.email}</p>
      <p className="user-phone">{user.phone ?? "Sin telefono"}</p>
      <p className="user-position">{user.position ?? "Sin posicion"}</p>
      {user.bio && <p className="user-bio">{user.bio}</p>}

      <div className="card-divider" />

      <div className="card-actions" aria-label={`Acciones para ${user.name}`}>
        <button type="button" onClick={() => onEdit(user)} title="Editar usuario">
          Editar
        </button>
        <button
          type="button"
          className="delete-btn"
          onClick={() => onDelete(user.user_id)}
          title="Eliminar usuario"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
};
