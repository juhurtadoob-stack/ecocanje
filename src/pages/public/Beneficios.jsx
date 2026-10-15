import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Beneficios() {
  const [puntosDisponibles, setPuntosDisponibles] = useState(0)
  const [loadingPoints, setLoadingPoints] = useState(true)

  const beneficios = [
    {
      nombre: 'Descuento inicial',
      puntos: 100,
      descuento: '5%',
      descripcion:
        'Obtén un descuento del 5% en productos seleccionados de EcoTienda.',
    },
    {
      nombre: 'Descuento Verde',
      puntos: 250,
      descuento: '10%',
      descripcion:
        'Obtén un descuento del 10% en tus compras dentro de EcoTienda.',
    },
    {
      nombre: 'Beneficio Eco',
      puntos: 500,
      descuento: '15%',
      descripcion:
        'Obtén un descuento del 15% en productos disponibles en EcoTienda.',
    },
    {
      nombre: 'Beneficio EcoMaster',
      puntos: 750,
      descuento: '20%',
      descripcion:
        'Obtén el beneficio máximo de 20% de descuento en tus compras.',
    },
  ]

  useEffect(() => {
    cargarPuntos()
  }, [])

  const cargarPuntos = async () => {
    try {
      setLoadingPoints(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setPuntosDisponibles(0)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('puntos_disponibles')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error(
          'Error al cargar los puntos:',
          error
        )

        setPuntosDisponibles(0)
        return
      }

      setPuntosDisponibles(
        data?.puntos_disponibles || 0
      )

    } catch (error) {
      console.error(
        'Error inesperado al cargar los puntos:',
        error
      )

      setPuntosDisponibles(0)
    } finally {
      setLoadingPoints(false)
    }
  }

  return (
    <main>

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <section className="benefits-hero">

        <div className="container">

          <div className="benefits-hero-content">

            <div>

              <span className="section-label">
                BENEFICIOS ECOCANJE
              </span>

              <h1>
                Tus puntos se convierten en
                <span> beneficios.</span>
              </h1>

              <p>
                Recicla, acumula puntos y desbloquea descuentos
                que podrás utilizar en EcoTienda.
              </p>

            </div>

            <div className="benefits-points-card">

              <span>
                PUNTOS DISPONIBLES
              </span>

              <strong>
                {loadingPoints
                  ? '...'
                  : puntosDisponibles}
              </strong>

              <small>
                puntos para canjear
              </small>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          BENEFICIOS
      ======================================== */}

      <section className="benefits-section">

        <div className="container">

          <div className="section-heading">

            <span>
              NIVELES DE BENEFICIO
            </span>

            <h2>
              Elige tu próximo beneficio
            </h2>

            <p>
              Mientras más reciclas, más puntos acumulas y
              mayores beneficios puedes obtener.
            </p>

          </div>


          <div className="benefits-grid">

            {beneficios.map((beneficio, index) => {

              const disponible =
                puntosDisponibles >= beneficio.puntos

              const faltan =
                Math.max(
                  beneficio.puntos - puntosDisponibles,
                  0
                )

              return (
                <article
                  className={`benefit-card ${
                    disponible
                      ? 'benefit-card-available'
                      : ''
                  }`}
                  key={beneficio.puntos}
                >

                  <div className="benefit-card-top">

                    <div className="benefit-number">
                      0{index + 1}
                    </div>

                    <span className="benefit-status">
                      {disponible
                        ? 'DISPONIBLE'
                        : 'BLOQUEADO'}
                    </span>

                  </div>


                  <div className="benefit-discount">
                    {beneficio.descuento}
                  </div>

                  <span className="benefit-discount-label">
                    DESCUENTO
                  </span>


                  <h3>
                    {beneficio.nombre}
                  </h3>


                  <p>
                    {beneficio.descripcion}
                  </p>


                  <div className="benefit-requirement">

                    <div>

                      <span>
                        PUNTOS REQUERIDOS
                      </span>

                      <strong>
                        {beneficio.puntos}
                      </strong>

                    </div>

                    <div>

                      <span>
                        VIGENCIA
                      </span>

                      <strong>
                        30 días
                      </strong>

                    </div>

                  </div>


                  <div className="benefit-footer">

                    {disponible ? (

                      <div className="benefit-available-message">
                        Beneficio disponible para canje
                      </div>

                    ) : (

                      <div className="benefit-locked-message">

                        <span>
                          Te faltan
                        </span>

                        <strong>
                          {faltan} puntos
                        </strong>

                      </div>

                    )}

                  </div>

                </article>
              )
            })}

          </div>

        </div>

      </section>


      {/* ========================================
          CÓMO OBTENER BENEFICIOS
      ======================================== */}

      <section className="benefits-info">

        <div className="container">

          <div className="benefits-info-content">

            <div>

              <span className="section-label">
                ¿CÓMO OBTENERLOS?
              </span>

              <h2>
                Recicla más.
                <span> Obtén más.</span>
              </h2>

              <p>
                Los puntos se generan automáticamente cuando un
                encargado registra y valida tus materiales reciclables.
              </p>

            </div>


            <div className="benefit-steps">

              <div className="benefit-step">

                <strong>
                  01
                </strong>

                <div>

                  <h3>
                    Recicla
                  </h3>

                  <p>
                    Entrega tus materiales en un punto de acopio.
                  </p>

                </div>

              </div>


              <div className="benefit-step">

                <strong>
                  02
                </strong>

                <div>

                  <h3>
                    Acumula
                  </h3>

                  <p>
                    El sistema registra automáticamente los puntos obtenidos.
                  </p>

                </div>

              </div>


              <div className="benefit-step">

                <strong>
                  03
                </strong>

                <div>

                  <h3>
                    Canjea
                  </h3>

                  <p>
                    Utiliza tus puntos para obtener un beneficio disponible.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          NOTA
      ======================================== */}

      <section className="benefits-note">

        <div className="container">

          <div className="benefits-note-card">

            <strong>
              Importante
            </strong>

            <p>
              Los puntos representan un sistema de incentivos y no
              constituyen dinero. Al canjear un beneficio, los puntos
              disponibles se descuentan de tu saldo.
            </p>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Beneficios