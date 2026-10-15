import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Dashboard() {
  const [stats, setStats] = useState({
    usuarios: 0,
    pedidos: 0,
    reciclajes: 0,
    productos: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    setLoading(true)
    setError('')

    const { data, error: statsError } = await supabase.rpc(
      'get_admin_dashboard_stats'
    )

    if (statsError) {
      console.error(statsError)
      setError(
        'No se pudieron cargar las estadísticas del panel administrativo.'
      )
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      setStats({
        usuarios: data[0].usuarios,
        pedidos: data[0].pedidos,
        reciclajes: data[0].reciclajes,
        productos: data[0].productos,
      })
    }

    setLoading(false)
  }

  return (
    <main className="admin-dashboard">

      <section className="admin-dashboard-hero">
        <div>

          <p className="section-kicker">
            PANEL DE ADMINISTRACIÓN
          </p>

          <p>
            Administra y supervisa los principales módulos de EcoCanje
            desde un solo lugar.
          </p>

        </div>
      </section>


      <section className="admin-dashboard-section">

        <div className="admin-dashboard-header">

          <div>

            <p className="section-kicker">
              RESUMEN
            </p>

            <p>
              Aquí puedes consultar los principales indicadores
              de la plataforma.
            </p>

          </div>

        </div>


        {loading && (
          <div className="orders-empty">

            <h3>
              Cargando estadísticas...
            </h3>

            <p>
              Estamos consultando la información del panel administrativo.
            </p>

          </div>
        )}


        {!loading && error && (
          <div className="orders-error">

            <h3>
              No se pudieron cargar las estadísticas
            </h3>

            <p>
              {error}
            </p>

          </div>
        )}


        {!loading && !error && (
          <div className="admin-stats-grid">

            <article className="admin-stat-card">

              <span>
                Usuarios
              </span>

              <strong>
                {stats.usuarios}
              </strong>

              <p>
                Usuarios registrados
              </p>

            </article>


            <article className="admin-stat-card">

              <span>
                Pedidos
              </span>

              <strong>
                {stats.pedidos}
              </strong>

              <p>
                Pedidos registrados
              </p>

            </article>


            <article className="admin-stat-card">

              <span>
                Reciclajes
              </span>

              <strong>
                {stats.reciclajes}
              </strong>

              <p>
                Reciclajes registrados
              </p>

            </article>


            <article className="admin-stat-card">

              <span>
                Productos
              </span>

              <strong>
                {stats.productos}
              </strong>

              <p>
                Productos disponibles
              </p>

            </article>

          </div>
        )}

      </section>

    </main>
  )
}

export default Dashboard