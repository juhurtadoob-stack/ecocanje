import { useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'


function Checkout() {

  const navigate = useNavigate()


  const [items, setItems] = useState([])

  const [cupones, setCupones] = useState([])


  const [metodoEntrega, setMetodoEntrega] = useState('recojo')

  const [metodoPago, setMetodoPago] = useState('yape')

  const [direccion, setDireccion] = useState('')

  const [cuponSeleccionado, setCuponSeleccionado] = useState('')


  const [loading, setLoading] = useState(true)

  const [confirmando, setConfirmando] = useState(false)

  const [error, setError] = useState('')

  const [mensajeError, setMensajeError] = useState('')


  const [pedidoCreado, setPedidoCreado] = useState(null)


  const cargarCheckout = async () => {

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


      /* ========================================
         OBTENER CARRITO
      ======================================== */

      const {
        data: cartData,
        error: cartError,
      } = await supabase
        .from('cart_items')
        .select(`
          id,
          producto_id,
          cantidad
        `)
        .eq('usuario_id', user.id)


      if (cartError) {
        throw cartError
      }


      if (!cartData || cartData.length === 0) {

        setItems([])

        setCupones([])

        return
      }


      const productoIds = [
        ...new Set(
          cartData.map(
            (item) => item.producto_id
          )
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
          precio,
          stock
        `)
        .in('id', productoIds)


      if (productosError) {
        throw productosError
      }


      const productosMap = {}


      productosData?.forEach((producto) => {

        productosMap[producto.id] = producto

      })


      const itemsCompletos = cartData.map(
        (item) => ({
          ...item,
          producto:
            productosMap[item.producto_id] ||
            null,
        })
      )


      setItems(itemsCompletos)


      /* ========================================
         OBTENER CUPONES
      ======================================== */

      const {
        data: cuponesData,
        error: cuponesError,
      } = await supabase
        .from('coupons')
        .select(`
          id,
          codigo,
          estado,
          fecha_vencimiento,
          beneficio_id
        `)
        .eq('usuario_id', user.id)
        .eq('estado', 'disponible')
        .order('fecha_vencimiento', {
          ascending: true,
        })


      if (cuponesError) {
        throw cuponesError
      }


      if (
        !cuponesData ||
        cuponesData.length === 0
      ) {

        setCupones([])

        return
      }


      const beneficioIds = [
        ...new Set(
          cuponesData.map(
            (cupon) => cupon.beneficio_id
          )
        ),
      ]


      const {
        data: beneficiosData,
        error: beneficiosError,
      } = await supabase
        .from('benefits')
        .select(`
          id,
          nombre,
          descuento_porcentaje
        `)
        .in('id', beneficioIds)


      if (beneficiosError) {
        throw beneficiosError
      }


      const beneficiosMap = {}


      beneficiosData?.forEach(
        (beneficio) => {

          beneficiosMap[beneficio.id] =
            beneficio

        }
      )


      const cuponesCompletos =
        cuponesData.map((cupon) => ({

          ...cupon,

          beneficio:
            beneficiosMap[
              cupon.beneficio_id
            ] || null,

        }))


      setCupones(cuponesCompletos)

    } catch (err) {

      console.error(
        'Error al cargar checkout:',
        err
      )


      setError(
        'No se pudo cargar la información de compra.'
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    cargarCheckout()

  }, [])


  /* ========================================
     CÁLCULOS
  ======================================== */

  const subtotal = items.reduce(
    (total, item) => {

      return (
        total +
        Number(
          item.producto?.precio || 0
        ) * item.cantidad
      )

    },
    0
  )


  const cuponActual = cupones.find(
    (cupon) =>
      String(cupon.id) ===
      String(cuponSeleccionado)
  )


  const descuentoPorcentaje =
    Number(
      cuponActual?.beneficio
        ?.descuento_porcentaje || 0
    )


  const descuento =
    subtotal *
    (descuentoPorcentaje / 100)


  const total =
    subtotal - descuento


  /* ========================================
     CONFIRMAR PEDIDO
  ======================================== */

  const confirmarPedido = async () => {

    setMensajeError('')

    setConfirmando(true)


    try {

      if (
        metodoEntrega === 'domicilio' &&
        !direccion.trim()
      ) {

        setMensajeError(
          'Ingresa una dirección de entrega.'
        )

        return
      }


      if (items.length === 0) {

        setMensajeError(
          'Tu carrito está vacío.'
        )

        return
      }


      /*
        Pago al recoger solo está disponible
        cuando la entrega es mediante recojo.
      */

      if (
        metodoPago === 'pago_al_recoger' &&
        metodoEntrega !== 'recojo'
      ) {

        setMensajeError(
          'El pago al recoger solo está disponible para pedidos con recojo en el punto de acopio.'
        )

        return
      }


      const couponId =
        cuponSeleccionado
          ? Number(cuponSeleccionado)
          : null


      const {
        data,
        error: orderError,
      } = await supabase.rpc(
        'create_order',
        {
          p_metodo_entrega:
            metodoEntrega,

          p_metodo_pago:
            metodoPago,

          p_direccion_entrega:
            metodoEntrega === 'domicilio'
              ? direccion.trim()
              : null,

          p_coupon_id:
            couponId,
        }
      )


      if (orderError) {

        console.error(
          'Error al crear pedido:',
          orderError
        )

        throw new Error(
          orderError.message ||
          'No se pudo crear el pedido.'
        )
      }


      if (
        !data ||
        !data[0]
      ) {

        throw new Error(
          'No se recibió información del pedido.'
        )
      }


      setPedidoCreado(
        data[0]
      )


      setItems([])

      setCupones([])

      setDireccion('')

      setCuponSeleccionado('')

    } catch (err) {

      console.error(
        'Error al confirmar pedido:',
        err
      )


      setMensajeError(
        err.message ||
        'No se pudo confirmar el pedido. Intenta nuevamente.'
      )

    } finally {

      setConfirmando(false)

    }

  }


  /* ========================================
     CARGANDO
  ======================================== */

  if (loading) {

    return (

      <main className="user-checkout-page">

        <section className="user-checkout-section">

          <div className="container">

            <div className="checkout-empty">

              <h3>
                Cargando compra...
              </h3>

              <p>
                Estamos preparando tu pedido.
              </p>

            </div>

          </div>

        </section>

      </main>

    )

  }


  /* ========================================
     PEDIDO CREADO
  ======================================== */

  if (pedidoCreado) {

    return (

      <main className="user-checkout-page">

        <section className="user-checkout-hero">

          <div className="container">

            <span className="section-label">
              ECOCANJE
            </span>

            <h1>
              Pedido
              <span> confirmado.</span>
            </h1>

            <p>
              Tu pedido fue registrado correctamente.
            </p>

          </div>

        </section>


        <section className="user-checkout-section">

          <div className="container">

            <div className="checkout-success">

              <span className="section-label">
                PEDIDO REGISTRADO
              </span>

              <h2>
                Gracias por tu compra
              </h2>

              <p>
                Tu pedido ha sido registrado correctamente
                y se encuentra pendiente de atención.
              </p>


              <div className="checkout-success-details">

                <div>

                  <span>
                    Código de pedido
                  </span>

                  <strong>
                    {pedidoCreado.codigo_pedido}
                  </strong>

                </div>


                <div>

                  <span>
                    Estado
                  </span>

                  <strong>
                    Pendiente
                  </strong>

                </div>


                <div>

                  <span>
                    Total
                  </span>

                  <strong>
                    S/ {Number(
                      pedidoCreado.total
                    ).toFixed(2)}
                  </strong>

                </div>

              </div>


              <div className="checkout-success-actions">

                <button
                  type="button"
                  className="checkout-button"
                  onClick={() =>
                    navigate('/usuario')
                  }
                >
                  Ir a mi panel
                </button>


                <button
                  type="button"
                  className="checkout-secondary-button"
                  onClick={() =>
                    navigate('/usuario/tienda')
                  }
                >
                  Volver a EcoTienda
                </button>

              </div>


            </div>

          </div>

        </section>

      </main>

    )

  }


  /* ========================================
     ERROR GENERAL
  ======================================== */

  if (error) {

    return (

      <main className="user-checkout-page">

        <section className="user-checkout-section">

          <div className="container">

            <div className="checkout-empty">

              <h3>
                No se pudo cargar el checkout
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                className="checkout-button"
                onClick={cargarCheckout}
              >
                Intentar nuevamente
              </button>

            </div>

          </div>

        </section>

      </main>

    )

  }


  /* ========================================
     CARRITO VACÍO
  ======================================== */

  if (items.length === 0) {

    return (

      <main className="user-checkout-page">

        <section className="user-checkout-section">

          <div className="container">

            <div className="checkout-empty">

              <h3>
                Tu carrito está vacío
              </h3>

              <p>
                Agrega productos en EcoTienda antes
                de continuar con la compra.
              </p>

              <button
                type="button"
                className="checkout-button"
                onClick={() =>
                  navigate('/usuario/tienda')
                }
              >
                Ir a EcoTienda
              </button>

            </div>

          </div>

        </section>

      </main>

    )

  }


  /* ========================================
     CHECKOUT
  ======================================== */

  return (

    <main className="user-checkout-page">

      <section className="user-checkout-hero">

        <div className="container">

          <span className="section-label">
            ECOCANJE
          </span>

          <h1>
            Finaliza tu
            <span> compra.</span>
          </h1>

          <p>
            Revisa tu pedido, selecciona la entrega,
            el método de pago y completa tu compra.
          </p>

        </div>

      </section>


      <section className="user-checkout-section">

        <div className="container">

          <div className="checkout-layout">


            <div className="checkout-form">


              {/* ========================================
                  MÉTODO DE ENTREGA
              ======================================== */}

              <div className="checkout-card">

                <span className="section-label">
                  ENTREGA
                </span>

                <h2>
                  ¿Cómo deseas recibir tu pedido?
                </h2>


                <div className="checkout-choice-grid">


                  <button
                    type="button"
                    className={`checkout-choice ${
                      metodoEntrega === 'recojo'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setMetodoEntrega('recojo')
                    }
                    disabled={confirmando}
                  >

                    <strong>
                      Recojo en punto de acopio
                    </strong>

                    <span>
                      Recoge tu pedido en el punto
                      de atención de EcoCanje.
                    </span>

                  </button>


                  <button
                    type="button"
                    className={`checkout-choice ${
                      metodoEntrega === 'domicilio'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setMetodoEntrega('domicilio')
                    }
                    disabled={confirmando}
                  >

                    <strong>
                      Entrega a domicilio
                    </strong>

                    <span>
                      Recibe tu pedido en la dirección
                      que indiques.
                    </span>

                  </button>


                </div>


                {metodoEntrega === 'domicilio' && (

                  <div className="checkout-address-field">

                    <label htmlFor="direccion">
                      Dirección de entrega
                    </label>

                    <textarea
                      id="direccion"
                      value={direccion}
                      onChange={(event) =>
                        setDireccion(
                          event.target.value
                        )
                      }
                      placeholder="Ingresa tu dirección de entrega"
                      rows="4"
                      disabled={confirmando}
                    />

                  </div>

                )}


                {metodoEntrega === 'recojo' && (

                  <div className="checkout-pickup-info">

                    <strong>
                      Punto de recojo
                    </strong>

                    <span>
                      Punto de Acopio EcoCanje -
                      Nuevo Chimbote
                    </span>

                    <span>
                      Av. Pacífico 1250
                    </span>

                  </div>

                )}


              </div>


              {/* ========================================
                  CUPÓN
              ======================================== */}

              <div className="checkout-card">

                <span className="section-label">
                  BENEFICIO
                </span>

                <h2>
                  ¿Tienes un cupón?
                </h2>


                {cupones.length === 0 ? (

                  <p className="checkout-muted">
                    No tienes cupones disponibles.
                  </p>

                ) : (

                  <>

                    <label htmlFor="cupon">
                      Selecciona un cupón
                    </label>


                    <select
                      id="cupon"
                      value={cuponSeleccionado}
                      onChange={(event) =>
                        setCuponSeleccionado(
                          event.target.value
                        )
                      }
                      disabled={confirmando}
                    >

                      <option value="">
                        No aplicar cupón
                      </option>


                      {cupones.map(
                        (cupon) => (

                          <option
                            key={cupon.id}
                            value={cupon.id}
                          >

                            {cupon.codigo} —{' '}

                            {cupon.beneficio
                              ?.descuento_porcentaje ||
                              0}

                            %

                          </option>

                        )
                      )}

                    </select>

                  </>

                )}


              </div>


              {/* ========================================
                  MÉTODO DE PAGO
              ======================================== */}

              <div className="checkout-card">

                <span className="section-label">
                  PAGO
                </span>

                <h2>
                  Selecciona tu método de pago
                </h2>


                <div className="checkout-choice-grid payment-grid">


                  <button
                    type="button"
                    className={`checkout-choice ${
                      metodoPago === 'yape'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setMetodoPago('yape')
                    }
                    disabled={confirmando}
                  >

                    <strong>
                      Yape
                    </strong>

                    <span>
                      Pago simulado mediante Yape.
                    </span>

                  </button>


                  <button
                    type="button"
                    className={`checkout-choice ${
                      metodoPago === 'plin'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setMetodoPago('plin')
                    }
                    disabled={confirmando}
                  >

                    <strong>
                      Plin
                    </strong>

                    <span>
                      Pago simulado mediante Plin.
                    </span>

                  </button>


                  <button
                    type="button"
                    className={`checkout-choice ${
                      metodoPago === 'tarjeta'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setMetodoPago('tarjeta')
                    }
                    disabled={confirmando}
                  >

                    <strong>
                      Tarjeta
                    </strong>

                    <span>
                      Pago simulado con tarjeta.
                    </span>

                  </button>


                  {metodoEntrega === 'recojo' && (

                    <button
                      type="button"
                      className={`checkout-choice ${
                        metodoPago === 'pago_al_recoger'
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setMetodoPago('pago_al_recoger')
                      }
                      disabled={confirmando}
                    >

                      <strong>
                        Pago al recoger
                      </strong>

                      <span>
                        Realiza el pago cuando recojas
                        tu pedido en el punto de acopio.
                      </span>

                    </button>

                  )}


                </div>


                <p className="checkout-payment-note">
                  Los métodos de pago son simulados y
                  forman parte de la demostración académica
                  del proyecto.
                </p>


              </div>


              {/* ========================================
                  ERROR
              ======================================== */}

              {mensajeError && (

                <div className="checkout-error">
                  {mensajeError}
                </div>

              )}


            </div>


            {/* ========================================
                RESUMEN
            ======================================== */}

            <aside className="checkout-summary">

              <span className="section-label">
                RESUMEN
              </span>

              <h2>
                Tu pedido
              </h2>


              <div className="checkout-products">

                {items.map(
                  (item) => (

                    <div
                      key={item.id}
                      className="checkout-product-row"
                    >

                      <div>

                        <strong>
                          {item.producto?.nombre}
                        </strong>

                        <span>
                          Cantidad: {item.cantidad}
                        </span>

                      </div>


                      <strong>
                        S/ {(
                          Number(
                            item.producto?.precio ||
                            0
                          ) *
                          item.cantidad
                        ).toFixed(2)}
                      </strong>

                    </div>

                  )
                )}

              </div>


              <div className="checkout-summary-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  S/ {subtotal.toFixed(2)}
                </strong>

              </div>


              {descuento > 0 && (

                <div className="checkout-summary-row checkout-discount">

                  <span>
                    Descuento ({descuentoPorcentaje}%)
                  </span>

                  <strong>
                    - S/ {descuento.toFixed(2)}
                  </strong>

                </div>

              )}


              <div className="checkout-total">

                <span>
                  Total
                </span>

                <strong>
                  S/ {total.toFixed(2)}
                </strong>

              </div>


              <button
                type="button"
                className="checkout-button"
                onClick={confirmarPedido}
                disabled={confirmando}
              >

                {confirmando
                  ? 'Procesando pedido...'
                  : 'Confirmar pedido'}

              </button>


              <button
                type="button"
                className="checkout-secondary-button"
                onClick={() =>
                  navigate('/usuario/carrito')
                }
                disabled={confirmando}
              >

                Volver al carrito

              </button>


            </aside>


          </div>

        </div>

      </section>

    </main>

  )

}


export default Checkout