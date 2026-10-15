import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function Producto() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [agregando, setAgregando] = useState(false)

  useEffect(() => {
    const cargarProducto = async () => {
      setLoading(true)
      setError('')

      const { data, error: productoError } = await supabase
        .from('products')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          stock,
          imagen_url,
          estado,
          puntos_requeridos,
          product_categories (
            id,
            nombre
          )
        `)
        .eq('id', id)
        .eq('estado', 'activo')
        .single()

      if (productoError) {
        console.error('Error al cargar producto:', productoError)
        setError('No se pudo encontrar el producto.')
        setProducto(null)
        setLoading(false)
        return
      }

      setProducto(data)
      setLoading(false)
    }

    cargarProducto()
  }, [id])

  const cerrarDetalle = () => {
    navigate('/eco-tienda')
  }

  const handleAgregarCarrito = async () => {
    setMensaje('')

    if (!producto) {
      return
    }

    if (producto.stock <= 0) {
      setMensaje('Este producto no tiene stock disponible.')
      return
    }

    setAgregando(true)

    try {
      // Verificar si el usuario ha iniciado sesión
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Si no hay sesión, llevar al inicio de sesión
      if (!session) {
        navigate('/login')
        return
      }

      // Buscar si el producto ya está en el carrito
      const { data: itemExistente, error: buscarError } =
        await supabase
          .from('cart_items')
          .select('id, cantidad')
          .eq('usuario_id', session.user.id)
          .eq('producto_id', producto.id)
          .maybeSingle()

      if (buscarError) {
        console.error(
          'Error al consultar el carrito:',
          buscarError
        )

        setMensaje(
          'No se pudo verificar el carrito.'
        )

        return
      }

      // Si ya existe, aumentar la cantidad
      if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + 1

        if (nuevaCantidad > producto.stock) {
          setMensaje(
            'No puedes agregar más unidades que el stock disponible.'
          )

          return
        }

        const { error: actualizarError } =
          await supabase
            .from('cart_items')
            .update({
              cantidad: nuevaCantidad,
            })
            .eq('id', itemExistente.id)
            .eq('usuario_id', session.user.id)

        if (actualizarError) {
          console.error(
            'Error al actualizar el carrito:',
            actualizarError
          )

          setMensaje(
            'No se pudo actualizar el carrito.'
          )

          return
        }

        setMensaje(
          'Producto agregado nuevamente al carrito.'
        )

        return
      }

      // Si no existe, crear el registro
      const { error: insertarError } =
        await supabase
          .from('cart_items')
          .insert({
            usuario_id: session.user.id,
            producto_id: producto.id,
            cantidad: 1,
          })

      if (insertarError) {
        console.error(
          'Error al agregar al carrito:',
          insertarError
        )

        setMensaje(
          'No se pudo agregar el producto al carrito.'
        )

        return
      }

      setMensaje(
        'Producto agregado al carrito correctamente.'
      )
    } catch (error) {
      console.error(
        'Error inesperado al agregar al carrito:',
        error
      )

      setMensaje(
        'Ocurrió un error al agregar el producto al carrito.'
      )
    } finally {
      setAgregando(false)
    }
  }

  if (loading) {
    return (
      <div className="product-modal-overlay">
        <div className="product-modal-loading">
          Cargando producto...
        </div>
      </div>
    )
  }

  if (error || !producto) {
    return (
      <div className="product-modal-overlay">
        <div className="product-modal-error">

          <button
            type="button"
            className="product-modal-close"
            onClick={cerrarDetalle}
            aria-label="Cerrar"
          >
            ×
          </button>

          <p>
            {error || 'Producto no encontrado.'}
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={cerrarDetalle}
          >
            Volver a EcoTienda
          </button>

        </div>
      </div>
    )
  }

  return (
    <div
      className="product-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          cerrarDetalle()
        }
      }}
    >
      <div
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >

        {/* ENCABEZADO */}

        <div className="product-modal-header">

          <div>
            <span className="product-modal-label">
              DETALLE DEL PRODUCTO
            </span>

            <h2 id="product-modal-title">
              Información del producto
            </h2>
          </div>

          <button
            type="button"
            className="product-modal-close"
            onClick={cerrarDetalle}
            aria-label="Cerrar"
          >
            ×
          </button>

        </div>


        {/* CONTENIDO */}

        <div className="product-modal-body">

          {/* IMAGEN */}

          <div className="product-modal-image">

            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
              />
            ) : (
              <span>EC</span>
            )}

          </div>


          {/* INFORMACIÓN */}

          <div className="product-modal-content">

            <span className="product-modal-category">
              {producto.product_categories?.nombre ||
                'Producto sostenible'}
            </span>

            <h3>
              {producto.nombre}
            </h3>

            <p className="product-modal-description">
              {producto.descripcion ||
                'Producto sostenible disponible en EcoCanje.'}
            </p>


            <div className="product-modal-info">

              <div className="product-modal-info-row">
                <span>Precio</span>

                <strong>
                  S/ {Number(producto.precio).toFixed(2)}
                </strong>
              </div>


              <div className="product-modal-info-row">
                <span>Puntos requeridos</span>

                <strong>
                  {producto.puntos_requeridos ?? 0} puntos
                </strong>
              </div>


              <div className="product-modal-info-row">
                <span>Stock disponible</span>

                <strong>
                  {producto.stock}
                </strong>
              </div>

            </div>


            {mensaje && (
              <div className="product-modal-message">
                {mensaje}
              </div>
            )}


            <div className="product-modal-actions">

              <button
                type="button"
                className="product-modal-cart-button"
                onClick={handleAgregarCarrito}
                disabled={agregando}
              >
                {agregando
                  ? 'Agregando...'
                  : 'Agregar al carrito'}
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default Producto