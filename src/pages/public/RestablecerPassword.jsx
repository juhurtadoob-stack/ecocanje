import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function RestablecerPassword() {
  const navigate = useNavigate()

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

    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (!session) {
        setError(
          'El enlace de recuperación no es válido o ha expirado.'
        )
      }

      setLoading(false)
    }

    checkRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {

        if (
          event === 'PASSWORD_RECOVERY' &&
          session
        ) {
          setError('')
          setLoading(false)
        }

      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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

    if (password.length < 6) {
      setError(
        'La contraseña debe tener al menos 6 caracteres.'
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
              Verificando enlace
            </h1>

            <p>
              Estamos verificando tu solicitud
              de recuperación.
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
              Tu contraseña se actualizó correctamente.
              Ahora puedes iniciar sesión con tu nueva
              contraseña.
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

        if (
          event.target === event.currentTarget
        ) {
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
            Restablecer contraseña
          </h1>

          <p>
            Ingresa una nueva contraseña para
            recuperar el acceso a tu cuenta.
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

          {/* NUEVA CONTRASEÑA */}

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
                placeholder="Mínimo 6 caracteres"
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
                    <path d="M6.1 6.8C3.5 8.5 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7" />
                  </svg>
                )}

              </button>

            </div>

          </div>


          {/* CONFIRMAR CONTRASEÑA */}

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
                    <path d="M6.1 6.8C3.5 8.5 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7" />
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
              : 'Actualizar contraseña'}
          </button>

        </form>

      </div>

    </div>
  )
}

export default RestablecerPassword