import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    navigate('/')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!email || !password) {
      setError(
        'Ingresa tu correo electrónico y contraseña.'
      )
      return
    }

    try {
      setLoading(true)

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (loginError) {
        setError(
          'Correo electrónico o contraseña incorrectos.'
        )
        return
      }

      const userId = data.user?.id

      if (!userId) {
        setError('No se pudo identificar la cuenta.')
        return
      }

      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('rol')
          .eq('id', userId)
          .single()

      if (profileError) {
        console.error(
          'Error al obtener el perfil:',
          profileError
        )

        await supabase.auth.signOut()

        setError(
          'No se pudo obtener la información de tu cuenta.'
        )

        return
      }

      if (profile.rol === 'administrador') {
        navigate('/admin')
        return
      }

      if (profile.rol === 'encargado') {
        navigate('/encargado')
        return
      }

      if (profile.rol === 'usuario') {
        navigate('/usuario')
        return
      }

      await supabase.auth.signOut()

      setError(
        'El rol de esta cuenta no está configurado correctamente.'
      )
    } catch (error) {
      console.error(
        'Error al iniciar sesión:',
        error
      )

      setError(
        'Ocurrió un error al iniciar sesión.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="login-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="login-modal">

        <button
          type="button"
          className="login-modal-close"
          onClick={handleClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="login-modal-header">
          <span className="section-label">
            ECOCANJE
          </span>

          <h1>
            Iniciar sesión
          </h1>

          <p>
            Ingresa a tu cuenta para consultar tus puntos,
            beneficios y pedidos.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="form-message form-message-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
            />
          </div>

          <div className="login-options">

            <label className="remember-me">
              <input type="checkbox" />

              <span>
                Recordarme
              </span>
            </label>

            <NavLink to="/recuperar-password">
              ¿Olvidaste tu contraseña?
            </NavLink>

          </div>

          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={loading}
          >
            {loading
              ? 'Ingresando...'
              : 'Iniciar sesión'}
          </button>

          <div className="login-register">

            <span>
              ¿Aún no tienes una cuenta?
            </span>

            <NavLink to="/registro">
              Crear una cuenta
            </NavLink>

          </div>

        </form>

      </div>
    </div>
  )
}

export default Login