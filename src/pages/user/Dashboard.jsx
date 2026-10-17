import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function DashboardIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="25"
      height="25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'points' && (
        <>
          <ellipse cx="10" cy="6" rx="7" ry="3" />
          <path d="M3 6v4c0 1.7 3.1 3 7 3 1.2 0 2.3-.1 3.3-.4" />
          <path d="M3 10v4c0 1.7 3.1 3 7 3 1.1 0 2.1-.1 3-.3" />
          <path d="M3 14v3c0 1.7 3.1 3 7 3 1.2 0 2.4-.2 3.4-.5" />
          <ellipse cx="17" cy="13" rx="4" ry="2" />
          <path d="M13 13v5c0 1.1 1.8 2 4 2s4-.9 4-2v-5" />
        </>
      )}

      {name === 'level' && (
        <>
          <path d="M20.5 3.5C11 3.5 5 7.2 5 13.1c0 3.2 2.1 5.2 5 5.2 6.1 0 10.5-7 10.5-14.8Z" />
          <path d="M3 21c3.4-5.2 7.2-8.4 12-11.1" />
        </>
      )}

      {name === 'recycling' && (
        <>
          <path d="m9.2 5.2 2.1-3.4h3.5l2.1 3.5" />
          <path d="M16.9 5.3h-3l1.4 2.4" />
          <path d="m18.2 10.3 3 5.1-1.8 3h-4" />
          <path d="m19.3 18.4 1.5-2.6 1.1 2.6" />
          <path d="m7.1 11.1-4 6.8 1.7 2.6h5" />
          <path d="m5.3 17.5 2.9.1-1.5 2.7" />
          <path d="m8.3 7.1-2.1 3.6" />
        </>
      )}

      {name === 'benefits' && (
        <>
          <path d="M3 10h18v11H3z" />
          <path d="M2 6h20v4H2z" />
          <path d="M12 6v15" />
          <path d="M12 6H8.5C6.6 6 5.5 5 5.5 3.8 5.5 2.8 6.3 2 7.4 2 10 2 12 6 12 6Z" />
          <path d="M12 6h3.5C17.4 6 18.5 5 18.5 3.8c0-1-.8-1.8-1.9-1.8C14 2 12 6 12 6Z" />
        </>
      )}
    </svg>
  )
}

function DashboardIllustration() {
  return (
    <svg
      className="dashboard-illustration-svg"
      viewBox="0 0 360 270"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="184" cy="132" r="112" fill="#E4F4E9" />
      <circle cx="184" cy="132" r="85" fill="#F4FBF6" />

      <circle cx="70" cy="74" r="8" fill="#B5E3C2" />
      <circle cx="290" cy="54" r="5" fill="#B5E3C2" />
      <circle cx="300" cy="178" r="7" fill="#D1EED9" />

      <path
        d="M178 250C180 211 187 178 198 142"
        stroke="#258348"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M182 214C146 217 115 197 107 166C141 164 169 181 182 214Z"
        fill="#55B875"
      />
      <path
        d="M182 214C157 195 134 181 113 169"
        stroke="#278348"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M190 180C188 145 210 119 244 111C250 143 226 171 190 180Z"
        fill="#278348"
      />
      <path
        d="M192 175C209 155 226 136 241 118"
        stroke="#81CE94"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M192 147C161 137 145 113 151 84C180 92 198 116 192 147Z"
        fill="#75C98A"
      />
      <path
        d="M190 141C177 120 165 103 154 88"
        stroke="#278348"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M198 126C199 94 220 71 250 64C255 95 233 119 198 126Z"
        fill="#3B9C5B"
      />
      <path
        d="M201 122C217 101 233 82 248 68"
        stroke="#A7DFB3"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M167 239C146 228 131 219 119 204"
        stroke="#278348"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M218 229C245 222 266 206 276 183"
        stroke="#278348"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M222 219C242 188 267 182 285 191C275 215 250 227 222 219Z"
        fill="#8BD39D"
      />

      <path
        d="M161 238C144 236 126 244 119 258C140 264 157 254 161 238Z"
        fill="#4DAE6D"
      />
    </svg>
  )
}

function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [recyclingCount, setRecyclingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
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
        setError('No se encontró una sesión activa.')
        return
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'nombres, apellidos, puntos_disponibles, puntos_acumulados, nivel'
        )
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      setProfile(profileData)

      const {
        count,
        error: recyclingError,
      } = await supabase
        .from('recyclings')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id)

      if (recyclingError) {
        throw recyclingError
      }

      setRecyclingCount(count || 0)
    } catch (err) {
      console.error('Error al cargar el Dashboard:', err)
      setError('No se pudieron cargar los datos de tu cuenta.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="user-dashboard">
        <section className="dashboard-state-section">
          <div className="container">
            <div className="dashboard-state-card">
              <span className="dashboard-loading-indicator" />
              <p>Cargando tu cuenta...</p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="user-dashboard">
        <section className="dashboard-state-section">
          <div className="container">
            <div className="dashboard-state-card dashboard-state-error">
              <h2>No pudimos cargar tu cuenta</h2>
              <p>{error}</p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={loadDashboard}
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="user-dashboard">

      {/* BIENVENIDA */}

      <section className="dashboard-hero">
        <div className="container dashboard-hero-content">

          <div className="dashboard-hero-copy">
            <span className="section-label">
              MI CUENTA
            </span>

            <h1>
              Bienvenido
              <span>
                {' '}
                {profile?.nombres || 'a EcoCanje'}.
              </span>
            </h1>

            <p>
              Consulta tus puntos, revisa tus reciclajes y descubre
              los beneficios disponibles para ti.
            </p>
          </div>

          <div className="dashboard-hero-visual">
            <DashboardIllustration />
          </div>

        </div>
      </section>

      {/* ESTADÍSTICAS */}

      <section className="dashboard-section">
        <div className="container">

          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-section-eyebrow">
                TU RESUMEN
              </span>

              <h2>Tu actividad en EcoCanje</h2>

              <p>
                Revisa tus puntos y el avance de tu compromiso
                con el reciclaje.
              </p>
            </div>
          </div>

          <div className="dashboard-grid">

            <article className="dashboard-card dashboard-card-points">
              <div className="dashboard-card-header">
                <div className="dashboard-card-icon">
                  <DashboardIcon name="points" />
                </div>

                <span>PUNTOS DISPONIBLES</span>
              </div>

              <strong className="dashboard-card-value">
                {Number(profile?.puntos_disponibles ?? 0).toLocaleString('es-PE')}
              </strong>

              <p>
                Puntos que puedes utilizar para obtener beneficios.
              </p>
            </article>

            <article className="dashboard-card dashboard-card-level">
              <div className="dashboard-card-header">
                <div className="dashboard-card-icon">
                  <DashboardIcon name="level" />
                </div>

                <span>NIVEL ACTUAL</span>
              </div>

              <strong className="dashboard-card-value dashboard-level-value">
                {profile?.nivel || 'Semilla'}
              </strong>

              <p>
                Sigue reciclando para alcanzar el siguiente nivel.
              </p>
            </article>

            <article className="dashboard-card dashboard-card-recycling">
              <div className="dashboard-card-header">
                <div className="dashboard-card-icon">
                  <DashboardIcon name="recycling" />
                </div>

                <span>RECICLAJES</span>
              </div>

              <strong className="dashboard-card-value">
                {recyclingCount}
              </strong>

              <p>
                Entregas de materiales registradas en EcoCanje.
              </p>
            </article>

            <article className="dashboard-card dashboard-card-benefits">
              <div className="dashboard-card-header">
                <div className="dashboard-card-icon">
                  <DashboardIcon name="benefits" />
                </div>

                <span>BENEFICIOS</span>
              </div>

              <strong className="dashboard-card-value">
                0
              </strong>

              <p>
                Beneficios disponibles en tu cuenta.
              </p>
            </article>

          </div>

          {/* BANNER INFORMATIVO */}

          <section className="dashboard-welcome">
            <div className="dashboard-welcome-content">
              <span className="section-label">
                EMPIEZA A RECICLAR
              </span>

              <h2>
                Convierte tus reciclajes
                <span> en oportunidades.</span>
              </h2>

              <p>
                Lleva tus materiales a un punto de acopio,
                registra tu reciclaje y comienza a acumular puntos.
              </p>
            </div>

            <div className="dashboard-welcome-visual">
              <DashboardIllustration />
            </div>
          </section>

          <p className="dashboard-footer-note">
            Cada material cuenta. Gracias por formar parte de EcoCanje.
          </p>

        </div>
      </section>

    </main>
  )
}

export default Dashboard