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
    level: "Amateur",
    gamesPlayed: 24,
    friendsCount: 12,
    reservations: 8,
    winRate: 67,
  };

  const badges = [
    { icon: "⚽", label: "Goleadora" },
    { icon: "🏆", label: "Campeona" },
    { icon: "🤝", label: "Compañera" },
    { icon: "🔥", label: "Racha x5" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

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
          padding: 40px 5% 80px 5%;
          position: relative;
        }

        .profile-logo {
          font-weight: 700;
          font-size: 20px;
          color: #ffffff;
          letter-spacing: -0.3px;
          margin-bottom: 32px;
          display: block;
        }

        .profile-logo-dot { color: #b2d100; }

        .hero-content {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-fallback {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #b2d100;
        }

        .avatar-initials {
          color: #00ab00;
          font-size: 32px;
          font-weight: 700;
        }

        .avatar-img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #b2d100;
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: #b2d100;
          border: 2px solid #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .hero-info { flex: 1; min-width: 200px; }

        .user-name {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          margin-bottom: 10px;
        }

        .user-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tag {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .tag-position {
          background-color: #b2d100;
          color: #1a1a1a;
        }

        .tag-level {
          background-color: rgba(255,255,255,0.2);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.4);
        }

        .profile-body {
          width: 100%;
          padding: 0 5% 40px 5%;
          margin-top: -40px;
          position: relative;
        }

        .stats-row {
          display: flex;
          background-color: #ffffff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #00ab00;
        }

        .stat-label {
          font-size: 12px;
          color: #888888;
          margin-top: 2px;
          text-align: center;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background-color: #eeeeee;
          align-self: center;
        }

        .card {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 700;
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

        .win-rate-bar {
          width: 100%;
          height: 8px;
          background-color: #f0f0f0;
          border-radius: 4px;
          margin-top: 8px;
          overflow: hidden;
        }

        .win-rate-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ab00, #b2d100);
          border-radius: 4px;
          width: ${user.winRate}%;
        }

        .win-rate-label {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #888888;
          margin-top: 4px;
        }

        .badges-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .badge-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background-color: #f9f9f9;
          border-radius: 12px;
          padding: 12px 16px;
          flex: 1;
          min-width: 70px;
        }

        .badge-icon { font-size: 24px; }

        .badge-label {
          font-size: 11px;
          color: #555555;
          font-weight: 600;
          text-align: center;
        }

        .field { margin-bottom: 14px; }

        .field-label {
          font-size: 11px;
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
          border: 1.5px solid #e0e0e0;
          border-radius: 10px;
          font-size: 15px;
          color: #1a1a1a;
          background-color: #fafafa;
          outline: none;
          transition: border-color 0.2s;
        }

        .field-input:focus { border-color: #00ab00; }

        .field-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 10px;
          font-size: 15px;
          color: #1a1a1a;
          background-color: #fafafa;
          outline: none;
          min-height: 80px;
          resize: vertical;
          transition: border-color 0.2s;
        }

        .field-textarea:focus { border-color: #00ab00; }

        .field-divider {
          height: 1px;
          background-color: #f0f0f0;
          margin: 12px 0;
        }

        .save-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #00ab00, #65c25d);
          color: #ffffff;
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
          border: 1.5px solid #ffcccc;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 600px) {
          .profile-hero { padding: 24px 16px 70px 16px; }
          .profile-body { padding: 0 16px 40px 16px; }
          .hero-content { flex-direction: column; align-items: flex-start; }
          .stat-number { font-size: 18px; }
        }
      `}</style>

      <div className="profile-page">

        <div className="profile-hero">
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
              <button className="avatar-edit-btn" title="Cambiar foto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <div className="hero-info">
              <h1 className="user-name">{user.name}</h1>
              <p className="user-email">{user.email}</p>
              <div className="user-tags">
                <span className="tag tag-position">⚽ {user.position}</span>
                <span className="tag tag-level">🏅 {user.level}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-body">

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
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-number">{user.winRate}%</span>
              <span className="stat-label">Victorias</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">🏆 Rendimiento</span>
            </div>
            <div style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}>
              Tasa de victorias
            </div>
            <div className="win-rate-bar">
              <div className="win-rate-fill" />
            </div>
            <div className="win-rate-label">
              <span>0%</span>
              <span style={{ color: "#00ab00", fontWeight: 600 }}>{user.winRate}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">🎖️ Logros</span>
            </div>
            <div className="badges-grid">
              {badges.map((b, i) => (
                <div className="badge-item" key={i}>
                  <span className="badge-icon">{b.icon}</span>
                  <span className="badge-label">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">👤 Información personal</span>
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

            {isEditing && (
              <button className="save-btn">Guardar cambios →</button>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>

        </div>
      </div>
    </>
  );
};

export default ProfilePage;