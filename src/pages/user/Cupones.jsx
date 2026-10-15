import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Cupones() {
  const [cupones, setCupones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarCupones()
  }, [])

  const cargarCupones = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error('No hay una sesión activa.')
      }

      const { data: couponsData, error: couponsError } =
        await supabase
          .from('coupons')
          .select(
            `
              id,
              beneficio_id,
              codigo,
              estado,
              fecha_canjes,
              fecha_vencimiento,
              fecha_uso
            `
          )
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false })

      if (couponsError) {
        throw couponsError
      }

      if (!couponsData || couponsData.length === 0) {
        setCupones([])
        return
      }

      const beneficioIds = [
        ...new Set(
          couponsData.map((cupon) => cupon.beneficio_id)
        ),
      ]

      const { data: benefitsData, error: benefitsError } =
        await supabase
          .from('benefits')
          .select(
            `
              id,
              nombre,
              descripcion,
              puntos_requeridos,
              descuento_porcentaje
            `
          )
          .in('id', beneficioIds)

      if (benefitsError) {
        throw benefitsError
      }

      const beneficiosMap = {}

      benefitsData?.forEach((beneficio) => {
        beneficiosMap[beneficio.id] = beneficio
      })

      const cuponesCompletos = couponsData.map((cupon) => ({
        ...cupon,
        beneficio: beneficiosMap[cupon.beneficio_id] || null,
      }))

      setCupones(cuponesCompletos)
    } catch (err) {
      console.error('Error al cargar cupones:', err)
      setError(
        'No se pudieron cargar tus cupones. Intenta nuevamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  const obtenerEstado = (cupon) => {
    const fechaActual = new Date()
    const fechaVencimiento = new Date(cupon.fecha_vencimiento)

    if (
      cupon.estado !== 'utilizado' &&
      fechaVencimiento < fechaActual
    ) {
      return 'vencido'
    }

    return cupon.estado
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'

    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <main className="user-coupons-page">

      <section className="user-coupons-hero">

        <div className="container">

          <span className="section-label">
            MIS CUPONES
          </span>

          <h1>
            Mis cupones
            <span> EcoCanje.</span>
          </h1>

          <p>
            Consulta los cupones que has obtenido mediante
            tus beneficios y revisa su estado y vigencia.
          </p>

        </div>

      </section>


      <section className="user-coupons-section">

        <div className="container">

          <div className="section-heading">

            <span>
              BENEFICIOS OBTENIDOS
            </span>

            <h2>
              Tus cupones
            </h2>

            <p>
              Aquí podrás consultar los descuentos que hayas
              obtenido al canjear tus puntos.
            </p>

          </div>


          {loading && (
            <div className="coupons-empty">

              <h3>
                Cargando tus cupones...
              </h3>

              <p>
                Estamos consultando tus beneficios obtenidos.
              </p>

            </div>
          )}


          {!loading && error && (
            <div className="coupons-empty">

              <h3>
                No se pudieron cargar los cupones
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={cargarCupones}
              >
                Intentar nuevamente
              </button>

            </div>
          )}


          {!loading && !error && cupones.length === 0 && (
            <div className="coupons-empty">

              <h3>
                Aún no tienes cupones
              </h3>

              <p>
                Cuando canjees un beneficio, tu cupón aparecerá
                aquí.
              </p>

            </div>
          )}


          {!loading && !error && cupones.length > 0 && (
            <div className="coupons-grid">

              {cupones.map((cupon) => {

                const estado = obtenerEstado(cupon)

                return (
                  <article
                    key={cupon.id}
                    className="coupon-card"
                  >

                    <div className="coupon-card-header">

                      <div>
                        <span className="coupon-label">
                          CUPÓN ECOCANJE
                        </span>

                        <h3>
                          {cupon.beneficio?.nombre ||
                            'Beneficio EcoCanje'}
                        </h3>
                      </div>

                      <span
                        className={`coupon-status coupon-status-${estado}`}
                      >
                        {estado === 'disponible' &&
                          'Disponible'}

                        {estado === 'utilizado' &&
                          'Utilizado'}

                        {estado === 'vencido' &&
                          'Vencido'}

                        {estado === 'canjeado' &&
                          'Canjeado'}
                      </span>

                    </div>


                    <div className="coupon-discount">

                      <strong>
                        {Number(
                          cupon.beneficio
                            ?.descuento_porcentaje || 0
                        )}%
                      </strong>

                      <span>
                        de descuento
                      </span>

                    </div>


                    <p className="coupon-description">
                      {cupon.beneficio?.descripcion ||
                        'Beneficio obtenido mediante el canje de puntos.'}
                    </p>


                    <div className="coupon-code-box">

                      <span>
                        Código del cupón
                      </span>

                      <strong>
                        {cupon.codigo}
                      </strong>

                    </div>


                    <div className="coupon-details">

                      <div>
                        <span>
                          Puntos utilizados
                        </span>

                        <strong>
                          {cupon.beneficio
                            ?.puntos_requeridos || 0}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Fecha de canje
                        </span>

                        <strong>
                          {formatearFecha(
                            cupon.fecha_canjes
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Válido hasta
                        </span>

                        <strong>
                          {formatearFecha(
                            cupon.fecha_vencimiento
                          )}
                        </strong>
                      </div>

                    </div>

                  </article>
                )
              })}

            </div>
          )}

        </div>

      </section>

    </main>
  )
}

export default Cupones