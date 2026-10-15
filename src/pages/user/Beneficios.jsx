import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Beneficios() {
  const [profile, setProfile] = useState(null)
  const [benefits, setBenefits] = useState([])

  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const [selectedBenefit, setSelectedBenefit] = useState(null)

  useEffect(() => {
    loadBenefits()
  }, [])

  const loadBenefits = async () => {
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

      const [
        profileResult,
        benefitsResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('puntos_disponibles')
          .eq('id', user.id)
          .single(),

        supabase
          .from('benefits')
          .select(
            'id, nombre, descripcion, puntos_requeridos, descuento_porcentaje, dias_vigencia'
          )
          .eq('estado', 'activo')
          .order('puntos_requeridos', {
            ascending: true,
          }),
      ])

      if (profileResult.error) {
        throw profileResult.error
      }

      if (benefitsResult.error) {
        throw benefitsResult.error
      }

      setProfile(profileResult.data)
      setBenefits(benefitsResult.data || [])
    } catch (err) {
      console.error(
        'Error al cargar beneficios:',
        err
      )

      setError(
        'No se pudieron cargar tus beneficios.'
      )
    } finally {
      setLoading(false)
    }
  }

  const puntosDisponibles =
    profile?.puntos_disponibles || 0

  const beneficiosDisponibles =
    benefits.filter(
      (benefit) =>
        puntosDisponibles >=
        Number(benefit.puntos_requeridos)
    ).length

  const canRedeem = (benefit) => {
    return (
      puntosDisponibles >=
      Number(benefit.puntos_requeridos)
    )
  }

  const openRedeemModal = (benefit) => {
    if (redeeming) return
    if (!canRedeem(benefit)) return

    setError('')
    setSelectedBenefit(benefit)
  }

  const closeRedeemModal = () => {
    if (redeeming) return

    setSelectedBenefit(null)
  }

  const handleRedeem = async () => {
    if (!selectedBenefit || redeeming) {
      return
    }

    try {
      setRedeeming(true)
      setError('')
      setSuccess(null)

      const {
        data,
        error: redeemError,
      } = await supabase.rpc(
        'redeem_benefit',
        {
          p_beneficio_id:
            selectedBenefit.id,
        }
      )

      if (redeemError) {
        console.error(
          'Error al canjear beneficio:',
          redeemError
        )

        throw redeemError
      }

      const result = data?.[0]

      if (!result) {
        throw new Error(
          'No se recibió información del cupón.'
        )
      }

      setSuccess({
        codigo: result.codigo,
        descuento: result.descuento,
        puntos: result.puntos_utilizados,
        fechaVencimiento:
          result.fecha_vencimiento,
      })

      setSelectedBenefit(null)

      await loadBenefits()
    } catch (err) {
      console.error(
        'Error al canjear beneficio:',
        err
      )

      setError(
        err.message ||
        'No se pudo canjear el beneficio.'
      )
    } finally {
      setRedeeming(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''

    return new Date(date).toLocaleDateString(
      'es-PE',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    )
  }

  if (loading) {
    return (
      <main className="user-benefits-page">

        <section className="user-benefits-hero">

          <div className="container">

            <span className="section-label">
              BENEFICIOS
            </span>

            <h1>
              Canjea tus puntos
              <span> EcoCanje.</span>
            </h1>

            <p>
              Acumula puntos mediante tus reciclajes
              y utilízalos para obtener descuentos
              en EcoTienda.
            </p>

          </div>

        </section>

        <section className="user-benefits-section">

          <div className="container">

            <div className="auth-loading">
              Cargando beneficios...
            </div>

          </div>

        </section>

      </main>
    )
  }

  if (error) {
    return (
      <main className="user-benefits-page">

        <section className="user-benefits-hero">

          <div className="container">

            <span className="section-label">
              BENEFICIOS
            </span>

            <h1>
              Canjea tus puntos
              <span> EcoCanje.</span>
            </h1>

            <p>
              Acumula puntos mediante tus reciclajes
              y utilízalos para obtener descuentos
              en EcoTienda.
            </p>

          </div>

        </section>

        <section className="user-benefits-section">

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
    <main className="user-benefits-page">

      {/* ========================================
          ENCABEZADO
          ======================================== */}

      <section className="user-benefits-hero">

        <div className="container">

          <span className="section-label">
            BENEFICIOS
          </span>

          <h1>
            Canjea tus puntos
            <span> EcoCanje.</span>
          </h1>

          <p>
            Acumula puntos mediante tus reciclajes
            y utilízalos para obtener descuentos
            en EcoTienda.
          </p>

        </div>

      </section>


      {/* ========================================
          CONTENIDO
          ======================================== */}

      <section className="user-benefits-section">

        <div className="container">

          {/* RESUMEN */}

          <div className="benefits-summary">

            <article className="benefits-summary-card">

              <span>
                PUNTOS DISPONIBLES
              </span>

              <strong>
                {puntosDisponibles}
              </strong>

              <p>
                Puntos disponibles para canjear beneficios.
              </p>

            </article>


            <article className="benefits-summary-card">

              <span>
                BENEFICIOS DISPONIBLES
              </span>

              <strong>
                {beneficiosDisponibles}
              </strong>

              <p>
                Beneficios que puedes obtener con tu saldo actual.
              </p>

            </article>

          </div>


          {/* BENEFICIO CANJEADO */}

          {success && (

            <div className="benefit-success">

              <span className="section-label">
                BENEFICIO CANJEADO
              </span>

              <h2>
                Tu cupón está listo
              </h2>

              <p>
                Has obtenido un descuento del{' '}
                <strong>
                  {success.descuento}%
                </strong>{' '}
                utilizando{' '}
                <strong>
                  {success.puntos} puntos
                </strong>.
              </p>

              <div className="benefit-coupon">

                <span>
                  CÓDIGO DEL CUPÓN
                </span>

                <strong>
                  {success.codigo}
                </strong>

              </div>

              <p>
                Válido hasta:{' '}
                <strong>
                  {formatDate(
                    success.fechaVencimiento
                  )}
                </strong>
              </p>

            </div>

          )}


          {/* ENCABEZADO DE BENEFICIOS */}

          <div className="section-heading">

            <span>
              MIS BENEFICIOS
            </span>

            <h2>
              Elige tu beneficio
            </h2>

            <p>
              Utiliza tus puntos disponibles para obtener
              descuentos en tus compras.
            </p>

          </div>


          {/* TARJETAS */}

          <div className="benefits-grid">

            {benefits.map((benefit, index) => {

              const available =
                canRedeem(benefit)

              const puntosRequeridos =
                Number(
                  benefit.puntos_requeridos
                )

              const puntosFaltantes =
                Math.max(
                  puntosRequeridos -
                    puntosDisponibles,
                  0
                )

              return (
                <article
                  className={`benefit-card ${
                    available
                      ? 'benefit-card-available'
                      : ''
                  }`}
                  key={benefit.id}
                >

                  {/* PARTE SUPERIOR */}

                  <div className="benefit-card-top">

                    <div className="benefit-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <span className="benefit-status">
                      {available
                        ? 'DISPONIBLE'
                        : 'BLOQUEADO'}
                    </span>

                  </div>


                  {/* DESCUENTO */}

                  <div className="benefit-discount">

                    {benefit.descuento_porcentaje}%

                  </div>

                  <span className="benefit-discount-label">
                    DESCUENTO
                  </span>


                  {/* INFORMACIÓN */}

                  <h3>
                    {benefit.nombre}
                  </h3>

                  <p>
                    {benefit.descripcion}
                  </p>


                  {/* REQUISITOS */}

                  <div className="benefit-requirement">

                    <div>

                      <span>
                        PUNTOS REQUERIDOS
                      </span>

                      <strong>
                        {puntosRequeridos}
                      </strong>

                    </div>


                    <div>

                      <span>
                        VIGENCIA
                      </span>

                      <strong>
                        {benefit.dias_vigencia} días
                      </strong>

                    </div>

                  </div>


                  {/* ESTADO / ACCIÓN */}

                  <div className="benefit-footer">

                    {available ? (

                      <button
                        type="button"
                        className="benefit-available-message"
                        onClick={() =>
                          openRedeemModal(
                            benefit
                          )
                        }
                        disabled={redeeming}
                      >
                        Canjear beneficio
                      </button>

                    ) : (

                      <div className="benefit-locked-message">

                        <span>
                          Te faltan
                        </span>

                        <strong>
                          {puntosFaltantes} puntos
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
          MODAL DE CANJE
          ======================================== */}

      {selectedBenefit && (

        <div
          className="redeem-modal-overlay"
          onClick={closeRedeemModal}
        >

          <div
            className="redeem-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="redeem-modal-header">

              <span className="section-label">
                CONFIRMAR CANJE
              </span>

              <button
                type="button"
                className="redeem-modal-close"
                onClick={closeRedeemModal}
                disabled={redeeming}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <h2>
              ¿Deseas canjear este beneficio?
            </h2>

            <p>
              Estás a punto de utilizar tus puntos
              disponibles para obtener el siguiente beneficio:
            </p>


            <div className="redeem-modal-benefit">

              <div>

                <span>
                  DESCUENTO
                </span>

                <strong>
                  {selectedBenefit.descuento_porcentaje}%
                </strong>

              </div>


              <div>

                <span>
                  PUNTOS A UTILIZAR
                </span>

                <strong>
                  {selectedBenefit.puntos_requeridos}
                </strong>

              </div>

            </div>


            <div className="redeem-modal-info">

              <p>
                Tu saldo actual es de{' '}
                <strong>
                  {puntosDisponibles} puntos
                </strong>.
              </p>

              <p>
                Después del canje tendrás{' '}
                <strong>
                  {puntosDisponibles -
                    Number(
                      selectedBenefit.puntos_requeridos
                    )}{' '}
                  puntos
                </strong>{' '}
                disponibles.
              </p>

              <p>
                El cupón tendrá una vigencia de{' '}
                <strong>
                  {selectedBenefit.dias_vigencia} días
                </strong>.
              </p>

            </div>


            <div className="redeem-modal-actions">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeRedeemModal}
                disabled={redeeming}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRedeem}
                disabled={redeeming}
              >
                {redeeming
                  ? 'Procesando...'
                  : 'Confirmar canje'}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}

export default Beneficios