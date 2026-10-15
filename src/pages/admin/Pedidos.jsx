import { useEffect, useMemo, useState } from 'react'

import { supabase } from '../../lib/supabase'

const ESTADOS = [
  'todos',
  'pendiente',
  'confirmado',
  'preparando',
  'listo_para_recojo',
  'enviado',
  'entregado',
  'cancelado',
]

const ESTADOS_CAMBIO = [
  'pendiente',
  'confirmado',
  'preparando',
  'listo_para_recojo',
  'enviado',
  'entregado',
  'cancelado',
]

const nombresEstado = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  listo_para_recojo: 'Listo para recojo',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const nombresMetodoPago = {
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
  pago_al_recoger: 'Pago al recoger',
  simulado: 'Simulado',
}

const nombresMetodoEntrega = {
  recojo: 'Recojo',
  domicilio: 'Domicilio',
}

function formatearEstado(estado) {
  return nombresEstado[estado] || estado
}

function formatearMetodoPago(metodo) {
  return nombresMetodoPago[metodo] || metodo
}

function formatearMetodoEntrega(metodo) {
  return nombresMetodoEntrega[metodo] || metodo
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

function formatearMoneda(valor) {
  return `S/ ${Number(valor || 0).toFixed(2)}`
}

function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
  const [productosPedido, setProductosPedido] = useState([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')

  const [nuevoEstado, setNuevoEstado] = useState('')
  const [actualizandoEstado, setActualizandoEstado] = useState(false)
  const [mensajeEstado, setMensajeEstado] = useState('')
  const [errorEstado, setErrorEstado] = useState('')

  useEffect(() => {
    if (pedidoSeleccionado) {
      const overflowOriginal = document.body.style.overflow

      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = overflowOriginal
      }
    }
  }, [pedidoSeleccionado])

  const cargarPedidos = async () => {
    setLoading(true)
    setError('')

    const { data, error: rpcError } = await supabase.rpc(
      'get_admin_orders'
    )

    if (rpcError) {
      console.error('Error al cargar pedidos:', rpcError)

      setError(
        rpcError.message ||
          'No se pudieron cargar los pedidos.'
      )

      setPedidos([])
      setLoading(false)
      return
    }

    setPedidos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarPedidos()
  }, [])

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return pedidos.filter((pedido) => {
      const coincideEstado =
        filtroEstado === 'todos' ||
        pedido.estado === filtroEstado

      const coincideBusqueda =
        texto === '' ||
        pedido.codigo_pedido
          ?.toLowerCase()
          .includes(texto) ||
        pedido.usuario_nombre
          ?.toLowerCase()
          .includes(texto) ||
        pedido.usuario_email
          ?.toLowerCase()
          .includes(texto)

      return coincideEstado && coincideBusqueda
    })
  }, [pedidos, busqueda, filtroEstado])

  const abrirDetalle = async (pedido) => {
    setPedidoSeleccionado(pedido)
    setProductosPedido([])
    setErrorDetalle('')
    setNuevoEstado(pedido.estado)
    setMensajeEstado('')
    setErrorEstado('')
    setLoadingDetalle(true)

    const { data, error: rpcError } = await supabase.rpc(
      'get_admin_order_items',
      {
        p_pedido_id: pedido.id,
      }
    )

    if (rpcError) {
      console.error(
        'Error al cargar productos del pedido:',
        rpcError
      )

      setErrorDetalle(
        rpcError.message ||
          'No se pudieron cargar los productos del pedido.'
      )

      setLoadingDetalle(false)
      return
    }

    setProductosPedido(data || [])
    setLoadingDetalle(false)
  }

  const cerrarDetalle = () => {
    if (actualizandoEstado) {
      return
    }

    setPedidoSeleccionado(null)
    setProductosPedido([])
    setErrorDetalle('')
    setNuevoEstado('')
    setMensajeEstado('')
    setErrorEstado('')
  }

  const cambiarEstado = async () => {
    if (!pedidoSeleccionado) {
      return
    }

    if (!nuevoEstado) {
      setErrorEstado('Selecciona un estado válido.')
      return
    }

    if (nuevoEstado === pedidoSeleccionado.estado) {
      setMensajeEstado(
        'El pedido ya tiene este estado.'
      )
      setErrorEstado('')
      return
    }

    setActualizandoEstado(true)
    setMensajeEstado('')
    setErrorEstado('')

    const { error: rpcError } = await supabase.rpc(
      'update_admin_order_status',
      {
        p_pedido_id: pedidoSeleccionado.id,
        p_estado: nuevoEstado,
      }
    )

    if (rpcError) {
      console.error(
        'Error al actualizar estado:',
        rpcError
      )

      setErrorEstado(
        rpcError.message ||
          'No se pudo actualizar el estado del pedido.'
      )

      setActualizandoEstado(false)
      return
    }

    const pedidoActualizado = {
      ...pedidoSeleccionado,
      estado: nuevoEstado,
    }

    setPedidoSeleccionado(pedidoActualizado)

    setPedidos((pedidosActuales) =>
      pedidosActuales.map((pedido) =>
        pedido.id === pedidoActualizado.id
          ? {
              ...pedido,
              estado: nuevoEstado,
            }
          : pedido
      )
    )

    setMensajeEstado(
      `Estado actualizado a "${formatearEstado(
        nuevoEstado
      )}".`
    )

    setErrorEstado('')
    setActualizandoEstado(false)
  }

  return (
    <div className="admin-orders-page">

      <section className="admin-orders-hero">

        <div>

          <span className="admin-page-kicker">
            Administración
          </span>

          <h1>
            Pedidos
          </h1>

          <p>
            Consulta y supervisa los pedidos realizados en
            EcoCanje.
          </p>

        </div>

      </section>

      <section className="admin-orders-section">

        <div className="admin-orders-header">

          <div>

            <h2>
              Gestión de pedidos
            </h2>

            <p>
              Revisa los pedidos, clientes, métodos de entrega,
              pagos y estados.
            </p>

          </div>

          <div className="admin-orders-count">
            {pedidos.length} pedido
            {pedidos.length !== 1 ? 's' : ''}
          </div>

        </div>

        {error && (
          <div className="admin-orders-message admin-orders-message-error">
            {error}
          </div>
        )}

        <div className="admin-orders-filters">

          <div className="admin-orders-search">

            <label htmlFor="admin-order-search">
              Buscar
            </label>

            <input
              id="admin-order-search"
              type="text"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Código, cliente o correo..."
            />

          </div>

          <div className="admin-orders-status-filter">

            <label htmlFor="admin-order-status">
              Estado
            </label>

            <select
              id="admin-order-status"
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

          <div className="admin-orders-message">
            Cargando pedidos...
          </div>

        ) : pedidosFiltrados.length === 0 ? (

          <div className="admin-orders-message">
            No se encontraron pedidos con los filtros
            seleccionados.
          </div>

        ) : (

          <div className="admin-orders-table-container">

            <table className="admin-orders-table">

              <thead>

                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Entrega</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>

              </thead>

              <tbody>

                {pedidosFiltrados.map((pedido) => (

                  <tr key={pedido.id}>

                    <td>

                      <div className="admin-order-code">
                        {pedido.codigo_pedido}
                      </div>

                    </td>

                    <td>

                      <div className="admin-order-customer">

                        <strong>
                          {pedido.usuario_nombre ||
                            'Sin nombre'}
                        </strong>

                        <span>
                          {pedido.usuario_email || '-'}
                        </span>

                      </div>

                    </td>

                    <td>

                      <span className="admin-order-method">
                        {formatearMetodoEntrega(
                          pedido.metodo_entrega
                        )}
                      </span>

                    </td>

                    <td>
                      {formatearMetodoPago(
                        pedido.metodo_pago
                      )}
                    </td>

                    <td>

                      <strong className="admin-order-total">
                        {formatearMoneda(pedido.total)}
                      </strong>

                    </td>

                    <td>

                      <span
                        className={`admin-order-status admin-order-status-${pedido.estado}`}
                      >
                        {formatearEstado(
                          pedido.estado
                        )}
                      </span>

                    </td>

                    <td>

                      <span className="admin-order-date">
                        {formatearFecha(
                          pedido.created_at
                        )}
                      </span>

                    </td>

                    <td>

                      <div className="admin-order-actions">

                        <button
                          type="button"
                          className="admin-table-button"
                          onClick={() =>
                            abrirDetalle(pedido)
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

      {pedidoSeleccionado && (

        <div
          className="admin-order-modal-overlay"
          onClick={cerrarDetalle}
        >

          <div
            className="admin-order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-order-modal-header">

              <div>

                <span className="admin-page-kicker">
                  Detalle del pedido
                </span>

                <h2>
                  {pedidoSeleccionado.codigo_pedido}
                </h2>

              </div>

              <button
                type="button"
                className="admin-order-modal-close"
                onClick={cerrarDetalle}
                disabled={actualizandoEstado}
              >
                ×
              </button>

            </div>

            <div className="admin-order-detail">

              <div className="admin-order-detail-card">

                <span>
                  Cliente
                </span>

                <strong>
                  {pedidoSeleccionado.usuario_nombre ||
                    '-'}
                </strong>

                <small>
                  {pedidoSeleccionado.usuario_email ||
                    '-'}
                </small>

              </div>

              <div className="admin-order-detail-card">

                <span>
                  Estado actual
                </span>

                <strong>

                  <span
                    className={`admin-order-status admin-order-status-${pedidoSeleccionado.estado}`}
                  >
                    {formatearEstado(
                      pedidoSeleccionado.estado
                    )}
                  </span>

                </strong>

              </div>

              <div className="admin-order-detail-card">

                <span>
                  Método de entrega
                </span>

                <strong>
                  {formatearMetodoEntrega(
                    pedidoSeleccionado.metodo_entrega
                  )}
                </strong>

              </div>

              <div className="admin-order-detail-card">

                <span>
                  Método de pago
                </span>

                <strong>
                  {formatearMetodoPago(
                    pedidoSeleccionado.metodo_pago
                  )}
                </strong>

              </div>

              <div className="admin-order-detail-card">

                <span>
                  Subtotal
                </span>

                <strong>
                  {formatearMoneda(
                    pedidoSeleccionado.subtotal
                  )}
                </strong>

              </div>

              <div className="admin-order-detail-card">

                <span>
                  Descuento
                </span>

                <strong>
                  {formatearMoneda(
                    pedidoSeleccionado.descuento
                  )}
                </strong>

              </div>

              <div className="admin-order-detail-card admin-order-detail-card-total">

                <span>
                  Total
                </span>

                <strong>
                  {formatearMoneda(
                    pedidoSeleccionado.total
                  )}
                </strong>

              </div>

              <div className="admin-order-detail-card">

                <span>
                  Fecha de creación
                </span>

                <strong>
                  {formatearFecha(
                    pedidoSeleccionado.created_at
                  )}
                </strong>

              </div>

              <div className="admin-order-detail-card admin-order-detail-card-full">

                <span>
                  Dirección de entrega
                </span>

                <strong>
                  {pedidoSeleccionado.direccion_entrega ||
                    'No aplica'}
                </strong>

              </div>

              <div className="admin-order-detail-card admin-order-detail-card-full">

                <span>
                  Observaciones
                </span>

                <strong>
                  {pedidoSeleccionado.observaciones ||
                    'Sin observaciones'}
                </strong>

              </div>

              <div
                className="admin-order-status-update"
                style={{
                  gridColumn: '1 / -1',
                  width: '100%',
                  boxSizing: 'border-box',
                  marginTop: '10px',
                  paddingTop: '6px',
                  textAlign: 'center',
                }}
              >

                <div>

                  <h3
                    style={{
                      margin: '0 0 6px',
                      color: '#111827',
                      fontSize: '22px',
                      fontWeight: '700',
                      lineHeight: '1.3',
                      textAlign: 'center',
                    }}
                  >
                    Actualizar estado
                  </h3>

                  <p
                    style={{
                      margin: '0 auto',
                      maxWidth: '520px',
                      color: '#64748b',
                      fontSize: '14px',
                      lineHeight: '1.55',
                      textAlign: 'center',
                    }}
                  >
                    Cambia el estado del pedido desde el
                    panel administrativo.
                  </p>

                </div>

                <div
                  className="admin-order-status-update-controls"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    marginTop: '16px',
                    width: '100%',
                  }}
                >

                  <select
                    className="admin-order-status-select"
                    value={nuevoEstado}
                    onChange={(event) =>
                      setNuevoEstado(
                        event.target.value
                      )
                    }
                    disabled={actualizandoEstado}
                    style={{
                      width: '280px',
                      minWidth: '280px',
                      height: '52px',
                      padding: '0 16px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontFamily: 'inherit',
                      fontSize: '15px',
                      fontWeight: '500',
                      outline: 'none',
                      cursor: actualizandoEstado
                        ? 'not-allowed'
                        : 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >

                    {ESTADOS_CAMBIO.map((estado) => (

                      <option
                        key={estado}
                        value={estado}
                      >
                        {formatearEstado(estado)}
                      </option>

                    ))}

                  </select>

                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={cambiarEstado}
                    disabled={actualizandoEstado}
                    style={{
                      width: '280px',
                      minWidth: '280px',
                      height: '52px',
                      padding: '0 20px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box',
                    }}
                  >
                    {actualizandoEstado
                      ? 'Actualizando...'
                      : 'Actualizar estado'}
                  </button>

                </div>

                {mensajeEstado && (

                  <div className="admin-order-status-success">
                    {mensajeEstado}
                  </div>

                )}

                {errorEstado && (

                  <div className="admin-order-status-error">
                    {errorEstado}
                  </div>

                )}

              </div>

              <div className="admin-order-products-section">

                <div className="admin-order-products-header">

                  <div>

                    <h3>
                      Productos del pedido
                    </h3>

                    <p>
                      Productos incluidos en esta compra.
                    </p>

                  </div>

                </div>

                {loadingDetalle ? (

                  <div className="admin-order-products-message">
                    Cargando productos...
                  </div>

                ) : errorDetalle ? (

                  <div className="admin-order-products-message admin-order-products-message-error">
                    {errorDetalle}
                  </div>

                ) : productosPedido.length === 0 ? (

                  <div className="admin-order-products-message">
                    Este pedido no tiene productos
                    registrados.
                  </div>

                ) : (

                  <div className="admin-order-products-table-container">

                    <table className="admin-order-products-table">

                      <thead>

                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio unitario</th>
                          <th>Subtotal</th>
                        </tr>

                      </thead>

                      <tbody>

                        {productosPedido.map((producto) => (

                          <tr key={producto.id}>

                            <td>

                              <strong>
                                {producto.producto_nombre}
                              </strong>

                            </td>

                            <td>
                              {producto.cantidad}
                            </td>

                            <td>
                              {formatearMoneda(
                                producto.precio_unitario
                              )}
                            </td>

                            <td>

                              <strong>
                                {formatearMoneda(
                                  producto.subtotal
                                )}
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

            <div className="admin-order-modal-footer">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={cerrarDetalle}
                disabled={actualizandoEstado}
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

export default Pedidos