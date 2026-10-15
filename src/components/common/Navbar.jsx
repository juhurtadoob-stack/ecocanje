import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-content">

        {/* LOGO */}
        <NavLink
          to="/"
          className="navbar-logo"
        >
          <span className="navbar-logo-mark">
            EC
          </span>

          <span className="navbar-logo-text">
            EcoCanje
          </span>
        </NavLink>


        {/* NAVEGACIÓN */}
        <nav className="navbar-links">

          <NavLink
            to="/"
            end
          >
            Inicio
          </NavLink>

          <NavLink
            to="/como-funciona"
          >
            Cómo funciona
          </NavLink>

          <NavLink
            to="/puntos-acopio"
          >
            Puntos de acopio
          </NavLink>

          <NavLink
            to="/beneficios"
          >
            Beneficios
          </NavLink>

          <NavLink
            to="/eco-tienda"
          >
            EcoTienda
          </NavLink>

        </nav>


        {/* ACCIONES */}
        <div className="navbar-actions">

          <NavLink
            to="/login"
            className="navbar-login"
          >
            Iniciar sesión
          </NavLink>

          <NavLink
            to="/registro"
            className="btn btn-primary navbar-register"
          >
            Registrarse
          </NavLink>

        </div>

      </div>
    </header>
  )
}

export default Navbar