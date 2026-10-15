import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const beneficioInicial = {
  nombre: '',
  descripcion: '',
  puntos_requeridos: '',
  descuento_porcentaje: '',
  dias_vigencia: '30',
  estado: 'activo',
}

function Beneficios() {
  const [beneficios, setBeneficios] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState(null)

  const [form, setForm] = useState(beneficioInicial)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    cargarBeneficios()
  }, [])

  const cargarBeneficios = async () => {
    setLoading(true)
    setError('')

    const { data, error: benefitsError } = await supabase.rpc(
      'get_admin_benefits'
    )

    if (benefitsError) {
      console.error(benefitsError)
      setError(
        'No se pudieron cargar los beneficios administrativos.'
      )
      setLoading(false)
      return
    }

    setBeneficios(data || [])
    setLoading(false)
  }

  const abrirNuevo = () => {
    setEditingBenefit(null)
    setForm(beneficioInicial)
    setFormError('')
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const abrirEditar = (beneficio) => {
    setEditingBenefit(beneficio)

    setForm({
      nombre: beneficio.nombre || '',
      descripcion: beneficio.descripcion || '',
      puntos_requeridos: String(
        beneficio.puntos_requeridos ?? ''
      ),
      descuento_porcentaje: String(
        beneficio.descuento_porcentaje ?? ''
      ),
      dias_vigencia: String(
        beneficio.dias_vigencia ?? '30'
      ),
      estado: beneficio.estado || 'activo',
    })

    setFormError('')
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const cerrarModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingBenefit(null)
    setForm(beneficioInicial)
    setFormError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const guardarBeneficio = async (event) => {
    event.preventDefault()

    setFormError('')
    setSuccess('')

    const nombre = form.nombre.trim()
    const descripcion = form.descripcion.trim()

    const puntos = Number(form.puntos_requeridos)
    const descuento = Number(form.descuento_porcentaje)
    const dias = Number(form.dias_vigencia)

    if (!nombre) {
      setFormError('El nombre del beneficio es obligatorio.')
      return
    }

    if (!Number.isFinite(puntos) || puntos <= 0) {
      setFormError(
        'Los puntos requeridos deben ser mayores que cero.'
      )
      return
    }

    if (
      !Number.isFinite(descuento) ||
      descuento <= 0 ||
      descuento > 100
    ) {
      setFormError(
        'El descuento debe estar entre 0 y 100 por ciento.'
      )
      return
    }

    if (!Number.isFinite(dias) || dias <= 0) {
      setFormError(
        'Los días de vigencia deben ser mayores que cero.'
      )
      return
    }

    setSaving(true)

    if (editingBenefit) {
      const { error: updateError } = await supabase.rpc(
        'update_admin_benefit',
        {
          p_id: editingBenefit.id,
          p_nombre: nombre,
          p_descripcion: descripcion,
          p_puntos_requeridos: puntos,
          p_descuento_porcentaje: descuento,
          p_dias_vigencia: dias,
          p_estado: form.estado,
        }
      )

      if (updateError) {
        console.error(updateError)

        setFormError(
          updateError.message ||
            'No se pudo actualizar el beneficio.'
        )

        setSaving(false)
        return
      }

      setSaving(false)
      setModalOpen(false)
      setEditingBenefit(null)
      setForm(beneficioInicial)

      setSuccess(
        'Beneficio actualizado correctamente.'
      )

      await cargarBeneficios()
      return
    }

    const { error: createError } = await supabase.rpc(
      'create_admin_benefit',
      {
        p_nombre: nombre,
        p_descripcion: descripcion,
        p_puntos_requeridos: puntos,
        p_descuento_porcentaje: descuento,
        p_dias_vigencia: dias,
        p_estado: form.estado,
      }
    )

    if (createError) {
      console.error(createError)

      setFormError(
        createError.message ||
          'No se pudo crear el beneficio.'
      )

      setSaving(false)
      return
    }

    setSaving(false)
    setModalOpen(false)
    setForm(beneficioInicial)

    setSuccess(
      'Beneficio creado correctamente.'
    )

    await cargarBeneficios()
  }

  const cambiarEstado = async (beneficio) => {
    setError('')
    setSuccess('')

    const accion =
      beneficio.estado === 'activo'
        ? 'desactivar'
        : 'activar'

    const confirmado = window.confirm(
      `¿Deseas ${accion} el beneficio "${beneficio.nombre}"?`
    )

    if (!confirmado) return

    const { error: toggleError } = await supabase.rpc(
      'toggle_admin_benefit_status',
      {
        p_id: beneficio.id,
      }
    )

    if (toggleError) {
      console.error(toggleError)

      setError(
        toggleError.message ||
          'No se pudo cambiar el estado del beneficio.'
      )

      return
    }

    setSuccess(
      `Beneficio ${
        accion === 'activar'
          ? 'activado'
          : 'desactivado'
      } correctamente.`
    )

    await cargarBeneficios()
  }

  return (
    <main className="admin-benefits-page">

      <section className="admin-benefits-hero">
        <div>

          <p className="section-kicker">
            PANEL DE ADMINISTRACIÓN
          </p>

          <h1>
            Beneficios
          </h1>

          <p>
            Administra los beneficios que los usuarios pueden
            obtener mediante el uso de sus puntos.
          </p>

        </div>
      </section>


      <section className="admin-benefits-section">

        <div className="admin-benefits-header">

          <div>

            <p className="section-kicker">
              GESTIÓN DE BENEFICIOS
            </p>

            <h2>
              Beneficios disponibles
            </h2>

            <p>
              Configura los puntos necesarios, descuentos y
              vigencia de cada beneficio.
            </p>

          </div>


          <div className="admin-benefits-actions">

            <div className="admin-benefits-count">

              <span>
                Total
              </span>

              <strong>
                {beneficios.length}
              </strong>

            </div>


            <button
              type="button"
              className="admin-primary-button"
              onClick={abrirNuevo}
            >
              + Nuevo beneficio
            </button>

          </div>

        </div>


        {success && (
          <div className="admin-benefits-success">
            {success}
          </div>
        )}


        {loading && (
          <div className="admin-benefits-message">

            <h3>
              Cargando beneficios...
            </h3>

            <p>
              Estamos consultando la información disponible.
            </p>

          </div>
        )}


        {!loading && error && (
          <div className="admin-benefits-message admin-benefits-message-error">

            <h3>
              No se pudieron cargar los beneficios
            </h3>

            <p>
              {error}
            </p>

          </div>
        )}


        {!loading &&
          !error &&
          beneficios.length === 0 && (
            <div className="admin-benefits-message">

              <h3>
                No hay beneficios registrados
              </h3>

              <p>
                Crea el primer beneficio utilizando el botón
                "Nuevo beneficio".
              </p>

            </div>
          )}


        {!loading &&
          !error &&
          beneficios.length > 0 && (
            <div className="admin-benefits-table-container">

              <table className="admin-benefits-table">

                <thead>
                  <tr>

                    <th>
                      Beneficio
                    </th>

                    <th>
                      Puntos
                    </th>

                    <th>
                      Descuento
                    </th>

                    <th>
                      Vigencia
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Acciones
                    </th>

                  </tr>
                </thead>


                <tbody>

                  {beneficios.map((beneficio) => (

                    <tr key={beneficio.id}>

                      <td>

                        <div className="admin-benefit-name">

                          <strong>
                            {beneficio.nombre}
                          </strong>

                          <span>
                            {beneficio.descripcion ||
                              'Sin descripción'}
                          </span>

                        </div>

                      </td>


                      <td>

                        <strong className="admin-benefit-points">
                          {beneficio.puntos_requeridos}
                        </strong>

                      </td>


                      <td>

                        <span className="admin-benefit-discount">
                          {Number(
                            beneficio.descuento_porcentaje
                          )}%
                        </span>

                      </td>


                      <td>
                        {beneficio.dias_vigencia} días
                      </td>


                      <td>

                        <span
                          className={`admin-benefit-status ${
                            beneficio.estado === 'activo'
                              ? 'admin-benefit-status-activo'
                              : 'admin-benefit-status-inactivo'
                          }`}
                        >
                          {beneficio.estado}
                        </span>

                      </td>


                      <td>

                        <div className="admin-benefit-actions">

                          <button
                            type="button"
                            className="admin-table-button"
                            onClick={() =>
                              abrirEditar(beneficio)
                            }
                          >
                            Editar
                          </button>


                          <button
                            type="button"
                            className={`admin-table-button ${
                              beneficio.estado === 'activo'
                                ? 'admin-table-button-danger'
                                : 'admin-table-button-success'
                            }`}
                            onClick={() =>
                              cambiarEstado(beneficio)
                            }
                          >
                            {beneficio.estado === 'activo'
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


      {modalOpen && (
        <div className="admin-benefit-modal-overlay">

          <div className="admin-benefit-modal">

            <div className="admin-benefit-modal-header">

              <div>

                <p className="section-kicker">
                  {editingBenefit
                    ? 'EDITAR BENEFICIO'
                    : 'NUEVO BENEFICIO'}
                </p>

                <h2>
                  {editingBenefit
                    ? 'Editar beneficio'
                    : 'Crear beneficio'}
                </h2>

                <p>
                  Configura los datos del beneficio para los
                  usuarios de EcoCanje.
                </p>

              </div>


              <button
                type="button"
                className="admin-benefit-modal-close"
                onClick={cerrarModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              className="admin-benefit-form"
              onSubmit={guardarBeneficio}
            >

              {formError && (
                <div className="admin-benefit-form-error">
                  {formError}
                </div>
              )}


              <div className="admin-benefit-form-grid">

                <div className="admin-form-field admin-form-field-full">

                  <label htmlFor="beneficio-nombre">
                    Nombre
                  </label>

                  <input
                    id="beneficio-nombre"
                    name="nombre"
                    type="text"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Descuento Verde"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="beneficio-puntos">
                    Puntos requeridos
                  </label>

                  <input
                    id="beneficio-puntos"
                    name="puntos_requeridos"
                    type="number"
                    min="1"
                    step="1"
                    value={form.puntos_requeridos}
                    onChange={handleChange}
                    placeholder="Ej. 250"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="beneficio-descuento">
                    Descuento (%)
                  </label>

                  <input
                    id="beneficio-descuento"
                    name="descuento_porcentaje"
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={form.descuento_porcentaje}
                    onChange={handleChange}
                    placeholder="Ej. 10"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="beneficio-vigencia">
                    Días de vigencia
                  </label>

                  <input
                    id="beneficio-vigencia"
                    name="dias_vigencia"
                    type="number"
                    min="1"
                    step="1"
                    value={form.dias_vigencia}
                    onChange={handleChange}
                    placeholder="Ej. 30"
                    disabled={saving}
                  />

                </div>


                <div className="admin-form-field">

                  <label htmlFor="beneficio-estado">
                    Estado
                  </label>

                  <select
                    id="beneficio-estado"
                    name="estado"
                    value={form.estado}
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


                <div className="admin-form-field admin-form-field-full">

                  <label htmlFor="beneficio-descripcion">
                    Descripción
                  </label>

                  <textarea
                    id="beneficio-descripcion"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    placeholder="Describe brevemente el beneficio."
                    disabled={saving}
                  />

                </div>

              </div>


              <div className="admin-benefit-form-actions">

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
                    : editingBenefit
                      ? 'Guardar cambios'
                      : 'Crear beneficio'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </main>
  )
}

export default Beneficios