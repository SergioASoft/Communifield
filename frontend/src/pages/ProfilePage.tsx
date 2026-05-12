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
          padding: 32px 20px 90px;
        }

        .profile-container {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        .profile-logo {
          font-weight: 800;
          font-size: 22px;
          color: #ffffff;
          letter-spacing: -0.5px;
          margin-bottom: 32px;
          display: inline-block;
        }

        .profile-logo-dot {
          color: #b2d100;
        }

        .hero-content {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-fallback,
        .avatar-img {
          width: 108px;
          height: 108px;
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
          font-size: 34px;
          font-weight: 800;
        }

        .avatar-edit-btn {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 32px;
          height: 32px;
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
        }

        .user-name {
          font-size: clamp(26px, 5vw, 38px);
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 6px;
          line-height: 1.1;
        }

        .user-email {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 14px;
          word-break: break-word;
        }

        .tag-position {
          display: inline-flex;
          align-items: center;
          padding: 7px 14px;
          border-radius: 999px;
          background-color: #b2d100;
          color: #1a1a1a;
          font-size: 13px;
          font-weight: 700;
        }

        .profile-body {
          width: 100%;
          padding: 0 20px 40px;
          margin-top: -50px;
        }

        .card {
          width: 100%;
          max-width: 760px;
          margin: 0 auto 20px;
          background-color: #ffffff;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 800;
          color: #1a1a1a;
        }

        .edit-btn {
          font-size: 14px;
          color: #00ab00;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
        }

        .field {
          margin-bottom: 16px;
        }

        .field-label {
          font-size: 11px;
          color: #777777;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          display: block;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .field-value {
          font-size: 15px;
          color: #1a1a1a;
          line-height: 1.5;
          word-break: break-word;
        }

        .field-input,
        .field-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e0e0e0;
          border-radius: 12px;
          font-size: 15px;
          color: #1a1a1a;
          background-color: #fafafa;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .field-input:focus,
        .field-textarea:focus {
          border-color: #00ab00;
          box-shadow: 0 0 0 3px rgba(0, 171, 0, 0.12);
        }

        .field-textarea {
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }

        .field-divider {
          height: 1px;
          background-color: #eeeeee;
          margin: 16px 0;
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
          margin-top: 8px;
        }

        .logout-btn {
          width: 100%;
          max-width: 760px;
          display: block;
          margin: 0 auto;
          padding: 15px;
          background-color: #ffffff;
          color: #cc0000;
          border: 1.5px solid #ffcccc;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
        }

        @media (max-width: 600px) {
          .profile-hero {
            padding: 26px 16px 82px;
          }

          .profile-body {
            padding: 0 16px 32px;
          }

          .hero-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
          }

          .avatar-fallback,
          .avatar-img {
            width: 96px;
            height: 96px;
          }

          .avatar-initials {
            font-size: 30px;
          }

          .card {
            padding: 20px;
            border-radius: 18px;
          }

          .card-header {
            align-items: flex-start;
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
          <div className="card">
            <div className="card-header">
              <span className="card-title">👤 Información personal</span>
              <button className="edit-btn" onClick={() => setIsEditing(!isEditing)} type="button">
                {isEditing ? "Cancelar" : "Editar"}
              </button>
            </div>

            <div className="field">
              <label className="field-label">Nombre</label>
              {isEditing ? (
                <input className="field-input" defaultValue={user.name} placeholder="Tu nombre" />
              ) : (
                <p className="field-value">{user.name}</p>
              )}
            </div>

            <div className="field-divider" />

            <div className="field">
              <label className="field-label">Correo electrónico</label>
              <p className="field-value">{user.email}</p>
            </div>

            <div className="field-divider" />

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
              <label className="field-label">Posición</label>
              {isEditing ? (
                <input className="field-input" defaultValue={user.position} placeholder="Tu posición" />
              ) : (
                <p className="field-value">{user.position}</p>
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

            {isEditing && <button className="save-btn">Guardar cambios →</button>}
          </div>

          <button className="logout-btn" onClick={handleLogout} type="button">
            Cerrar sesión
          </button>
        </section>
      </main>
    </>
  );
};

export default ProfilePage;