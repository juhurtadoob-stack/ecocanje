import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  })

  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    const { id, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleClose = () => {
    navigate('/')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const {
      nombres,
      apellidos,
      email,
      telefono,
      password,
      confirmPassword,
    } = formData

    if (
      !nombres ||
      !apellidos ||
      !email ||
      !telefono ||
      !password ||
      !confirmPassword
    ) {
      setError('Completa todos los campos.')
      return
    }

    if (password.length < 6) {
      setError(
        'La contraseña debe tener al menos 6 caracteres.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!aceptaTerminos) {
      setError(
        'Debes aceptar los términos y condiciones.'
      )
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombres,
            apellidos,
            telefono,
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(
        'Cuenta creada correctamente. Revisa tu correo electrónico para confirmar tu cuenta.'
      )

      setFormData({
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
      })

      setAceptaTerminos(false)

      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      console.error(
        'Error al crear la cuenta:',
        error
      )

      setError(
        'Ocurrió un error al crear la cuenta.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="register-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="register-modal">

        <button
          type="button"
          className="register-modal-close"
          onClick={handleClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="register-modal-header">

          <span className="section-label">
            ECOCANJE
          </span>

          <h1>
            Crear una cuenta
          </h1>

          <p>
            Regístrate para comenzar a reciclar,
            acumular puntos y obtener beneficios.
          </p>

        </div>

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="form-message form-message-error">
              {error}
            </div>
          )}

          {success && (
            <div className="form-message form-message-success">
              {success}
            </div>
          )}

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="nombres">
                Nombres
              </label>

              <input
                id="nombres"
                type="text"
                placeholder="Ingresa tus nombres"
                value={formData.nombres}
                onChange={handleChange}
                autoComplete="given-name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellidos">
                Apellidos
              </label>

              <input
                id="apellidos"
                type="text"
                placeholder="Ingresa tus apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                autoComplete="family-name"
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
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">
              Teléfono
            </label>

            <input
              id="telefono"
              type="tel"
              placeholder="Ingresa tu número"
              value={formData.telefono}
              onChange={handleChange}
              autoComplete="tel"
            />
          </div>

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="password">
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                placeholder="Crea una contraseña"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirmar contraseña
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

          </div>

          <label className="terms">

            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(event) =>
                setAceptaTerminos(
                  event.target.checked
                )
              }
            />

            <span>
              Acepto los términos y condiciones de EcoCanje.
            </span>

          </label>

          <button
            type="submit"
            className="btn btn-primary register-button"
            disabled={loading}
          >
            {loading
              ? 'Creando cuenta...'
              : 'Crear cuenta'}
          </button>

          <p className="register-login-link">
            ¿Ya tienes una cuenta?{' '}

            <NavLink to="/login">
              Inicia sesión
            </NavLink>
          </p>

        </form>

      </div>
    </div>
  )
}

export default Register