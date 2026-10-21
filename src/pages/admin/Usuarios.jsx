import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [busqueda, setBusqueda] = useState('')

  const [adminActualId, setAdminActualId] = useState(null)
  const [esAdminPrincipal, setEsAdminPrincipal] =
    useState(false)

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState(null)

  const [nuevoRol, setNuevoRol] = useState('')
  const [passwordAdmin, setPasswordAdmin] = useState('')

  const [mostrarPasswordAdmin, setMostrarPasswordAdmin] =
    useState(false)

  const [cambiandoRol, setCambiandoRol] =
    useState(false)

  const [errorRol, setErrorRol] = useState('')
  const [exitoRol, setExitoRol] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError(
          'No se pudo identificar la cuenta actual.'
        )

        setLoading(false)
        return
      }

      setAdminActualId(user.id)

      const {
        data,
        error: usuariosError,
      } = await supabase.rpc('get_admin_users')

      if (usuariosError) {
        console.error(usuariosError)

        setError(
          'No se pudieron cargar los usuarios registrados.'
        )

        setLoading(false)
        return
      }

      const usuariosData = data || []

      setUsuarios(usuariosData)

      const usuarioActual = usuariosData.find(
        (usuario) => usuario.id === user.id
      )

      if (usuarioActual) {
        setEsAdminPrincipal(
          usuarioActual.es_admin_principal === true
        )
      } else {
        setEsAdminPrincipal(false)
      }

    } catch (error) {
      console.error(
        'Error al cargar usuarios:',
        error
      )

      setError(
        'Ocurrió un error al cargar los usuarios.'
      )

    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return '-'
    }

    return new Date(fecha).toLocaleDateString(
      'es-PE',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    )
  }

  const mostrarRol = (rol) => {
    const roles = {
      usuario: 'Usuario',
      encargado: 'Encargado',
      administrador: 'Administrador',
    }

    return roles[rol] || rol
  }

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    if (!texto) {
      return usuarios
    }

    return usuarios.filter((usuario) => {
      const contenido = [
        usuario.nombres,
        usuario.apellidos,
        usuario.email,
        usuario.rol,
        mostrarRol(usuario.rol),
        usuario.nivel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return contenido.includes(texto)
    })
  }, [usuarios, busqueda])

  const abrirCambiarRol = (usuario) => {
    if (!esAdminPrincipal) {
      return
    }

    if (usuario.id === adminActualId) {
      return
    }

    setUsuarioSeleccionado(usuario)
    setNuevoRol(usuario.rol)
    setPasswordAdmin('')
    setMostrarPasswordAdmin(false)
    setErrorRol('')
    setExitoRol('')
  }

  const cerrarCambiarRol = () => {
    if (cambiandoRol) {
      return
    }

    setUsuarioSeleccionado(null)
    setNuevoRol('')
    setPasswordAdmin('')
    setMostrarPasswordAdmin(false)
    setErrorRol('')
    setExitoRol('')
  }

  const cambiarRol = async (event) => {
    event.preventDefault()

    setErrorRol('')
    setExitoRol('')

    if (!esAdminPrincipal) {
      setErrorRol(
        'Solo el administrador principal puede cambiar roles.'
      )
      return
    }

    if (!usuarioSeleccionado) {
      setErrorRol(
        'No se seleccionó ningún usuario.'
      )
      return
    }

    if (usuarioSeleccionado.id === adminActualId) {
      setErrorRol(
        'No puedes cambiar tu propio rol.'
      )
      return
    }

    if (!nuevoRol) {
      setErrorRol(
        'Selecciona un rol.'
      )
      return
    }

    if (!passwordAdmin) {
      setErrorRol(
        'Ingresa la contraseña del administrador.'
      )
      return
    }

    if (usuarioSeleccionado.rol === nuevoRol) {
      setErrorRol(
        'El usuario ya tiene ese rol.'
      )
      return
    }

    try {
      setCambiandoRol(true)

      const {
        data: {
          user: adminUser,
        },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !adminUser) {
        setErrorRol(
          'No se pudo identificar la cuenta del administrador.'
        )
        return
      }

      if (!adminUser.email) {
        setErrorRol(
          'La cuenta del administrador no tiene un correo disponible.'
        )
        return
      }

      const {
        error: passwordError,
      } = await supabase.auth.signInWithPassword({
        email: adminUser.email,
        password: passwordAdmin,
      })

      if (passwordError) {
        setErrorRol(
          'La contraseña del administrador es incorrecta.'
        )
        return
      }

      const {
        error: cambioError,
      } = await supabase.rpc(
        'admin_change_user_role',
        {
          p_usuario_id: usuarioSeleccionado.id,
          p_nuevo_rol: nuevoRol,
        }
      )

      if (cambioError) {
        console.error(
          'Error al cambiar rol:',
          cambioError
        )

        setErrorRol(
          cambioError.message ||
          'No se pudo cambiar el rol del usuario.'
        )

        return
      }

      setExitoRol(
        `El rol de ${
          usuarioSeleccionado.nombres || 'el usuario'
        } fue actualizado correctamente.`
      )

      await cargarDatos()

      setTimeout(() => {
        cerrarCambiarRol()
      }, 900)

    } catch (error) {
      console.error(
        'Error al cambiar rol:',
        error
      )

      setErrorRol(
        'Ocurrió un error al intentar cambiar el rol.'
      )

    } finally {
      setCambiandoRol(false)
    }
  }

  return (
    <main className="admin-users-page">

      <section className="admin-users-hero">

        <div>

          <p className="section-kicker">
            GESTIÓN DE USUARIOS
          </p>

          <h1>
            Usuarios registrados
          </h1>

          <p>
            Información principal de las cuentas de EcoCanje.
          </p>

        </div>

      </section>


      <section className="admin-users-section">

        <div className="admin-users-header">

          <div>

            <p className="section-kicker">
              VISTA GENERAL
            </p>

            <h2>
              Directorio de usuarios
            </h2>

            <p>
              Detalle de cuentas, roles y puntos acumulados.
            </p>

          </div>

          <div className="admin-users-count">

            <span>
              Total de cuentas
            </span>

            <strong>
              {usuarios.length}
            </strong>

            <small>
              Registros en la plataforma
            </small>

          </div>

        </div>


        {!loading && !error && (

          <div className="admin-users-search">

            <div className="admin-users-search-field">

              <label htmlFor="buscar-usuarios">
                Buscar
              </label>

              <input
                id="buscar-usuarios"
                type="text"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Nombre, apellido, correo o rol..."
                autoComplete="off"
              />

            </div>

            <div className="admin-users-search-results">

              <span>
                Resultados
              </span>

              <strong>
                {usuariosFiltrados.length}
              </strong>

            </div>

          </div>

        )}


        {loading && (

          <div className="admin-users-message">

            <h3>
              Cargando usuarios...
            </h3>

            <p>
              Estamos consultando los registros de EcoCanje.
            </p>

          </div>

        )}


        {!loading && error && (

          <div className="admin-users-message admin-users-message-error">

            <h3>
              No se pudieron cargar los usuarios
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {!loading &&
          !error &&
          usuarios.length === 0 && (

            <div className="admin-users-message">

              <h3>
                No hay usuarios registrados
              </h3>

              <p>
                Todavía no existen cuentas disponibles para mostrar.
              </p>

            </div>

        )}


        {!loading &&
          !error &&
          usuarios.length > 0 &&
          usuariosFiltrados.length === 0 && (

            <div className="admin-users-message">

              <h3>
                No se encontraron usuarios
              </h3>

              <p>
                No existen usuarios que coincidan con la búsqueda.
              </p>

            </div>

        )}


        {!loading &&
          !error &&
          usuariosFiltrados.length > 0 && (

            <div className="admin-users-table-container">

              <table className="admin-users-table">

                <thead>

                  <tr>

                    <th>
                      Usuario
                    </th>

                    <th>
                      Correo electrónico
                    </th>

                    <th>
                      Rol
                    </th>

                    <th>
                      Puntos disponibles
                    </th>

                    <th>
                      Puntos acumulados
                    </th>

                    <th>
                      Nivel
                    </th>

                    <th>
                      Fecha de registro
                    </th>

                    <th>
                      Acción
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {usuariosFiltrados.map((usuario) => {

                    const esUsuarioActual =
                      usuario.id === adminActualId

                    const esAdminPrincipalUsuario =
                      usuario.es_admin_principal === true

                    return (

                      <tr key={usuario.id}>

                        <td>

                          <div className="admin-user-name">

                            <strong>
                              {usuario.nombres || 'Sin nombre'}
                            </strong>

                            <span>
                              {usuario.apellidos || 'Sin apellidos'}
                            </span>

                          </div>

                        </td>

                        <td>
                          {usuario.email}
                        </td>

                        <td>

                          <span
                            className={`admin-user-role admin-user-role-${usuario.rol}`}
                          >
                            {mostrarRol(usuario.rol)}
                          </span>

                        </td>

                        <td>

                          <strong>
                            {usuario.puntos_disponibles}
                          </strong>

                        </td>

                        <td>
                          {usuario.puntos_acumulados}
                        </td>

                        <td>

                          <span className="admin-user-level">
                            {usuario.nivel}
                          </span>

                        </td>

                        <td>
                          {formatearFecha(
                            usuario.created_at
                          )}
                        </td>

                        <td>

                          {esUsuarioActual &&
                          esAdminPrincipalUsuario ? (

                            <span className="admin-user-action-disabled">
                              Administrador principal
                            </span>

                          ) : !esAdminPrincipal ? (

                            <span className="admin-user-action-disabled">
                              Sin permisos
                            </span>

                          ) : (

                            <button
                              type="button"
                              className="admin-user-action-button"
                              onClick={() =>
                                abrirCambiarRol(usuario)
                              }
                            >
                              Cambiar rol
                            </button>

                          )}

                        </td>

                      </tr>

                    )

                  })}

                </tbody>

              </table>

            </div>

        )}

      </section>


      {/* MODAL CAMBIAR ROL */}

      {usuarioSeleccionado && (

        <div
          className="admin-role-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target === event.currentTarget &&
              !cambiandoRol
            ) {
              cerrarCambiarRol()
            }

          }}
        >

          <div
            className="admin-role-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-role-modal-header">

              <div>

                <span className="section-kicker">
                  GESTIÓN DE CUENTA
                </span>

                <h2>
                  Cambiar rol
                </h2>

                <p>
                  Actualiza los permisos de esta cuenta.
                </p>

              </div>

              <button
                type="button"
                className="admin-role-modal-close"
                onClick={cerrarCambiarRol}
                disabled={cambiandoRol}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <div className="admin-role-user">

              <div className="admin-role-user-avatar">

                {(
                  usuarioSeleccionado.nombres ||
                  'U'
                ).charAt(0).toUpperCase()}

              </div>

              <div>

                <strong>

                  {usuarioSeleccionado.nombres ||
                    'Sin nombre'}{' '}

                  {usuarioSeleccionado.apellidos ||
                    ''}

                </strong>

                <span>
                  {usuarioSeleccionado.email}
                </span>

              </div>

            </div>


            <form
              className="admin-role-form"
              onSubmit={cambiarRol}
            >

              <div className="admin-role-form-group">

                <label htmlFor="nuevo-rol">
                  Nuevo rol
                </label>

                <select
                  id="nuevo-rol"
                  value={nuevoRol}
                  onChange={(event) =>
                    setNuevoRol(event.target.value)
                  }
                  disabled={cambiandoRol}
                >

                  <option value="usuario">
                    Usuario
                  </option>

                  <option value="encargado">
                    Encargado
                  </option>

                  <option value="administrador">
                    Administrador
                  </option>

                </select>

              </div>


              {/* CONTRASEÑA DEL ADMINISTRADOR */}

              <div className="admin-role-form-group">

                <label htmlFor="admin-password">
                  Contraseña del administrador
                </label>

                <div className="password-field">

                  <input
                    id="admin-password"
                    type={
                      mostrarPasswordAdmin
                        ? 'text'
                        : 'password'
                    }
                    value={passwordAdmin}
                    onChange={(event) =>
                      setPasswordAdmin(
                        event.target.value
                      )
                    }
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    disabled={cambiandoRol}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setMostrarPasswordAdmin(
                        !mostrarPasswordAdmin
                      )
                    }
                    disabled={cambiandoRol}
                    aria-label={
                      mostrarPasswordAdmin
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    title={
                      mostrarPasswordAdmin
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >

                    {mostrarPasswordAdmin ? (
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

                <small>
                  Por seguridad, confirma tu contraseña
                  para realizar este cambio.
                </small>

              </div>


              {errorRol && (

                <div className="form-message form-message-error">
                  {errorRol}
                </div>

              )}


              {exitoRol && (

                <div className="form-message form-message-success">
                  {exitoRol}
                </div>

              )}


              <div className="admin-role-modal-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cerrarCambiarRol}
                  disabled={cambiandoRol}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={cambiandoRol}
                >
                  {cambiandoRol
                    ? 'Verificando...'
                    : 'Confirmar cambio'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  )
}

export default Usuarios