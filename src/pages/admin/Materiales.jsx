import { useEffect, useState } from 'react'

import { supabase } from '../../lib/supabase'

const formularioInicial = {
  nombre: '',
  unidad: 'kg',
  cantidad_base: '',
  puntos_base: '',
  descripcion: '',
  estado: 'activo',
}

function Materiales() {
  const [materiales, setMateriales] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [materialEditando, setMaterialEditando] = useState(null)

  const [formulario, setFormulario] = useState(formularioInicial)

  useEffect(() => {
    cargarMateriales()
  }, [])

  useEffect(() => {
    if (!modalAbierto) {
      return
    }

    const overflowOriginal = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowOriginal
    }
  }, [modalAbierto])

  const cargarMateriales = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.rpc(
      'get_admin_materials'
    )

    if (error) {
      console.error(
        'Error al cargar materiales:',
        error
      )

      setError(
        error.message ||
          'No se pudieron cargar los materiales.'
      )

      setMateriales([])
    } else {
      setMateriales(data || [])
    }

    setLoading(false)
  }

  const abrirNuevo = () => {
    setMaterialEditando(null)
    setFormulario({ ...formularioInicial })
    setError('')
    setSuccess('')
    setModalAbierto(true)
  }

  const abrirEditar = (material) => {
    setMaterialEditando(material)

    setFormulario({
      nombre: material.nombre || '',
      unidad: material.unidad || 'kg',
      cantidad_base: material.cantidad_base ?? '',
      puntos_base: material.puntos_base ?? '',
      descripcion: material.descripcion || '',
      estado: material.estado || 'activo',
    })

    setError('')
    setSuccess('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (saving) {
      return
    }

    setModalAbierto(false)
    setMaterialEditando(null)
    setFormulario({ ...formularioInicial })
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  const guardarMaterial = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const nombre = formulario.nombre.trim()
    const unidad = formulario.unidad.trim()
    const cantidadBase = Number(formulario.cantidad_base)
    const puntosBase = Number(formulario.puntos_base)

    if (!nombre) {
      setError(
        'El nombre del material es obligatorio.'
      )
      return
    }

    if (!unidad) {
      setError(
        'La unidad del material es obligatoria.'
      )
      return
    }

    if (
      !Number.isFinite(cantidadBase) ||
      cantidadBase <= 0
    ) {
      setError(
        'La cantidad base debe ser mayor que cero.'
      )
      return
    }

    if (
      !Number.isInteger(puntosBase) ||
      puntosBase <= 0
    ) {
      setError(
        'Los puntos base deben ser un número entero mayor que cero.'
      )
      return
    }

    setSaving(true)

    let result

    if (materialEditando) {
      result = await supabase.rpc(
        'update_admin_material',
        {
          p_id: materialEditando.id,
          p_nombre: nombre,
          p_unidad: unidad,
          p_cantidad_base: cantidadBase,
          p_puntos_base: puntosBase,
          p_descripcion:
            formulario.descripcion.trim(),
          p_estado: formulario.estado,
        }
      )
    } else {
      result = await supabase.rpc(
        'create_admin_material',
        {
          p_nombre: nombre,
          p_unidad: unidad,
          p_cantidad_base: cantidadBase,
          p_puntos_base: puntosBase,
          p_descripcion:
            formulario.descripcion.trim(),
          p_estado: formulario.estado,
        }
      )
    }

    if (result.error) {
      console.error(
        'Error al guardar material:',
        result.error
      )

      setError(
        result.error.message ||
          'No se pudo guardar el material.'
      )

      setSaving(false)
      return
    }

    setSaving(false)
    setModalAbierto(false)
    setMaterialEditando(null)
    setFormulario({ ...formularioInicial })

    setSuccess(
      materialEditando
        ? 'Material actualizado correctamente.'
        : 'Material creado correctamente.'
    )

    await cargarMateriales()
  }

  const cambiarEstado = async (material) => {
    const accion =
      material.estado === 'activo'
        ? 'desactivar'
        : 'activar'

    const confirmado = window.confirm(
      `¿Deseas ${accion} el material "${material.nombre}"?`
    )

    if (!confirmado) {
      return
    }

    setError('')
    setSuccess('')

    const { error } = await supabase.rpc(
      'toggle_admin_material_status',
      {
        p_id: material.id,
      }
    )

    if (error) {
      console.error(
        'Error al cambiar estado del material:',
        error
      )

      setError(
        error.message ||
          'No se pudo cambiar el estado del material.'
      )

      return
    }

    setSuccess(
      `Material ${
        accion === 'activar'
          ? 'activado'
          : 'desactivado'
      } correctamente.`
    )

    await cargarMateriales()
  }

  return (
    <main className="admin-materials-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="admin-materials-hero">

        <div>

          <p className="section-kicker">
            GESTIÓN DE CATÁLOGO
          </p>

          <h1>
            Materiales reciclables
          </h1>

          <p>
            Gestiona los materiales, unidades,
            cantidades base y puntos asignados
            al reciclaje.
          </p>

        </div>

      </section>


      {/* =====================================================
          CONTENIDO - ENCABEZADO
      ===================================================== */}

      <section className="admin-materials-section">

        <div className="admin-materials-header">

          <div>

            <p className="section-kicker">
              CONFIGURACIÓN
            </p>

            <h2>
              Materiales registrados
            </h2>

            <p>
              Administra los valores utilizados para
              calcular los puntos de reciclaje.
            </p>

          </div>


          <div className="admin-materials-actions">

            <div className="admin-materials-count">

              <span>
                Total
              </span>

              <strong>
                {materiales.length}
              </strong>

            </div>


            <button
              type="button"
              className="admin-primary-button"
              onClick={abrirNuevo}
            >
              + Nuevo material
            </button>

          </div>

        </div>


        {/* =====================================================
            MENSAJE DE ÉXITO
        ===================================================== */}

        {success && (
          <div className="admin-materials-success">
            {success}
          </div>
        )}


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && !modalAbierto && (
          <div className="admin-materials-message admin-materials-message-error">
            {error}
          </div>
        )}

      </section>


      {/* =====================================================
          TABLA
      ===================================================== */}

      {loading ? (

        <div className="admin-materials-message">
          Cargando materiales...
        </div>

      ) : materiales.length === 0 ? (

        <div className="admin-materials-message">
          No hay materiales registrados.
        </div>

      ) : (

        <div className="admin-materials-table-container">

          <table className="admin-materials-table">

            <thead>

              <tr>
                <th>Material</th>
                <th>Unidad</th>
                <th>Cantidad base</th>
                <th>Puntos base</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>

            </thead>


            <tbody>

              {materiales.map((material) => (

                <tr key={material.id}>

                  <td>

                    <div className="admin-material-name">
                      {material.nombre}
                    </div>

                    {material.descripcion && (
                      <div className="admin-material-description">
                        {material.descripcion}
                      </div>
                    )}

                  </td>


                  <td>
                    {material.unidad}
                  </td>


                  <td>
                    {Number(
                      material.cantidad_base
                    )}
                  </td>


                  <td>

                    <span className="admin-material-points">
                      {material.puntos_base} puntos
                    </span>

                  </td>


                  <td>

                    <span
                      className={
                        `admin-material-status ${
                          material.estado === 'activo'
                            ? 'admin-material-status-activo'
                            : 'admin-material-status-inactivo'
                        }`
                      }
                    >
                      {material.estado === 'activo'
                        ? 'Activo'
                        : 'Inactivo'}
                    </span>

                  </td>


                  <td>

                    <div className="admin-material-actions">

                      <button
                        type="button"
                        className="admin-table-button"
                        onClick={() =>
                          abrirEditar(material)
                        }
                      >
                        Editar
                      </button>


                      <button
                        type="button"
                        className={
                          material.estado === 'activo'
                            ? 'admin-table-button admin-table-button-danger'
                            : 'admin-table-button admin-table-button-success'
                        }
                        onClick={() =>
                          cambiarEstado(material)
                        }
                      >
                        {material.estado === 'activo'
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


      {/* =====================================================
          MODAL
      ===================================================== */}

      {modalAbierto && (

        <div
          className="admin-material-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target === event.currentTarget
            ) {
              cerrarModal()
            }

          }}
        >

          <div
            className="admin-material-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-material-modal-title"
          >

            <div className="admin-material-modal-header">

              <div>

                <p className="section-kicker">
                  {materialEditando
                    ? 'EDITAR MATERIAL'
                    : 'NUEVO MATERIAL'}
                </p>

                <h2 id="admin-material-modal-title">
                  {materialEditando
                    ? 'Modificar material'
                    : 'Registrar material'}
                </h2>

                <p>
                  Completa la información del
                  material reciclable.
                </p>

              </div>


              <button
                type="button"
                className="admin-material-modal-close"
                onClick={cerrarModal}
                disabled={saving}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <form
              className="admin-material-form"
              onSubmit={guardarMaterial}
            >

              <div className="admin-material-form-grid">


                {/* NOMBRE */}

                <div className="admin-form-field">

                  <label htmlFor="material-nombre">
                    Nombre
                  </label>

                  <input
                    id="material-nombre"
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Cartón"
                    disabled={saving}
                  />

                </div>


                {/* UNIDAD */}

                <div className="admin-form-field">

                  <label htmlFor="material-unidad">
                    Unidad
                  </label>

                  <select
                    id="material-unidad"
                    name="unidad"
                    value={formulario.unidad}
                    onChange={handleChange}
                    disabled={saving}
                  >

                    <option value="kg">
                      kg
                    </option>

                    <option value="unidad">
                      unidad
                    </option>

                    <option value="unidades">
                      unidades
                    </option>

                    <option value="litro">
                      litro
                    </option>

                    <option value="litros">
                      litros
                    </option>

                  </select>

                </div>


                {/* CANTIDAD BASE */}

                <div className="admin-form-field">

                  <label htmlFor="material-cantidad">
                    Cantidad base
                  </label>

                  <input
                    id="material-cantidad"
                    type="number"
                    name="cantidad_base"
                    value={
                      formulario.cantidad_base
                    }
                    onChange={handleChange}
                    placeholder="Ej. 1"
                    min="0.01"
                    step="0.01"
                    disabled={saving}
                  />

                  <small>
                    Cantidad necesaria para obtener
                    los puntos base.
                  </small>

                </div>


                {/* PUNTOS BASE */}

                <div className="admin-form-field">

                  <label htmlFor="material-puntos">
                    Puntos base
                  </label>

                  <input
                    id="material-puntos"
                    type="number"
                    name="puntos_base"
                    value={
                      formulario.puntos_base
                    }
                    onChange={handleChange}
                    placeholder="Ej. 6"
                    min="1"
                    step="1"
                    disabled={saving}
                  />

                </div>


                {/* ESTADO */}

                <div className="admin-form-field">

                  <label htmlFor="material-estado">
                    Estado
                  </label>

                  <select
                    id="material-estado"
                    name="estado"
                    value={formulario.estado}
                    onChange={handleChange}
                    disabled={saving}
                  >

                    <option value="activo">
                      Activo
                    </option>

                    <option value="inactivo">
                      Inactivo
                    </option>

                  </select>

                </div>


                {/* DESCRIPCIÓN */}

                <div className="admin-form-field admin-material-form-full">

                  <label htmlFor="material-descripcion">
                    Descripción
                  </label>

                  <textarea
                    id="material-descripcion"
                    name="descripcion"
                    value={
                      formulario.descripcion
                    }
                    onChange={handleChange}
                    placeholder="Descripción opcional del material"
                    rows="4"
                    disabled={saving}
                  />

                </div>

              </div>


              {/* ERROR DEL FORMULARIO */}

              {error && (
                <div className="admin-material-form-error">
                  {error}
                </div>
              )}


              {/* BOTONES */}

              <div className="admin-material-form-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cerrarModal}
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
                    : materialEditando
                      ? 'Guardar cambios'
                      : 'Crear material'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  )
}

export default Materiales