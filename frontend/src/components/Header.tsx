
import { useState, useRef, useEffect } from 'react';
import { Usuario } from '../types';

interface HeaderProps {
  usuario?: Usuario; 
}

export default function Header({ usuario }: HeaderProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('click', handleClickFuera);
    return () => document.removeEventListener('click', handleClickFuera);
  }, []);

  return (
    <header className="cf-header">
      {/* Logo */}
      <div className="logo-wrap">
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
      </div>

      {/* Navegación */}
      {usuario ? (
        /* ── Versión logueada ── */
        <div className="header-usuario" ref={menuRef}>
          {/* Foto de perfil */}
          <div className="perfil-circle" onClick={() => setMenuAbierto(!menuAbierto)}>
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
              <span className="perfil-iniciales">{usuario.iniciales}</span>
            )}
          </div>

          {/* Hamburguesa */}
          <button
            className={`hamburguesa${menuAbierto ? ' activo' : ''}`}
            aria-label="Abrir menú"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <span />
            <span />
            <span />
          </button>

          {/* Menú desplegable */}
          <div className={`menu-desplegable${menuAbierto ? ' abierto' : ''}`}>
            <div className="menu-usuario-info">
              <div className="menu-avatar">
                {usuario.avatarUrl ? (
                  <img src={usuario.avatarUrl} alt="Perfil"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).outerHTML = usuario.iniciales;
                    }}
                  />
                ) : usuario.iniciales}
              </div>
              <div>
                <p className="menu-nombre">{usuario.nombre}</p>
                <p className="menu-email">{usuario.email}</p>
              </div>
            </div>
            <hr className="menu-divider" />
            <a href="#" className="menu-item">Mi perfil</a>
            <a href="#" className="menu-item">Mis reservas</a>
            <a href="#" className="menu-item">Mis partidos</a>
            <a href="#" className="menu-item">Configuración</a>
            <hr className="menu-divider" />
            <a href="#" className="menu-item menu-salir"> Cerrar sesión</a>
          </div>
        </div>
      ) : (
        
        <nav className="cf-nav">
          <a href="#" className="btn-login">Iniciar sesión</a>
          <a href="#" className="btn-register">Registrarse</a>
        </nav>
      )}
    </header>
  );
}
