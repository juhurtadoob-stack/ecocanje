import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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

      // Obtener el usuario actualmente autenticado
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

      // Obtener el perfil del usuario
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

      // Obtener cantidad de reciclajes del usuario
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
        <section className="dashboard-section">
          <div className="container">
            <div className="auth-loading">
              Cargando tu cuenta...
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="user-dashboard">
        <section className="dashboard-section">
          <div className="container">
            <div className="auth-loading">
              {error}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="user-dashboard">

      <section className="dashboard-hero">
        <div className="container">

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
      </section>


      <section className="dashboard-section">
        <div className="container">

          <div className="dashboard-grid">

            <article className="dashboard-card">

              <span>
                PUNTOS DISPONIBLES
              </span>

              <strong>
                {profile?.puntos_disponibles ?? 0}
              </strong>

              <p>
                Puntos que puedes utilizar para obtener beneficios.
              </p>

            </article>


            <article className="dashboard-card">

              <span>
                NIVEL ACTUAL
              </span>

              <strong>
                {profile?.nivel || 'Semilla'}
              </strong>

              <p>
                Sigue reciclando para alcanzar el siguiente nivel.
              </p>

            </article>


            <article className="dashboard-card">

              <span>
                RECICLAJES
              </span>

              <strong>
                {recyclingCount}
              </strong>

              <p>
                Entregas de materiales registradas en EcoCanje.
              </p>

            </article>


            <article className="dashboard-card">

              <span>
                BENEFICIOS
              </span>

              <strong>
                0
              </strong>

              <p>
                Beneficios disponibles en tu cuenta.
              </p>

            </article>

          </div>


          <div className="dashboard-welcome">

            <div>
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

          </div>

        </div>
      </section>

    </main>
  )
}

export default Dashboard