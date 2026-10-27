import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function Tienda() {
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')

  const [puntos, setPuntos] = useState(0)
  const [cantidadCarrito, setCantidadCarrito] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agregando, setAgregando] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarTienda()
  }, [])

  const cargarCantidadCarrito = async (userId) => {
    const { data, error: carritoError } = await supabase
      .from('cart_items')
      .select('cantidad')
      .eq('usuario_id', userId)

    if (carritoError) {
      throw carritoError
    }

    const total = (data || []).reduce(
      (acumulado, item) =>
        acumulado + Number(item.cantidad || 0),
      0
    )

    setCantidadCarrito(total)
  }

  const cargarTienda = async () => {
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

      const { data: perfil, error: perfilError } =
        await supabase
          .from('profiles')
          .select('puntos_disponibles')
          .eq('id', user.id)
          .single()

      if (perfilError) {
        throw perfilError
      }

      setPuntos(perfil?.puntos_disponibles || 0)

      await cargarCantidadCarrito(user.id)

      const {
        data: categoriasData,
        error: categoriasError,
      } = await supabase
        .from('product_categories')
        .select('id, nombre')
        .eq('estado', 'activo')
        .order('nombre')

      if (categoriasError) {
        throw categoriasError
      }

      setCategorias(categoriasData || [])

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
          categoria_id,
          puntos_requeridos
        `)
        .eq('estado', 'activo')
        .order('created_at', {
          ascending: false,
        })

      if (productosError) {
        throw productosError
      }

      setProductos(productosData || [])
    } catch (err) {
      console.error('Error al cargar EcoTienda:', err)

      setError(
        'No se pudieron cargar los productos. Intenta nuevamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  const obtenerNombreCategoria = (categoriaId) => {
    const categoria = categorias.find(
      (item) => item.id === categoriaId
    )

    return categoria?.nombre || 'General'
  }

  const agregarAlCarrito = async (producto) => {
    if (producto.stock <= 0) {
      setMensaje('Este producto no tiene stock disponible.')
      return
    }

    setAgregando(producto.id)
    setMensaje('')

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

      const {
        data: itemExistente,
        error: consultaError,
      } = await supabase
        .from('cart_items')
        .select('id, cantidad')
        .eq('usuario_id', user.id)
        .eq('producto_id', producto.id)
        .maybeSingle()

      if (consultaError) {
        throw consultaError
      }

      if (itemExistente) {
        if (itemExistente.cantidad >= producto.stock) {
          setMensaje(
            'No puedes agregar más unidades de este producto.'
          )
          return
        }

        const { error: updateError } =
          await supabase
            .from('cart_items')
            .update({
              cantidad: itemExistente.cantidad + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', itemExistente.id)
            .eq('usuario_id', user.id)

        if (updateError) {
          throw updateError
        }
      } else {
        const { error: insertError } =
          await supabase
            .from('cart_items')
            .insert({
              usuario_id: user.id,
              producto_id: producto.id,
              cantidad: 1,
            })

        if (insertError) {
          throw insertError
        }
      }

      await cargarCantidadCarrito(user.id)

      setMensaje(
        `${producto.nombre} fue agregado al carrito.`
      )
    } catch (err) {
      console.error(
        'Error al agregar al carrito:',
        err
      )

      setMensaje(
        'No se pudo agregar el producto al carrito.'
      )
    } finally {
      setAgregando(null)
    }
  }

  const productosFiltrados =
    categoriaActiva === 'Todos'
      ? productos
      : productos.filter(
          (producto) =>
            obtenerNombreCategoria(
              producto.categoria_id
            ) === categoriaActiva
        )

  return (
    <main className="user-store-page">

      {/* HERO */}

      <section className="user-store-hero">

        <div className="container">

          <span className="section-label">
            ECOCANJE
          </span>

          <h1>
            Eco<span>Tienda.</span>
          </h1>

          <p>
            Descubre productos sostenibles y utiliza tus
            beneficios disponibles para obtener descuentos
            en tus compras.
          </p>

        </div>

      </section>


      {/* TIENDA */}

      <section className="user-store-section">

        <div className="container">

          {/* ENCABEZADO */}

          <div className="store-header">

            <div>

              <span className="section-label">
                PRODUCTOS
              </span>

              <h2>
                Productos sostenibles
              </h2>

            </div>


            <div className="store-header-actions">

              <div className="store-points">

                <span>
                  TUS PUNTOS
                </span>

                <strong>
                  {puntos}
                </strong>

              </div>


              <button
                type="button"
                className="store-cart-button"
                onClick={() =>
                  navigate('/usuario/carrito')
                }
              >
                Carrito

                <span className="store-cart-count">
                  {cantidadCarrito}
                </span>
              </button>

            </div>

          </div>


          {/* FILTROS */}

          <div className="store-filters">

            <button
              type="button"
              className={`store-filter ${
                categoriaActiva === 'Todos'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setCategoriaActiva('Todos')
              }
            >
              Todos
            </button>


            {categorias.map((categoria) => (

              <button
                key={categoria.id}
                type="button"
                className={`store-filter ${
                  categoriaActiva === categoria.nombre
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setCategoriaActiva(
                    categoria.nombre
                  )
                }
              >
                {categoria.nombre}
              </button>

            ))}

          </div>


          {/* MENSAJE */}

          {mensaje && (

            <div className="store-message">

              <span>
                {mensaje}
              </span>

              <button
                type="button"
                className="store-message-cart"
                onClick={() =>
                  navigate('/usuario/carrito')
                }
              >
                Ver carrito
              </button>

            </div>

          )}


          {/* CARGANDO */}

          {loading && (

            <div className="store-empty">

              <h3>
                Cargando productos...
              </h3>

              <p>
                Estamos preparando la EcoTienda.
              </p>

            </div>

          )}


          {/* ERROR */}

          {!loading && error && (

            <div className="store-empty">

              <h3>
                No se pudieron cargar los productos
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                className="product-button"
                onClick={cargarTienda}
              >
                Intentar nuevamente
              </button>

            </div>

          )}


          {/* SIN PRODUCTOS */}

          {!loading &&
            !error &&
            productosFiltrados.length === 0 && (

              <div className="store-empty">

                <h3>
                  No hay productos disponibles
                </h3>

                <p>
                  No encontramos productos en esta categoría.
                </p>

              </div>

            )}


          {/* PRODUCTOS */}

          {!loading &&
            !error &&
            productosFiltrados.length > 0 && (

              <div className="store-grid">

                {productosFiltrados.map((producto) => (

                  <article
                    key={producto.id}
                    className="store-product-card"
                  >

                    {/* IMAGEN */}

                    <div className="product-image">

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


                    {/* CONTENIDO */}

                    <div className="product-content">

                      <span className="product-category">
                        {obtenerNombreCategoria(
                          producto.categoria_id
                        ).toUpperCase()}
                      </span>


                      <h3>
                        {producto.nombre}
                      </h3>


                      <p>
                        {producto.descripcion ||
                          'Producto sostenible de EcoCanje.'}
                      </p>


                      {/* PRECIO + BOTÓN */}

                      <div className="product-footer">

                        <strong>
                          S/ {Number(
                            producto.precio
                          ).toFixed(2)}
                        </strong>


                        <button
                          type="button"
                          className="product-button"
                          disabled={
                            producto.stock <= 0 ||
                            agregando === producto.id
                          }
                          onClick={() =>
                            agregarAlCarrito(producto)
                          }
                        >
                          {agregando === producto.id
                            ? 'Agregando...'
                            : producto.stock <= 0
                            ? 'Sin stock'
                            : 'Agregar al carrito'}
                        </button>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

            )}


          {/* NOTA */}

          <div className="store-note">

            <strong>
              Utiliza tus beneficios
            </strong>

            <p>
              Los descuentos obtenidos mediante tus puntos
              pueden aplicarse durante el proceso de compra
              en EcoTienda.
            </p>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Tienda