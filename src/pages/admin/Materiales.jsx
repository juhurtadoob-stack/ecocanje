import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const formularioInicial = {
  nombre: '',
  unidad: 'kg',
  cantidad_base: '',
  puntos_base: '',
  descripcion: '',
  estado: 'activo',
}

function Materiales() {
  const [materiales, setMateriales] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [busqueda, setBusqueda] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [materialEditando, setMaterialEditando] = useState(null)

  const [mostrarModalEstado, setMostrarModalEstado] =
    useState(false)

  const [materialEstadoSeleccionado, setMaterialEstadoSeleccionado] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioInicial)

  useEffect(() => {
    cargarMateriales()
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

  const cargarMateriales = async () => {
    setLoading(true)
    setError('')

    const { data, error: materialesError } =
      await supabase.rpc('get_admin_materials')

    if (materialesError) {
      console.error(materialesError)

      setError(
        materialesError.message ||
          'No se pudieron cargar los materiales.'
      )

      setMateriales([])
      setLoading(false)
      return
    }

    setMateriales(data || [])
    setLoading(false)
  }

  const materialesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    if (!texto) {
      return materiales
    }

    return materiales.filter((material) => {
      const contenido = [
        material.nombre,
        material.descripcion,
        material.unidad,
        material.cantidad_base,
        material.puntos_base,
        material.estado,
      ]
        .filter(
          (valor) =>
            valor !== null &&
            valor !== undefined
        )
        .join(' ')
        .toLowerCase()

      return contenido.includes(texto)
    })
  }, [materiales, busqueda])

  const abrirNuevo = () => {
    setMaterialEditando(null)
    setFormulario({
      ...formularioInicial,
    })
    setError('')
    setSuccess('')
    setModalAbierto(true)
  }

  const abrirEditar = (material) => {
    setMaterialEditando(material)

    setFormulario({
      nombre: material.nombre || '',
      unidad: material.unidad || 'kg',
      cantidad_base:
        material.cantidad_base ?? '',
      puntos_base:
        material.puntos_base ?? '',
      descripcion:
        material.descripcion || '',
      estado:
        material.estado || 'activo',
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
    setMaterialEditando(null)
    setFormulario({
      ...formularioInicial,
    })
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  const guardarMaterial = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const nombre = formulario.nombre.trim()
    const unidad = formulario.unidad.trim()
    const cantidadBase = Number(
      formulario.cantidad_base
    )
    const puntosBase = Number(
      formulario.puntos_base
    )
    const descripcion =
      formulario.descripcion.trim()

    if (!nombre) {
      setError(
        'El nombre del material es obligatorio.'
      )
      return
    }

    if (!unidad) {
      setError(
        'La unidad del material es obligatoria.'
      )
      return
    }

    if (
      !Number.isFinite(cantidadBase) ||
      cantidadBase <= 0
    ) {
      setError(
        'La cantidad base debe ser mayor que cero.'
      )
      return
    }

    if (
      !Number.isInteger(puntosBase) ||
      puntosBase <= 0
    ) {
      setError(
        'Los puntos base deben ser un número entero mayor que cero.'
      )
      return
    }

    setSaving(true)

    let resultado

    if (materialEditando) {
      resultado = await supabase.rpc(
        'update_admin_material',
        {
          p_id: materialEditando.id,
          p_nombre: nombre,
          p_unidad: unidad,
          p_cantidad_base: cantidadBase,
          p_puntos_base: puntosBase,
          p_descripcion: descripcion,
          p_estado: formulario.estado,
        }
      )
    } else {
      resultado = await supabase.rpc(
        'create_admin_material',
        {
          p_nombre: nombre,
          p_unidad: unidad,
          p_cantidad_base: cantidadBase,
          p_puntos_base: puntosBase,
          p_descripcion: descripcion,
          p_estado: formulario.estado,
        }
      )
    }

    if (resultado.error) {
      console.error(resultado.error)

      setError(
        resultado.error.message ||
          'No se pudo guardar el material.'
      )

      setSaving(false)
      return
    }

    setSaving(false)
    setModalAbierto(false)
    setMaterialEditando(null)

    setFormulario({
      ...formularioInicial,
    })

    setSuccess(
      materialEditando
        ? 'Material actualizado correctamente.'
        : 'Material creado correctamente.'
    )

    await cargarMateriales()
  }

  const abrirCambioEstado = (material) => {
    setMaterialEstadoSeleccionado(material)
    setError('')
    setSuccess('')
    setMostrarModalEstado(true)
  }

  const cerrarCambioEstado = () => {
    if (cambiandoEstado) {
      return
    }

    setMostrarModalEstado(false)
    setMaterialEstadoSeleccionado(null)
  }

  const cambiarEstado = async () => {
    if (!materialEstadoSeleccionado) {
      return
    }

    setCambiandoEstado(true)
    setError('')
    setSuccess('')

    const material =
      materialEstadoSeleccionado

    const accion =
      material.estado === 'activo'
        ? 'desactivar'
        : 'activar'

    const { error: statusError } =
      await supabase.rpc(
        'toggle_admin_material_status',
        {
          p_id: material.id,
        }
      )

    if (statusError) {
      console.error(statusError)

      setError(
        statusError.message ||
          'No se pudo cambiar el estado del material.'
      )

      setCambiandoEstado(false)
      return
    }

    setMostrarModalEstado(false)
    setMaterialEstadoSeleccionado(null)

    setSuccess(
      `Material ${
        accion === 'activar'
          ? 'activado'
          : 'desactivado'
      } correctamente.`
    )

    await cargarMateriales()

    setCambiandoEstado(false)
  }

  const mostrarEstado = (estado) => {
    return estado === 'activo'
      ? 'Activo'
      : 'Inactivo'
  }

  return (
    <main className="admin-materials-page">

      <section className="admin-materials-hero">

        <div>

          <p className="section-kicker">
            GESTIÓN DE CATÁLOGO
          </p>

          <h1>
            Materiales reciclables
          </h1>

          <p>
            Gestiona los materiales, unidades,
            cantidades base y puntos asignados
            al reciclaje.
          </p>

        </div>

      </section>

      <section className="admin-materials-section">

        <div className="admin-materials-header">

          <div>

            <p className="section-kicker">
              CONFIGURACIÓN
            </p>

            <h2>
              Materiales registrados
            </h2>

            <p>
              Administra los valores utilizados para
              calcular los puntos de reciclaje.
            </p>

          </div>

          <div className="admin-materials-actions">

            <div className="admin-materials-count">

              <span>
                Total
              </span>

              <strong>
                {materiales.length}
              </strong>

            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={abrirNuevo}
            >
              + Nuevo material
            </button>

          </div>

        </div>

        {success && (
          <div className="admin-materials-success">
            {success}
          </div>
        )}

        {error &&
          !modalAbierto &&
          !mostrarModalEstado && (
            <div className="admin-materials-message admin-materials-message-error">

              <h3>
                Ocurrió un problema
              </h3>

              <p>
                {error}
              </p>

            </div>
          )}

        {loading && (
          <div className="admin-materials-message">

            <h3>
              Cargando materiales...
            </h3>

            <p>
              Estamos consultando los materiales
              registrados.
            </p>

          </div>
        )}

        {!loading &&
          !error &&
          materiales.length === 0 && (
            <div className="admin-materials-message">

              <h3>
                No hay materiales registrados
              </h3>

              <p>
                Puedes comenzar creando el primer
                material reciclable.
              </p>

            </div>
          )}

        {!loading &&
          !error &&
          materiales.length > 0 && (

            <div
              className="admin-materials-content"
              style={{
                width: '100%',
                maxWidth: '1400px',
                margin: '0 auto',
                boxSizing: 'border-box',
              }}
            >

              <div
                className="admin-products-search"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  margin: '0 0 20px 0',
                }}
              >

                <div className="admin-products-search-field">

                  <label htmlFor="buscar-materiales">
                    Buscar materiales
                  </label>

                  <input
                    id="buscar-materiales"
                    type="text"
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(
                        event.target.value
                      )
                    }
                    placeholder="Nombre, descripción, unidad, puntos o estado..."
                  />

                </div>

                {busqueda.trim() && (
                  <button
                    type="button"
                    className="admin-products-search-clear"
                    onClick={() =>
                      setBusqueda('')
                    }
                  >
                    Limpiar
                  </button>
                )}

                <div className="admin-products-search-results">

                  <span>
                    Resultados
                  </span>

                  <strong>
                    {materialesFiltrados.length}
                  </strong>

                </div>

              </div>

              {materialesFiltrados.length === 0 && (

                <div className="admin-benefits-message">

                  <h3>
                    No se encontraron materiales
                  </h3>

                  <p>
                    No existen materiales que
                    coincidan con la búsqueda.
                  </p>

                </div>

              )}

              {materialesFiltrados.length > 0 && (

                <div className="admin-materials-table-container">

                  <table className="admin-materials-table">

                    <thead>

                      <tr>

                        <th>
                          Material
                        </th>

                        <th>
                          Unidad
                        </th>

                        <th>
                          Cantidad base
                        </th>

                        <th>
                          Puntos base
                        </th>

                        <th>
                          Estado
                        </th>

                        <th>
                          Acciones
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {materialesFiltrados.map(
                        (material) => (

                          <tr
                            key={material.id}
                          >

                            <td>

                              <div className="admin-material-name">

                                <strong>
                                  {material.nombre}
                                </strong>

                                <span>
                                  {material.descripcion ||
                                    'Sin descripción'}
                                </span>

                              </div>

                            </td>

                            <td>
                              {material.unidad}
                            </td>

                            <td>
                              {Number(
                                material.cantidad_base
                              )}
                            </td>

                            <td>

                              <span className="admin-material-points">
                                {material.puntos_base}{' '}
                                puntos
                              </span>

                            </td>

                            <td>

                              <span
                                className={
                                  `admin-material-status ${
                                    material.estado ===
                                    'activo'
                                      ? 'admin-material-status-activo'
                                      : 'admin-material-status-inactivo'
                                  }`
                                }
                              >
                                {mostrarEstado(
                                  material.estado
                                )}
                              </span>

                            </td>

                            <td>

                              <div className="admin-material-actions">

                                <button
                                  type="button"
                                  className="admin-table-button"
                                  onClick={() =>
                                    abrirEditar(
                                      material
                                    )
                                  }
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  className={
                                    material.estado ===
                                    'activo'
                                      ? 'admin-table-button admin-table-button-danger'
                                      : 'admin-table-button admin-table-button-success'
                                  }
                                  onClick={() =>
                                    abrirCambioEstado(
                                      material
                                    )
                                  }
                                >
                                  {material.estado ===
                                  'activo'
                                    ? 'Desactivar'
                                    : 'Activar'}
                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          )}

      </section>

      {modalAbierto && (

        <div
          className="admin-material-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarModal()
            }
          }}
        >

          <div
            className="admin-material-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-material-modal-title"
          >

            <div className="admin-material-modal-header">

              <div>

                <p className="section-kicker">
                  {materialEditando
                    ? 'EDITAR MATERIAL'
                    : 'NUEVO MATERIAL'}
                </p>

                <h2 id="admin-material-modal-title">
                  {materialEditando
                    ? 'Modificar material'
                    : 'Registrar material'}
                </h2>

                <p>
                  Completa la información del
                  material reciclable.
                </p>

              </div>

              <button
                type="button"
                className="admin-material-modal-close"
                onClick={cerrarModal}
                disabled={saving}
                aria-label="Cerrar ventana"
              >
                ×
              </button>

            </div>

            <form
              className="admin-material-form"
              onSubmit={guardarMaterial}
            >

              {error && (
                <div className="admin-material-form-error">
                  {error}
                </div>
              )}

              <div className="admin-material-form-grid">

                <div className="admin-form-field">

                  <label htmlFor="material-nombre">
                    Nombre
                  </label>

                  <input
                    id="material-nombre"
                    name="nombre"
                    type="text"
                    value={
                      formulario.nombre
                    }
                    onChange={handleChange}
                    placeholder="Ej. Cartón"
                    disabled={saving}
                  />

                </div>

                <div className="admin-form-field">

                  <label htmlFor="material-unidad">
                    Unidad
                  </label>

                  <select
                    id="material-unidad"
                    name="unidad"
                    value={
                      formulario.unidad
                    }
                    onChange={handleChange}
                    disabled={saving}
                  >

                    <option value="kg">
                      kg
                    </option>

                    <option value="unidad">
                      unidad
                    </option>

                    <option value="unidades">
                      unidades
                    </option>

                    <option value="litro">
                      litro
                    </option>

                    <option value="litros">
                      litros
                    </option>

                  </select>

                </div>

                <div className="admin-form-field">

                  <label htmlFor="material-cantidad">
                    Cantidad base
                  </label>

                  <input
                    id="material-cantidad"
                    name="cantidad_base"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      formulario.cantidad_base
                    }
                    onChange={handleChange}
                    placeholder="Ej. 1"
                    disabled={saving}
                  />

                  <small>
                    Cantidad necesaria para obtener
                    los puntos base.
                  </small>

                </div>

                <div className="admin-form-field">

                  <label htmlFor="material-puntos">
                    Puntos base
                  </label>

                  <input
                    id="material-puntos"
                    name="puntos_base"
                    type="number"
                    min="1"
                    step="1"
                    value={
                      formulario.puntos_base
                    }
                    onChange={handleChange}
                    placeholder="Ej. 6"
                    disabled={saving}
                  />

                </div>

                <div className="admin-form-field">

                  <label htmlFor="material-estado">
                    Estado
                  </label>

                  <select
                    id="material-estado"
                    name="estado"
                    value={
                      formulario.estado
                    }
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

                <div className="admin-form-field admin-material-form-full">

                  <label htmlFor="material-descripcion">
                    Descripción
                  </label>

                  <textarea
                    id="material-descripcion"
                    name="descripcion"
                    value={
                      formulario.descripcion
                    }
                    onChange={handleChange}
                    placeholder="Descripción opcional del material."
                    rows="4"
                    disabled={saving}
                  />

                </div>

              </div>

              <div className="admin-material-form-actions">

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
                    : materialEditando
                      ? 'Guardar cambios'
                      : 'Crear material'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {mostrarModalEstado &&
        materialEstadoSeleccionado && (

          <div
            className="admin-status-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                  event.currentTarget &&
                !cambiandoEstado
              ) {
                cerrarCambioEstado()
              }

            }}
          >

            <div
              className="admin-status-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-material-status-modal-title"
            >

              <div className="admin-status-modal-header">

                <div>

                  <p className="admin-status-modal-kicker">
                    GESTIÓN DE MATERIAL
                  </p>

                  <h2 id="admin-material-status-modal-title">

                    {materialEstadoSeleccionado.estado ===
                    'activo'
                      ? 'Desactivar material'
                      : 'Activar material'}

                  </h2>

                  <p>

                    {materialEstadoSeleccionado.estado ===
                    'activo'
                      ? 'El material dejará de estar disponible para el reciclaje.'
                      : 'El material volverá a estar disponible para el reciclaje.'}

                  </p>

                </div>

                <button
                  type="button"
                  className="admin-status-modal-close"
                  onClick={
                    cerrarCambioEstado
                  }
                  disabled={
                    cambiandoEstado
                  }
                  aria-label="Cerrar ventana"
                >
                  ×
                </button>

              </div>

              <div className="admin-status-category">

                <span className="admin-status-category-label">
                  MATERIAL SELECCIONADO
                </span>

                <strong className="admin-status-category-name">
                  {
                    materialEstadoSeleccionado.nombre
                  }
                </strong>

                <p className="admin-status-category-description">
                  {
                    materialEstadoSeleccionado.descripcion ||
                    'Sin descripción disponible.'
                  }
                </p>

              </div>

              <div className="admin-status-current">

                <span>
                  Estado actual
                </span>

                <strong
                  className={
                    materialEstadoSeleccionado.estado ===
                    'activo'
                      ? 'is-active'
                      : 'is-inactive'
                  }
                >

                  <span className="admin-status-dot" />

                  {mostrarEstado(
                    materialEstadoSeleccionado.estado
                  )}

                </strong>

              </div>

              <div className="admin-status-modal-message">

                <strong>

                  {materialEstadoSeleccionado.estado ===
                  'activo'
                    ? '¿Deseas desactivar este material?'
                    : '¿Deseas activar este material?'}

                </strong>

                <p>

                  {materialEstadoSeleccionado.estado ===
                  'activo'
                    ? 'El material ya no podrá utilizarse para registrar nuevos reciclajes mientras permanezca inactivo.'
                    : 'El material podrá volver a utilizarse para registrar reciclajes en EcoCanje.'}

                </p>

              </div>

              <div className="admin-status-modal-actions">

                <button
                  type="button"
                  className="admin-status-cancel-button"
                  onClick={
                    cerrarCambioEstado
                  }
                  disabled={
                    cambiandoEstado
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className={
                    materialEstadoSeleccionado.estado ===
                    'activo'
                      ? 'admin-status-confirm-button admin-status-confirm-danger'
                      : 'admin-status-confirm-button admin-status-confirm-success'
                  }
                  onClick={cambiarEstado}
                  disabled={
                    cambiandoEstado
                  }
                >

                  {cambiandoEstado
                    ? 'Procesando...'
                    : materialEstadoSeleccionado.estado ===
                      'activo'
                      ? 'Sí, desactivar'
                      : 'Sí, activar'}

                </button>

              </div>

            </div>

          </div>

        )}

    </main>
  )
}

export default Materiales