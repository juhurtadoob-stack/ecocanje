import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Perfil() {
  const [user, setUser] = useState(null)

  const [profile, setProfile] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    rol: 'usuario',
    nivel: 'Semilla',
    puntos_disponibles: 0,
    puntos_acumulados: 0,
  })

  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')
      setMessage('')

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!currentUser) {
        setError('No se encontró una sesión activa.')
        return
      }

      setUser(currentUser)

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'nombres, apellidos, telefono, rol, nivel, puntos_disponibles, puntos_acumulados'
        )
        .eq('id', currentUser.id)
        .single()

      if (profileError) {
        throw profileError
      }

      setProfile({
        nombres: profileData.nombres || '',
        apellidos: profileData.apellidos || '',
        telefono: profileData.telefono || '',
        rol: profileData.rol || 'usuario',
        nivel: profileData.nivel || 'Semilla',
        puntos_disponibles: profileData.puntos_disponibles ?? 0,
        puntos_acumulados: profileData.puntos_acumulados ?? 0,
      })
    } catch (err) {
      console.error('Error al cargar el perfil:', err)
      setError('No se pudieron cargar los datos de tu perfil.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEdit = () => {
    setError('')
    setMessage('')
    setEditando(true)
  }

  const handleCancel = () => {
    setEditando(false)
    setError('')
    setMessage('')
    loadProfile()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!profile.nombres || !profile.apellidos) {
      setError('Los nombres y apellidos son obligatorios.')
      return
    }

    try {
      setSaving(true)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nombres: profile.nombres,
          apellidos: profile.apellidos,
          telefono: profile.telefono,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      setEditando(false)
      setMessage('Tus datos se actualizaron correctamente.')
    } catch (err) {
      console.error('Error al actualizar el perfil:', err)
      setError('No se pudieron actualizar tus datos.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="user-profile">
        <section className="profile-section">
          <div className="container">
            <div className="auth-loading">
              Cargando tu perfil...
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (error && !user) {
    return (
      <main className="user-profile">
        <section className="profile-section">
          <div className="container">
            <div className="auth-loading">
              {error}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="user-profile">

      <section className="profile-hero">
        <div className="container">

          <span className="section-label">
            MI CUENTA
          </span>

          <h1>
            Mi perfil
          </h1>

          <p>
            Consulta y actualiza la información de tu cuenta en EcoCanje.
          </p>

        </div>
      </section>


      <section className="profile-section">
        <div className="container">

          <div className="profile-grid">

            <div className="profile-card">

              <div className="profile-card-header">

                <div className="profile-header-content">
                  <div>
                    <h2>
                      Información personal
                    </h2>

                    <p>
                      {editando
                        ? 'Modifica los datos que deseas actualizar.'
                        : 'Consulta tus datos personales.'}
                    </p>
                  </div>

                  {!editando && (
                    <button
                      type="button"
                      className="profile-edit-button"
                      onClick={handleEdit}
                    >
                      Editar información
                    </button>
                  )}
                </div>

              </div>


              {error && (
                <div className="form-message form-message-error">
                  {error}
                </div>
              )}


              {message && (
                <div className="form-message form-message-success">
                  {message}
                </div>
              )}


              <form onSubmit={handleSubmit}>

                <div className="form-row">

                  <div className="form-group">
                    <label htmlFor="nombres">
                      Nombres
                    </label>

                    <input
                      id="nombres"
                      name="nombres"
                      type="text"
                      value={profile.nombres}
                      onChange={handleChange}
                      disabled={!editando}
                    />
                  </div>


                  <div className="form-group">
                    <label htmlFor="apellidos">
                      Apellidos
                    </label>

                    <input
                      id="apellidos"
                      name="apellidos"
                      type="text"
                      value={profile.apellidos}
                      onChange={handleChange}
                      disabled={!editando}
                    />
                  </div>

                </div>


                <div className="form-group">
                  <label htmlFor="email">
                    Correo electrónico
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="telefono">
                    Teléfono
                  </label>

                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={profile.telefono}
                    onChange={handleChange}
                    disabled={!editando}
                  />
                </div>


                {editando && (
                  <div className="profile-actions">

                    <button
                      type="submit"
                      className="btn btn-primary profile-button"
                      disabled={saving}
                    >
                      {saving
                        ? 'Guardando cambios...'
                        : 'Guardar cambios'}
                    </button>


                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancelar
                    </button>

                  </div>
                )}

              </form>

            </div>


            <div className="profile-card profile-summary">

              <div className="profile-card-header">
                <h2>
                  Resumen de cuenta
                </h2>

                <p>
                  Información actual de tu cuenta.
                </p>
              </div>


              <div className="profile-info">

                <div className="profile-info-item">
                  <span>
                    Rol
                  </span>

                  <strong>
                    {profile.rol === 'usuario'
                      ? 'Usuario'
                      : profile.rol}
                  </strong>
                </div>


                <div className="profile-info-item">
                  <span>
                    Nivel
                  </span>

                  <strong>
                    {profile.nivel}
                  </strong>
                </div>


                <div className="profile-info-item">
                  <span>
                    Puntos acumulados
                  </span>

                  <strong>
                    {profile.puntos_acumulados}
                  </strong>
                </div>


                <div className="profile-info-item">
                  <span>
                    Puntos disponibles
                  </span>

                  <strong>
                    {profile.puntos_disponibles}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

    </main>
  )
}

export default Perfil