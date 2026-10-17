
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function AdminIcon({ name }) {
  return (
    <svg
      className="admin-stat-svg"
      viewBox="0 0 24 24"
      width="25"
      height="25"
      fill="none"
      stroke="#168044"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        display: 'block',
        flex: '0 0 25px',
        width: '25px',
        height: '25px',
        minWidth: '25px',
        margin: 0,
        transform: 'none',
      }}
    >
      {name === 'usuarios' && (
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20v-2a6.5 6.5 0 0 1 13 0v2" />
          <path d="M16 5.5a3.5 3.5 0 0 1 0 6.5" />
          <path d="M18 14a5 5 0 0 1 3.5 4.8V20" />
        </>
      )}

      {name === 'pedidos' && (
        <>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4V3h6v1" />
          <path d="M8.5 10h7" />
          <path d="M8.5 14h7" />
          <path d="M8.5 18h4" />
        </>
      )}

      {name === 'reciclajes' && (
        <>
          {/* Flecha superior */}
          <path d="M9 5 10.7 2.5h3.2L16 6" />
          <path d="M12.8 6H16V2.8" />

          {/* Flecha derecha e inferior */}
          <path d="m18 9.5 2.2 3.7-1.8 3.2h-4.1" />
          <path d="M14.3 13.5v2.9h3" />

          {/* Flecha izquierda e inferior */}
          <path d="M8.5 19H4.8l-1.7-3 2.1-3.7" />
          <path d="m8.3 15.7-3.1-1.1-.9 3" />
        </>
      )}

      {name === 'productos' && (
        <>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4.5 7.8 7.5 4.3 7.5-4.3" />
          <path d="M12 12.1V21" />
        </>
      )}
    </svg>
  )
}

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

  const indicadores = [
    {
      nombre: 'Usuarios',
      valor: stats.usuarios,
      descripcion: 'Usuarios registrados',
      icono: 'usuarios',
    },
    {
      nombre: 'Pedidos',
      valor: stats.pedidos,
      descripcion: 'Pedidos registrados',
      icono: 'pedidos',
    },
    {
      nombre: 'Reciclajes',
      valor: stats.reciclajes,
      descripcion: 'Reciclajes registrados',
      icono: 'reciclajes',
    },
    {
      nombre: 'Productos',
      valor: stats.productos,
      descripcion: 'Productos disponibles',
      icono: 'productos',
    },
  ]

  return (
    <main className="admin-dashboard">

      {/* ENCABEZADO */}
      <section className="admin-dashboard-hero">
        <div className="admin-dashboard-hero-content">

          <span className="admin-dashboard-kicker">
            <span className="admin-dashboard-kicker-line" />
            ESPACIO DE GESTIÓN
          </span>

          <h1>
            Panel de <span>administración</span>
          </h1>

          <p>
            Administra y supervisa los principales módulos de EcoCanje
            desde un solo lugar.
          </p>

        </div>
      </section>

      {/* RESUMEN */}
      <section className="admin-dashboard-section">

        <div className="admin-dashboard-header">
          <div>

            <span className="admin-dashboard-section-label">
              VISTA GENERAL
            </span>

            <h2>Resumen de la plataforma</h2>

            <p>
              Consulta los principales indicadores de EcoCanje.
            </p>

          </div>
        </div>

        {/* CARGANDO */}
        {loading && (
          <div className="admin-dashboard-state">

            <span className="admin-dashboard-loader" />

            <h3>Cargando estadísticas...</h3>

            <p>
              Estamos consultando la información del panel administrativo.
            </p>

          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="admin-dashboard-state admin-dashboard-state-error">

            <h3>No se pudieron cargar las estadísticas</h3>

            <p>{error}</p>

          </div>
        )}

        {/* TARJETAS DE ESTADÍSTICAS */}
        {!loading && !error && (
          <div className="admin-stats-grid">

            {indicadores.map((indicador) => (
              <article
                className="admin-stat-card"
                key={indicador.icono}
              >

                <div className="admin-stat-top">

                  <span
                    className="admin-stat-icon"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      padding: 0,
                      lineHeight: 0,
                      color: '#168044',
                    }}
                  >
                    <AdminIcon name={indicador.icono} />
                  </span>

                  <span className="admin-stat-status">
                    TOTAL
                  </span>

                </div>

                <span className="admin-stat-label">
                  {indicador.nombre}
                </span>

                <strong className="admin-stat-value">
                  {indicador.valor}
                </strong>

                <p className="admin-stat-description">
                  {indicador.descripcion}
                </p>

                <div className="admin-stat-bottom-line" />

              </article>
            ))}

          </div>
        )}

      </section>

    </main>
  )
}

export default Dashboard
