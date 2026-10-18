import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const formularioInicial = {
  nombre: '',
  direccion: '',
  referencia: '',
  distrito: '',
  provincia: '',
  departamento: '',
  horario: '',
  telefono: '',
  estado: 'activo',
}

function PuntosAcopio() {
  const [puntos, setPuntos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [puntoEditando, setPuntoEditando] = useState(null)

  const [mostrarModalEstado, setMostrarModalEstado] =
    useState(false)

  const [puntoEstadoSeleccionado, setPuntoEstadoSeleccionado] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioInicial)

  useEffect(() => {
    cargarPuntos()
  }, [])

  useEffect(() => {
    if (modalAbierto || mostrarModalEstado) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [modalAbierto, mostrarModalEstado])

  const cargarPuntos = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.rpc(
      'get_admin_collection_points'
    )

    if (error) {
      console.error(
        'Error al cargar puntos de acopio:',
        error
      )

      setError(
        error.message ||
          'No se pudieron cargar los puntos de acopio.'
      )

      setPuntos([])
    } else {
      setPuntos(data || [])
    }

    setLoading(false)
  }

  const abrirNuevo = () => {
    setPuntoEditando(null)
    setFormulario({ ...formularioInicial })
    setError('')
    setSuccess('')
    setModalAbierto(true)
  }

  const abrirEditar = (punto) => {
    setPuntoEditando(punto)

    setFormulario({
      nombre: punto.nombre || '',
      direccion: punto.direccion || '',
      referencia: punto.referencia || '',
      distrito: punto.distrito || '',
      provincia: punto.provincia || '',
      departamento: punto.departamento || '',
      horario: punto.horario || '',
      telefono: punto.telefono || '',
      estado: punto.estado || 'activo',
    })

    setError('')
    setSuccess('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (saving) {
      return
    }

    setModalAbierto(false)
    setPuntoEditando(null)
    setFormulario({ ...formularioInicial })
    setError('')
  }

  const abrirCambioEstado = (punto) => {
    setPuntoEstadoSeleccionado(punto)
    setError('')
    setSuccess('')
    setMostrarModalEstado(true)
  }

  const cerrarCambioEstado = () => {
    if (cambiandoEstado) {
      return
    }

    setMostrarModalEstado(false)
    setPuntoEstadoSeleccionado(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  const guardarPunto = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const nombre = formulario.nombre.trim()
    const direccion = formulario.direccion.trim()

    if (!nombre) {
      setError(
        'El nombre del punto de acopio es obligatorio.'
      )
      return
    }

    if (!direccion) {
      setError('La dirección es obligatoria.')
      return
    }

    setSaving(true)

    let result

    if (puntoEditando) {
      result = await supabase.rpc(
        'update_admin_collection_point',
        {
          p_id: puntoEditando.id,
          p_nombre: nombre,
          p_direccion: direccion,
          p_referencia: formulario.referencia.trim(),
          p_distrito: formulario.distrito.trim(),
          p_provincia: formulario.provincia.trim(),
          p_departamento: formulario.departamento.trim(),
          p_horario: formulario.horario.trim(),
          p_telefono: formulario.telefono.trim(),
          p_estado: formulario.estado,
        }
      )
    } else {
      result = await supabase.rpc(
        'create_admin_collection_point',
        {
          p_nombre: nombre,
          p_direccion: direccion,
          p_referencia: formulario.referencia.trim(),
          p_distrito: formulario.distrito.trim(),
          p_provincia: formulario.provincia.trim(),
          p_departamento: formulario.departamento.trim(),
          p_horario: formulario.horario.trim(),
          p_telefono: formulario.telefono.trim(),
          p_estado: formulario.estado,
        }
      )
    }

    if (result.error) {
      console.error(
        'Error al guardar punto de acopio:',
        result.error
      )

      setError(
        result.error.message ||
          'No se pudo guardar el punto de acopio.'
      )

      setSaving(false)
      return
    }

    setSaving(false)
    setModalAbierto(false)
    setPuntoEditando(null)
    setFormulario({ ...formularioInicial })

    setSuccess(
      puntoEditando
        ? 'Punto de acopio actualizado correctamente.'
        : 'Punto de acopio creado correctamente.'
    )

    await cargarPuntos()
  }

  const cambiarEstado = async () => {
    if (!puntoEstadoSeleccionado) {
      return
    }

    const punto = puntoEstadoSeleccionado

    setCambiandoEstado(true)
    setError('')
    setSuccess('')

    const { error } = await supabase.rpc(
      'toggle_admin_collection_point_status',
      {
        p_id: punto.id,
      }
    )

    if (error) {
      console.error(
        'Error al cambiar estado del punto de acopio:',
        error
      )

      setError(
        error.message ||
          'No se pudo cambiar el estado del punto de acopio.'
      )

      setCambiandoEstado(false)
      return
    }

    const accion =
      punto.estado === 'activo'
        ? 'desactivado'
        : 'activado'

    setMostrarModalEstado(false)
    setPuntoEstadoSeleccionado(null)
    setCambiandoEstado(false)

    setSuccess(
      `Punto de acopio ${accion} correctamente.`
    )

    await cargarPuntos()
  }

  const mostrarEstado = (estado) => {
    return estado === 'activo'
      ? 'Activo'
      : 'Inactivo'
  }

  const puntosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    if (!texto) {
      return puntos
    }

    return puntos.filter((punto) => {
      const contenido = [
        punto.nombre,
        punto.direccion,
        punto.referencia,
        punto.distrito,
        punto.provincia,
        punto.departamento,
        punto.horario,
        punto.telefono,
        punto.estado,
        punto.estado === 'activo' ? 'activo' : 'inactivo',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return contenido.includes(texto)
    })
  }, [puntos, busqueda])

  return (
    <section className="admin-collection-points-page">

      <div className="container">

        <div className="admin-collection-points-hero">

          <div>

            <p className="admin-page-eyebrow">
              Administración
            </p>

            <h1>
              Puntos de acopio
            </h1>

            <p>
              Gestiona los lugares donde los usuarios pueden
              entregar sus materiales reciclables.
            </p>

          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={abrirNuevo}
          >
            Nuevo punto de acopio
          </button>

        </div>


        <section className="admin-collection-points-section">

          <div className="admin-collection-points-header">

            <div>

              <h2>
                Puntos registrados
              </h2>

              <p>
                Administra la información y disponibilidad
                de los puntos de acopio.
              </p>

            </div>

            <div className="admin-collection-points-count">
              {puntos.length}{' '}
              {puntos.length === 1
                ? 'punto'
                : 'puntos'}
            </div>

          </div>


          <div className="admin-collection-points-search">

            <div className="admin-collection-points-search-field">

              <label htmlFor="buscar-puntos-acopio">
                Buscar puntos de acopio
              </label>

              <input
                id="buscar-puntos-acopio"
                type="text"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Nombre, dirección, distrito, horario, teléfono o estado..."
              />

            </div>

            {busqueda.trim() && (
              <button
                type="button"
                className="admin-collection-points-search-clear"
                onClick={() => setBusqueda('')}
              >
                Limpiar
              </button>
            )}

            <div className="admin-collection-points-search-results">
              <span>Resultados</span>
              <strong>{puntosFiltrados.length}</strong>
            </div>

          </div>


          {success && (
            <div className="admin-collection-points-success">
              {success}
            </div>
          )}


          {error && !modalAbierto && !mostrarModalEstado && (
            <div className="admin-collection-points-message admin-collection-points-message-error">
              {error}
            </div>
          )}


          {loading ? (

            <div className="admin-collection-points-message">
              Cargando puntos de acopio...
            </div>

          ) : puntos.length === 0 ? (

            <div className="admin-collection-points-message">

              <h3>
                No hay puntos de acopio registrados
              </h3>

              <p>
                Puedes comenzar creando el primer punto de acopio.
              </p>

            </div>

          ) : puntosFiltrados.length === 0 ? (

            <div className="admin-collection-points-message">

              <h3>
                No se encontraron puntos de acopio
              </h3>

              <p>
                No existen puntos de acopio que coincidan con la búsqueda.
              </p>

            </div>

          ) : (

            <div className="admin-collection-points-table-container">

              <table className="admin-collection-points-table">

                <thead>

                  <tr>
                    <th>Punto</th>
                    <th>Ubicación</th>
                    <th>Horario</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>

                </thead>

                <tbody>

                  {puntosFiltrados.map((punto) => (

                    <tr key={punto.id}>

                      <td>

                        <div className="admin-collection-point-name">
                          <strong>
                            {punto.nombre}
                          </strong>
                        </div>

                        {punto.referencia && (
                          <div className="admin-collection-point-reference">
                            {punto.referencia}
                          </div>
                        )}

                      </td>


                      <td>

                        <div className="admin-collection-point-address">
                          {punto.direccion}
                        </div>

                        {(punto.distrito ||
                          punto.provincia ||
                          punto.departamento) && (

                          <div className="admin-collection-point-location">

                            {[
                              punto.distrito,
                              punto.provincia,
                              punto.departamento,
                            ]
                              .filter(Boolean)
                              .join(', ')}

                          </div>

                        )}

                      </td>


                      <td>
                        {punto.horario ||
                          'No especificado'}
                      </td>


                      <td>
                        {punto.telefono ||
                          'No registrado'}
                      </td>


                      <td>

                        <span
                          className={`admin-collection-point-status ${
                            punto.estado === 'activo'
                              ? 'admin-collection-point-status-activo'
                              : 'admin-collection-point-status-inactivo'
                          }`}
                        >
                          {mostrarEstado(
                            punto.estado
                          )}
                        </span>

                      </td>


                      <td>

                        <div className="admin-collection-point-actions">

                          <button
                            type="button"
                            className="admin-table-button"
                            onClick={() =>
                              abrirEditar(punto)
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={
                              punto.estado === 'activo'
                                ? 'admin-table-button admin-table-button-danger'
                                : 'admin-table-button admin-table-button-success'
                            }
                            onClick={() =>
                              abrirCambioEstado(punto)
                            }
                          >
                            {punto.estado === 'activo'
                              ? 'Desactivar'
                              : 'Activar'}
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

      </div>


      {/* =====================================================
          MODAL CREAR / EDITAR PUNTO DE ACOPIO
      ===================================================== */}

      {modalAbierto && (

        <div
          className="admin-collection-point-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target === event.currentTarget
            ) {
              cerrarModal()
            }

          }}
        >

          <div
            className="admin-collection-point-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-collection-point-modal-title"
          >

            <div className="admin-collection-point-modal-header">

              <div>

                <h2 id="admin-collection-point-modal-title">
                  {puntoEditando
                    ? 'Editar punto de acopio'
                    : 'Nuevo punto de acopio'}
                </h2>

                <p>
                  Completa la información del punto de acopio.
                </p>

              </div>

              <button
                type="button"
                className="admin-collection-point-modal-close"
                onClick={cerrarModal}
                disabled={saving}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <form
              className="admin-collection-point-form"
              onSubmit={guardarPunto}
            >

              <div className="admin-collection-point-form-grid">

                <div className="admin-form-field">

                  <label htmlFor="collection-point-nombre">
                    Nombre
                  </label>

                  <input
                    id="collection-point-nombre"
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Punto de Acopio EcoCanje"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="collection-point-telefono">
                    Teléfono
                  </label>

                  <input
                    id="collection-point-telefono"
                    type="text"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={handleChange}
                    placeholder="Ej. 999999999"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field admin-collection-point-form-full">

                  <label htmlFor="collection-point-direccion">
                    Dirección
                  </label>

                  <input
                    id="collection-point-direccion"
                    type="text"
                    name="direccion"
                    value={formulario.direccion}
                    onChange={handleChange}
                    placeholder="Ej. Av. Pacífico 1250"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field admin-collection-point-form-full">

                  <label htmlFor="collection-point-referencia">
                    Referencia
                  </label>

                  <input
                    id="collection-point-referencia"
                    type="text"
                    name="referencia"
                    value={formulario.referencia}
                    onChange={handleChange}
                    placeholder="Ej. Frente al parque principal"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="collection-point-distrito">
                    Distrito
                  </label>

                  <input
                    id="collection-point-distrito"
                    type="text"
                    name="distrito"
                    value={formulario.distrito}
                    onChange={handleChange}
                    placeholder="Ej. Nuevo Chimbote"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="collection-point-provincia">
                    Provincia
                  </label>

                  <input
                    id="collection-point-provincia"
                    type="text"
                    name="provincia"
                    value={formulario.provincia}
                    onChange={handleChange}
                    placeholder="Ej. Santa"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="collection-point-departamento">
                    Departamento
                  </label>

                  <input
                    id="collection-point-departamento"
                    type="text"
                    name="departamento"
                    value={formulario.departamento}
                    onChange={handleChange}
                    placeholder="Ej. Áncash"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="collection-point-estado">
                    Estado
                  </label>

                  <select
                    id="collection-point-estado"
                    name="estado"
                    value={formulario.estado}
                    onChange={handleChange}
                    disabled={saving}
                  >

                    <option value="activo">
                      Activo
                    </option>

                    <option value="inactivo">
                      Inactivo
                    </option>

                  </select>

                </div>


                <div className="admin-form-field admin-collection-point-form-full">

                  <label htmlFor="collection-point-horario">
                    Horario
                  </label>

                  <input
                    id="collection-point-horario"
                    type="text"
                    name="horario"
                    value={formulario.horario}
                    onChange={handleChange}
                    placeholder="Ej. Lunes a sábado, 8:00 a.m. - 6:00 p.m."
                    disabled={saving}
                  />

                </div>

              </div>


              {error && (
                <div className="admin-collection-point-form-error">
                  {error}
                </div>
              )}


              <div className="admin-collection-point-form-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cerrarModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Guardando...'
                    : puntoEditando
                      ? 'Guardar cambios'
                      : 'Crear punto'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          MODAL ACTIVAR / DESACTIVAR PUNTO DE ACOPIO
      ===================================================== */}

      {mostrarModalEstado &&
        puntoEstadoSeleccionado && (

          <div
            className="admin-collection-status-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target === event.currentTarget &&
                !cambiandoEstado
              ) {
                cerrarCambioEstado()
              }

            }}
          >

            <div
              className="admin-collection-status-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-collection-status-modal-title"
            >

              <div className="admin-collection-status-modal-header">

                <div>

                  <p className="admin-collection-status-modal-kicker">
                    GESTIÓN DE PUNTO DE ACOPIO
                  </p>

                  <h2 id="admin-collection-status-modal-title">
                    {puntoEstadoSeleccionado.estado ===
                    'activo'
                      ? 'Desactivar punto de acopio'
                      : 'Activar punto de acopio'}
                  </h2>

                  <p>
                    {puntoEstadoSeleccionado.estado ===
                    'activo'
                      ? 'El punto dejará de estar disponible para los usuarios.'
                      : 'El punto volverá a estar disponible para los usuarios.'}
                  </p>

                </div>


                <button
                  type="button"
                  className="admin-collection-status-modal-close"
                  onClick={cerrarCambioEstado}
                  disabled={cambiandoEstado}
                  aria-label="Cerrar ventana"
                >
                  ×
                </button>

              </div>


              <div className="admin-collection-status-point">

                <span className="admin-collection-status-point-label">
                  PUNTO DE ACOPIO SELECCIONADO
                </span>

                <strong>
                  {puntoEstadoSeleccionado.nombre}
                </strong>

                <p>
                  {puntoEstadoSeleccionado.direccion ||
                    'Sin dirección registrada.'}
                </p>

                {(puntoEstadoSeleccionado.distrito ||
                  puntoEstadoSeleccionado.provincia ||
                  puntoEstadoSeleccionado.departamento) && (

                  <span className="admin-collection-status-point-location">

                    {[
                      puntoEstadoSeleccionado.distrito,
                      puntoEstadoSeleccionado.provincia,
                      puntoEstadoSeleccionado.departamento,
                    ]
                      .filter(Boolean)
                      .join(', ')}

                  </span>

                )}

              </div>


              <div className="admin-collection-status-current">

                <span>
                  Estado actual
                </span>

                <strong
                  className={
                    puntoEstadoSeleccionado.estado ===
                    'activo'
                      ? 'is-active'
                      : 'is-inactive'
                  }
                >
                  <span className="admin-collection-status-dot" />

                  {mostrarEstado(
                    puntoEstadoSeleccionado.estado
                  )}
                </strong>

              </div>


              <div className="admin-collection-status-modal-message">

                <strong>
                  {puntoEstadoSeleccionado.estado ===
                  'activo'
                    ? '¿Deseas desactivar este punto de acopio?'
                    : '¿Deseas activar este punto de acopio?'}
                </strong>

                <p>
                  {puntoEstadoSeleccionado.estado ===
                  'activo'
                    ? 'Los usuarios ya no podrán utilizar este punto de acopio mientras permanezca inactivo.'
                    : 'Los usuarios podrán volver a utilizar este punto de acopio.'}
                </p>

              </div>


              <div className="admin-collection-status-modal-actions">

                <button
                  type="button"
                  className="admin-collection-status-cancel-button"
                  onClick={cerrarCambioEstado}
                  disabled={cambiandoEstado}
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className={
                    puntoEstadoSeleccionado.estado ===
                    'activo'
                      ? 'admin-collection-status-confirm-button admin-collection-status-confirm-danger'
                      : 'admin-collection-status-confirm-button admin-collection-status-confirm-success'
                  }
                  onClick={cambiarEstado}
                  disabled={cambiandoEstado}
                >
                  {cambiandoEstado
                    ? 'Procesando...'
                    : puntoEstadoSeleccionado.estado ===
                      'activo'
                      ? 'Sí, desactivar'
                      : 'Sí, activar'}
                </button>

              </div>

            </div>

          </div>

        )}

    </section>
  )
}

export default PuntosAcopio