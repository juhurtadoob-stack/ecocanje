import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AttendantLayout({ children }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error al cerrar sesión:', error)
      return
    }

    navigate('/login')
  }

  return (
    <div className="attendant-layout">

      <header className="attendant-navbar">

        <div className="container attendant-navbar-content">

          <NavLink
            to="/encargado"
            className="attendant-navbar-logo"
          >
            <span className="attendant-navbar-logo-mark">
              EC
            </span>

            <span className="attendant-navbar-logo-text">
              EcoCanje
            </span>
          </NavLink>


          <nav className="attendant-navbar-links">

            <NavLink
              to="/encargado"
              end
            >
              Inicio
            </NavLink>

            <NavLink to="/encargado/escanear">
              Escanear QR
            </NavLink>

            <NavLink to="/encargado/reciclajes">
              Reciclajes
            </NavLink>

          </nav>


          <div className="attendant-navbar-account">

            <span className="attendant-role">
              Encargado
            </span>

            <button
              type="button"
              className="attendant-logout"
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

export default AttendantLayout