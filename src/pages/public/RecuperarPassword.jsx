import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function RecuperarPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleClose = () => {
    navigate('/')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setMessage('')
    setError('')

    if (!email) {
      setError(
        'Ingresa tu correo electrónico.'
      )
      return
    }

    try {
      setLoading(true)

      const { error: recoveryError } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${window.location.origin}/restablecer-password`,
          }
        )

      if (recoveryError) {
        console.error(
          'Error al enviar recuperación:',
          recoveryError
        )

        setError(
          'No se pudo enviar el correo de recuperación.'
        )

        return
      }

      setMessage(
        'Se enviaron las instrucciones a tu correo electrónico. Revisa tu bandeja de entrada.'
      )

    } catch (err) {
      console.error(
        'Error al solicitar recuperación:',
        err
      )

      setError(
        'Ocurrió un error al solicitar la recuperación.'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="recover-password-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="recover-password-modal">

        <button
          type="button"
          className="recover-password-modal-close"
          onClick={handleClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="recover-password-modal-header">

          <span className="section-label">
            ECOCANJE
          </span>

          <h1>
            Recuperar contraseña
          </h1>

          <p>
            Ingresa tu correo electrónico y te enviaremos
            las instrucciones para restablecer tu contraseña.
          </p>

        </div>

        <form
          className="recover-password-form"
          onSubmit={handleSubmit}
        >

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

          <div className="form-group">

            <label htmlFor="recover-email">
              Correo electrónico
            </label>

            <input
              id="recover-email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
            />

          </div>

          <button
            type="submit"
            className="btn btn-primary recover-password-button"
            disabled={loading}
          >
            {loading
              ? 'Enviando...'
              : 'Enviar instrucciones'}
          </button>

          <div className="recover-password-login">

            <NavLink to="/login">
              Volver a iniciar sesión
            </NavLink>

          </div>

        </form>

      </div>
    </div>
  )
}

export default RecuperarPassword