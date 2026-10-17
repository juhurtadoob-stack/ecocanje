import { NavLink } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">

      <div className="container footer-content">

        {/* MARCA */}

        <div className="footer-brand">

          <NavLink
            to="/"
            className="footer-logo"
            aria-label="EcoCanje - Inicio"
          >
            <img
              src="/logo-ecocanje.png"
              alt="EcoCanje"
              className="footer-logo-image"
            />
          </NavLink>

          <p>
            Recicla, acumula puntos y obtén beneficios
            mientras contribuyes a una gestión más sostenible
            de los residuos sólidos.
          </p>

        </div>


        {/* NAVEGACIÓN */}

        <div className="footer-column">

          <h3>
            EcoCanje
          </h3>

          <NavLink to="/como-funciona">
            Cómo funciona
          </NavLink>

          <NavLink to="/puntos-acopio">
            Puntos de acopio
          </NavLink>

          <NavLink to="/beneficios">
            Beneficios
          </NavLink>

          <NavLink to="/ecotienda">
            EcoTienda
          </NavLink>

        </div>


        {/* CUENTA */}

        <div className="footer-column">

          <h3>
            Cuenta
          </h3>

          <NavLink to="/login">
            Iniciar sesión
          </NavLink>

          <NavLink to="/registro">
            Crear una cuenta
          </NavLink>

          <NavLink to="/recuperar-password">
            Recuperar contraseña
          </NavLink>

        </div>


        {/* INFORMACIÓN */}

        <div className="footer-column">

          <h3>
            Información
          </h3>

          <span>
            Plataforma de incentivos
          </span>

          <span>
            Gestión sostenible de residuos
          </span>

          <span>
            Productos sostenibles
          </span>

        </div>

      </div>


      {/* PARTE INFERIOR */}

      <div className="container footer-bottom">

        <span>
          © {new Date().getFullYear()} EcoCanje.
          Todos los derechos reservados.
        </span>

        <span className="footer-slogan">
          Recicla. Acumula. Canjea.
        </span>

      </div>

    </footer>
  )
}

export default Footer