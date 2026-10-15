import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'

function QR() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      setError('')

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
        .select('nombres, apellidos, codigo_usuario')
        .eq('id', currentUser.id)
        .single()

      if (profileError) {
        throw profileError
      }

      setProfile(profileData)
    } catch (err) {
      console.error('Error al cargar el código QR:', err)
      setError('No se pudo cargar tu código QR.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="user-qr-page">
        <section className="user-qr-section">
          <div className="container">
            <div className="auth-loading">
              Cargando tu código QR...
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (error || !user) {
    return (
      <main className="user-qr-page">
        <section className="user-qr-section">
          <div className="container">
            <div className="auth-loading">
              {error || 'No se encontró tu cuenta.'}
            </div>
          </div>
        </section>
      </main>
    )
  }

  const qrValue = profile?.codigo_usuario || ''

  const userCode = `EC-${user.id
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase()}`

  return (
    <main className="user-qr-page">

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <section className="user-qr-hero">

        <div className="container">

          <span className="section-label">
            MI IDENTIFICACIÓN
          </span>

          <h1>
            Tu código QR
            <span> de EcoCanje.</span>
          </h1>

          <p>
            Muestra este código en un punto de acopio para que el
            encargado pueda identificar tu cuenta y registrar tu reciclaje.
          </p>

        </div>

      </section>


      {/* ========================================
          QR
      ======================================== */}

      <section className="user-qr-section">

        <div className="container">

          <div className="user-qr-content">


            {/* CÓDIGO QR */}

            <div className="user-qr-card">

              <div className="qr-placeholder">

                <QRCodeSVG
                  value={qrValue}
                  size={220}
                  level="H"
                  includeMargin={true}
                />

              </div>

              <p className="qr-status">
                Código de usuario
              </p>

              <strong className="qr-user-code">
                {userCode}
              </strong>

              {profile && (
                <p className="qr-user-name">
                  {profile.nombres} {profile.apellidos}
                </p>
              )}

            </div>


            {/* INFORMACIÓN */}

            <div className="user-qr-info">

              <span className="section-label">
                ¿CÓMO UTILIZARLO?
              </span>

              <h2>
                Identifícate fácilmente
                <span> al reciclar.</span>
              </h2>

              <p>
                Tu código QR permite al encargado identificar tu cuenta
                antes de registrar los materiales que entregas.
              </p>


              <div className="qr-steps">

                <div className="qr-step">

                  <strong>
                    01
                  </strong>

                  <div>
                    <h3>
                      Acude a un punto de acopio
                    </h3>

                    <p>
                      Lleva tus materiales reciclables a uno de los
                      puntos disponibles.
                    </p>
                  </div>

                </div>


                <div className="qr-step">

                  <strong>
                    02
                  </strong>

                  <div>
                    <h3>
                      Muestra tu QR
                    </h3>

                    <p>
                      El encargado escaneará tu código para identificar
                      tu cuenta.
                    </p>
                  </div>

                </div>


                <div className="qr-step">

                  <strong>
                    03
                  </strong>

                  <div>
                    <h3>
                      Registra tu reciclaje
                    </h3>

                    <p>
                      El encargado validará tus materiales y el sistema
                      calculará tus puntos.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          IMPORTANTE
      ======================================== */}

      <section className="user-qr-note">

        <div className="container">

          <div className="user-qr-note-card">

            <strong>
              Importante
            </strong>

            <p>
              Este código identifica únicamente tu cuenta de EcoCanje.
              Los puntos solo pueden ser asignados mediante un registro
              de reciclaje validado por un encargado.
            </p>

          </div>

        </div>

      </section>

    </main>
  )
}

export default QR