import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function UserPuntosAcopio() {
  const [puntos, setPuntos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarPuntos()
  }, [])

  const cargarPuntos = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: supabaseError } = await supabase
        .from('collection_points')
        .select(
          `
          id,
          nombre,
          direccion,
          referencia,
          distrito,
          provincia,
          departamento,
          horario,
          telefono,
          estado
          `
        )
        .eq('estado', 'activo')
        .order('nombre', { ascending: true })

      if (supabaseError) {
        console.error(
          'Error al cargar puntos de acopio:',
          supabaseError
        )

        throw supabaseError
      }

      setPuntos(data || [])
    } catch (err) {
      console.error(
        'Error al cargar los puntos de acopio:',
        err
      )

      setError(
        err.message ||
          'No se pudieron cargar los puntos de acopio.'
      )

      setPuntos([])
    } finally {
      setLoading(false)
    }
  }

  const abrirGoogleMaps = (punto) => {
    const ubicacion = [
      punto.direccion,
      punto.referencia,
      punto.distrito,
      punto.provincia,
      punto.departamento,
      'Perú',
    ]
      .filter(Boolean)
      .join(', ')

    const url =
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(ubicacion)

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <main className="user-collection-page">

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <section className="user-collection-hero">

        <div className="container">

          <span className="section-label">
            MI CUENTA
          </span>

          <h1>
            Puntos
            <span> de acopio.</span>
          </h1>

          <p>
            Encuentra el punto de acopio más cercano para
            entregar tus materiales reciclables y registrar
            tus reciclajes en EcoCanje.
          </p>

        </div>

      </section>


      {/* ========================================
          PUNTOS DISPONIBLES
      ======================================== */}

      <section className="user-collection-section">

        <div className="container">

          <div className="user-collection-heading">

            <span>
              PUNTOS DISPONIBLES
            </span>

            <h2>
              Lugares donde puedes reciclar
            </h2>

            <p>
              Consulta la ubicación, horario y materiales
              aceptados en cada punto de acopio.
            </p>

          </div>


          {/* ========================================
              ESTADO DE CARGA
          ======================================== */}

          {loading && (
            <div className="user-collection-message">
              Cargando puntos de acopio...
            </div>
          )}


          {/* ========================================
              ERROR
          ======================================== */}

          {!loading && error && (
            <div className="user-collection-message user-collection-message-error">
              {error}
            </div>
          )}


          {/* ========================================
              SIN PUNTOS
          ======================================== */}

          {!loading &&
            !error &&
            puntos.length === 0 && (
              <div className="user-collection-message">
                Actualmente no hay puntos de acopio
                disponibles.
              </div>
            )}


          {/* ========================================
              PUNTOS
          ======================================== */}

          {!loading &&
            !error &&
            puntos.length > 0 && (

              <div className="user-collection-grid">

                {puntos.map((punto, index) => (

                  <article
                    className="user-collection-card"
                    key={punto.id}
                  >

                    {/* NÚMERO */}

                    <div className="user-collection-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>


                    {/* NOMBRE */}

                    <h3>
                      {punto.nombre}
                    </h3>


                    {/* INFORMACIÓN */}

                    <div className="user-collection-info">

                      {/* DIRECCIÓN */}

                      <div>

                        <strong>
                          Dirección
                        </strong>

                        <span>
                          {punto.direccion ||
                            'No especificada'}
                        </span>

                      </div>


                      {/* REFERENCIA */}

                      <div>

                        <strong>
                          Referencia
                        </strong>

                        <span>
                          {punto.referencia ||
                            'No especificada'}
                        </span>

                      </div>


                      {/* UBICACIÓN */}

                      <div>

                        <strong>
                          Ubicación
                        </strong>

                        <span>
                          {[
                            punto.distrito,
                            punto.provincia,
                            punto.departamento,
                          ]
                            .filter(Boolean)
                            .join(', ') ||
                            'No especificada'}
                        </span>

                      </div>


                      {/* HORARIO */}

                      <div>

                        <strong>
                          Horario
                        </strong>

                        <span>
                          {punto.horario ||
                            'No especificado'}
                        </span>

                      </div>


                      {/* TELÉFONO */}

                      {punto.telefono && (
                        <div>

                          <strong>
                            Teléfono
                          </strong>

                          <span>
                            {punto.telefono}
                          </span>

                        </div>
                      )}

                    </div>


                    {/* UBICACIÓN */}

                    <button
                      type="button"
                      className="btn btn-secondary user-collection-button"
                      onClick={() =>
                        abrirGoogleMaps(punto)
                      }
                    >
                      Ver ubicación
                    </button>

                  </article>

                ))}

              </div>

            )}

        </div>

      </section>


      {/* ========================================
          RECOMENDACIONES
      ======================================== */}

      <section className="user-collection-tips-section">

        <div className="container">

          <div className="user-collection-tips-content">

            <div>

              <span className="section-label">
                ANTES DE RECICLAR
              </span>

              <h2>
                Prepara tus materiales
                <span> correctamente.</span>
              </h2>

              <p>
                Una correcta preparación facilita la recepción
                de tus materiales y el registro de tu reciclaje.
              </p>

            </div>


            <div className="user-collection-tips">

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

export default UserPuntosAcopio