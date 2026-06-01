import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { resolvePhotoUrl, type PhotoFilePayload } from "../services/userService";
import "../styles/ProfilePage.css";

type UserProfile = {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  photo?: string | null;
  photoFile?: PhotoFilePayload | null;
  position?: string;
  role?: "gestor" | "player" | "admin";
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function cargarPerfil() {
      const token = localStorage.getItem("communifield_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await api.getMe();
        setUser(data);
        setForm(data);
        localStorage.setItem("communifield_user", JSON.stringify(data));
      } catch {
        const localUser = localStorage.getItem("communifield_user");

        if (localUser) {
          const parsed = JSON.parse(localUser);
          setUser(parsed);
          setForm(parsed);
        } else {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    cargarPerfil();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("communifield_token");
    localStorage.removeItem("communifield_user");
    navigate("/login");
  };

  const handleSave = async () => {
    if (!form) return;

    try {
      const updatedUser = await api.updateMe({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        photo: form.photo?.startsWith("data:") ? undefined : form.photo ?? undefined,
        photoFile: form.photoFile ?? null,
        position: form.position,
      });

      setUser(updatedUser);
      setForm(updatedUser);
      localStorage.setItem("communifield_user", JSON.stringify(updatedUser));
      setIsEditing(false);
    } catch {
      alert("No se pudieron guardar los cambios.");
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !form) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona un archivo de imagen.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert("La imagen no puede superar 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setForm({
        ...form,
        photo: dataUrl,
        photoFile: { name: file.name, type: file.type, dataUrl },
      });
    };
    reader.onerror = () => alert("No se pudo leer la imagen.");
    reader.readAsDataURL(file);
  };

  if (loading) return <p>Cargando perfil...</p>;
  if (!user || !form) return null;

  const initials = getInitials(user.name);
  const displayPhoto = resolvePhotoUrl(isEditing ? form.photo : user.photo);

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
                {displayPhoto ? (
                  <img src={displayPhoto} alt="Foto de perfil" className="avatar-img" />
                ) : (
                  <div className="avatar-fallback">
                    <span className="avatar-initials">{initials}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="hero-info">
              <div className="user-badge">
                {user.role === "gestor" ? "Gestor" : "Jugador"}
              </div>
              <h1 className="user-name">{user.name}</h1>
              <p className="user-email">{user.email}</p>
              <span className="tag-position">{user.position || "Sin posición"}</span>
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
                  <input
                    className="field-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
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
                  <input
                    className="field-input"
                    value={form.phone || ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                ) : (
                  <p className="field-value">{user.phone || "Sin teléfono"}</p>
                )}
              </div>

              <div className="field">
                <label className="field-label">Posición</label>
                {isEditing ? (
                  <input
                    className="field-input"
                    value={form.position || ""}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                  />
                ) : (
                  <p className="field-value">{user.position || "Sin posición"}</p>
                )}
              </div>

              <div className="field">
                <label className="field-label">Foto</label>
                {isEditing ? (
                  <input
                    className="field-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handlePhotoChange}
                  />
                ) : (
                  <p className="field-value">{displayPhoto ? "Foto cargada" : "Sin foto"}</p>
                )}
              </div>

              <div className="field field-full">
                <label className="field-label">Biografía</label>
                {isEditing ? (
                  <textarea
                    className="field-textarea"
                    value={form.bio || ""}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                ) : (
                  <p className="field-value">{user.bio || "Sin biografía"}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <button className="save-btn" type="button" onClick={handleSave}>
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
