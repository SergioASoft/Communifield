import { useState } from "react";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);

  const user = {
    name: "Lissa Ramírez",
    email: "lissa@communifield.com",
    phone: "+57 300 123 4567",
    bio: "Jugadora apasionada del fútbol. Me encanta conocer nuevos equipos y canchas.",
    photo: null as string | null,
    initials: "LR",
    gamesPlayed: 24,
    friendsCount: 12,
    reservations: 8,
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .profile-page {
          min-height: 100vh;
          width: 100%;
          background-color: #f5f5f5;
          display: flex;
          justify-content: center;
        }
.profile-container {
  width: 100%;
  max-width: 100%;
  background-color: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10% 40px 10%;
 }

        @media (max-width: 480px) {
          .profile-container { max-width: 100%; }
          .profile-page { background-color: #ffffff; }
        }

        .profile-header {
          width: 100%;
          padding-top: 24px;
          padding-bottom: 8px;
        }

        .profile-logo {
          font-weight: 700;
          font-size: 20px;
          color: #1a1a1a;
          letter-spacing: -0.3px;
        }

        .profile-logo-dot { color: #b2d100; }

        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 24px;
          margin-bottom: 24px;
          width: 100%;
        }

        .avatar-wrapper {
          position: relative;
          margin-bottom: 12px;
        }

        .avatar-fallback {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background-color: #00ab00;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-initials {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
        }

        .avatar-img {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-color: #b2d100;
          border: 2px solid #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .user-name {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
          text-align: center;
        }

        .user-email {
          font-size: 14px;
          color: #888888;
          text-align: center;
        }

        .stats-row {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f9f9f9;
          border-radius: 16px;
          padding: 16px 24px;
          width: 100%;
          margin-bottom: 24px;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .stat-number {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .stat-label {
          font-size: 12px;
          color: #888888;
          margin-top: 2px;
        }

        .stat-divider {
          width: 1px;
          height: 32px;
          background-color: #e0e0e0;
        }

        .info-card {
          width: 100%;
          background-color: #ffffff;
          border-radius: 16px;
          border: 1px solid #eeeeee;
          padding: 20px;
          margin-bottom: 16px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .edit-btn {
          font-size: 14px;
          color: #00ab00;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .field { margin-bottom: 12px; }

        .field-label {
          font-size: 12px;
          color: #888888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 4px;
        }

        .field-value {
          font-size: 15px;
          color: #1a1a1a;
          line-height: 1.5;
        }

        .field-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          font-size: 15px;
          color: #1a1a1a;
          background-color: #fafafa;
          outline: none;
        }

        .field-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          font-size: 15px;
          color: #1a1a1a;
          background-color: #fafafa;
          outline: none;
          min-height: 80px;
          resize: vertical;
        }

        .field-divider {
          height: 1px;
          background-color: #f0f0f0;
          margin: 12px 0;
        }

        .save-btn {
          width: 100%;
          padding: 14px;
          background-color: #b2d100;
          color: #1a1a1a;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
        }

        .logout-btn {
          width: 100%;
          padding: 14px;
          background-color: transparent;
          color: #cc0000;
          border: 1px solid #ffcccc;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>

      <div className="profile-page">
        <div className="profile-container">

          <div className="profile-header">
            <span className="profile-logo">
              CommuniField <span className="profile-logo-dot">•</span>
            </span>
          </div>

          <div className="avatar-section">
            <div className="avatar-wrapper">
              {user.photo ? (
                <img src={user.photo} alt="Foto de perfil" className="avatar-img" />
              ) : (
                <div className="avatar-fallback">
                  <span className="avatar-initials">{user.initials}</span>
                </div>
              )}
              <button className="avatar-edit-btn" title="Cambiar foto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <h1 className="user-name">{user.name}</h1>
            <p className="user-email">{user.email}</p>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-number">{user.gamesPlayed}</span>
              <span className="stat-label">Partidos</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-number">{user.friendsCount}</span>
              <span className="stat-label">Amigos</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-number">{user.reservations}</span>
              <span className="stat-label">Reservas</span>
            </div>
          </div>

          <div className="info-card">
            <div className="card-header">
              <span className="card-title">Información personal</span>
              <button className="edit-btn" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancelar" : "Editar"}
              </button>
            </div>

            <div className="field">
              <label className="field-label">Teléfono</label>
              {isEditing ? (
                <input className="field-input" defaultValue={user.phone} placeholder="Tu número de teléfono" />
              ) : (
                <p className="field-value">{user.phone}</p>
              )}
            </div>

            <div className="field-divider" />

            <div className="field">
              <label className="field-label">Biografía</label>
              {isEditing ? (
                <textarea className="field-textarea" defaultValue={user.bio} placeholder="Cuéntanos sobre ti..." />
              ) : (
                <p className="field-value">{user.bio}</p>
              )}
            </div>

            {isEditing && (
              <button className="save-btn">Guardar cambios →</button>
            )}
          </div>

          <button className="logout-btn">Cerrar sesión</button>

        </div>
      </div>
    </>
  );
};

export default ProfilePage;