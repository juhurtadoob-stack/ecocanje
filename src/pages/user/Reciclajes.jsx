import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Reciclajes() {
  const [recyclings, setRecyclings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRecyclings()
  }, [])

  const loadRecyclings = async () => {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setError('No hay una sesión activa.')
        return
      }

      const {
        data: recyclingData,
        error: recyclingError,
      } = await supabase
        .from('recyclings')
        .select(`
          id,
          punto_acopio_id,
          puntos_obtenidos,
          estado,
          observaciones,
          created_at
        `)
        .eq('usuario_id', user.id)
        .order('created_at', {
          ascending: false,
        })

      if (recyclingError) {
        throw recyclingError
      }

      if (!recyclingData || recyclingData.length === 0) {
        setRecyclings([])
        return
      }

      const recyclingIds = recyclingData.map(
        (recycling) => recycling.id
      )

      const pointIds = [
        ...new Set(
          recyclingData.map(
            (recycling) => recycling.punto_acopio_id
          )
        ),
      ]

      const [
        detailsResult,
        pointsResult,
      ] = await Promise.all([
        supabase
          .from('recycling_details')
          .select(`
            id,
            reciclaje_id,
            material_id,
            cantidad,
            puntos_obtenidos
          `)
          .in(
            'reciclaje_id',
            recyclingIds
          ),

        supabase
          .from('collection_points')
          .select(
            'id, nombre, direccion'
          )
          .in(
            'id',
            pointIds
          ),
      ])

      if (detailsResult.error) {
        throw detailsResult.error
      }

      if (pointsResult.error) {
        throw pointsResult.error
      }

      const details =
        detailsResult.data || []

      const materialIds = [
        ...new Set(
          details.map(
            (detail) => detail.material_id
          )
        ),
      ]

      let materials = []

      if (materialIds.length > 0) {
        const {
          data: materialData,
          error: materialsError,
        } = await supabase
          .from('materials')
          .select(
            'id, nombre, unidad'
          )
          .in(
            'id',
            materialIds
          )

        if (materialsError) {
          throw materialsError
        }

        materials = materialData || []
      }

      const formattedRecyclings =
        recyclingData.map(
          (recycling) => {
            const recyclingDetails =
              details.filter(
                (detail) =>
                  detail.reciclaje_id ===
                  recycling.id
              )

            const formattedDetails =
              recyclingDetails.map(
                (detail) => {
                  const material =
                    materials.find(
                      (item) =>
                        item.id ===
                        detail.material_id
                    )

                  return {
                    ...detail,
                    material,
                  }
                }
              )

            const point =
              pointsResult.data?.find(
                (item) =>
                  item.id ===
                  recycling.punto_acopio_id
              )

            return {
              ...recycling,
              point,
              details:
                formattedDetails,
            }
          }
        )

      setRecyclings(
        formattedRecyclings
      )
    } catch (err) {
      console.error(
        'Error al cargar reciclajes:',
        err
      )

      setError(
        'No se pudieron cargar tus reciclajes.'
      )
    } finally {
      setLoading(false)
    }
  }

  const totalRecyclings =
    recyclings.length

  const totalPoints =
    recyclings.reduce(
      (total, recycling) =>
        total +
        Number(
          recycling.puntos_obtenidos || 0
        ),
      0
    )

  const totalQuantity =
    recyclings.reduce(
      (total, recycling) => {
        const recyclingQuantity =
          recycling.details.reduce(
            (sum, detail) =>
              sum +
              Number(
                detail.cantidad || 0
              ),
            0
          )

        return total + recyclingQuantity
      },
      0
    )

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      'es-PE',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    )
  }

  const getStatusLabel = (estado) => {
    const statuses = {
      pendiente: 'Pendiente',
      validado: 'Validado',
      corregido: 'Corregido',
      cancelado: 'Cancelado',
    }

    return (
      statuses[estado] ||
      estado
    )
  }

  const getStatusClass = (estado) => {
    const statusClasses = {
      pendiente: 'status-pending',
      validado: 'status-validated',
      corregido: 'status-corrected',
      cancelado: 'status-cancelled',
    }

    return (
      statusClasses[estado] ||
      ''
    )
  }

  if (loading) {
    return (
      <main className="user-recycling-page">

        <section className="user-recycling-hero">
          <div className="container">

            <span className="section-label">
              MI CUENTA
            </span>

            <h1>
              Mis
              <span> reciclajes.</span>
            </h1>

            <p>
              Consulta el historial de los materiales que has
              entregado, los puntos obtenidos y el estado de cada registro.
            </p>

          </div>
        </section>

        <section className="user-recycling-section">

          <div className="container">

            <div className="auth-loading">
              Cargando tus reciclajes...
            </div>

          </div>

        </section>

      </main>
    )
  }

  if (error) {
    return (
      <main className="user-recycling-page">

        <section className="user-recycling-hero">
          <div className="container">

            <span className="section-label">
              MI CUENTA
            </span>

            <h1>
              Mis
              <span> reciclajes.</span>
            </h1>

            <p>
              Consulta el historial de los materiales que has
              entregado, los puntos obtenidos y el estado de cada registro.
            </p>

          </div>
        </section>

        <section className="user-recycling-section">

          <div className="container">

            <div className="form-message form-message-error">
              {error}
            </div>

          </div>

        </section>

      </main>
    )
  }

  return (
    <main className="user-recycling-page">

      <section className="user-recycling-hero">

        <div className="container">

          <span className="section-label">
            MI CUENTA
          </span>

          <h1>
            Mis
            <span> reciclajes.</span>
          </h1>

          <p>
            Consulta el historial de los materiales que has entregado,
            los puntos obtenidos y el estado de cada registro.
          </p>

        </div>

      </section>

      <section className="user-recycling-section">

        <div className="container">

          <div className="recycling-summary">

            <article className="recycling-summary-card">

              <span>
                TOTAL DE RECICLAJES
              </span>

              <strong>
                {totalRecyclings}
              </strong>

              <p>
                Entregas registradas en tu cuenta.
              </p>

            </article>

            <article className="recycling-summary-card">

              <span>
                MATERIAL RECICLADO
              </span>

              <strong>
                {totalQuantity} kg
              </strong>

              <p>
                Cantidad total registrada.
              </p>

            </article>

            <article className="recycling-summary-card">

              <span>
                PUNTOS OBTENIDOS
              </span>

              <strong>
                {totalPoints}
              </strong>

              <p>
                Puntos generados mediante tus reciclajes.
              </p>

            </article>

          </div>

          <div className="recycling-history">

            <div className="section-heading">

              <span>
                HISTORIAL
              </span>

              <h2>
                Tus entregas recientes
              </h2>

              <p>
                Aquí puedes consultar los registros de reciclaje
                validados por un encargado.
              </p>

            </div>

            {recyclings.length === 0 ? (

              <div className="recycling-empty">

                <div className="recycling-empty-mark">
                  0
                </div>

                <h3>
                  Aún no tienes reciclajes registrados
                </h3>

                <p>
                  Acude a un punto de acopio y entrega tus materiales
                  reciclables para comenzar a acumular puntos.
                </p>

              </div>

            ) : (

              <div className="recycling-history-list">

                {recyclings.map(
                  (recycling, index) => {

                    const materialNames =
                      recycling.details
                        .map(
                          (detail) =>
                            detail.material?.nombre
                        )
                        .filter(Boolean)

                    const quantities =
                      recycling.details
                        .map(
                          (detail) =>
                            `${detail.cantidad} ${
                              detail.material?.unidad || ''
                            }`
                        )

                    return (
                      <article
                        className="recycling-history-card"
                        key={recycling.id}
                      >

                        <div className="recycling-card-top">

                          <div className="recycling-card-number">
                            <span>
                              RECICLAJE
                            </span>

                            <strong>
                              #{index + 1}
                            </strong>
                          </div>

                          <span
                            className={`recycling-status ${getStatusClass(
                              recycling.estado
                            )}`}
                          >
                            {getStatusLabel(
                              recycling.estado
                            )}
                          </span>

                        </div>

                        <div className="recycling-card-main">

                          <div className="recycling-material">

                            <span className="recycling-material-label">
                              MATERIAL RECIBIDO
                            </span>

                            <h3>
                              {materialNames.join(', ') ||
                                'Material reciclable'}
                            </h3>

                            <p>
                              Entrega registrada en EcoCanje
                            </p>

                          </div>

                          <div className="recycling-points">

                            <span>
                              PUNTOS OBTENIDOS
                            </span>

                            <strong>
                              +{recycling.puntos_obtenidos}
                            </strong>

                            <small>
                              puntos
                            </small>

                          </div>

                        </div>

                        <div className="recycling-card-details">

                          <div className="recycling-detail-item">

                            <span>
                              CANTIDAD
                            </span>

                            <strong>
                              {quantities.join(', ') || '—'}
                            </strong>

                          </div>

                          <div className="recycling-detail-item">

                            <span>
                              PUNTO DE ACOPIO
                            </span>

                            <strong>
                              {recycling.point?.nombre ||
                                'No disponible'}
                            </strong>

                          </div>

                          <div className="recycling-detail-item">

                            <span>
                              FECHA
                            </span>

                            <strong>
                              {formatDate(
                                recycling.created_at
                              )}
                            </strong>

                          </div>

                        </div>

                        {recycling.observaciones && (

                          <div className="recycling-card-observations">

                            <span>
                              OBSERVACIONES
                            </span>

                            <p>
                              {recycling.observaciones}
                            </p>

                          </div>

                        )}

                      </article>
                    )
                  }
                )}

              </div>

            )}

          </div>

          <div className="recycling-info">

            <div>

              <span className="section-label">
                IMPORTANTE
              </span>

              <h2>
                Tus puntos se generan
                <span> automáticamente.</span>
              </h2>

              <p>
                Cada registro es validado por un encargado de EcoCanje.
                Una vez confirmado, los puntos correspondientes se
                agregan automáticamente a tu cuenta.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Reciclajes