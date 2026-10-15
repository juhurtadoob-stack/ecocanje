import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function RegistrarReciclaje() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const codigo = searchParams.get('codigo')

  const [user, setUser] = useState(null)
  const [collectionPoints, setCollectionPoints] = useState([])
  const [materials, setMaterials] = useState([])

  const [pointId, setPointId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [showReview, setShowReview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredPoints, setRegisteredPoints] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      if (!codigo) {
        setError('No se recibió el código del usuario.')
        return
      }

      const [
        userResult,
        pointsResult,
        materialsResult,
      ] = await Promise.all([
        supabase.rpc(
          'find_user_by_code',
          {
            p_codigo_usuario: codigo,
          }
        ),

        supabase
          .from('collection_points')
          .select('id, nombre, direccion')
          .eq('estado', 'activo')
          .order('nombre'),

        supabase
          .from('materials')
          .select(
            'id, nombre, unidad, cantidad_base, puntos_base, descripcion'
          )
          .eq('estado', 'activo')
          .order('nombre'),
      ])

      if (userResult.error) {
        throw userResult.error
      }

      if (!userResult.data || userResult.data.length === 0) {
        throw new Error(
          'No se encontró un usuario válido con ese código.'
        )
      }

      if (pointsResult.error) {
        throw pointsResult.error
      }

      if (materialsResult.error) {
        throw materialsResult.error
      }

      setUser(userResult.data[0])
      setCollectionPoints(pointsResult.data || [])
      setMaterials(materialsResult.data || [])

    } catch (err) {
      console.error(
        'Error al cargar datos:',
        err
      )

      setError(
        err.message ||
        'No se pudieron cargar los datos del reciclaje.'
      )
    } finally {
      setLoading(false)
    }
  }

  /* ======================================================
     DATOS SELECCIONADOS
  ====================================================== */

  const selectedMaterial = materials.find(
    (material) =>
      String(material.id) === String(materialId)
  )

  const selectedPoint = collectionPoints.find(
    (point) =>
      String(point.id) === String(pointId)
  )

  /* ======================================================
     CÁLCULO DE PUNTOS
  ====================================================== */

  const cantidadNumerica = Number(cantidad) || 0

  let puntosCalculados = 0

  if (
    selectedMaterial &&
    cantidadNumerica > 0
  ) {
    puntosCalculados = Math.floor(
      (
        cantidadNumerica /
        Number(selectedMaterial.cantidad_base)
      ) *
      Number(selectedMaterial.puntos_base)
    )
  }

  /* ======================================================
     REVISAR REGISTRO
  ====================================================== */

  const handleReview = () => {
    setError('')

    if (!pointId) {
      setError(
        'Selecciona un punto de acopio.'
      )
      return
    }

    if (!materialId) {
      setError(
        'Selecciona un material.'
      )
      return
    }

    if (cantidadNumerica <= 0) {
      setError(
        'Ingresa una cantidad mayor a 0.'
      )
      return
    }

    if (puntosCalculados <= 0) {
      setError(
        'La cantidad ingresada no genera puntos.'
      )
      return
    }

    setShowReview(true)
  }

  /* ======================================================
     CONFIRMAR Y REGISTRAR
  ====================================================== */

  const handleConfirm = async () => {
    if (!user || saving) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        'register_recycling',
        {
          p_usuario_id: user.id,
          p_punto_acopio_id: Number(pointId),
          p_material_id: Number(materialId),
          p_cantidad: cantidadNumerica,
          p_observaciones:
            observaciones.trim() || null,
        }
      )

      if (rpcError) {
        console.error(
          'Error al registrar reciclaje:',
          rpcError
        )

        throw rpcError
      }

      const result = data?.[0]

      setRegisteredPoints(
        result?.puntos || puntosCalculados
      )

      setShowReview(false)
      setSuccess(true)

    } catch (err) {
      console.error(
        'Error al confirmar registro:',
        err
      )

      setError(
        err.message ||
        'No se pudo registrar el reciclaje.'
      )
    } finally {
      setSaving(false)
    }
  }

  /* ======================================================
     CANCELAR REVISIÓN
  ====================================================== */

  const cancelReview = () => {
    if (saving) {
      return
    }

    setShowReview(false)
    setError('')
  }

  /* ======================================================
     VOLVER A ESCANEAR
  ====================================================== */

  const goToScanner = () => {
    navigate('/encargado/escanear')
  }

  /* ======================================================
     CARGANDO
  ====================================================== */

  if (loading) {
    return (
      <main className="attendant-recycling-page">

        <div className="container">

          <div className="auth-loading">
            Cargando información del reciclaje...
          </div>

        </div>

      </main>
    )
  }

  /* ======================================================
     ERROR DE CARGA
  ====================================================== */

  if (error && !user) {
    return (
      <main className="attendant-recycling-page">

        <div className="container">

          <div className="attendant-scan-error">
            {error}
          </div>

        </div>

      </main>
    )
  }

  return (
    <main className="attendant-recycling-page">

      {/* ==================================================
          ENCABEZADO
      ================================================== */}

      <section className="attendant-recycling-hero">

        <div className="container">

          <span className="section-label">
            REGISTRO DE RECICLAJE
          </span>

          <h1>
            Registra los materiales
            <span> del usuario.</span>
          </h1>

          <p>
            Selecciona el punto de acopio, registra el material
            entregado y revisa los puntos que serán asignados.
          </p>

        </div>

      </section>

      {/* ==================================================
          CONTENIDO
      ================================================== */}

      <section className="attendant-recycling-section">

        <div className="container">

          <div className="attendant-recycling-grid">

            {/* ==================================================
                FORMULARIO
            ================================================== */}

            <div className="attendant-recycling-form-card">

              <div className="attendant-form-heading">

                <span>
                  DATOS DEL RECICLAJE
                </span>

                <h2>
                  Información de entrega
                </h2>

                <p>
                  Completa los datos correspondientes al
                  material recibido.
                </p>

              </div>

              {/* ==================================================
                  USUARIO
              ================================================== */}

              <div className="attendant-selected-user">

                <div className="attendant-selected-user-avatar">

                  {user.nombres?.charAt(0)}
                  {user.apellidos?.charAt(0)}

                </div>

                <div>

                  <span>
                    USUARIO
                  </span>

                  <strong>
                    {user.nombres} {user.apellidos}
                  </strong>

                  <small>
                    {user.codigo_usuario}
                  </small>

                </div>

              </div>

              {/* ==================================================
                  PUNTO DE ACOPIO
              ================================================== */}

              <div className="attendant-form-group">

                <label htmlFor="collection-point">
                  Punto de acopio
                </label>

                <select
                  id="collection-point"
                  value={pointId}
                  onChange={(event) => {

                    setPointId(
                      event.target.value
                    )

                    setShowReview(false)
                    setError('')

                  }}
                >

                  <option value="">
                    Selecciona un punto de acopio
                  </option>

                  {collectionPoints.map((point) => (

                    <option
                      key={point.id}
                      value={point.id}
                    >
                      {point.nombre}
                    </option>

                  ))}

                </select>

              </div>

              {/* ==================================================
                  MATERIAL
              ================================================== */}

              <div className="attendant-form-group">

                <label htmlFor="material">
                  Material
                </label>

                <select
                  id="material"
                  value={materialId}
                  onChange={(event) => {

                    setMaterialId(
                      event.target.value
                    )

                    setCantidad('')
                    setShowReview(false)
                    setError('')

                  }}
                >

                  <option value="">
                    Selecciona un material
                  </option>

                  {materials.map((material) => (

                    <option
                      key={material.id}
                      value={material.id}
                    >
                      {material.nombre}
                    </option>

                  ))}

                </select>

              </div>

              {/* ==================================================
                  INFORMACIÓN MATERIAL
              ================================================== */}

              {selectedMaterial && (

                <div className="attendant-material-info">

                  <strong>
                    {selectedMaterial.nombre}
                  </strong>

                  <span>
                    Base: {selectedMaterial.cantidad_base}{' '}
                    {selectedMaterial.unidad} ={' '}
                    {selectedMaterial.puntos_base} puntos
                  </span>

                </div>

              )}

              {/* ==================================================
                  CANTIDAD
              ================================================== */}

              <div className="attendant-form-group">

                <label htmlFor="cantidad">
                  Cantidad entregada
                </label>

                <div className="attendant-quantity-input">

                  <input
                    id="cantidad"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cantidad}
                    onChange={(event) => {

                      setCantidad(
                        event.target.value
                      )

                      setShowReview(false)
                      setError('')

                    }}
                    placeholder="Ej. 2"
                  />

                  <span>
                    {selectedMaterial?.unidad || 'unidad'}
                  </span>

                </div>

              </div>

              {/* ==================================================
                  OBSERVACIONES
              ================================================== */}

              <div className="attendant-form-group">

                <label htmlFor="observaciones">
                  Observaciones
                </label>

                <textarea
                  id="observaciones"
                  rows="4"
                  value={observaciones}
                  onChange={(event) => {

                    setObservaciones(
                      event.target.value
                    )

                    setShowReview(false)

                  }}
                  placeholder="Observaciones opcionales..."
                />

              </div>

              {/* ==================================================
                  ERROR
              ================================================== */}

              {error && (

                <div className="attendant-scan-error">
                  {error}
                </div>

              )}

              {/* ==================================================
                  BOTÓN REVISAR
              ================================================== */}

              <button
                type="button"
                className="attendant-primary-button attendant-register-button"
                onClick={handleReview}
                disabled={
                  !pointId ||
                  !materialId ||
                  cantidadNumerica <= 0
                }
              >
                Revisar registro
              </button>

            </div>

            {/* ==================================================
                RESUMEN
            ================================================== */}

            <aside className="attendant-recycling-summary">

              <span className="section-label">
                RESUMEN
              </span>

              <h2>
                Puntos a asignar
              </h2>

              <p>
                El sistema calcula los puntos automáticamente
                según el material y la cantidad registrada.
              </p>

              <div className="attendant-points-result">

                <span>
                  PUNTOS CALCULADOS
                </span>

                <strong>
                  {puntosCalculados}
                </strong>

                <small>
                  puntos
                </small>

              </div>

              <div className="attendant-summary-data">

                <div>

                  <span>
                    Usuario
                  </span>

                  <strong>
                    {user.nombres} {user.apellidos}
                  </strong>

                </div>

                <div>

                  <span>
                    Material
                  </span>

                  <strong>
                    {selectedMaterial?.nombre || '—'}
                  </strong>

                </div>

                <div>

                  <span>
                    Cantidad
                  </span>

                  <strong>
                    {cantidadNumerica > 0
                      ? `${cantidadNumerica} ${
                          selectedMaterial?.unidad || ''
                        }`
                      : '—'}
                  </strong>

                </div>

              </div>

            </aside>

          </div>

        </div>

      </section>

      {/* ==================================================
          MODAL DE CONFIRMACIÓN
      ================================================== */}

      {showReview && (

        <div className="attendant-modal-overlay">

          <div className="attendant-modal">

            <div className="attendant-modal-header">

              <span>
                CONFIRMACIÓN
              </span>

              <h2>
                Revisa el registro
              </h2>

              <p>
                Verifica los datos antes de asignar los puntos.
              </p>

            </div>

            <div className="attendant-modal-data">

              <div>

                <span>
                  USUARIO
                </span>

                <strong>
                  {user.nombres} {user.apellidos}
                </strong>

              </div>

              <div>

                <span>
                  PUNTO DE ACOPIO
                </span>

                <strong>
                  {selectedPoint?.nombre}
                </strong>

              </div>

              <div>

                <span>
                  MATERIAL
                </span>

                <strong>
                  {selectedMaterial?.nombre}
                </strong>

              </div>

              <div>

                <span>
                  CANTIDAD
                </span>

                <strong>
                  {cantidadNumerica}{' '}
                  {selectedMaterial?.unidad}
                </strong>

              </div>

            </div>

            <div className="attendant-modal-points">

              <span>
                PUNTOS A ASIGNAR
              </span>

              <strong>
                {puntosCalculados}
              </strong>

              <small>
                puntos
              </small>

            </div>

            {observaciones.trim() && (

              <div className="attendant-modal-observations">

                <span>
                  OBSERVACIONES
                </span>

                <p>
                  {observaciones.trim()}
                </p>

              </div>

            )}

            {error && (

              <div className="attendant-scan-error">
                {error}
              </div>

            )}

            <div className="attendant-modal-actions">

              <button
                type="button"
                className="attendant-secondary-button"
                onClick={cancelReview}
                disabled={saving}
              >
                Corregir datos
              </button>

              <button
                type="button"
                className="attendant-primary-button"
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving
                  ? 'Registrando...'
                  : 'Confirmar y registrar'}
              </button>

            </div>

            {!saving && (

              <p className="attendant-modal-note">
                Al confirmar, los puntos serán asignados
                automáticamente al usuario.
              </p>

            )}

          </div>

        </div>

      )}

      {/* ==================================================
          MODAL DE ÉXITO
      ================================================== */}

      {success && (

        <div className="attendant-modal-overlay">

          <div className="attendant-modal">

            <div className="attendant-modal-header">

              <span>
                REGISTRO COMPLETADO
              </span>

              <h2>
                Reciclaje registrado correctamente
              </h2>

              <p>
                La operación se guardó correctamente en EcoCanje.
              </p>

            </div>

            <div className="attendant-modal-points">

              <span>
                PUNTOS ASIGNADOS
              </span>

              <strong>
                {registeredPoints}
              </strong>

              <small>
                puntos
              </small>

            </div>

            <div className="attendant-modal-data">

              <div>

                <span>
                  USUARIO
                </span>

                <strong>
                  {user.nombres} {user.apellidos}
                </strong>

              </div>

              <div>

                <span>
                  MATERIAL
                </span>

                <strong>
                  {selectedMaterial?.nombre}
                </strong>

              </div>

              <div>

                <span>
                  CANTIDAD
                </span>

                <strong>
                  {cantidadNumerica}{' '}
                  {selectedMaterial?.unidad}
                </strong>

              </div>

              <div>

                <span>
                  NIVEL ACTUAL
                </span>

                <strong>
                  Actualizado
                </strong>

              </div>

            </div>

            <div className="attendant-modal-actions">

              <button
                type="button"
                className="attendant-primary-button"
                onClick={goToScanner}
              >
                Escanear otro usuario
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  )
}

export default RegistrarReciclaje