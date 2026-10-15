import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function formatearFecha(fecha) {
  if (!fecha) {
    return '-'
  }

  return new Date(fecha).toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargarNotificaciones = async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('No se pudo identificar al usuario.')
      setLoading(false)
      return
    }

    const { data, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error(
        'Error al cargar notificaciones:',
        notificationsError
      )

      setError(
        notificationsError.message ||
          'No se pudieron cargar las notificaciones.'
      )

      setLoading(false)
      return
    }

    setNotificaciones(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  const marcarComoLeida = async (id) => {
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ leida: true })
      .eq('id', id)

    if (updateError) {
      console.error(
        'Error al marcar notificación:',
        updateError
      )
      return
    }

    setNotificaciones((actuales) =>
      actuales.map((notificacion) =>
        notificacion.id === id
          ? { ...notificacion, leida: true }
          : notificacion
      )
    )
  }

  const marcarTodasComoLeidas = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ leida: true })
      .eq('usuario_id', user.id)
      .eq('leida', false)

    if (updateError) {
      console.error(
        'Error al marcar todas las notificaciones:',
        updateError
      )
      return
    }

    setNotificaciones((actuales) =>
      actuales.map((notificacion) => ({
        ...notificacion,
        leida: true,
      }))
    )
  }

  const noLeidas = notificaciones.filter(
    (notificacion) => !notificacion.leida
  ).length

  return (
    <main className="user-notifications-page">

      <section className="user-notifications-hero">
        <div>
          <p className="section-kicker">
            CENTRO DE NOTIFICACIONES
          </p>

          <h1>Notificaciones</h1>

          <p>
            Consulta las novedades y actualizaciones de tu
            cuenta en EcoCanje.
          </p>
        </div>
      </section>

      <section className="user-notifications-section">

        <div className="user-notifications-header">

          <div>
            <p className="section-kicker">
              ACTUALIZACIONES
            </p>

            <h2>
              Tus notificaciones
            </h2>

            <p>
              Aquí aparecerán los avisos relacionados con
              tus reciclajes, pedidos y beneficios.
            </p>
          </div>

          {noLeidas > 0 && (
            <button
              type="button"
              className="user-notifications-read-all"
              onClick={marcarTodasComoLeidas}
            >
              Marcar todas como leídas
            </button>
          )}

        </div>

        {loading && (
          <div className="user-notifications-message">
            Cargando notificaciones...
          </div>
        )}

        {!loading && error && (
          <div className="user-notifications-message user-notifications-message-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          notificaciones.length === 0 && (
            <div className="user-notifications-empty">
              <h3>No tienes notificaciones</h3>

              <p>
                Cuando recibas una actualización aparecerá
                aquí.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          notificaciones.length > 0 && (
            <div className="user-notifications-list">

              {notificaciones.map((notificacion) => (
                <article
                  key={notificacion.id}
                  className={
                    `user-notification-card ${
                      !notificacion.leida
                        ? 'user-notification-unread'
                        : ''
                    }`
                  }
                >

                  <div className="user-notification-content">

                    <div className="user-notification-top">

                      <div>
                        <span className="user-notification-type">
                          {notificacion.tipo ||
                            'Notificación'}
                        </span>

                        <h3>
                          {notificacion.titulo}
                        </h3>
                      </div>

                      {!notificacion.leida && (
                        <span className="user-notification-badge">
                          Nueva
                        </span>
                      )}

                    </div>

                    <p>
                      {notificacion.mensaje}
                    </p>

                    <span className="user-notification-date">
                      {formatearFecha(
                        notificacion.created_at
                      )}
                    </span>

                  </div>

                  {!notificacion.leida && (
                    <button
                      type="button"
                      className="user-notification-read-button"
                      onClick={() =>
                        marcarComoLeida(
                          notificacion.id
                        )
                      }
                    >
                      Marcar como leída
                    </button>
                  )}

                </article>
              ))}

            </div>
          )}

      </section>

    </main>
  )
}

export default Notificaciones