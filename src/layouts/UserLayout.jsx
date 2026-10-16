import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function UserLayout({ children }) {
  const navigate = useNavigate()

  const [notificacionesNoLeidas, setNotificacionesNoLeidas] =
    useState(0)

  const cargarNotificaciones = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setNotificacionesNoLeidas(0)
      return
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('leida', false)

    if (error) {
      console.error(
        'Error al cargar el contador de notificaciones:',
        error
      )
      return
    }

    setNotificacionesNoLeidas(data?.length || 0)
  }

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error al cerrar sesión:', error)
      return
    }

    navigate('/login')
  }

  return (
    <div className="user-layout">

      <header className="user-navbar">

        <div className="container user-navbar-content">

          <NavLink
            to="/usuario"
            className="user-navbar-logo"
          >
            <img
              src="/logo-ecocanje.png"
              alt="EcoCanje"
              className="user-navbar-logo-image"
            />
          </NavLink>

          <nav className="user-navbar-links">

            <NavLink
              to="/usuario"
              end
            >
              Inicio
            </NavLink>

            <NavLink to="/usuario/qr">
              Mi QR
            </NavLink>

            <NavLink to="/usuario/puntos">
              Mis puntos
            </NavLink>

            <NavLink to="/usuario/reciclajes">
              Reciclajes
            </NavLink>

            <NavLink to="/usuario/beneficios">
              Beneficios
            </NavLink>

            <NavLink to="/usuario/cupones">
              Mis cupones
            </NavLink>

            <NavLink to="/usuario/pedidos">
              Mis pedidos
            </NavLink>

            <NavLink
              to="/usuario/notificaciones"
              className="user-notifications-link"
            >
              <span>
                Notificaciones
              </span>

              {notificacionesNoLeidas > 0 && (
                <span className="user-notifications-badge">
                  {notificacionesNoLeidas}
                </span>
              )}
            </NavLink>

            <NavLink to="/usuario/tienda">
              EcoTienda
            </NavLink>

          </nav>

          <div className="user-navbar-account">

            <NavLink
              to="/usuario/perfil"
              className="user-profile-link"
            >
              Mi perfil
            </NavLink>

            <button
              type="button"
              className="user-logout"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </header>

      <main>
        {children}
      </main>

    </div>
  )
}

export default UserLayout