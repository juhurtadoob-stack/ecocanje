import { useEffect, useState } from 'react'

import { supabase } from '../../lib/supabase'

function Categorias() {
  const [categorias, setCategorias] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)

  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    estado: 'activo',
  })

  useEffect(() => {
    cargarCategorias()
  }, [])

  useEffect(() => {
    if (mostrarFormulario) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mostrarFormulario])

  const cargarCategorias = async () => {
    setLoading(true)
    setError('')

    const { data, error: categoriasError } = await supabase.rpc(
      'get_admin_categories'
    )

    if (categoriasError) {
      console.error(categoriasError)

      setError(
        'No se pudieron cargar las categorías registradas.'
      )

      setLoading(false)
      return
    }

    setCategorias(data || [])
    setLoading(false)
  }

  const limpiarFormulario = () => {
    setFormulario({
      nombre: '',
      descripcion: '',
      estado: 'activo',
    })

    setCategoriaEditando(null)
  }

  const abrirNuevaCategoria = () => {
    limpiarFormulario()
    setMensaje('')
    setError('')
    setMostrarFormulario(true)
  }

  const abrirEditarCategoria = (categoria) => {
    setCategoriaEditando(categoria)

    setFormulario({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      estado: categoria.estado || 'activo',
    })

    setMensaje('')
    setError('')
    setMostrarFormulario(true)
  }

  const cerrarFormulario = () => {
    if (saving) {
      return
    }

    limpiarFormulario()
    setMostrarFormulario(false)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const guardarCategoria = async (e) => {
    e.preventDefault()

    setSaving(true)
    setError('')
    setMensaje('')

    const nombre = formulario.nombre.trim()
    const descripcion = formulario.descripcion.trim()

    if (!nombre) {
      setError(
        'El nombre de la categoría es obligatorio.'
      )

      setSaving(false)
      return
    }

    let rpcError = null

    if (categoriaEditando) {
      const { error } = await supabase.rpc(
        'update_admin_category',
        {
          p_id: categoriaEditando.id,
          p_nombre: nombre,
          p_descripcion: descripcion,
          p_estado: formulario.estado,
        }
      )

      rpcError = error
    } else {
      const { error } = await supabase.rpc(
        'create_admin_category',
        {
          p_nombre: nombre,
          p_descripcion: descripcion,
          p_estado: formulario.estado,
        }
      )

      rpcError = error
    }

    if (rpcError) {
      console.error(rpcError)

      setError(
        rpcError.message ||
          'No se pudo guardar la categoría.'
      )

      setSaving(false)
      return
    }

    setMensaje(
      categoriaEditando
        ? 'Categoría actualizada correctamente.'
        : 'Categoría creada correctamente.'
    )

    limpiarFormulario()
    setMostrarFormulario(false)

    await cargarCategorias()

    setSaving(false)
  }

  const cambiarEstado = async (categoria) => {
    const accion =
      categoria.estado === 'activo'
        ? 'desactivar'
        : 'activar'

    const confirmar = window.confirm(
      `¿Deseas ${accion} la categoría "${categoria.nombre}"?`
    )

    if (!confirmar) {
      return
    }

    setError('')
    setMensaje('')

    const { error: statusError } = await supabase.rpc(
      'toggle_admin_category_status',
      {
        p_id: categoria.id,
      }
    )

    if (statusError) {
      console.error(statusError)

      setError(
        statusError.message ||
          'No se pudo cambiar el estado de la categoría.'
      )

      return
    }

    setMensaje(
      categoria.estado === 'activo'
        ? 'Categoría desactivada correctamente.'
        : 'Categoría activada correctamente.'
    )

    await cargarCategorias()
  }

  const mostrarEstado = (estado) => {
    const estados = {
      activo: 'Activo',
      inactivo: 'Inactivo',
    }

    return estados[estado] || estado
  }

  return (
    <main className="admin-categories-page">

      <section className="admin-categories-hero">

        <div>

          <p className="section-kicker">
            GESTIÓN DE CATÁLOGO
          </p>

          <h1>
            Categorías
          </h1>

          <p>
            Administra las categorías utilizadas para
            organizar los productos de la EcoTienda.
          </p>

        </div>

      </section>

      <section className="admin-categories-section">

        <div className="admin-categories-header">

          <div>

            <p className="section-kicker">
              CLASIFICACIÓN
            </p>

            <h2>
              Categorías registradas
            </h2>

            <p>
              Crea, modifica y administra las categorías
              disponibles para el catálogo.
            </p>

          </div>

          <div className="admin-categories-actions">

            <div className="admin-categories-count">

              <span>
                Total
              </span>

              <strong>
                {categorias.length}
              </strong>

            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={abrirNuevaCategoria}
            >
              + Nueva categoría
            </button>

          </div>

        </div>

        {mensaje && (
          <div className="admin-categories-success">
            {mensaje}
          </div>
        )}

        {error && !mostrarFormulario && (
          <div className="admin-categories-message admin-categories-message-error">

            <h3>
              Ocurrió un problema
            </h3>

            <p>
              {error}
            </p>

          </div>
        )}

        {loading && (
          <div className="admin-categories-message">

            <h3>
              Cargando categorías...
            </h3>

            <p>
              Estamos consultando las categorías de EcoCanje.
            </p>

          </div>
        )}

        {!loading && !error && categorias.length === 0 && (
          <div className="admin-categories-message">

            <h3>
              No hay categorías registradas
            </h3>

            <p>
              Puedes comenzar creando la primera categoría.
            </p>

          </div>
        )}

        {!loading && !error && categorias.length > 0 && (
          <div className="admin-categories-table-container">

            <table className="admin-categories-table">

              <thead>

                <tr>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>

              </thead>

              <tbody>

                {categorias.map((categoria) => (

                  <tr key={categoria.id}>

                    <td>

                      <div className="admin-category-name">

                        <strong>
                          {categoria.nombre}
                        </strong>

                      </div>

                    </td>

                    <td>
                      {categoria.descripcion ||
                        'Sin descripción'}
                    </td>

                    <td>

                      <span className="admin-category-products-count">
                        {categoria.cantidad_productos}
                      </span>

                    </td>

                    <td>

                      <span
                        className={`admin-category-status admin-category-status-${categoria.estado}`}
                      >
                        {mostrarEstado(categoria.estado)}
                      </span>

                    </td>

                    <td>

                      {new Date(
                        categoria.created_at
                      ).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}

                    </td>

                    <td>

                      <div className="admin-category-actions">

                        <button
                          type="button"
                          className="admin-table-button"
                          onClick={() =>
                            abrirEditarCategoria(categoria)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={
                            categoria.estado === 'activo'
                              ? 'admin-table-button admin-table-button-danger'
                              : 'admin-table-button admin-table-button-success'
                          }
                          onClick={() =>
                            cambiarEstado(categoria)
                          }
                        >
                          {categoria.estado === 'activo'
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

      {mostrarFormulario && (

        <div
          className="admin-category-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarFormulario()
            }
          }}
        >

          <div
            className="admin-category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-category-modal-title"
          >

            <div className="admin-category-modal-header">

              <div>

                <p className="section-kicker">
                  {categoriaEditando
                    ? 'EDITAR CATEGORÍA'
                    : 'NUEVA CATEGORÍA'}
                </p>

                <h2 id="admin-category-modal-title">
                  {categoriaEditando
                    ? 'Modificar categoría'
                    : 'Registrar categoría'}
                </h2>

                <p>
                  Completa la información de la categoría.
                </p>

              </div>

              <button
                type="button"
                className="admin-category-modal-close"
                onClick={cerrarFormulario}
                disabled={saving}
                aria-label="Cerrar ventana"
              >
                ×
              </button>

            </div>

            <form
              className="admin-category-form"
              onSubmit={guardarCategoria}
            >

              {error && (
                <div className="admin-category-form-error">
                  {error}
                </div>
              )}

              <div className="admin-category-form-grid">

                <div className="admin-form-field">

                  <label htmlFor="nombre">
                    Nombre de la categoría
                  </label>

                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Hogar"
                    required
                  />

                </div>

                <div className="admin-form-field">

                  <label htmlFor="estado">
                    Estado
                  </label>

                  <select
                    id="estado"
                    name="estado"
                    value={formulario.estado}
                    onChange={handleChange}
                  >

                    <option value="activo">
                      Activo
                    </option>

                    <option value="inactivo">
                      Inactivo
                    </option>

                  </select>

                </div>

                <div className="admin-form-field admin-form-field-full">

                  <label htmlFor="descripcion">
                    Descripción
                  </label>

                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={handleChange}
                    placeholder="Describe brevemente la categoría."
                    rows="4"
                  />

                </div>

              </div>

              <div className="admin-category-form-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cerrarFormulario}
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
                    : categoriaEditando
                      ? 'Guardar cambios'
                      : 'Crear categoría'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  )
}

export default Categorias