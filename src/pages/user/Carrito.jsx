import { useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'


function Carrito() {

  const navigate = useNavigate()


  const [items, setItems] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [actualizando, setActualizando] = useState(null)


  const cargarCarrito = async () => {

    setLoading(true)

    setError('')


    try {

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()


      if (userError) {
        throw userError
      }


      if (!user) {
        throw new Error('No hay una sesión activa.')
      }


      const { data: cartData, error: cartError } =
        await supabase
          .from('cart_items')
          .select(`
            id,
            producto_id,
            cantidad,
            created_at,
            updated_at
          `)
          .eq('usuario_id', user.id)
          .order('created_at', {
            ascending: false,
          })


      if (cartError) {
        throw cartError
      }


      if (!cartData || cartData.length === 0) {

        setItems([])

        return

      }


      const productoIds = [
        ...new Set(
          cartData.map((item) => item.producto_id)
        ),
      ]


      const {
        data: productosData,
        error: productosError,
      } = await supabase
        .from('products')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          stock,
          imagen_url,
          puntos_requeridos
        `)
        .in('id', productoIds)


      if (productosError) {
        throw productosError
      }


      const productosMap = {}


      productosData?.forEach((producto) => {

        productosMap[producto.id] = producto

      })


      const itemsCompletos = cartData.map((item) => ({

        ...item,

        producto: productosMap[item.producto_id] || null,

      }))


      setItems(itemsCompletos)


    } catch (err) {

      console.error('Error al cargar carrito:', err)


      setError(
        'No se pudo cargar tu carrito. Intenta nuevamente.'
      )


    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    cargarCarrito()

  }, [])


  const actualizarCantidad = async (item, nuevaCantidad) => {

    if (nuevaCantidad < 1) {
      return
    }


    if (
      item.producto &&
      nuevaCantidad > item.producto.stock
    ) {

      return

    }


    setActualizando(item.id)


    try {

      const { error: updateError } =
        await supabase
          .from('cart_items')
          .update({
            cantidad: nuevaCantidad,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)


      if (updateError) {
        throw updateError
      }


      setItems((itemsActuales) =>

        itemsActuales.map((itemActual) =>

          itemActual.id === item.id

            ? {
                ...itemActual,
                cantidad: nuevaCantidad,
              }

            : itemActual

        )

      )


    } catch (err) {

      console.error(
        'Error al actualizar cantidad:',
        err
      )


      setError(
        'No se pudo actualizar la cantidad.'
      )


    } finally {

      setActualizando(null)

    }

  }


  const eliminarProducto = async (item) => {

    setActualizando(item.id)


    try {

      const { error: deleteError } =
        await supabase
          .from('cart_items')
          .delete()
          .eq('id', item.id)


      if (deleteError) {
        throw deleteError
      }


      setItems((itemsActuales) =>

        itemsActuales.filter(
          (itemActual) =>
            itemActual.id !== item.id
        )

      )


    } catch (err) {

      console.error(
        'Error al eliminar producto:',
        err
      )


      setError(
        'No se pudo eliminar el producto.'
      )


    } finally {

      setActualizando(null)

    }

  }


  const calcularSubtotal = () => {

    return items.reduce((total, item) => {

      const precio = Number(
        item.producto?.precio || 0
      )


      return total + precio * item.cantidad

    }, 0)

  }


  const calcularPuntosRequeridos = () => {

    return items.reduce((total, item) => {

      const puntos = Number(
        item.producto?.puntos_requeridos || 0
      )


      return total + puntos * item.cantidad

    }, 0)

  }


  const subtotal = calcularSubtotal()

  const puntosRequeridos = calcularPuntosRequeridos()


  const cantidadTotal = items.reduce(
    (total, item) =>
      total + item.cantidad,
    0
  )


  return (

    <main className="user-cart-page">


      <section className="user-cart-hero">

        <div className="container">

          <span className="section-label">
            ECOCANJE
          </span>


          <h1>
            Mi<span> carrito.</span>
          </h1>


          <p>
            Revisa los productos que deseas adquirir antes
            de continuar con tu pedido.
          </p>

        </div>

      </section>


      <section className="user-cart-section">

        <div className="container">


          {loading && (

            <div className="cart-empty">

              <h3>
                Cargando carrito...
              </h3>

              <p>
                Estamos consultando tus productos.
              </p>

            </div>

          )}


          {!loading && error && (

            <div className="cart-error">

              <p>
                {error}
              </p>

            </div>

          )}


          {!loading &&
            !error &&
            items.length === 0 && (

              <div className="cart-empty">

                <h3>
                  Tu carrito está vacío
                </h3>

                <p>
                  Agrega productos desde EcoTienda para
                  comenzar tu compra.
                </p>


                <button
                  type="button"
                  className="cart-continue-button"
                  onClick={() =>
                    navigate('/usuario/tienda')
                  }
                >
                  Seguir comprando
                </button>

              </div>

            )}


          {!loading &&
            !error &&
            items.length > 0 && (

              <div className="cart-layout">


                <div className="cart-items">


                  {items.map((item) => (


                    <article
                      key={item.id}
                      className="cart-item"
                    >


                      <div className="cart-item-image">

                        {item.producto?.imagen_url ? (

                          <img
                            src={item.producto.imagen_url}
                            alt={item.producto.nombre}
                          />

                        ) : (

                          <span>
                            PRODUCTO
                          </span>

                        )}

                      </div>


                      <div className="cart-item-content">


                        <span className="cart-item-category">
                          PRODUCTO SOSTENIBLE
                        </span>


                        <h3>
                          {item.producto?.nombre ||
                            'Producto'}
                        </h3>


                        <p>
                          {item.producto?.descripcion ||
                            'Producto sostenible de EcoCanje.'}
                        </p>


                        <div className="cart-item-price">
                          Precio unitario{' '}
                          <strong>
                            S/ {Number(
                              item.producto?.precio || 0
                            ).toFixed(2)}
                          </strong>
                        </div>


                      </div>


                      <div className="cart-item-quantity">

                        <span>
                          Cantidad
                        </span>


                        <div className="cart-quantity-control">


                          <button
                            type="button"
                            onClick={() =>
                              actualizarCantidad(
                                item,
                                item.cantidad - 1
                              )
                            }
                            disabled={
                              item.cantidad <= 1 ||
                              actualizando === item.id
                            }
                          >
                            −
                          </button>


                          <strong>
                            {item.cantidad}
                          </strong>


                          <button
                            type="button"
                            onClick={() =>
                              actualizarCantidad(
                                item,
                                item.cantidad + 1
                              )
                            }
                            disabled={
                              actualizando === item.id ||
                              item.cantidad >=
                                (item.producto?.stock || 0)
                            }
                          >
                            +
                          </button>


                        </div>

                      </div>


                      <div className="cart-item-subtotal">

                        <span>
                          Subtotal
                        </span>


                        <strong>
                          S/ {(
                            Number(
                              item.producto?.precio || 0
                            ) * item.cantidad
                          ).toFixed(2)}
                        </strong>


                        <button
                          type="button"
                          className="cart-remove-button"
                          onClick={() =>
                            eliminarProducto(item)
                          }
                          disabled={
                            actualizando === item.id
                          }
                        >
                          Eliminar
                        </button>

                      </div>


                    </article>

                  ))}


                </div>


                <aside className="cart-summary">


                  <span className="section-label">
                    RESUMEN
                  </span>


                  <h2>
                    Tu pedido
                  </h2>


                  <div className="cart-summary-row">

                    <span>
                      Productos
                    </span>

                    <strong>
                      {cantidadTotal}
                    </strong>

                  </div>


                  <div className="cart-summary-row">

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      S/ {subtotal.toFixed(2)}
                    </strong>

                  </div>


                  <div className="cart-summary-total">

                    <span>
                      Total
                    </span>

                    <strong>
                      S/ {subtotal.toFixed(2)}
                    </strong>

                  </div>


                  <button
                    type="button"
                    className="cart-checkout-button"
                    onClick={() =>
                      navigate('/usuario/checkout')
                    }
                  >
                    Continuar compra
                  </button>


                  <button
                    type="button"
                    className="cart-continue-button"
                    onClick={() =>
                      navigate('/usuario/tienda')
                    }
                  >
                    Seguir comprando
                  </button>


                </aside>


              </div>

            )}


        </div>

      </section>


    </main>

  )

}


export default Carrito