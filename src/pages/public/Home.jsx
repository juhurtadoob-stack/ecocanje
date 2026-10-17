import { NavLink } from 'react-router-dom'

function EcoIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="27"
      height="27"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'register' && (
        <>
          <circle cx="9" cy="7" r="4" />
          <path d="M2.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
          <path d="M19 8v7" />
          <path d="M15.5 11.5h7" />
        </>
      )}

      {name === 'recycle' && (
        <>
          <path d="m9 4 2-2h4l2.5 4" />
          <path d="M17.5 3.5 17 7l-3.2-.8" />
          <path d="m19 11 2 3.5-2 3.5h-5" />
          <path d="m20.5 16.5-2.5-2-1 3" />
          <path d="M8 20H4l-2-3.5 2.5-4.2" />
          <path d="m2 15 2.5-2.2.7 3.1" />
          <path d="m8 5-3 5" />
        </>
      )}

      {name === 'points' && (
        <>
          <ellipse cx="9" cy="5" rx="6" ry="2.5" />
          <path d="M3 5v4c0 1.4 2.7 2.5 6 2.5 1.1 0 2.1-.1 3-.4" />
          <path d="M3 9v4c0 1.4 2.7 2.5 6 2.5" />
          <path d="M3 13v3.5C3 17.9 5.7 19 9 19" />
          <ellipse cx="17" cy="12" rx="4" ry="2" />
          <path d="M13 12v5c0 1.1 1.8 2 4 2s4-.9 4-2v-5" />
        </>
      )}

      {name === 'gift' && (
        <>
          <rect x="3" y="9" width="18" height="12" rx="1.5" />
          <path d="M2 6h20v4H2z" />
          <path d="M12 6v15" />
          <path d="M12 6H8.5C6 6 5 4.8 5 3.5 5 2.6 5.8 2 6.7 2 9.2 2 12 6 12 6Z" />
          <path d="M12 6h3.5C18 6 19 4.8 19 3.5c0-.9-.8-1.5-1.7-1.5C14.8 2 12 6 12 6Z" />
        </>
      )}

      {name === 'leaf' && (
        <>
          <path d="M20.5 3.5C11 3.5 5 7.2 5 13.1c0 3.2 2.1 5.2 5 5.2 6.1 0 10.5-7 10.5-14.8Z" />
          <path d="M3 21c3.4-5.2 7.2-8.4 12-11.1" />
        </>
      )}

      {name === 'community' && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M19 14a4.5 4.5 0 0 1 2 4v2" />
        </>
      )}

      {name === 'sprout' && (
        <>
          <path d="M12 21v-9" />
          <path d="M12 13C5 13 3 9 3 4c6 0 9 3 9 9Z" />
          <path d="M12 10c0-5 3-7 9-7 0 5-2 9-9 10" />
        </>
      )}

      {name === 'document' && (
        <>
          <path d="M6 2h8l5 5v15H6z" />
          <path d="M14 2v5h5" />
          <path d="M9 12h7M9 16h7" />
        </>
      )}
    </svg>
  )
}

function PlantIllustration() {
  return (
    <svg
      className="recycling-plant"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="90" cy="90" r="82" fill="#E6F5EA" />
      <circle cx="90" cy="90" r="65" fill="#F7FCF8" />

      <path
        d="M86 145C86 117 94 84 115 51"
        stroke="#176534"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      <path
        d="M87 119C61 123 42 106 38 84C61 82 81 97 87 119Z"
        fill="#55B875"
      />
      <path
        d="M84 115C68 102 53 92 41 86"
        stroke="#247D42"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M94 96C91 70 109 49 135 46C138 70 120 91 94 96Z"
        fill="#258348"
      />
      <path
        d="M97 91C111 75 123 61 133 49"
        stroke="#A6DDB4"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M98 77C74 70 65 51 72 33C93 39 104 57 98 77Z"
        fill="#76C98B"
      />
      <path
        d="M97 73C87 57 79 45 74 36"
        stroke="#258348"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M111 56C112 35 128 22 147 24C147 43 133 56 111 56Z"
        fill="#3B9C5B"
      />
      <path
        d="M113 53C124 42 135 32 145 27"
        stroke="#B5E3C2"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M87 137C70 137 57 145 51 157C68 161 82 151 87 137Z"
        fill="#3B9C5B"
      />
    </svg>
  )
}

function Home() {
  return (
    <main className="home">

      {/* ========================================
          PORTADA PRINCIPAL
      ======================================== */}

      <section className="hero">

        <div className="container hero-content">

          <div className="hero-text">

            <span className="hero-label">
              <span
                className="hero-label-mark"
                aria-hidden="true"
              />
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
                <span className="hero-button-arrow" aria-hidden="true">
                  →
                </span>
              </NavLink>

              <NavLink
                to="/como-funciona"
                className="btn btn-secondary"
              >
                Conocer cómo funciona
              </NavLink>

            </div>

            <div className="hero-highlights">

              <div className="hero-highlight">
                <span className="hero-highlight-icon">
                  <EcoIcon name="leaf" />
                </span>

                <span>
                  Un planeta
                  <strong>más limpio</strong>
                </span>
              </div>

              <div className="hero-highlight">
                <span className="hero-highlight-icon">
                  <EcoIcon name="community" />
                </span>

                <span>
                  Comunidades
                  <strong>más fuertes</strong>
                </span>
              </div>

              <div className="hero-highlight">
                <span className="hero-highlight-icon">
                  <EcoIcon name="sprout" />
                </span>

                <span>
                  Productos
                  <strong>más sostenibles</strong>
                </span>
              </div>

            </div>

          </div>

          <div className="hero-visual">

            <div className="recycling-card">

              <div className="recycling-circle">
                <PlantIllustration />
              </div>

              <div className="recycling-card-copy">

                <strong>Recicla</strong>

                <span>Acumula puntos</span>

                <span>Obtén beneficios</span>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          CÓMO FUNCIONA
      ======================================== */}

      <section className="process-section" id="proceso">

        <div className="container">

          <div className="section-heading">

            <span className="process-kicker">
              <span className="section-heading-mark" aria-hidden="true" />
              EL PROCESO
            </span>

            <h2>
              ¿Cómo funciona <span>EcoCanje</span>?
            </h2>

            <p>
              Un sistema sencillo para transformar tus hábitos de reciclaje
              en beneficios.
            </p>

          </div>

          <div className="process-grid">

            <article className="process-card">

              <div className="process-card-top">
                <span className="process-number">01</span>

                <span className="process-icon">
                  <EcoIcon name="register" />
                </span>
              </div>

              <h3>Regístrate</h3>

              <p>
                Crea tu cuenta en EcoCanje y obtén tu código de usuario.
              </p>

            </article>

            <article className="process-card">

              <div className="process-card-top">
                <span className="process-number">02</span>

                <span className="process-icon">
                  <EcoIcon name="recycle" />
                </span>
              </div>

              <h3>Recicla</h3>

              <p>
                Lleva tus materiales reciclables a uno de nuestros
                puntos de acopio.
              </p>

            </article>

            <article className="process-card">

              <div className="process-card-top">
                <span className="process-number">03</span>

                <span className="process-icon">
                  <EcoIcon name="points" />
                </span>
              </div>

              <h3>Acumula puntos</h3>

              <p>
                El encargado registra tus materiales y el sistema calcula
                tus puntos automáticamente.
              </p>

            </article>

            <article className="process-card">

              <div className="process-card-top">
                <span className="process-number">04</span>

                <span className="process-icon">
                  <EcoIcon name="gift" />
                </span>
              </div>

              <h3>Obtén beneficios</h3>

              <p>
                Utiliza tus puntos para obtener beneficios y descuentos
                en EcoTienda.
              </p>

            </article>

          </div>

        </div>

      </section>


      {/* ========================================
          IMPACTO Y BENEFICIOS
      ======================================== */}

      <section className="impact-section">

        <div className="container impact-content">

          <div className="impact-copy">

            <span className="section-label impact-label">
              <span className="section-heading-mark" aria-hidden="true" />
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

            <div className="impact-benefits">

              <div className="impact-benefit">
                <span className="impact-benefit-icon">
                  <EcoIcon name="leaf" />
                </span>

                <span>
                  Menos residuos
                  <strong>en el ambiente</strong>
                </span>
              </div>

              <div className="impact-benefit">
                <span className="impact-benefit-icon">
                  <EcoIcon name="community" />
                </span>

                <span>
                  Comunidades
                  <strong>más conscientes</strong>
                </span>
              </div>

              <div className="impact-benefit">
                <span className="impact-benefit-icon">
                  <EcoIcon name="sprout" />
                </span>

                <span>
                  Más oportunidades
                  <strong>para todos</strong>
                </span>
              </div>

            </div>

          </div>

          <div className="impact-flow" aria-label="Proceso de EcoCanje">

            <article className="impact-flow-card">

              <span className="impact-flow-number">01</span>

              <span className="impact-flow-icon">
                <EcoIcon name="document" />
              </span>

              <strong>Registra</strong>

            </article>

            <span className="impact-flow-arrow" aria-hidden="true">
              →
            </span>

            <article className="impact-flow-card">

              <span className="impact-flow-number">02</span>

              <span className="impact-flow-icon">
                <EcoIcon name="points" />
              </span>

              <strong>Acumula</strong>

            </article>

            <span className="impact-flow-arrow" aria-hidden="true">
              →
            </span>

            <article className="impact-flow-card">

              <span className="impact-flow-number">03</span>

              <span className="impact-flow-icon">
                <EcoIcon name="gift" />
              </span>

              <strong>Canjea</strong>

            </article>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Home