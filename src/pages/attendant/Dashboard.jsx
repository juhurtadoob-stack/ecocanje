import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function Dashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    reciclajes_hoy: 0,
    usuarios_atendidos: 0,
    puntos_asignados: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    setLoading(true)

    const { data, error } = await supabase.rpc(
      'get_attendant_dashboard_stats'
    )

    if (error) {
      console.error(
        'Error al cargar estadísticas del encargado:',
        error
      )

      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      setStats({
        reciclajes_hoy: data[0].reciclajes_hoy || 0,
        usuarios_atendidos: data[0].usuarios_atendidos || 0,
        puntos_asignados: data[0].puntos_asignados || 0,
      })
    }

    setLoading(false)
  }

  return (
    <main className="attendant-dashboard">

      <section className="attendant-dashboard-hero">
        <div className="container">

          <span className="section-label">
            PANEL DEL ENCARGADO
          </span>

          <h1>
            Gestión de reciclajes
            <span> EcoCanje.</span>
          </h1>

          <p>
            Identifica usuarios, registra sus materiales reciclables
            y valida los puntos obtenidos.
          </p>

        </div>
      </section>


      <section className="attendant-dashboard-section">

        <div className="container">

          <div className="attendant-stats-grid">

            <article className="attendant-stat-card">

              <span>
                RECICLAJES DE HOY
              </span>

              <strong>
                {loading ? '...' : stats.reciclajes_hoy}
              </strong>

              <p>
                Registros realizados durante el día.
              </p>

            </article>


            <article className="attendant-stat-card">

              <span>
                USUARIOS ATENDIDOS
              </span>

              <strong>
                {loading ? '...' : stats.usuarios_atendidos}
              </strong>

              <p>
                Usuarios atendidos en el punto de acopio.
              </p>

            </article>


            <article className="attendant-stat-card">

              <span>
                PUNTOS ASIGNADOS
              </span>

              <strong>
                {loading ? '...' : stats.puntos_asignados}
              </strong>

              <p>
                Puntos otorgados mediante reciclajes validados.
              </p>

            </article>

          </div>


          <div className="attendant-actions-section">

            <div className="section-heading">

              <span>
                OPERACIONES
              </span>

              <h2>
                Gestiona los reciclajes
              </h2>

              <p>
                Utiliza las herramientas disponibles para atender
                a los usuarios de EcoCanje.
              </p>

            </div>


            <div className="attendant-actions-grid">

              <article
                className="attendant-action-card"
                onClick={() => navigate('/encargado/escanear')}
                style={{ cursor: 'pointer' }}
              >

                <div className="attendant-action-number">
                  01
                </div>

                <h3>
                  Escanear QR
                </h3>

                <p>
                  Identifica rápidamente al usuario mediante
                  su código QR de EcoCanje.
                </p>

              </article>


              <article
                className="attendant-action-card"
                onClick={() => navigate('/encargado/registrar-reciclaje')}
                style={{ cursor: 'pointer' }}
              >

                <div className="attendant-action-number">
                  02
                </div>

                <h3>
                  Registrar reciclaje
                </h3>

                <p>
                  Registra los materiales entregados y calcula
                  los puntos correspondientes.
                </p>

              </article>


              <article
                className="attendant-action-card"
                onClick={() => navigate('/encargado/reciclajes')}
                style={{ cursor: 'pointer' }}
              >

                <div className="attendant-action-number">
                  03
                </div>

                <h3>
                  Consultar reciclajes
                </h3>

                <p>
                  Revisa los registros realizados y el estado
                  de cada operación.
                </p>

              </article>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Dashboard