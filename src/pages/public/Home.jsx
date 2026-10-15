import { NavLink } from 'react-router-dom'

function Home() {
  return (
    <main className="home">

      {/* ========================================
          HERO
      ======================================== */}

      <section className="hero">

        <div className="container hero-content">

          <div className="hero-text">

            <span className="hero-label">
              ECOCANJE
            </span>

            <h1>
              Convierte tus residuos
              <span> en beneficios.</span>
            </h1>

            <p>
              Recicla en nuestros puntos de acopio, acumula puntos
              y obtén beneficios para adquirir productos sostenibles.
            </p>


            <div className="hero-actions">

              <NavLink
                to="/registro"
                className="btn btn-primary"
              >
                Comenzar ahora
              </NavLink>

              <NavLink
                to="/como-funciona"
                className="btn btn-secondary"
              >
                Conocer cómo funciona
              </NavLink>

            </div>

          </div>


          <div className="hero-visual">

            <div className="recycling-card">

              <div className="recycling-circle">
                EC
              </div>

              <div>
                <strong>
                  Recicla
                </strong>

                <span>
                  Acumula puntos
                </span>

                <span>
                  Obtén beneficios
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          PROCESO
      ======================================== */}

      <section className="process-section">

        <div className="container">

          <div className="section-heading">

            <span>
              EL PROCESO
            </span>

            <h2>
              ¿Cómo funciona EcoCanje?
            </h2>

            <p>
              Un sistema sencillo para transformar tus hábitos de reciclaje
              en beneficios.
            </p>

          </div>


          <div className="process-grid">

            <article className="process-card">

              <div className="process-number">
                01
              </div>

              <h3>
                Regístrate
              </h3>

              <p>
                Crea tu cuenta en EcoCanje y obtén tu código de usuario.
              </p>

            </article>


            <article className="process-card">

              <div className="process-number">
                02
              </div>

              <h3>
                Recicla
              </h3>

              <p>
                Lleva tus materiales reciclables a uno de nuestros
                puntos de acopio.
              </p>

            </article>


            <article className="process-card">

              <div className="process-number">
                03
              </div>

              <h3>
                Acumula puntos
              </h3>

              <p>
                El encargado registra tus materiales y el sistema calcula
                tus puntos automáticamente.
              </p>

            </article>


            <article className="process-card">

              <div className="process-number">
                04
              </div>

              <h3>
                Obtén beneficios
              </h3>

              <p>
                Utiliza tus puntos para obtener beneficios y descuentos
                en EcoTienda.
              </p>

            </article>

          </div>

        </div>

      </section>


      {/* ========================================
          IMPACTO
      ======================================== */}

      <section className="impact-section">

        <div className="container impact-content">

          <div>

            <span className="section-label">
              ECOCANJE
            </span>

            <h2>
              Reciclar también puede
              <span> generar oportunidades.</span>
            </h2>

            <p>
              EcoCanje integra reciclaje, tecnología e incentivos en una
              sola plataforma para promover una gestión más sostenible
              de los residuos sólidos.
            </p>

          </div>


          <div className="impact-stats">

            <div>
              <strong>
                01
              </strong>

              <span>
                Registra
              </span>
            </div>

            <div>
              <strong>
                02
              </strong>

              <span>
                Acumula
              </span>
            </div>

            <div>
              <strong>
                03
              </strong>

              <span>
                Canjea
              </span>
            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Home