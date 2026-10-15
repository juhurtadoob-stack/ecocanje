import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Reciclajes() {
  const [reciclajes, setReciclajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarReciclajes()
  }, [])

  const cargarReciclajes = async () => {
    setLoading(true)
    setError('')

    const { data, error: rpcError } = await supabase.rpc(
      'get_attendant_recyclings'
    )

    if (rpcError) {
      console.error('Error al cargar reciclajes:', rpcError)
      setError('No se pudieron cargar los reciclajes.')
      setReciclajes([])
      setLoading(false)
      return
    }

    setReciclajes(data || [])
    setLoading(false)
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'

    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section className="attendant-page">
      <div className="container">

        <div className="attendant-page-header">
          <div>
            <h1>Mis reciclajes</h1>

            <p>
              Consulta los reciclajes registrados por ti como encargado.
            </p>
          </div>
        </div>

        <div className="attendant-card">

          <div className="attendant-card-header">
            <div>
              <h2>Registros de reciclaje</h2>

              <p>
                Aquí aparecen los reciclajes que has registrado.
              </p>
            </div>

            <span className="attendant-count">
              {reciclajes.length} registros
            </span>
          </div>

          {loading ? (
            <div className="attendant-empty">
              Cargando reciclajes...
            </div>
          ) : error ? (
            <div className="attendant-empty">
              <h3>Error al cargar los reciclajes</h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={cargarReciclajes}
              >
                Intentar nuevamente
              </button>
            </div>
          ) : reciclajes.length === 0 ? (
            <div className="attendant-empty">
              <h3>No hay reciclajes registrados</h3>

              <p>
                Los reciclajes que registres aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="attendant-table-wrapper">

              <table className="attendant-table">

                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Material</th>
                    <th>Cantidad</th>
                    <th>Puntos</th>
                    <th>Punto de acopio</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>

                <tbody>

                  {reciclajes.map((reciclaje) => (
                    <tr key={reciclaje.id}>

                      <td>
                        {reciclaje.usuario_nombre || '-'}
                      </td>

                      <td>
                        {reciclaje.material || '-'}
                      </td>

                      <td>
                        {reciclaje.cantidad ?? '-'}{' '}
                        {reciclaje.unidad || ''}
                      </td>

                      <td>
                        {reciclaje.puntos ?? 0}
                      </td>

                      <td>
                        {reciclaje.punto_acopio || '-'}
                      </td>

                      <td>
                        {reciclaje.estado || '-'}
                      </td>

                      <td>
                        {formatearFecha(reciclaje.fecha)}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </section>
  )
}

export default Reciclajes