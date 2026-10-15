import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function MisPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarPedidos()
  }, [])

  const cargarPedidos = async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('No se pudo identificar al usuario.')
      setLoading(false)
      return
    }

    const { data, error: pedidosError } = await supabase
      .from('orders')
      .select(`
        id,
        codigo_pedido,
        subtotal,
        descuento,
        total,
        metodo_pago,
        metodo_entrega,
        direccion_entrega,
        estado,
        created_at,
        order_items (
          id,
          cantidad,
          precio_unitario,
          subtotal,
          products (
            nombre,
            imagen_url
          )
        )
      `)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    if (pedidosError) {
      console.error(pedidosError)
      setError('No se pudieron cargar tus pedidos.')
      setLoading(false)
      return
    }

    setPedidos(data || [])
    setLoading(false)
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const mostrarMetodoPago = (metodo) => {
    const metodos = {
      yape: 'Yape',
      plin: 'Plin',
      tarjeta: 'Tarjeta',
      pago_al_recoger: 'Pago al recoger',
      simulado: 'Pago simulado',
    }

    return metodos[metodo] || metodo
  }

  const mostrarMetodoEntrega = (metodo) => {
    const metodos = {
      recojo: 'Recojo en punto de acopio',
      domicilio: 'Entrega a domicilio',
    }

    return metodos[metodo] || metodo
  }

  const mostrarEstado = (estado) => {
    const estados = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      preparando: 'Preparando',
      listo_para_recojo: 'Listo para recojo',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    }

    return estados[estado] || estado
  }

  return (
    <main className="user-orders-page">

      <section className="user-orders-hero">
        <div>
          <p className="section-kicker">MI CUENTA</p>

          <h1>Mis pedidos</h1>

          <p>
            Consulta el estado y los detalles de tus pedidos realizados
            en EcoCanje.
          </p>
        </div>
      </section>


      <section className="user-orders-section">

        <div className="user-orders-header">
          <div>
            <p className="section-kicker">HISTORIAL</p>

            <h2>Mis pedidos</h2>

            <p>
              Aquí puedes consultar tus compras realizadas en EcoTienda.
            </p>
          </div>
        </div>


        {loading && (
          <div className="orders-empty">
            <h3>Cargando pedidos...</h3>

            <p>
              Estamos consultando tu historial de pedidos.
            </p>
          </div>
        )}


        {!loading && error && (
          <div className="orders-error">
            <h3>No se pudieron cargar los pedidos</h3>

            <p>{error}</p>
          </div>
        )}


        {!loading && !error && pedidos.length === 0 && (
          <div className="orders-empty">
            <h3>Aún no tienes pedidos</h3>

            <p>
              Cuando realices una compra en EcoTienda,
              podrás consultar aquí toda la información de tu pedido.
            </p>
          </div>
        )}


        {!loading && !error && pedidos.length > 0 && (
          <div className="orders-list">

            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="order-card"
              >

                <div className="order-card-header">

                  <div>
                    <p className="order-card-label">
                      Código de pedido
                    </p>

                    <h3>
                      {pedido.codigo_pedido}
                    </h3>
                  </div>

                  <span
                    className={`order-status order-status-${pedido.estado}`}
                  >
                    {mostrarEstado(pedido.estado)}
                  </span>

                </div>


                <div className="order-card-details">

                  <div>
                    <span>Fecha</span>

                    <strong>
                      {formatearFecha(pedido.created_at)}
                    </strong>
                  </div>

                  <div>
                    <span>Entrega</span>

                    <strong>
                      {mostrarMetodoEntrega(pedido.metodo_entrega)}
                    </strong>
                  </div>

                  <div>
                    <span>Pago</span>

                    <strong>
                      {mostrarMetodoPago(pedido.metodo_pago)}
                    </strong>
                  </div>

                  <div>
                    <span>Total</span>

                    <strong>
                      S/ {Number(pedido.total).toFixed(2)}
                    </strong>
                  </div>

                </div>


                <div className="order-products">

                  <h4>Productos del pedido</h4>

                  {pedido.order_items &&
                  pedido.order_items.length > 0 ? (
                    <div className="order-products-list">

                      {pedido.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="order-product"
                        >

                          <div className="order-product-image">

                            {item.products?.imagen_url ? (
                              <img
                                src={item.products.imagen_url}
                                alt={item.products.nombre}
                              />
                            ) : (
                              <span>
                                PRODUCTO
                              </span>
                            )}

                          </div>


                          <div className="order-product-info">

                            <strong>
                              {item.products?.nombre || 'Producto'}
                            </strong>

                            <span>
                              Cantidad: {item.cantidad}
                            </span>

                          </div>


                          <div className="order-product-price">

                            <strong>
                              S/ {Number(item.subtotal).toFixed(2)}
                            </strong>

                          </div>

                        </div>
                      ))}

                    </div>
                  ) : (
                    <p className="order-no-products">
                      No se encontraron productos asociados a este pedido.
                    </p>
                  )}

                </div>


                {pedido.metodo_entrega === 'domicilio' &&
                  pedido.direccion_entrega && (
                    <div className="order-address">

                      <span>
                        Dirección de entrega
                      </span>

                      <p>
                        {pedido.direccion_entrega}
                      </p>

                    </div>
                  )}

              </article>
            ))}

          </div>
        )}

      </section>

    </main>
  )
}

export default MisPedidos