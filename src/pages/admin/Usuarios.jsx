import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    setLoading(true)
    setError('')

    const { data, error: usuariosError } = await supabase.rpc(
      'get_admin_users'
    )

    if (usuariosError) {
      console.error(usuariosError)

      setError(
        'No se pudieron cargar los usuarios registrados.'
      )

      setLoading(false)
      return
    }

    setUsuarios(data || [])
    setLoading(false)
  }

  const formatearFecha = (fecha) => {
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

  return (
    <main className="admin-users-page">

      <section className="admin-users-hero">
        <div>
          <p className="section-kicker">
            GESTIÓN DE USUARIOS
          </p>

          <h1>
            Usuarios
          </h1>

          <p>
            Consulta y supervisa las cuentas registradas
            en la plataforma EcoCanje.
          </p>
        </div>
      </section>


      <section className="admin-users-section">

        <div className="admin-users-header">

          <div>
            <p className="section-kicker">
              REGISTROS
            </p>

            <h2>
              Usuarios registrados
            </h2>

            <p>
              Aquí puedes consultar la información principal
              de las cuentas de EcoCanje.
            </p>
          </div>

          <div className="admin-users-count">
            <span>
              Total
            </span>

            <strong>
              {usuarios.length}
            </strong>
          </div>

        </div>


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


        {!loading && !error && usuarios.length === 0 && (
          <div className="admin-users-message">

            <h3>
              No hay usuarios registrados
            </h3>

            <p>
              Todavía no existen cuentas disponibles para mostrar.
            </p>

          </div>
        )}


        {!loading && !error && usuarios.length > 0 && (
          <div className="admin-users-table-container">

            <table className="admin-users-table">

              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Puntos disponibles</th>
                  <th>Puntos acumulados</th>
                  <th>Nivel</th>
                  <th>Registro</th>
                </tr>
              </thead>

              <tbody>

                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>

                    <td>
                      <div className="admin-user-name">
                        <strong>
                          {usuario.nombres || 'Sin nombre'}
                        </strong>

                        <span>
                          {usuario.apellidos || ''}
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
                      {usuario.nivel}
                    </td>

                    <td>
                      {formatearFecha(usuario.created_at)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </main>
  )
}

export default Usuarios