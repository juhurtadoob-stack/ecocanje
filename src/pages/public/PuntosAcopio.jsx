function PuntosAcopio() {
  const puntos = [
    {
      nombre: 'Punto EcoCanje Central',
      direccion: 'Av. Pacífico 370',
      referencia: 'Frente a la Plaza Mayor de Nuevo Chimbote',
      distrito: 'Nuevo Chimbote',
      provincia: 'Santa',
      departamento: 'Áncash',
      horario: 'Lunes a sábado · 8:00 a. m. - 6:00 p. m.',
      materiales: 'PET, papel, cartón, aluminio y vidrio',
    },
    {
      nombre: 'Punto EcoCanje Norte',
      direccion: 'E2, Las Brisas',
      referencia: 'Cerca de la Plaza Mayor de Las Brisas',
      distrito: 'Nuevo Chimbote',
      provincia: 'Santa',
      departamento: 'Áncash',
      horario: 'Lunes a sábado · 8:00 a. m. - 5:00 p. m.',
      materiales: 'PET, papel, cartón y aluminio',
    },
    {
      nombre: 'Punto EcoCanje Sur',
      direccion: 'Av. A, Urb. Las Casuarinas',
      referencia: 'Cerca del Complejo Polideportivo de Casuarinas',
      distrito: 'Nuevo Chimbote',
      provincia: 'Santa',
      departamento: 'Áncash',
      horario: 'Lunes a viernes · 9:00 a. m. - 5:00 p. m.',
      materiales: 'PET, vidrio, papel y cartón',
    },
  ]

  const abrirGoogleMaps = (punto) => {
    const ubicacion = `${punto.direccion}, ${punto.referencia}, ${punto.distrito}, ${punto.provincia}, ${punto.departamento}, Perú`

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      ubicacion
    )}`

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main>

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <section className="collection-hero">
        <div className="container">

          <span className="section-label">
            ECOCANJE
          </span>

          <h1>
            Encuentra un punto
            <span> de acopio.</span>
          </h1>

          <p>
            Lleva tus materiales reciclables a uno de nuestros
            puntos de acopio y comienza a acumular puntos.
          </p>

        </div>
      </section>


      {/* ========================================
          PUNTOS DE ACOPIO
      ======================================== */}

      <section className="collection-section">
        <div className="container">

          <div className="section-heading">
            <span>
              PUNTOS DISPONIBLES
            </span>

            <h2>
              Lugares donde puedes reciclar
            </h2>

            <p>
              Consulta la ubicación, horario y materiales aceptados
              en cada punto de acopio.
            </p>
          </div>


          <div className="collection-grid">

            {puntos.map((punto, index) => (
              <article
                className="collection-card"
                key={index}
              >

                <div className="collection-number">
                  0{index + 1}
                </div>

                <h3>
                  {punto.nombre}
                </h3>

                <div className="collection-info">

                  <div>
                    <strong>
                      Dirección
                    </strong>

                    <span>
                      {punto.direccion}
                    </span>
                  </div>


                  <div>
                    <strong>
                      Referencia
                    </strong>

                    <span>
                      {punto.referencia}
                    </span>
                  </div>


                  <div>
                    <strong>
                      Horario
                    </strong>

                    <span>
                      {punto.horario}
                    </span>
                  </div>


                  <div>
                    <strong>
                      Materiales aceptados
                    </strong>

                    <span>
                      {punto.materiales}
                    </span>
                  </div>

                </div>


                <button
                  type="button"
                  className="btn btn-secondary collection-button"
                  onClick={() => abrirGoogleMaps(punto)}
                >
                  Ver ubicación
                </button>

              </article>
            ))}

          </div>

        </div>
      </section>


      {/* ========================================
          INFORMACIÓN
      ======================================== */}

      <section className="collection-info-section">

        <div className="container">

          <div className="collection-info-content">

            <div>
              <span className="section-label">
                ANTES DE RECICLAR
              </span>

              <h2>
                Prepara tus materiales
                <span> correctamente.</span>
              </h2>
            </div>


            <div className="collection-tips">

              <div>
                <strong>
                  01
                </strong>

                <p>
                  Separa los materiales reciclables antes
                  de llevarlos al punto de acopio.
                </p>
              </div>


              <div>
                <strong>
                  02
                </strong>

                <p>
                  Procura entregar los envases limpios
                  y libres de residuos.
                </p>
              </div>


              <div>
                <strong>
                  03
                </strong>

                <p>
                  El encargado verificará el material y
                  registrará tu reciclaje en EcoCanje.
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default PuntosAcopio