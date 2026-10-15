import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Puntos() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
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
        data,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'puntos_disponibles, puntos_acumulados, nivel'
        )
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      setProfile(data)

    } catch (err) {
      console.error(
        'Error al cargar los puntos:',
        err
      )

      setError(
        'No se pudieron cargar tus puntos.'
      )
    } finally {
      setLoading(false)
    }
  }

  const puntosDisponibles =
    profile?.puntos_disponibles ?? 0

  const puntosAcumulados =
    profile?.puntos_acumulados ?? 0

  const nivel =
    profile?.nivel || 'Semilla'

  const niveles = {
    Semilla: {
      siguiente: 'Verde',
      minimoSiguiente: 250,
    },

    Verde: {
      siguiente: 'Eco',
      minimoSiguiente: 750,
    },

    Eco: {
      siguiente: 'EcoMaster',
      minimoSiguiente: 1500,
    },

    EcoMaster: {
      siguiente: null,
      minimoSiguiente: null,
    },
  }

  const nivelActual =
    niveles[nivel] || niveles.Semilla

  let porcentaje = 0

  if (nivelActual.minimoSiguiente) {
    porcentaje =
      (puntosAcumulados /
        nivelActual.minimoSiguiente) *
      100

    if (porcentaje > 100) {
      porcentaje = 100
    }
  } else {
    porcentaje = 100
  }

  const puntosRestantes =
    nivelActual.minimoSiguiente
      ? Math.max(
          nivelActual.minimoSiguiente -
            puntosAcumulados,
          0
        )
      : 0

  if (loading) {
    return (
      <main className="user-points-page">

        <section className="user-points-hero">
          <div className="container">

            <span className="section-label">
              MI CUENTA
            </span>

            <h1>
              Mis puntos
              <span> EcoCanje.</span>
            </h1>

            <p>
              Consulta tus puntos disponibles, revisa tu
              progreso y conoce cuánto te falta para alcanzar
              el siguiente nivel.
            </p>

          </div>
        </section>

        <section className="user-points-section">

          <div className="container">

            <div className="auth-loading">
              Cargando tus puntos...
            </div>

          </div>

        </section>

      </main>
    )
  }

  if (error) {
    return (
      <main className="user-points-page">

        <section className="user-points-hero">
          <div className="container">

            <span className="section-label">
              MI CUENTA
            </span>

            <h1>
              Mis puntos
              <span> EcoCanje.</span>
            </h1>

            <p>
              Consulta tus puntos disponibles, revisa tu
              progreso y conoce cuánto te falta para alcanzar
              el siguiente nivel.
            </p>

          </div>
        </section>

        <section className="user-points-section">

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
    <main className="user-points-page">

      <section className="user-points-hero">
        <div className="container">

          <span className="section-label">
            MI CUENTA
          </span>

          <h1>
            Mis puntos
            <span> EcoCanje.</span>
          </h1>

          <p>
            Consulta tus puntos disponibles, revisa tu progreso
            y conoce cuánto te falta para alcanzar el siguiente nivel.
          </p>

        </div>
      </section>

      <section className="user-points-section">

        <div className="container">

          <div className="points-summary">

            <article className="points-main-card">

              <span>
                PUNTOS DISPONIBLES
              </span>

              <strong>
                {puntosDisponibles}
              </strong>

              <p>
                Puntos disponibles para obtener beneficios.
              </p>

            </article>

            <article className="points-info-card">

              <span>
                PUNTOS ACUMULADOS
              </span>

              <strong>
                {puntosAcumulados}
              </strong>

              <p>
                Total de puntos obtenidos mediante tus reciclajes.
              </p>

            </article>

          </div>

          <div className="points-level-card">

            <div className="points-level-header">

              <div>

                <span className="section-label">
                  NIVEL ACTUAL
                </span>

                <h2>
                  {nivel}
                </h2>

              </div>

              <strong>
                {nivelActual.minimoSiguiente
                  ? `${puntosAcumulados} / ${nivelActual.minimoSiguiente}`
                  : `${puntosAcumulados} puntos`}
              </strong>

            </div>

            <div className="points-progress">

              <div className="points-progress-bar">

                <span
                  style={{
                    width: `${porcentaje}%`,
                  }}
                ></span>

              </div>

            </div>

            <div className="points-level-footer">

              <span>
                {nivel}
              </span>

              <span>
                {nivelActual.siguiente || 'Nivel máximo'}
              </span>

            </div>

            <p>
              {nivelActual.minimoSiguiente
                ? `Te faltan ${puntosRestantes} puntos para alcanzar el nivel ${nivelActual.siguiente}.`
                : 'Has alcanzado el nivel máximo de EcoCanje.'}
            </p>

          </div>

          <div className="points-rules">

            <div className="section-heading">

              <span>
                PUNTOS POR RECICLAJE
              </span>

              <h2>
                ¿Cómo se calculan tus puntos?
              </h2>

              <p>
                La cantidad de puntos depende del tipo y cantidad de
                material reciclable entregado.
              </p>

            </div>

            <div className="points-rules-grid">

              <article className="points-rule-card">

                <h3>
                  Botellas PET
                </h3>

                <strong>
                  10 puntos
                </strong>

                <span>
                  por cada 10 unidades
                </span>

              </article>

              <article className="points-rule-card">

                <h3>
                  Papel
                </h3>

                <strong>
                  5 puntos
                </strong>

                <span>
                  por cada 1 kg
                </span>

              </article>

              <article className="points-rule-card">

                <h3>
                  Cartón
                </h3>

                <strong>
                  6 puntos
                </strong>

                <span>
                  por cada 1 kg
                </span>

              </article>

              <article className="points-rule-card">

                <h3>
                  Latas de aluminio
                </h3>

                <strong>
                  15 puntos
                </strong>

                <span>
                  por cada 10 unidades
                </span>

              </article>

              <article className="points-rule-card">

                <h3>
                  Vidrio
                </h3>

                <strong>
                  5 puntos
                </strong>

                <span>
                  por cada 1 kg
                </span>

              </article>

              <article className="points-rule-card">

                <h3>
                  Otros reciclables
                </h3>

                <strong>
                  4 puntos
                </strong>

                <span>
                  por cada 1 kg
                </span>

              </article>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Puntos