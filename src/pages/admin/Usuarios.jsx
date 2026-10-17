import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Administrador actualmente autenticado
  const [adminActualId, setAdminActualId] = useState(null)
  const [esAdminPrincipal, setEsAdminPrincipal] = useState(false)

  // Modal de cambio de rol
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [nuevoRol, setNuevoRol] = useState('')
  const [passwordAdmin, setPasswordAdmin] = useState('')
  const [cambiandoRol, setCambiandoRol] = useState(false)
  const [errorRol, setErrorRol] = useState('')
  const [exitoRol, setExitoRol] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')

    try {
      /*
        Identificar al usuario actualmente autenticado
      */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('No se pudo identificar la cuenta actual.')
        setLoading(false)
        return
      }

      setAdminActualId(user.id)

      /*
        Obtener usuarios mediante la función segura
      */
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

      /*
        Buscar al administrador actualmente autenticado
        y comprobar si es el administrador principal.
      */
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

    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const mostrarRol = (rol) => {
    const roles = {
      usuario: 'Usuario',
      encargado: 'Encargado',
      administrador: 'Administrador',
    }

    return roles[rol] || rol
  }

  /*
    Abrir modal solamente si el administrador actual
    es el administrador principal.
  */
  const abrirCambiarRol = (usuario) => {
    if (!esAdminPrincipal) {
      return
    }

    /*
      El administrador principal tampoco puede
      cambiar su propio rol.
    */
    if (usuario.id === adminActualId) {
      return
    }

    setUsuarioSeleccionado(usuario)
    setNuevoRol(usuario.rol)
    setPasswordAdmin('')
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
    setErrorRol('')
    setExitoRol('')
  }

  const cambiarRol = async (event) => {
    event.preventDefault()

    setErrorRol('')
    setExitoRol('')

    /*
      Comprobación adicional en frontend.
      La protección real también está en Supabase.
    */
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

      /*
        Obtener la cuenta actualmente autenticada.
      */
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

      /*
        Verificar nuevamente la contraseña
        del administrador principal.
      */
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

      /*
        Ejecutar la función segura de Supabase.
      */
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

      /*
        Actualizar la tabla.
      */
      await cargarDatos()

      /*
        Cerrar el modal después de mostrar
        el mensaje de éxito.
      */
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

      {/* HERO */}

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


      {/* RESUMEN */}

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


        {/* CARGANDO */}

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


        {/* ERROR */}

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


        {/* SIN USUARIOS */}

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


        {/* TABLA */}

        {!loading &&
          !error &&
          usuarios.length > 0 && (

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

                  {usuarios.map((usuario) => {

                    const esUsuarioActual =
                      usuario.id === adminActualId

                    const esAdminPrincipalUsuario =
                      usuario.es_admin_principal === true

                    return (

                      <tr key={usuario.id}>

                        {/* USUARIO */}

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


                        {/* CORREO */}

                        <td>
                          {usuario.email}
                        </td>


                        {/* ROL */}

                        <td>

                          <span
                            className={`admin-user-role admin-user-role-${usuario.rol}`}
                          >
                            {mostrarRol(usuario.rol)}
                          </span>

                        </td>


                        {/* PUNTOS DISPONIBLES */}

                        <td>

                          <strong>
                            {usuario.puntos_disponibles}
                          </strong>

                        </td>


                        {/* PUNTOS ACUMULADOS */}

                        <td>
                          {usuario.puntos_acumulados}
                        </td>


                        {/* NIVEL */}

                        <td>

                          <span className="admin-user-level">
                            {usuario.nivel}
                          </span>

                        </td>


                        {/* FECHA */}

                        <td>
                          {formatearFecha(
                            usuario.created_at
                          )}
                        </td>


                        {/* ACCIÓN */}

                        <td>

                          {esUsuarioActual && esAdminPrincipalUsuario ? (

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


            {/* USUARIO SELECCIONADO */}

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

              {/* NUEVO ROL */}

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


              {/* CONTRASEÑA */}

              <div className="admin-role-form-group">

                <label htmlFor="admin-password">
                  Contraseña del administrador
                </label>

                <input
                  id="admin-password"
                  type="password"
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

                <small>
                  Por seguridad, confirma tu contraseña
                  para realizar este cambio.
                </small>

              </div>


              {/* ERROR */}

              {errorRol && (

                <div className="form-message form-message-error">
                  {errorRol}
                </div>

              )}


              {/* ÉXITO */}

              {exitoRol && (

                <div className="form-message form-message-success">
                  {exitoRol}
                </div>

              )}


              {/* BOTONES */}

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