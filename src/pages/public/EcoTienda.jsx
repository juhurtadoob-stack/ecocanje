import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function EcoTienda() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarProductos = async () => {
      setLoading(true)
      setError('')

      const { data, error: productosError } = await supabase
        .from('products')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          imagen_url,
          estado,
          categoria_id,
          puntos_requeridos,
          product_categories (
            id,
            nombre,
            estado
          )
        `)
        .eq('estado', 'activo')
        .order('created_at', { ascending: false })

      if (productosError) {
        console.error('Error al cargar productos:', productosError)
        setError('No se pudieron cargar los productos.')
        setProductos([])
        setLoading(false)
        return
      }

      const productosActivos = data || []

      setProductos(productosActivos)

      const categoriasUnicas = productosActivos
        .map((producto) => producto.product_categories)
        .filter(
          (categoria) =>
            categoria && categoria.estado === 'activo'
        )
        .filter(
          (categoria, index, array) =>
            array.findIndex(
              (item) => item.id === categoria.id
            ) === index
        )
        .sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        )

      setCategorias(categoriasUnicas)
      setLoading(false)
    }

    cargarProductos()
  }, [])

  const productosFiltrados =
    categoriaSeleccionada === 'todos'
      ? productos
      : productos.filter(
          (producto) =>
            producto.categoria_id ===
            Number(categoriaSeleccionada)
        )

  const formatearPrecio = (precio) => {
    return `S/ ${Number(precio).toFixed(2)}`
  }

  return (
    <main>

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <section className="store-hero">
        <div className="container">

          <span className="section-label">
            ECOTIENDA
          </span>

          <h1>
            Productos para un
            <span> consumo sostenible.</span>
          </h1>

          <p>
            Descubre productos sostenibles y utiliza tus beneficios
            obtenidos mediante el reciclaje.
          </p>

        </div>
      </section>


      {/* ========================================
          FILTROS
      ======================================== */}

      <section className="store-section">

        <div className="container">

          <div className="store-toolbar">

            <div>
              <span className="store-count">
                PRODUCTOS DESTACADOS
              </span>

              <h2>
                Explora la EcoTienda
              </h2>
            </div>

            <select
              className="store-filter"
              value={categoriaSeleccionada}
              onChange={(event) =>
                setCategoriaSeleccionada(event.target.value)
              }
            >
              <option value="todos">
                Todas las categorías
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


          {/* ========================================
              PRODUCTOS
          ======================================== */}

          <div className="store-grid">

            {loading && (
              <div className="store-empty">
                Cargando productos...
              </div>
            )}

            {!loading && error && (
              <div className="store-empty">
                {error}
              </div>
            )}

            {!loading &&
              !error &&
              productosFiltrados.length === 0 && (
                <div className="store-empty">
                  No hay productos disponibles en esta categoría.
                </div>
              )}

            {!loading &&
              !error &&
              productosFiltrados.map((producto) => (
                <article
                  className="product-card"
                  key={producto.id}
                >

                  <div className="product-image">

                    {producto.imagen_url ? (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                      />
                    ) : (
                      <span>
                        EC
                      </span>
                    )}

                  </div>


                  <div className="product-content">

                    <span className="product-category">
                      {producto.product_categories?.nombre ||
                        'Producto sostenible'}
                    </span>

                    <h3>
                      {producto.nombre}
                    </h3>

                    <p>
                      {producto.descripcion ||
                        'Producto sostenible disponible en EcoCanje.'}
                    </p>


                    <div className="product-footer">

                      <div className="product-price">

                        <strong>
                          {formatearPrecio(producto.precio)}
                        </strong>

                        <span>
                          {producto.puntos_requeridos ?? 0} puntos
                        </span>

                      </div>


                      <Link
                        to={`/eco-tienda/producto/${producto.id}`}
                        className="btn btn-primary product-button"
                      >
                        Ver producto
                      </Link>

                    </div>

                  </div>

                </article>
              ))}

          </div>

        </div>

      </section>


      {/* ========================================
          INFORMACIÓN
      ======================================== */}

      <section className="store-info">

        <div className="container">

          <div className="store-info-content">

            <div>
              <span className="section-label">
                COMPRA RESPONSABLE
              </span>

              <h2>
                Tus puntos también pueden
                <span> convertirse en beneficios.</span>
              </h2>
            </div>

            <p>
              Los puntos obtenidos mediante el reciclaje pueden
              utilizarse para acceder a beneficios y descuentos
              disponibles dentro de EcoCanje.
            </p>

          </div>

        </div>

      </section>

    </main>
  )
}

export default EcoTienda