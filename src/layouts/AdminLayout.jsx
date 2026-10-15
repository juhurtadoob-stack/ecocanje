import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminLayout({ children }) {
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
    <div className="admin-layout">

      <header className="admin-navbar">

        <div className="container admin-navbar-content">

          <NavLink
            to="/admin"
            className="admin-navbar-logo"
          >
            <span className="admin-navbar-logo-mark">
              EC
            </span>

            <span className="admin-navbar-logo-text">
              EcoCanje
            </span>
          </NavLink>


          <nav className="admin-navbar-links">

            <NavLink
              to="/admin"
              end
            >
              Inicio
            </NavLink>

            <NavLink to="/admin/usuarios">
              Usuarios
            </NavLink>

            <NavLink to="/admin/productos">
              Productos
            </NavLink>

            <NavLink to="/admin/categorias">
              Categorías
            </NavLink>

            <NavLink to="/admin/beneficios">
              Beneficios
            </NavLink>

            <NavLink to="/admin/materiales">
              Materiales
            </NavLink>

            <NavLink to="/admin/puntos-acopio">
              Puntos de acopio
            </NavLink>

            <NavLink to="/admin/pedidos">
              Pedidos
            </NavLink>

            <NavLink to="/admin/reciclajes">
              Reciclajes
            </NavLink>

          </nav>


          <div className="admin-navbar-account">

            <button
              type="button"
              className="admin-logout"
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

export default AdminLayout