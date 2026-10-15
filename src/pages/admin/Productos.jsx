import { useEffect, useState } from 'react'

import { supabase } from '../../lib/supabase'

function Productos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)

  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    imagen_url: '',
    categoria_id: '',
    estado: 'activo',
  })

  useEffect(() => {
    cargarDatos()
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

  const cargarDatos = async () => {
    setLoading(true)
    setError('')

    const [
      { data: productosData, error: productosError },
      { data: categoriasData, error: categoriasError },
    ] = await Promise.all([
      supabase.rpc('get_admin_products'),
      supabase.rpc('get_admin_categories'),
    ])

    if (productosError) {
      console.error(productosError)

      setError(
        'No se pudieron cargar los productos registrados.'
      )

      setLoading(false)
      return
    }

    if (categoriasError) {
      console.error(categoriasError)

      setError(
        'No se pudieron cargar las categorías.'
      )

      setLoading(false)
      return
    }

    setProductos(productosData || [])

    setCategorias(
      (categoriasData || []).filter(
        (categoria) => categoria.estado === 'activo'
      )
    )

    setLoading(false)
  }

  const limpiarFormulario = () => {
    setFormulario({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      imagen_url: '',
      categoria_id: '',
      estado: 'activo',
    })

    setProductoEditando(null)
  }

  const abrirNuevoProducto = () => {
    limpiarFormulario()
    setMensaje('')
    setError('')
    setMostrarFormulario(true)
  }

  const abrirEditarProducto = (producto) => {
    setProductoEditando(producto)

    setFormulario({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio ?? '',
      stock: producto.stock ?? '',
      imagen_url: producto.imagen_url || '',
      categoria_id: producto.categoria_id || '',
      estado: producto.estado || 'activo',
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

  const guardarProducto = async (e) => {
    e.preventDefault()

    setSaving(true)
    setError('')
    setMensaje('')

    const nombre = formulario.nombre.trim()
    const descripcion = formulario.descripcion.trim()
    const precio = Number(formulario.precio)
    const stock = Number(formulario.stock)

    if (!nombre) {
      setError('El nombre del producto es obligatorio.')
      setSaving(false)
      return
    }

    if (Number.isNaN(precio) || precio < 0) {
      setError('Ingresa un precio válido.')
      setSaving(false)
      return
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError(
        'El stock debe ser un número entero mayor o igual a 0.'
      )
      setSaving(false)
      return
    }

    let rpcError = null

    if (productoEditando) {
      const { error } = await supabase.rpc(
        'update_admin_product',
        {
          p_id: productoEditando.id,
          p_nombre: nombre,
          p_descripcion: descripcion,
          p_precio: precio,
          p_stock: stock,
          p_imagen_url: formulario.imagen_url.trim(),
          p_categoria_id: formulario.categoria_id
            ? Number(formulario.categoria_id)
            : null,
          p_estado: formulario.estado,
        }
      )

      rpcError = error
    } else {
      const { error } = await supabase.rpc(
        'create_admin_product',
        {
          p_nombre: nombre,
          p_descripcion: descripcion,
          p_precio: precio,
          p_stock: stock,
          p_imagen_url: formulario.imagen_url.trim(),
          p_categoria_id: formulario.categoria_id
            ? Number(formulario.categoria_id)
            : null,
          p_estado: formulario.estado,
        }
      )

      rpcError = error
    }

    if (rpcError) {
      console.error(rpcError)

      setError(
        rpcError.message ||
          'No se pudo guardar el producto.'
      )

      setSaving(false)
      return
    }

    setMensaje(
      productoEditando
        ? 'Producto actualizado correctamente.'
        : 'Producto creado correctamente.'
    )

    limpiarFormulario()
    setMostrarFormulario(false)

    await cargarDatos()

    setSaving(false)
  }

  const cambiarEstado = async (producto) => {
    const accion =
      producto.estado === 'activo'
        ? 'desactivar'
        : 'activar'

    const confirmar = window.confirm(
      `¿Deseas ${accion} el producto "${producto.nombre}"?`
    )

    if (!confirmar) {
      return
    }

    setError('')
    setMensaje('')

    const { error: statusError } = await supabase.rpc(
      'toggle_admin_product_status',
      {
        p_id: producto.id,
      }
    )

    if (statusError) {
      console.error(statusError)

      setError(
        statusError.message ||
          'No se pudo cambiar el estado del producto.'
      )

      return
    }

    setMensaje(
      producto.estado === 'activo'
        ? 'Producto desactivado correctamente.'
        : 'Producto activado correctamente.'
    )

    await cargarDatos()
  }

  const mostrarEstado = (estado) => {
    const estados = {
      activo: 'Activo',
      inactivo: 'Inactivo',
    }

    return estados[estado] || estado
  }

  return (
    <main className="admin-products-page">

      <section className="admin-products-hero">

        <div>

          <p className="section-kicker">
            GESTIÓN DE CATÁLOGO
          </p>

          <h1>
            Productos
          </h1>

          <p>
            Administra los productos disponibles en la
            EcoTienda de EcoCanje.
          </p>

        </div>

      </section>

      <section className="admin-products-section">

        <div className="admin-products-header">

          <div>

            <p className="section-kicker">
              CATÁLOGO
            </p>

            <h2>
              Productos registrados
            </h2>

            <p>
              Crea, modifica y administra los productos
              disponibles para los usuarios.
            </p>

          </div>

          <div className="admin-products-actions">

            <div className="admin-products-count">

              <span>
                Total
              </span>

              <strong>
                {productos.length}
              </strong>

            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={abrirNuevoProducto}
            >
              + Nuevo producto
            </button>

          </div>

        </div>

        {mensaje && (
          <div className="admin-products-success">
            {mensaje}
          </div>
        )}

        {error && !mostrarFormulario && (
          <div className="admin-products-message admin-products-message-error">

            <h3>
              Ocurrió un problema
            </h3>

            <p>
              {error}
            </p>

          </div>
        )}

        {loading && (
          <div className="admin-products-message">

            <h3>
              Cargando productos...
            </h3>

            <p>
              Estamos consultando el catálogo de EcoCanje.
            </p>

          </div>
        )}

        {!loading && !error && productos.length === 0 && (
          <div className="admin-products-message">

            <h3>
              No hay productos registrados
            </h3>

            <p>
              Puedes comenzar creando el primer producto.
            </p>

          </div>
        )}

        {!loading && !error && productos.length > 0 && (
          <div className="admin-products-table-container">

            <table className="admin-products-table">

              <thead>

                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>

              </thead>

              <tbody>

                {productos.map((producto) => (

                  <tr key={producto.id}>

                    <td>

                      <div className="admin-product-name">

                        <div className="admin-product-image">

                          {producto.imagen_url ? (

                            <img
                              src={producto.imagen_url}
                              alt={producto.nombre}
                            />

                          ) : (

                            <span>
                              PRODUCTO
                            </span>

                          )}

                        </div>

                        <div>

                          <strong>
                            {producto.nombre}
                          </strong>

                          <span>
                            {producto.descripcion ||
                              'Sin descripción'}
                          </span>

                        </div>

                      </div>

                    </td>

                    <td>
                      {producto.categoria_nombre ||
                        'Sin categoría'}
                    </td>

                    <td>

                      <strong>
                        S/ {Number(producto.precio).toFixed(2)}
                      </strong>

                    </td>

                    <td>

                      <span
                        className={
                          producto.stock === 0
                            ? 'admin-product-stock admin-product-stock-empty'
                            : 'admin-product-stock'
                        }
                      >
                        {producto.stock}
                      </span>

                    </td>

                    <td>

                      <span
                        className={`admin-product-status admin-product-status-${producto.estado}`}
                      >
                        {mostrarEstado(producto.estado)}
                      </span>

                    </td>

                    <td>

                      {new Date(
                        producto.created_at
                      ).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}

                    </td>

                    <td>

                      <div className="admin-product-actions">

                        <button
                          type="button"
                          className="admin-table-button"
                          onClick={() =>
                            abrirEditarProducto(producto)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={
                            producto.estado === 'activo'
                              ? 'admin-table-button admin-table-button-danger'
                              : 'admin-table-button admin-table-button-success'
                          }
                          onClick={() =>
                            cambiarEstado(producto)
                          }
                        >
                          {producto.estado === 'activo'
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
          className="admin-product-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarFormulario()
            }
          }}
        >

          <div
            className="admin-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-modal-title"
          >

            <div className="admin-product-modal-header">

              <div>

                <p className="section-kicker">
                  {productoEditando
                    ? 'EDITAR PRODUCTO'
                    : 'NUEVO PRODUCTO'}
                </p>

                <h2 id="admin-product-modal-title">
                  {productoEditando
                    ? 'Modificar producto'
                    : 'Registrar producto'}
                </h2>

                <p>
                  Completa la información principal del producto.
                </p>

              </div>

              <button
                type="button"
                className="admin-product-modal-close"
                onClick={cerrarFormulario}
                disabled={saving}
                aria-label="Cerrar ventana"
              >
                ×
              </button>

            </div>

            <form
              className="admin-product-form"
              onSubmit={guardarProducto}
            >

              {error && (
                <div className="admin-product-form-error">
                  {error}
                </div>
              )}

              <div className="admin-product-form-grid">

                <div className="admin-form-field">

                  <label htmlFor="nombre">
                    Nombre del producto
                  </label>

                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Botella reutilizable"
                    required
                  />

                </div>

                <div className="admin-form-field">

                  <label htmlFor="categoria_id">
                    Categoría
                  </label>

                  <select
                    id="categoria_id"
                    name="categoria_id"
                    value={formulario.categoria_id}
                    onChange={handleChange}
                  >

                    <option value="">
                      Sin categoría
                    </option>

                    {categorias.map((categoria) => (

                      <option
                        key={categoria.id}
                        value={categoria.id}
                      >
                        {categoria.nombre}
                      </option>

                    ))}

                  </select>

                </div>

                <div className="admin-form-field">

                  <label htmlFor="precio">
                    Precio
                  </label>

                  <input
                    id="precio"
                    name="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.precio}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />

                </div>

                <div className="admin-form-field">

                  <label htmlFor="stock">
                    Stock
                  </label>

                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.stock}
                    onChange={handleChange}
                    placeholder="0"
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

                <div className="admin-form-field">

                  <label htmlFor="imagen_url">
                    URL de imagen
                  </label>

                  <input
                    id="imagen_url"
                    name="imagen_url"
                    type="url"
                    value={formulario.imagen_url}
                    onChange={handleChange}
                    placeholder="https://..."
                  />

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
                    placeholder="Describe brevemente el producto."
                    rows="4"
                  />

                </div>

              </div>

              <div className="admin-product-form-actions">

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
                    : productoEditando
                      ? 'Guardar cambios'
                      : 'Crear producto'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  )
}

export default Productos