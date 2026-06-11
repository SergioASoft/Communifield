import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LogOut } from "lucide-react";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../../services/userService";
import type { User, UserFormPayload, UserType } from "../../services/userService";
import { UserCard } from "./UserCard";
import { AdminAssistant } from "./AdminAssistant";
import { CourtManagement } from "./CourtManagement";
import { AdminDashboard } from "../dashboard/AdminDashboard";
import "./UserManagement.css";

const emptyForm: UserFormPayload = {
  name: "",
  email: "",
  phone: "",
  bio: "",
  photo: "",
  position: "",
  type: "player",
  password: "",
};

const userTypeOptions: UserType[] = ["player", "organizer", "admin"];

export const UserManagement: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "users" | "courts" | "assistant"
  >("dashboard");

  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<UserFormPayload>(emptyForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const formPanelRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async (currentPage: number, replace = false) => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers(currentPage, 8);

      setUsers((prev) => (replace ? data.content : [...prev, ...data.content]));
      setPage(data.page);
      setLastPage(data.last);
    } catch (err) {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0, true);
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.phone ?? "",
        user.bio ?? "",
        user.position ?? "",
        user.type,
      ].some((value) => value.toLowerCase().includes(term))
    );
  }, [search, users]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUser(null);
    setError("");
    setShowPassword(false);
  };

  const validateColombiaPhone = (phone: string): boolean => {
    if (!phone) return true;

    const cleanPhone = phone.trim();
    const phoneRegex = /^3\d{9}$/;

    return phoneRegex.test(cleanPhone);
  };

  const validatePasswordStrength = (password: string): boolean => {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    return passwordRegex.test(password);
  };

  const readImageFile = (file: File) =>
    new Promise<UserFormPayload["photoFile"]>((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Selecciona un archivo de imagen."));
        return;
      }

      if (file.size > 3 * 1024 * 1024) {
        reject(new Error("La imagen no puede superar 3MB."));
        return;
      }

      const reader = new FileReader();

      reader.onload = () =>
        resolve({
          name: file.name,
          type: file.type,
          dataUrl: String(reader.result),
        });

      reader.onerror = () => reject(new Error("No se pudo leer la imagen."));

      reader.readAsDataURL(file);
    });

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const photoFile = await readImageFile(file);

      setForm((prev) => ({
        ...prev,
        photoFile,
        photo: photoFile?.dataUrl ?? prev.photo,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la imagen."
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (form.phone && !validateColombiaPhone(form.phone)) {
      setError(
        "El teléfono debe ser un número celular válido de Colombia (10 dígitos y comenzar por 3)."
      );
      return;
    }

    if (!editingUser && !form.password) {
      setError("La contraseña es obligatoria para crear usuarios.");
      return;
    }

    if (form.password && !validatePasswordStrength(form.password)) {
      setError(
        "Contraseña insegura: Debe contener mínimo 8 caracteres, una mayúscula, un número y un símbolo especial."
      );
      return;
    }

    setSaving(true);

    const payload: UserFormPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || null,
      bio: form.bio?.trim() || null,
      photo: form.photo?.startsWith("data:")
        ? null
        : form.photo?.trim() || null,
      photoFile: form.photoFile ?? null,
      position: form.position?.trim() || null,
      type: form.type,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (editingUser) {
        const updatedUser = await updateUser(editingUser.user_id, payload);

        setUsers((prev) =>
          prev.map((user) =>
            user.user_id === updatedUser.user_id ? updatedUser : user
          )
        );
      } else {
        const createdUser = await createUser(payload);
        setUsers((prev) => [createdUser, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError(
        "No se pudo guardar el usuario. Revisa si el email ya esta registrado."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setError("");
    setShowPassword(false);

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      bio: user.bio ?? "",
      photo: user.photo ?? "",
      position: user.position ?? "",
      type: user.type,
      password: "",
    });

    window.setTimeout(() => {
      formPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      firstInputRef.current?.focus();
    }, 0);
  };

  const handleDelete = async (userId: number) => {
    const shouldDelete = window.confirm("¿Deseas eliminar este usuario?");

    if (!shouldDelete) {
      return;
    }

    try {
      setError("");
      await deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
    } catch (err) {
      setError("No se pudo eliminar el usuario.");
    }
  };

  const loadMore = () => {
    if (!loading && !lastPage) {
      fetchUsers(page + 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("communifield_user");
    localStorage.removeItem("token");
    localStorage.removeItem("communifield_token");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <h1>CommuniField</h1>
            <p>Admin Console</p>
          </div>

          <nav className="sidebar-menu" aria-label="Admin sections">
            <button
              type="button"
              className={activeSection === "dashboard" ? "active" : ""}
              onClick={() => setActiveSection("dashboard")}
            >
              Dashboard
            </button>

            <button
              type="button"
              className={activeSection === "users" ? "active" : ""}
              onClick={() => setActiveSection("users")}
            >
              Gestión de Usuarios
            </button>

            <button
              type="button"
              className={activeSection === "courts" ? "active" : ""}
              onClick={() => setActiveSection("courts")}
            >
              Gestión de Canchas
            </button>

            <button
              type="button"
              className={activeSection === "assistant" ? "active" : ""}
              onClick={() => setActiveSection("assistant")}
            >
              Asistente IA
            </button>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          {activeSection === "users" ? (
            <input
              type="search"
              placeholder="Buscar por nombre, email, teléfono o tipo"
              className="global-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          ) : activeSection === "courts" ? (
            <div className="topbar-title">Gestión de Canchas</div>
          ) : activeSection === "dashboard" ? (
            <div className="topbar-title">Dashboard administrativo</div>
          ) : (
            <div className="topbar-title">Asistente IA</div>
          )}

          <div className="admin-profile">
            <div>
              <h4>Admin</h4>
              <p>Super Admin</p>
            </div>

            <div className="profile-avatar">A</div>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} strokeWidth={2.4} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        {activeSection === "dashboard" ? (
          <AdminDashboard />
        ) : activeSection === "users" ? (
          <>
            <section className="page-header">
              <div>
                <h2>Gestión de Usuarios</h2>
                <p>
                  Administra usuarios, perfil y tipos segun la tabla USUARIO de
                  CommuniField.
                </p>
              </div>
            </section>

            <section className="management-panel" ref={formPanelRef}>
              <form className="user-form" onSubmit={handleSubmit}>
                <h3>{editingUser ? "Editar usuario" : "Nuevo usuario"}</h3>

                <div className="form-grid">
                  <label>
                    Nombre
                    <input
                      ref={firstInputRef}
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      required
                    />
                  </label>

                  <label>
                    Teléfono
                    <input
                      type="tel"
                      value={form.phone ?? ""}
                      onChange={(event) =>
                        setForm({ ...form, phone: event.target.value })
                      }
                      placeholder="Ej: 3001234567"
                    />
                  </label>

                  <label>
                    Tipo
                    <select
                      value={form.type}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          type: event.target.value as UserType,
                        })
                      }
                    >
                      {userTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Posicion
                    <input
                      type="text"
                      value={form.position ?? ""}
                      onChange={(event) =>
                        setForm({ ...form, position: event.target.value })
                      }
                      placeholder="Ej: Delantero"
                    />
                  </label>

                  <label>
                    Foto
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handlePhotoChange}
                    />
                  </label>

                  <label className="wide-field">
                    Biografia
                    <textarea
                      value={form.bio ?? ""}
                      onChange={(event) =>
                        setForm({ ...form, bio: event.target.value })
                      }
                      placeholder="Perfil breve del usuario"
                      rows={3}
                    />
                  </label>

                  <label>
                    Contraseña
                    <div className="password-input-container">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password ?? ""}
                        onChange={(event) =>
                          setForm({ ...form, password: event.target.value })
                        }
                        placeholder={
                          editingUser
                            ? "Dejar vacía para conservarla"
                            : "Mín. 8 caracteres, Mayús, Núm y Símbolo"
                        }
                        required={!editingUser}
                      />

                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? "O" : "X"}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary-btn" disabled={saving}>
                    {saving
                      ? "Guardando..."
                      : editingUser
                      ? "Actualizar"
                      : "Crear"}
                  </button>

                  {editingUser && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={resetForm}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </section>

            {error && <p className="error-message">{error}</p>}
{filteredUsers.length === 0 ? (
  <p className="end-message">
    No se encontraron usuarios con esa búsqueda.
  </p>
) : (
  <section className="users-grid">
    {filteredUsers.map((user) => (
      <UserCard
        key={user.user_id}
        user={user}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ))}
  </section>
)}
        

            <section className="pagination-section">
              {!lastPage ? (
                <button
                  className="load-more-btn"
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Cargando..." : "Cargar más usuarios"}
                </button>
              ) : (
                <p className="end-message">No hay más usuarios para mostrar</p>
              )}
            </section>
          </>
        ) : activeSection === "courts" ? (
          <CourtManagement />
        ) : (
          <>
            <section className="page-header">
              <div>
                <h2>Asistente IA</h2>
                <p>
                  Conversa con el agente administrativo conectado a herramientas
                  MCP de CommuniField.
                </p>
              </div>
            </section>

            <AdminAssistant />
          </>
        )}
      </main>
    </div>
  );
};
