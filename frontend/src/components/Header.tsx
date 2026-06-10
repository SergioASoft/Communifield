import { useState, useRef, useEffect } from "react";
import { Usuario } from "../types";

interface HeaderProps {
  usuario?: Usuario;
}

interface FriendUser {
  id_usuario: number;
  nombre: string;
  email: string;
  foto?: string | null;
  Tipo?: string;
  id_amistad?: number | null;
  estado?: "pendiente" | "aceptada" | "rechazada" | "bloqueada" | null;
  id_dueño?: number | null;
  id_amigo?: number | null;
}

interface FriendRequest extends FriendUser {
  id_amistad: number;
}

function getUserId(usuario: Usuario): number | null {
  const user: any = usuario;

  if (user.id_usuario) return Number(user.id_usuario);
  if (user.user_id) return Number(user.user_id);
  if (user.id) return Number(user.id);

  try {
    const raw = localStorage.getItem("communifield_user");
    if (!raw) return null;

    const storedUser = JSON.parse(raw);

    return (
      Number(storedUser.id_usuario) ||
      Number(storedUser.user_id) ||
      Number(storedUser.id) ||
      null
    );
  } catch {
    return null;
  }
}

function FriendsPanel({
  usuario,
  onClose,
}: {
  usuario: Usuario;
  onClose: () => void;
}) {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [results, setResults] = useState<FriendUser[]>([]);
  const [search, setSearch] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendToDelete, setFriendToDelete] =
  useState<FriendUser | null>(null);

  const userId = getUserId(usuario);

  function loadFriends() {
    if (!userId) return;

    setLoadingFriends(true);

    fetch(`/api/friends/${userId}`)
      .then((res) => res.json())
      .then(setFriends)
      .catch(console.error)
      .finally(() => setLoadingFriends(false));
  }

  function loadRequests() {
    if (!userId) return;

    fetch(`/api/friends/requests/${userId}`)
      .then((res) => res.json())
      .then(setRequests)
      .catch(console.error);
  }

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, [userId]);

  useEffect(() => {
    if (!search.trim() || !userId) {
      setResults([]);
      return;
    }

    fetch(
      `/api/friends/search/${userId}?q=${encodeURIComponent(search)}`
    )
      .then((res) => res.json())
      .then(setResults)
      .catch(console.error);
  }, [search, userId]);

  function addFriend(friendId: number) {
  if (!userId) return;

  fetch("/api/friends", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, friendId }),
  })
    .then(() => {
      if (search.trim()) {
        return fetch(
          `/api/friends/search/${userId}?q=${encodeURIComponent(search)}`
        );
      }

      return null;
    })
    .then((res) => (res ? res.json() : []))
    .then(setResults)
    .catch(console.error);
}

  function acceptRequest(requestId: number) {
    if (!userId) return;

    fetch(`/api/friends/requests/${requestId}/accept`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    })
      .then(() => {
        loadRequests();
        loadFriends();
      })
      .catch(console.error);
  }

  function rejectRequest(requestId: number) {
    if (!userId) return;

    fetch(`/api/friends/requests/${requestId}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    })
      .then(() => {
        loadRequests();
      })
      .catch(console.error);
  }
  function cancelRequest(requestId: number) {
  if (!userId) return;

  fetch(`/api/friends/requests/${requestId}/cancel`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
    .then(() => {
      if (search.trim()) {
        return fetch(
          `/api/friends/search/${userId}?q=${encodeURIComponent(search)}`
        );
      }

      return null;
    })
    .then((res) => (res ? res.json() : []))
    .then(setResults)
    .catch(console.error);
}
function deleteFriend() {
  if (!userId || !friendToDelete?.id_amistad) return;

  fetch(`/api/friends/${friendToDelete.id_amistad}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
    .then(() => {
      setFriendToDelete(null);
      loadFriends();
    })
    .catch(console.error);
}
  return (
    <>
      <div className="friends-panel-overlay" onClick={onClose} />

      <aside className="friends-panel">
        <div className="friends-header">
          <div>
            <h2 className="friends-title">Mis amigos</h2>
            <p className="friends-subtitle">
              Busca usuarios, envía solicitudes y acepta amigos.
            </p>
          </div>

          <button
            type="button"
            className="friends-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="friends-search">
          <input
            type="text"
            placeholder="Buscar usuarios por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search.trim() && (
          <section className="friends-results">
            <h3 className="friends-section-title">Resultados</h3>

            {results.length === 0 ? (
              <p className="friends-empty">
                No se encontraron usuarios.
              </p>
            ) : (
             results.map((user) => (
  <div key={user.id_usuario} className="friend-row">
    <div className="friend-avatar">
      {user.foto ? (
        <img src={user.foto} alt={user.nombre} />
      ) : (
        user.nombre?.charAt(0).toUpperCase()
      )}
    </div>

    <div className="friend-info">
      <p className="friend-name">{user.nombre}</p>
      <p className="friend-email">{user.email}</p>
    </div>

    {user.estado === "pendiente" &&
    Number(user.id_dueño) === Number(userId) ? (
      <button
        type="button"
        className="friend-cancel"
        onClick={() =>
          cancelRequest(Number(user.id_amistad))
        }
      >
        Cancelar
      </button>
    ) : user.estado === "pendiente" ? (
      <span className="friend-pending">
        Pendiente
      </span>
    ) : (
      <button
        type="button"
        className="friend-add"
        onClick={() => addFriend(user.id_usuario)}
      >
        +
      </button>
    )}
  </div>
))
            )}
          </section>
        )}

        <section className="friends-requests">
          <h3 className="friends-section-title">
            Solicitudes de amistad
          </h3>

          {requests.length === 0 ? (
            <p className="friends-empty">
              No tienes solicitudes pendientes.
            </p>
          ) : (
            requests.map((request) => (
              <div key={request.id_amistad} className="friend-row">
                <div className="friend-avatar">
                  {request.foto ? (
                    <img src={request.foto} alt={request.nombre} />
                  ) : (
                    request.nombre?.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="friend-info">
                  <p className="friend-name">{request.nombre}</p>
                  <p className="friend-email">{request.email}</p>
                </div>

                <div className="friend-request-actions">
                  <button
                    type="button"
                    className="friend-accept"
                    onClick={() =>
                      acceptRequest(request.id_amistad)
                    }
                    title="Aceptar"
                  >
                    ✓
                  </button>

                  <button
                    type="button"
                    className="friend-reject"
                    onClick={() =>
                      rejectRequest(request.id_amistad)
                    }
                    title="Rechazar"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="friends-list">
          <h3 className="friends-section-title">
            Amigos agregados
          </h3>

          {loadingFriends ? (
            <p className="friends-empty">Cargando amigos...</p>
          ) : friends.length === 0 ? (
            <p className="friends-empty">
              No tienes amigos agregados.
            </p>
          ) : (
            friends.map((friend) => (
              <div key={friend.id_usuario} className="friend-row">
                <div className="friend-avatar">
                  {friend.foto ? (
                    <img src={friend.foto} alt={friend.nombre} />
                  ) : (
                    friend.nombre?.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="friend-info">
                  <p className="friend-name">{friend.nombre}</p>
                  <p className="friend-email">{friend.email}</p>
                </div>
                <button
                type="button"
                className="friend-delete"
                onClick={() => setFriendToDelete(friend)}
                >
                  Eliminar
                  </button>
              </div>
            ))
          )}
        </section>
        {friendToDelete && (
  <div className="friend-modal-overlay">
    <div className="friend-modal">
      <h3>Eliminar amigo</h3>

      <p>
        ¿Seguro que deseas eliminar a{" "}
        <strong>{friendToDelete.nombre}</strong>?
      </p>

      <div className="friend-modal-actions">
        <button
          type="button"
          className="friend-modal-cancel"
          onClick={() => setFriendToDelete(null)}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="friend-modal-delete"
          onClick={deleteFriend}
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
)}
      </aside>
    </>
  );
}

export default function Header({ usuario }: HeaderProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [amigosAbierto, setAmigosAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenuAbierto(false);
      }
    };

    document.addEventListener("click", handleClickFuera);

    return () =>
      document.removeEventListener("click", handleClickFuera);
  }, []);

  return (
    <>
      <header className="cf-header">
        <a className="logo-wrap" href="/">
          <div className="logo-circle">
            <img
              src="/img/logo-color.jpeg"
              alt="CommuniField Logo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).outerHTML =
                  '<span class="logo-fallback">⚽</span>';
              }}
            />
          </div>

          <span className="brand-name">COMMUNIFIELD</span>
        </a>

        {usuario ? (
          <div className="header-usuario" ref={menuRef}>
            <div
              className="perfil-circle"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {usuario.avatarUrl ? (
                <img
                  src={usuario.avatarUrl}
                  alt="Foto de perfil"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).outerHTML =
                      `<span class="perfil-iniciales">${usuario.iniciales}</span>`;
                  }}
                />
              ) : (
                <span className="perfil-iniciales">
                  {usuario.iniciales}
                </span>
              )}
            </div>

            <button
              className={`hamburguesa${menuAbierto ? " activo" : ""}`}
              aria-label="Abrir menú"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              <span />
              <span />
              <span />
            </button>

            <div
              className={`menu-desplegable${
                menuAbierto ? " abierto" : ""
              }`}
            >
              <div className="menu-usuario-info">
                <div className="menu-avatar">
                  {usuario.avatarUrl ? (
                    <img
                      src={usuario.avatarUrl}
                      alt="Perfil"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).outerHTML =
                          usuario.iniciales;
                      }}
                    />
                  ) : (
                    usuario.iniciales
                  )}
                </div>

                <div>
                  <p className="menu-nombre">{usuario.nombre}</p>
                  <p className="menu-email">{usuario.email}</p>
                </div>
              </div>

              <hr className="menu-divider" />

              <a href="/perfil" className="menu-item">
                Mi perfil
              </a>

              {(() => {
  const raw = localStorage.getItem("communifield_user");
  const user = raw ? JSON.parse(raw) : null;
  const tipoUsuario = user?.type || user?.Tipo;

  return tipoUsuario === "organizer" ? (
    <a href="/gestor/mis-canchas" className="menu-item">
      Gestión de mis canchas
    </a>
  ) : (
    <a href="#" className="menu-item">
      Mis reservas
    </a>
  );
})()}

              <button
                type="button"
                className="menu-item menu-item-button"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuAbierto(false);
                  setAmigosAbierto(true);
                }}
              >
                Mis amigos
              </button>

              <a href="#" className="menu-item">
                Configuración
              </a>

              <hr className="menu-divider" />

              <a
                href="/login"
                className="menu-item menu-salir"
                onClick={(e) => {
                  e.preventDefault();

                  localStorage.removeItem("communifield_user");
                  localStorage.removeItem("token");
                  localStorage.removeItem("communifield_token");

                  window.location.href = "/login";
                }}
              >
                Cerrar sesión
              </a>
            </div>
          </div>
        ) : (
          <nav className="cf-nav">
            <a href="/login" className="btn-login">
              Iniciar sesión
            </a>
          </nav>
        )}
      </header>

      {usuario && amigosAbierto && (
        <FriendsPanel
          usuario={usuario}
          onClose={() => setAmigosAbierto(false)}
        />
      )}
    </>
    
  );
  
}