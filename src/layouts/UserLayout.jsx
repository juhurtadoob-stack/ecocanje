import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function UserLayout({ children }) {
  const navigate = useNavigate()

  const [notificacionesNoLeidas, setNotificacionesNoLeidas] =
    useState(0)

  const [mostrarMenuReciclajes, setMostrarMenuReciclajes] =
    useState(false)

  const dropdownRef = useRef(null)

  /*
    =========================================================
    CARGAR NOTIFICACIONES
    =========================================================
  */

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

  /*
    =========================================================
    EFECTO INICIAL
    =========================================================
  */

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  /*
    =========================================================
    CERRAR DROPDOWN AL HACER CLIC FUERA
    =========================================================
  */

  useEffect(() => {
    const manejarClickFuera = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setMostrarMenuReciclajes(false)
      }
    }

    document.addEventListener(
      'mousedown',
      manejarClickFuera
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        manejarClickFuera
      )
    }
  }, [])

  /*
    =========================================================
    CERRAR SESIÓN
    =========================================================
  */

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(
        'Error al cerrar sesión:',
        error
      )
      return
    }

    navigate('/login')
  }

  /*
    =========================================================
    ABRIR / CERRAR MENÚ DE RECICLAJES
    =========================================================
  */

  const alternarMenuReciclajes = (event) => {
    event.preventDefault()
    event.stopPropagation()

    setMostrarMenuReciclajes(
      (estadoActual) => !estadoActual
    )
  }

  /*
    =========================================================
    CERRAR MENÚ
    =========================================================
  */

  const cerrarMenuReciclajes = () => {
    setMostrarMenuReciclajes(false)
  }

  return (
    <div className="user-layout">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="user-navbar">

        <div className="container user-navbar-content">

          {/* =================================================
              LOGO
          ================================================= */}

          <NavLink
            to="/usuario"
            className="user-navbar-logo"
            onClick={cerrarMenuReciclajes}
          >
            <img
              src="/logo-ecocanje.png"
              alt="EcoCanje"
              className="user-navbar-logo-image"
            />
          </NavLink>


          {/* =================================================
              NAVEGACIÓN
          ================================================= */}

          <nav className="user-navbar-links">

            {/* INICIO */}

            <NavLink
              to="/usuario"
              end
              onClick={cerrarMenuReciclajes}
            >
              Inicio
            </NavLink>


            {/* MI QR */}

            <NavLink
              to="/usuario/qr"
              onClick={cerrarMenuReciclajes}
            >
              Mi QR
            </NavLink>


            {/* MIS PUNTOS */}

            <NavLink
              to="/usuario/puntos"
              onClick={cerrarMenuReciclajes}
            >
              Mis puntos
            </NavLink>


            {/* =================================================
                RECICLAJES + PUNTOS DE ACOPIO
            ================================================= */}

            <div
              className="user-navbar-dropdown"
              ref={dropdownRef}
            >

              {/* BOTÓN PRINCIPAL */}

              <button
                type="button"
                className={`user-navbar-dropdown-trigger ${
                  mostrarMenuReciclajes
                    ? 'user-navbar-dropdown-trigger-active'
                    : ''
                }`}
                onClick={alternarMenuReciclajes}
                aria-expanded={mostrarMenuReciclajes}
                aria-haspopup="true"
              >
                Reciclajes
              </button>


              {/* MENÚ */}

              {mostrarMenuReciclajes && (

                <div
                  className="user-navbar-dropdown-menu user-navbar-dropdown-menu-open"
                >

                  {/* MIS RECICLAJES */}

                  <NavLink
                    to="/usuario/reciclajes"
                    className="user-navbar-dropdown-item"
                    onClick={cerrarMenuReciclajes}
                  >
                    Mis reciclajes
                  </NavLink>


                  {/* =================================================
                      PUNTOS DE ACOPIO

                      IMPORTANTE:
                      Esta ruta es la del usuario.

                      NO usar:
                      /puntos-acopio

                      Usar:
                      /usuario/puntos-acopio
                  ================================================= */}

                  <NavLink
                    to="/usuario/puntos-acopio"
                    className="user-navbar-dropdown-item"
                    onClick={cerrarMenuReciclajes}
                  >
                    Puntos de acopio
                  </NavLink>

                </div>

              )}

            </div>


            {/* BENEFICIOS */}

            <NavLink
              to="/usuario/beneficios"
              onClick={cerrarMenuReciclajes}
            >
              Beneficios
            </NavLink>


            {/* MIS CUPONES */}

            <NavLink
              to="/usuario/cupones"
              onClick={cerrarMenuReciclajes}
            >
              Mis cupones
            </NavLink>


            {/* MIS PEDIDOS */}

            <NavLink
              to="/usuario/pedidos"
              onClick={cerrarMenuReciclajes}
            >
              Mis pedidos
            </NavLink>


            {/* ECOTIENDA */}

            <NavLink
              to="/usuario/tienda"
              onClick={cerrarMenuReciclajes}
            >
              EcoTienda
            </NavLink>

          </nav>


          {/* =================================================
              CUENTA
          ================================================= */}

          <div className="user-navbar-account">

            {/* MI PERFIL */}

            <NavLink
              to="/usuario/perfil"
              className="user-profile-link"
              onClick={cerrarMenuReciclajes}
            >
              Mi perfil
            </NavLink>


            {/* CERRAR SESIÓN */}

            <button
              type="button"
              className="user-logout"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>


            {/* =================================================
                NOTIFICACIONES
            ================================================= */}

            <NavLink
              to="/usuario/notificaciones"
              className="user-notifications-link"
              onClick={cerrarMenuReciclajes}
              aria-label={
                notificacionesNoLeidas > 0
                  ? `Notificaciones, ${notificacionesNoLeidas} sin leer`
                  : 'Notificaciones'
              }
              title="Notificaciones"
            >

              <svg
                className="user-notifications-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >

                <path
                  d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                />

                <path d="M10 21h4" />

              </svg>


              {/* CONTADOR */}

              {notificacionesNoLeidas > 0 && (

                <span className="user-notifications-badge">
                  {notificacionesNoLeidas}
                </span>

              )}

            </NavLink>

          </div>

        </div>

      </header>


      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <main>
        {children}
      </main>

    </div>
  )
}

export default UserLayout