function ComoFunciona() {
  return (
    <main>

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <section className="how-hero">
        <div className="container">
          <span className="section-label">ECOCANJE</span>

          <h1>
            Reciclar es sencillo.
            <span> Obtener beneficios también.</span>
          </h1>

          <p>
            EcoCanje conecta el reciclaje con un sistema de puntos,
            beneficios y productos sostenibles en una sola plataforma.
          </p>
        </div>
      </section>


      {/* ========================================
          PASOS
      ======================================== */}

      <section className="how-steps">
        <div className="container">

          <div className="section-heading">
            <span>EL PROCESO</span>

            <h2>
              Así funciona EcoCanje
            </h2>

            <p>
              Desde tu registro hasta el uso de tus beneficios,
              todo el proceso se gestiona desde la plataforma.
            </p>
          </div>


          <div className="how-grid">

            <article className="how-card">
              <div className="how-number">
                01
              </div>

              <h3>
                Regístrate
              </h3>

              <p>
                Crea tu cuenta proporcionando tus datos básicos
                y comienza a utilizar EcoCanje.
              </p>
            </article>


            <article className="how-card">
              <div className="how-number">
                02
              </div>

              <h3>
                Recicla
              </h3>

              <p>
                Lleva tus materiales reciclables a un punto
                de acopio autorizado.
              </p>
            </article>


            <article className="how-card">
              <div className="how-number">
                03
              </div>

              <h3>
                Acumula puntos
              </h3>

              <p>
                El encargado registra tus materiales y el sistema
                calcula automáticamente los puntos obtenidos.
              </p>
            </article>


            <article className="how-card">
              <div className="how-number">
                04
              </div>

              <h3>
                Obtén beneficios
              </h3>

              <p>
                Utiliza tus puntos para obtener beneficios
                y descuentos disponibles en EcoCanje.
              </p>
            </article>


            <article className="how-card">
              <div className="how-number">
                05
              </div>

              <h3>
                Compra en EcoTienda
              </h3>

              <p>
                Utiliza tus beneficios al realizar pedidos
                de productos sostenibles en nuestra tienda.
              </p>
            </article>

          </div>

        </div>
      </section>


      {/* ========================================
          FLUJO
      ======================================== */}

      <section className="how-flow">
        <div className="container">

          <div className="flow-content">

            <div>
              <span className="section-label">
                FLUJO ECOCANJE
              </span>

              <h2>
                Del reciclaje al beneficio.
              </h2>

              <p>
                Cada entrega registrada genera una recompensa
                que puedes utilizar dentro de la plataforma.
              </p>
            </div>


            <div className="flow-steps">

              <div className="flow-item">
                <strong>Usuario</strong>
                <span>Entrega materiales</span>
              </div>

              <div className="flow-line"></div>

              <div className="flow-item">
                <strong>Encargado</strong>
                <span>Valida el reciclaje</span>
              </div>

              <div className="flow-line"></div>

              <div className="flow-item">
                <strong>Sistema</strong>
                <span>Calcula los puntos</span>
              </div>

              <div className="flow-line"></div>

              <div className="flow-item">
                <strong>Usuario</strong>
                <span>Canjea beneficios</span>
              </div>

            </div>

          </div>

        </div>
      </section>

    </main>
  )
}

export default ComoFunciona