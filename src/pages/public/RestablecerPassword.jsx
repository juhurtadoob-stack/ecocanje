import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function RestablecerPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const cambioObligatorio =
    searchParams.get('cambio') === 'obligatorio'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [mostrarPassword, setMostrarPassword] =
    useState(false)

  const [
    mostrarConfirmPassword,
    setMostrarConfirmPassword,
  ] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true

    const verificarSesion = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (!session) {
          setError(
            cambioObligatorio
              ? 'No se encontró una sesión activa para cambiar la contraseña.'
              : 'El enlace de recuperación no es válido o ha expirado.'
          )
        }
      } catch (err) {
        console.error(
          'Error al verificar la sesión:',
          err
        )

        if (mounted) {
          setError(
            'No se pudo verificar la sesión.'
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    verificarSesion()

    return () => {
      mounted = false
    }
  }, [cambioObligatorio])

  const handleClose = () => {
    navigate('/')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!password || !confirmPassword) {
      setError(
        'Completa ambos campos de contraseña.'
      )
      return
    }

    if (password.length < 8) {
      setError(
        'La contraseña debe tener al menos 8 caracteres.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError(
        'Las contraseñas no coinciden.'
      )
      return
    }

    try {
      setSaving(true)

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        })

      if (updateError) {
        console.error(
          'Error al actualizar contraseña:',
          updateError
        )

        setError(
          'No se pudo actualizar la contraseña.'
        )

        return
      }

      if (cambioObligatorio) {
        const { error: completarCambioError } =
          await supabase.rpc(
            'marcar_cambio_password_completado'
          )

        if (completarCambioError) {
          console.error(
            'Error al completar el cambio obligatorio:',
            completarCambioError
          )

          setError(
            'La contraseña se actualizó, pero no se pudo completar el cambio obligatorio. Intenta nuevamente.'
          )

          return
        }
      }

      setSuccess(true)

      await supabase.auth.signOut()
    } catch (err) {
      console.error(
        'Error al restablecer contraseña:',
        err
      )

      setError(
        'Ocurrió un error al restablecer la contraseña.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="reset-password-modal-overlay">

        <div className="reset-password-modal">

          <button
            type="button"
            className="reset-password-modal-close"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            ×
          </button>

          <div className="reset-password-modal-header">

            <span className="section-label">
              ECOCANJE
            </span>

            <h1>
              Verificando sesión
            </h1>

            <p>
              Estamos verificando tu sesión.
            </p>

          </div>

        </div>

      </div>
    )
  }

  if (success) {
    return (
      <div className="reset-password-modal-overlay">

        <div className="reset-password-modal">

          <button
            type="button"
            className="reset-password-modal-close"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            ×
          </button>

          <div className="reset-password-modal-header">

            <span className="section-label">
              ECOCANJE
            </span>

            <h1>
              Contraseña actualizada
            </h1>

            <p>
              {cambioObligatorio
                ? 'Tu contraseña temporal fue reemplazada correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
                : 'Tu contraseña se actualizó correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.'}
            </p>

          </div>

          <button
            type="button"
            className="btn btn-primary reset-password-button"
            onClick={() => navigate('/login')}
          >
            Ir a iniciar sesión
          </button>

        </div>

      </div>
    )
  }

  return (
    <div
      className="reset-password-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >

      <div className="reset-password-modal">

        <button
          type="button"
          className="reset-password-modal-close"
          onClick={handleClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="reset-password-modal-header">

          <span className="section-label">
            ECOCANJE
          </span>

          <h1>
            {cambioObligatorio
              ? 'Cambia tu contraseña'
              : 'Restablecer contraseña'}
          </h1>

          <p>
            {cambioObligatorio
              ? 'Por seguridad, debes reemplazar la contraseña temporal antes de continuar.'
              : 'Ingresa una nueva contraseña para recuperar el acceso a tu cuenta.'}
          </p>

        </div>

        <form
          className="reset-password-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="form-message form-message-error">
              {error}
            </div>
          )}

          {cambioObligatorio && (
            <div className="form-message">
              Tu contraseña temporal debe ser reemplazada
              antes de acceder al panel de encargado.
            </div>
          )}

          <div className="form-group">

            <label htmlFor="password">
              Nueva contraseña
            </label>

            <div className="password-field">

              <input
                id="password"
                type={
                  mostrarPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setMostrarPassword(
                    !mostrarPassword
                  )
                }
                aria-label={
                  mostrarPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                title={
                  mostrarPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >

                {mostrarPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-3.1 3.8" />
                    <path d="M6.1 6.8C3.5 6.8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7" />
                  </svg>
                )}

              </button>

            </div>

          </div>

          <div className="form-group">

            <label htmlFor="confirm-password">
              Confirmar contraseña
            </label>

            <div className="password-field">

              <input
                id="confirm-password"
                type={
                  mostrarConfirmPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setMostrarConfirmPassword(
                    !mostrarConfirmPassword
                  )
                }
                aria-label={
                  mostrarConfirmPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                title={
                  mostrarConfirmPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >

                {mostrarConfirmPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-3.1 3.8" />
                    <path d="M6.1 6.8C3.5 6.8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7" />
                  </svg>
                )}

              </button>

            </div>

          </div>

          <button
            type="submit"
            className="btn btn-primary reset-password-button"
            disabled={saving}
          >
            {saving
              ? 'Actualizando...'
              : cambioObligatorio
                ? 'Guardar nueva contraseña'
                : 'Actualizar contraseña'}
          </button>

        </form>

      </div>

    </div>
  )
}

export default RestablecerPassword