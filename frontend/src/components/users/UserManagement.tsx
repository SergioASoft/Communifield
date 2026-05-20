import React, { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../../services/userService";
import type { User, UserFormPayload, UserType } from "../../services/userService";
import { UserCard } from "./UserCard";
import "./UserManagement.css";

const emptyForm: UserFormPayload = {
  name: "",
  email: "",
  phone: "",
  type: "player",
  password: "",
};

const userTypeOptions: UserType[] = ["player", "organizer", "admin"];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<UserFormPayload>(emptyForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Estado para controlar la visibilidad de la contraseña
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
      [user.name, user.email, user.phone ?? "", user.type].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [search, users]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUser(null);
    setError("");
    setShowPassword(false);
  };

  // Validaciones con las reglas solicitadas
  const validateColombiaPhone = (phone: string): boolean => {
    if (!phone) return true; 
    const cleanPhone = phone.trim();
    const phoneRegex = /^3\d{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  const validatePasswordStrength = (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // 1. Validar Teléfono utilizando el cartel de error común
    if (form.phone && !validateColombiaPhone(form.phone)) {
      setError("El teléfono debe ser un número celular válido de Colombia (10 dígitos y comenzar por 3).");
      return;
    }

    // 2. Validar Contraseña utilizando el cartel de error común
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
      type: form.type,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (editingUser) {
        const updatedUser = await updateUser(editingUser.user_id, payload);
        setUsers((prev) =>
          prev.map((user) => (user.user_id === updatedUser.user_id ? updatedUser : user))
        );
      } else {
        const createdUser = await createUser(payload as Required<UserFormPayload>);
        setUsers((prev) => [createdUser, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError("No se pudo guardar el usuario. Revisa email o teléfono duplicados.");
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
      type: user.type,
      password: "",
    });
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

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <h1>CommuniField</h1>
            <p>Admin Console</p>
          </div>

          <nav className="sidebar-menu" aria-label="Admin sections">
            <button type="button">Dashboard</button>
            <button type="button" className="active">
              User Management
            </button>
            <button type="button">Field Operations</button>
            <button type="button">Tournament Engine</button>
            <button type="button">System Settings</button>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <input
            type="search"
            placeholder="Buscar por nombre, email, teléfono o tipo"
            className="global-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="admin-profile">
            <div>
              <h4>Admin</h4>
              <p>Super Admin</p>
            </div>
            <div className="profile-avatar">A</div>
          </div>
        </header>

        <section className="page-header">
          <div>
            <h2>User Management</h2>
            <p>Administra usuarios, teléfonos y tipos según la tabla users de CommuniField.</p>
          </div>
        </section>

        <section className="management-panel">
          <form className="user-form" onSubmit={handleSubmit}>
            <h3>{editingUser ? "Editar usuario" : "Nuevo usuario"}</h3>

            <div className="form-grid">
              <label>
                Nombre
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  type="tel"
                  value={form.phone ?? ""}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="Ej: 3001234567"
                />
              </label>

              <label>
                Tipo
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value as UserType })}
                >
                  {userTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Contraseña
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password ?? ""}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder={editingUser ? "Dejar vacía para conservarla" : "Mín. 8 caracteres, Mayús, Núm y Símbolo"}
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? "O" : "X"}
                  </button>
                </div>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Guardando..." : editingUser ? "Actualizar" : "Crear"}
              </button>
              {editingUser && (
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Aquí se centralizan todos los errores con tu estructura original */}
        {error && <p className="error-message">{error}</p>}

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

        <section className="pagination-section">
          {!lastPage ? (
            <button className="load-more-btn" type="button" onClick={loadMore} disabled={loading}>
              {loading ? "Cargando..." : "Cargar más usuarios"}
            </button>
          ) : (
            <p className="end-message">No hay más usuarios para mostrar</p>
          )}
        </section>
      </main>
    </div>
  );
};