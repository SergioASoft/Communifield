import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body, #root {
          width: 100%;
          min-height: 100%;
        }

        body {
          background-color: #f5f5f5;
          font-family: system-ui, sans-serif;
        }

        .profile-page {
          width: 100%;
          min-height: 100vh;
          background-color: #f5f5f5;
        }

        .profile-hero {
          width: 100%;
          background: linear-gradient(135deg, #00ab00, #65c25d);
          padding: clamp(24px, 4vw, 48px) clamp(16px, 5vw, 80px) 110px;
        }

        .profile-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-logo {
          display: inline-block;
          color: #ffffff;
          font-size: clamp(20px, 2vw, 28px);
          font-weight: 800;
          margin-bottom: clamp(24px, 4vw, 44px);
        }

        .profile-logo-dot {
          color: #b2d100;
        }

        .hero-content {
          width: 100%;
          display: flex;
          align-items: center;
          gap: clamp(20px, 4vw, 40px);
        }

        .avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-fallback,
        .avatar-img {
          width: clamp(96px, 12vw, 150px);
          height: clamp(96px, 12vw, 150px);
          border-radius: 50%;
          border: 4px solid #b2d100;
        }

        .avatar-fallback {
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-img {
          object-fit: cover;
        }

        .avatar-initials {
          color: #00ab00;
          font-size: clamp(30px, 5vw, 52px);
          font-weight: 800;
        }

        .avatar-edit-btn {
          position: absolute;
          right: 6px;
          bottom: 6px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #b2d100;
          border: 2px solid #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-info {
          min-width: 0;
          flex: 1;
        }

        .user-name {
          color: #ffffff;
          font-size: clamp(28px, 5vw, 52px);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 8px;
          word-break: break-word;
        }

        .user-email {
          color: rgba(255,255,255,0.86);
          font-size: clamp(14px, 1.6vw, 18px);
          margin-bottom: 16px;
          word-break: break-word;
        }

        .tag-position {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 999px;
          background-color: #b2d100;
          color: #1a1a1a;
          font-size: clamp(13px, 1.4vw, 15px);
          font-weight: 800;
        }

        .profile-body {
          width: 100%;
          padding: 0 clamp(16px, 5vw, 80px) 48px;
          margin-top: -60px;
        }

        .profile-content {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 20px;
        }

        .card {
          width: 100%;
          background-color: #ffffff;
          border-radius: 24px;
          padding: clamp(20px, 4vw, 36px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .card-title {
          font-size: clamp(18px, 2vw, 24px);
          font-weight: 800;
          color: #1a1a1a;
        }

        .edit-btn {
          font-size: 15px;
          color: #00ab00;
          font-weight: 800;
          background: none;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .fields-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .field {
          width: 100%;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        .field-label {
          font-size: 12px;
          color: #777777;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          display: block;
          margin-bottom: 8px;
          font-weight: 800;
        }

        .field-value {
          font-size: 16px;
          color: #1a1a1a;
          line-height: 1.5;
          word-break: break-word;
        }

        .field-input,
        .field-textarea {
          width: 100%;
          padding: 13px 14px;
          border: 1.5px solid #e0e0e0;
          border-radius: 14px;
          font-size: 15px;
          color: #1a1a1a;
          background-color: #fafafa;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }

        .field-input:focus,
        .field-textarea:focus {
          border-color: #00ab00;
          box-shadow: 0 0 0 3px rgba(0,171,0,0.12);
        }

        .field-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .save-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #b2d100, #65c25d);
          color: #1a1a1a;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          margin-top: 24px;
        }

        .logout-btn {
          width: 100%;
          padding: 15px;
          background-color: #ffffff;
          color: #cc0000;
          border: 1.5px solid #ffcccc;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0,0,0,0.04);
        }

        @media (min-width: 1000px) {
          .profile-content {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 768px) {
          .profile-hero {
            padding: 24px 18px 92px;
          }

          .hero-content {
            align-items: flex-start;
          }

          .fields-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .hero-content {
            flex-direction: column;
          }

          .card-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .edit-btn {
            align-self: flex-start;
          }

          .profile-body {
            margin-top: -52px;
            padding-bottom: 32px;
          }

          .card {
            border-radius: 20px;
          }
        }
      `}</style>

      <main className="profile-page">
        <section className="profile-hero">
          <div className="profile-container">
            <span className="profile-logo">
              CommuniField <span className="profile-logo-dot">•</span>
            </span>

            <div className="hero-content">
              <div className="avatar-wrapper">
                {user.photo ? (
                  <img src={user.photo} alt="Foto de perfil" className="avatar-img" />
                ) : (
                  <div className="avatar-fallback">
                    <span className="avatar-initials">{user.initials}</span>
                  </div>
                )}

                <button className="avatar-edit-btn" title="Cambiar foto" type="button">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>

              <div className="hero-info">
                <h1 className="user-name">{user.name}</h1>
                <p className="user-email">{user.email}</p>
                <span className="tag-position">⚽ {user.position}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-body">
          <div className="profile-content">
            <div className="card">
              <div className="card-header">
                <span className="card-title">👤 Información personal</span>
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

              {isEditing && <button className="save-btn">Guardar cambios →</button>}
            </div>

            <button className="logout-btn" onClick={handleLogout} type="button">
              Cerrar sesión
            </button>
          </div>
        </section>
      </main>
    </>
  );
};

export default ProfilePage;