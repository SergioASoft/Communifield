import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const user = {
    name: "Lissa Ramírez",
    email: "lissa@communifield.com",
    phone: "+57 300 123 4567",
    bio: "Jugadora apasionada del fútbol. Me encanta conocer nuevos equipos y canchas.",
    photo: null as string | null,
    initials: "LR",
    position: "Delantera",
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-container">
          <span className="profile-logo">
            CommuniField <span className="profile-logo-dot">•</span>
          </span>

          <div className="hero-content">
            <div className="avatar-wrapper">
              <div className="avatar-ring">
                {user.photo ? (
                  <img src={user.photo} alt="Foto de perfil" className="avatar-img" />
                ) : (
                  <div className="avatar-fallback">
                    <span className="avatar-initials">{user.initials}</span>
                  </div>
                )}
              </div>

              <button className="avatar-edit-btn" title="Cambiar foto" type="button">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>

            <div className="hero-info">
              <div className="user-badge">Jugadora</div>
              <h1 className="user-name">{user.name}</h1>
              <p className="user-email">{user.email}</p>
              <span className="tag-position">{user.position}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-body">
        <div className="profile-content">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Información personal</span>
              <button className="edit-btn" onClick={() => setIsEditing(!isEditing)} type="button">
                {isEditing ? "Cancelar" : "Editar"}
              </button>
            </div>

            <div className="fields-grid">
              <div className="field">
                <label className="field-label">Nombre</label>
                {isEditing ? (
                  <input className="field-input" defaultValue={user.name} placeholder="Tu nombre" />
                ) : (
                  <p className="field-value">{user.name}</p>
                )}
              </div>

              <div className="field">
                <label className="field-label">Correo electrónico</label>
                <p className="field-value">{user.email}</p>
              </div>

              <div className="field">
                <label className="field-label">Teléfono</label>
                {isEditing ? (
                  <input className="field-input" defaultValue={user.phone} placeholder="Tu número de teléfono" />
                ) : (
                  <p className="field-value">{user.phone}</p>
                )}
              </div>

              <div className="field">
                <label className="field-label">Posición</label>
                {isEditing ? (
                  <input className="field-input" defaultValue={user.position} placeholder="Tu posición" />
                ) : (
                  <p className="field-value">{user.position}</p>
                )}
              </div>

              <div className="field field-full">
                <label className="field-label">Biografía</label>
                {isEditing ? (
                  <textarea className="field-textarea" defaultValue={user.bio} placeholder="Cuéntanos sobre ti..." />
                ) : (
                  <p className="field-value">{user.bio}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <button className="save-btn" type="button">
                Guardar cambios
              </button>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout} type="button">
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
};

export default ProfilePage;