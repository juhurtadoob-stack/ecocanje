import { useEffect, useMemo, useState } from 'react'

import { supabase } from '../../lib/supabase'

const ESTADOS = [
  'todos',
  'pendiente',
  'validado',
  'corregido',
  'cancelado',
]

const nombresEstado = {
  pendiente: 'Pendiente',
  validado: 'Validado',
  corregido: 'Corregido',
  cancelado: 'Cancelado',
}

function formatearEstado(estado) {
  return nombresEstado[estado] || estado
}

function formatearFecha(fecha) {
  if (!fecha) {
    return '-'
  }

  return new Date(fecha).toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function Reciclajes() {
  const [reciclajes, setReciclajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const [reciclajeSeleccionado, setReciclajeSeleccionado] =
    useState(null)

  const [detalles, setDetalles] = useState([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')

  const cargarReciclajes = async () => {
    setLoading(true)
    setError('')

    const { data, error: rpcError } = await supabase.rpc(
      'get_admin_recyclings'
    )

    if (rpcError) {
      console.error(
        'Error al cargar reciclajes:',
        rpcError
      )

      setError(
        rpcError.message ||
        'No se pudieron cargar los reciclajes.'
      )

      setReciclajes([])
      setLoading(false)
      return
    }

    setReciclajes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarReciclajes()
  }, [])

  /*
    Bloquea el scroll de la página cuando el modal
    de detalle está abierto.
  */
  useEffect(() => {
    if (!reciclajeSeleccionado) {
      return
    }

    const overflowOriginal = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowOriginal
    }
  }, [reciclajeSeleccionado])

  const reciclajesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return reciclajes.filter((reciclaje) => {
      const coincideEstado =
        filtroEstado === 'todos' ||
        reciclaje.estado === filtroEstado

      const coincideBusqueda =
        texto === '' ||
        String(reciclaje.id)
          .toLowerCase()
          .includes(texto) ||
        reciclaje.usuario_nombre
          ?.toLowerCase()
          .includes(texto) ||
        reciclaje.usuario_email
          ?.toLowerCase()
          .includes(texto) ||
        reciclaje.encargado_nombre
          ?.toLowerCase()
          .includes(texto) ||
        reciclaje.punto_acopio_nombre
          ?.toLowerCase()
          .includes(texto)

      return coincideEstado && coincideBusqueda
    })
  }, [reciclajes, busqueda, filtroEstado])

  const abrirDetalle = async (reciclaje) => {
    setReciclajeSeleccionado(reciclaje)
    setDetalles([])
    setErrorDetalle('')
    setLoadingDetalle(true)

    const { data, error: rpcError } = await supabase.rpc(
      'get_admin_recycling_details',
      {
        p_reciclaje_id: reciclaje.id,
      }
    )

    if (rpcError) {
      console.error(
        'Error al cargar detalle del reciclaje:',
        rpcError
      )

      setErrorDetalle(
        rpcError.message ||
        'No se pudo cargar el detalle del reciclaje.'
      )

      setLoadingDetalle(false)
      return
    }

    setDetalles(data || [])
    setLoadingDetalle(false)
  }

  const cerrarDetalle = () => {
    setReciclajeSeleccionado(null)
    setDetalles([])
    setErrorDetalle('')
  }

  return (
    <div className="admin-recyclings-page">

      <section className="admin-recyclings-hero">

        <div>

          <span className="admin-page-kicker">
            Administración
          </span>

          <h1>
            Reciclajes
          </h1>

          <p>
            Consulta y supervisa los registros de reciclaje
            realizados en EcoCanje.
          </p>

        </div>

      </section>

      <section className="admin-recyclings-section">

        <div className="admin-recyclings-header">

          <div>

            <h2>
              Gestión de reciclajes
            </h2>

            <p>
              Revisa usuarios, encargados, puntos de acopio,
              materiales y puntos obtenidos.
            </p>

          </div>

          <div className="admin-recyclings-count">
            {reciclajes.length} reciclaje
            {reciclajes.length !== 1 ? 's' : ''}
          </div>

        </div>

        {error && (
          <div className="admin-recyclings-message admin-recyclings-message-error">
            {error}
          </div>
        )}

        <div className="admin-recyclings-filters">

          <div className="admin-recyclings-search">

            <label htmlFor="admin-recycling-search">
              Buscar
            </label>

            <input
              id="admin-recycling-search"
              type="text"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Usuario, encargado, punto de acopio o ID..."
            />

          </div>

          <div className="admin-recyclings-status-filter">

            <label htmlFor="admin-recycling-status">
              Estado
            </label>

            <select
              id="admin-recycling-status"
              value={filtroEstado}
              onChange={(event) =>
                setFiltroEstado(event.target.value)
              }
            >

              {ESTADOS.map((estado) => (

                <option
                  key={estado}
                  value={estado}
                >
                  {estado === 'todos'
                    ? 'Todos los estados'
                    : formatearEstado(estado)}
                </option>

              ))}

            </select>

          </div>

        </div>

        {loading ? (

          <div className="admin-recyclings-message">
            Cargando reciclajes...
          </div>

        ) : reciclajesFiltrados.length === 0 ? (

          <div className="admin-recyclings-message">
            No se encontraron reciclajes con los filtros
            seleccionados.
          </div>

        ) : (

          <div className="admin-recyclings-table-container">

            <table className="admin-recyclings-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Encargado</th>
                  <th>Punto de acopio</th>
                  <th>Puntos</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>

              </thead>

              <tbody>

                {reciclajesFiltrados.map((reciclaje) => (

                  <tr key={reciclaje.id}>

                    <td>

                      <strong className="admin-recycling-id">
                        #{reciclaje.id}
                      </strong>

                    </td>

                    <td>

                      <div className="admin-recycling-person">

                        <strong>
                          {reciclaje.usuario_nombre ||
                            'Sin nombre'}
                        </strong>

                        <span>
                          {reciclaje.usuario_email || '-'}
                        </span>

                      </div>

                    </td>

                    <td>

                      <div className="admin-recycling-person">

                        <strong>
                          {reciclaje.encargado_nombre ||
                            'Sin nombre'}
                        </strong>

                      </div>

                    </td>

                    <td>

                      <div className="admin-recycling-point">

                        {reciclaje.punto_acopio_nombre ||
                          'Sin punto de acopio'}

                      </div>

                    </td>

                    <td>

                      <strong className="admin-recycling-points">
                        {reciclaje.puntos_obtenidos} pts
                      </strong>

                    </td>

                    <td>

                      <span
                        className={`admin-recycling-status admin-recycling-status-${reciclaje.estado}`}
                      >
                        {formatearEstado(
                          reciclaje.estado
                        )}
                      </span>

                    </td>

                    <td>

                      <span className="admin-recycling-date">
                        {formatearFecha(
                          reciclaje.created_at
                        )}
                      </span>

                    </td>

                    <td>

                      <div className="admin-recycling-actions">

                        <button
                          type="button"
                          className="admin-table-button"
                          onClick={() =>
                            abrirDetalle(reciclaje)
                          }
                        >
                          Ver detalle
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {reciclajeSeleccionado && (

        <div
          className="admin-recycling-modal-overlay"
          onClick={cerrarDetalle}
        >

          <div
            className="admin-recycling-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-recycling-modal-header">

              <div>

                <span className="admin-page-kicker">
                  Detalle del reciclaje
                </span>

                <h2>
                  Reciclaje #{reciclajeSeleccionado.id}
                </h2>

              </div>

              <button
                type="button"
                className="admin-recycling-modal-close"
                onClick={cerrarDetalle}
              >
                ×
              </button>

            </div>

            <div className="admin-recycling-detail">

              <div className="admin-recycling-detail-card">

                <span>
                  Usuario
                </span>

                <strong>
                  {reciclajeSeleccionado.usuario_nombre ||
                    '-'}
                </strong>

                <small>
                  {reciclajeSeleccionado.usuario_email ||
                    '-'}
                </small>

              </div>

              <div className="admin-recycling-detail-card">

                <span>
                  Estado
                </span>

                <strong>
                  {formatearEstado(
                    reciclajeSeleccionado.estado
                  )}
                </strong>

              </div>

              <div className="admin-recycling-detail-card">

                <span>
                  Encargado
                </span>

                <strong>
                  {reciclajeSeleccionado.encargado_nombre ||
                    '-'}
                </strong>

              </div>

              <div className="admin-recycling-detail-card">

                <span>
                  Punto de acopio
                </span>

                <strong>
                  {reciclajeSeleccionado.punto_acopio_nombre ||
                    '-'}
                </strong>

              </div>

              <div className="admin-recycling-detail-card admin-recycling-detail-card-total">

                <span>
                  Puntos obtenidos
                </span>

                <strong>
                  {reciclajeSeleccionado.puntos_obtenidos} puntos
                </strong>

              </div>

              <div className="admin-recycling-detail-card">

                <span>
                  Fecha de registro
                </span>

                <strong>
                  {formatearFecha(
                    reciclajeSeleccionado.created_at
                  )}
                </strong>

              </div>

              <div className="admin-recycling-detail-card admin-recycling-detail-card-full">

                <span>
                  Observaciones
                </span>

                <strong>
                  {reciclajeSeleccionado.observaciones ||
                    'Sin observaciones'}
                </strong>

              </div>

              <div className="admin-recycling-materials-section">

                <div className="admin-recycling-materials-header">

                  <div>

                    <h3>
                      Materiales registrados
                    </h3>

                    <p>
                      Materiales entregados durante este reciclaje.
                    </p>

                  </div>

                </div>

                {loadingDetalle ? (

                  <div className="admin-recycling-materials-message">
                    Cargando materiales...
                  </div>

                ) : errorDetalle ? (

                  <div className="admin-recycling-materials-message admin-recycling-materials-message-error">
                    {errorDetalle}
                  </div>

                ) : detalles.length === 0 ? (

                  <div className="admin-recycling-materials-message">
                    Este reciclaje no tiene materiales registrados.
                  </div>

                ) : (

                  <div className="admin-recycling-materials-table-container">

                    <table className="admin-recycling-materials-table">

                      <thead>

                        <tr>
                          <th>Material</th>
                          <th>Unidad</th>
                          <th>Cantidad</th>
                          <th>Puntos obtenidos</th>
                        </tr>

                      </thead>

                      <tbody>

                        {detalles.map((detalle) => (

                          <tr key={detalle.id}>

                            <td>

                              <strong>
                                {detalle.material_nombre}
                              </strong>

                            </td>

                            <td>
                              {detalle.unidad}
                            </td>

                            <td>
                              {Number(
                                detalle.cantidad
                              ).toFixed(2)}
                            </td>

                            <td>

                              <strong>
                                {detalle.puntos_obtenidos} puntos
                              </strong>

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </div>

            <div className="admin-recycling-modal-footer">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={cerrarDetalle}
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Reciclajes