import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'

function Escanear() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)

  const [scanning, setScanning] = useState(false)
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [codigoManual, setCodigoManual] = useState('')
  const [buscandoManual, setBuscandoManual] = useState(false)

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      setError('')
      setMessage('')
      setUser(null)

      const scanner = new Html5Qrcode('qr-reader')

      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          await handleScan(decodedText)
        },
        () => {}
      )

      setScanning(true)
    } catch (err) {
      console.error('Error al iniciar el escáner:', err)

      setError(
        'No se pudo iniciar la cámara. Verifica los permisos del navegador.'
      )
    }
  }

  const stopScanner = async () => {
    if (!scannerRef.current) return

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop()
      }

      scannerRef.current.clear()
    } catch (err) {
      console.error('Error al detener el escáner:', err)
    }

    scannerRef.current = null
    setScanning(false)
  }

  const buscarUsuario = async (codigo) => {
    try {
      setMessage('')
      setError('')

      const codigoLimpio = codigo.trim()

      if (!codigoLimpio) {
        setError('Ingresa el código del usuario.')
        return
      }

      const {
        data,
        error: profileError,
      } = await supabase.rpc(
        'find_user_by_code',
        {
          p_codigo_usuario: codigoLimpio,
        }
      )

      if (profileError) {
        console.error(
          'Error al buscar usuario:',
          profileError
        )

        setError(
          'No se pudo consultar el usuario.'
        )

        return
      }

      if (!data || data.length === 0) {
        setUser(null)

        setError(
          'No se encontró un usuario con ese código.'
        )

        return
      }

      const usuario = data[0]

      setUser(usuario)

      setCodigoManual(
        usuario.codigo_usuario || codigoLimpio
      )

      setMessage(
        'Usuario identificado correctamente.'
      )

    } catch (err) {
      console.error(
        'Error al buscar usuario:',
        err
      )

      setError(
        'No se pudo procesar el código del usuario.'
      )
    }
  }

  const handleScan = async (codigo) => {
    await stopScanner()
    await buscarUsuario(codigo)
  }

  const handleBusquedaManual = async (event) => {
    event.preventDefault()

    if (buscandoManual) return

    try {
      setBuscandoManual(true)

      await stopScanner()

      await buscarUsuario(codigoManual)

    } finally {
      setBuscandoManual(false)
    }
  }

  const resetScan = () => {
    setUser(null)
    setMessage('')
    setError('')
    setCodigoManual('')
  }

  const goToRegister = () => {
    if (!user?.codigo_usuario) return

    navigate(
      `/encargado/registrar-reciclaje?codigo=${encodeURIComponent(
        user.codigo_usuario
      )}`
    )
  }

  return (
    <main className="attendant-scan-page">

      <section className="attendant-scan-hero">

        <div className="container">

          <span className="section-label">
            IDENTIFICACIÓN DE USUARIOS
          </span>

          <h1>
            Identifica al usuario
            <span> de EcoCanje.</span>
          </h1>

          <p>
            Escanea su código QR o ingresa manualmente
            su código de usuario.
          </p>

        </div>

      </section>

      <section className="attendant-scan-section">

        <div className="container">

          <div className="attendant-scan-grid">

            <div className="attendant-scanner-card">

              <div className="attendant-scanner-header">

                <span>
                  LECTOR QR
                </span>

                <h2>
                  Escanear código QR
                </h2>

                <p>
                  Coloca el código QR de EcoCanje dentro
                  del área de escaneo.
                </p>

              </div>

              <div
                id="qr-reader"
                className="attendant-qr-reader"
              ></div>

              <div className="attendant-scanner-actions">

                {!scanning && !user && (
                  <button
                    type="button"
                    className="attendant-primary-button"
                    onClick={startScanner}
                  >
                    Activar cámara
                  </button>
                )}

                {scanning && (
                  <button
                    type="button"
                    className="attendant-secondary-button"
                    onClick={stopScanner}
                  >
                    Detener cámara
                  </button>
                )}

                {user && (
                  <>
                    <button
                      type="button"
                      className="attendant-primary-button"
                      onClick={goToRegister}
                    >
                      Registrar reciclaje
                    </button>

                    <button
                      type="button"
                      className="attendant-secondary-button"
                      onClick={resetScan}
                    >
                      Identificar otro usuario
                    </button>
                  </>
                )}

              </div>

              <div className="attendant-manual-search">

                <div className="attendant-manual-divider">
                  <span>O</span>
                </div>

                <div className="attendant-manual-header">

                  <span>
                    BÚSQUEDA MANUAL
                  </span>

                  <h3>
                    Ingresa el código del usuario
                  </h3>

                  <p>
                    Utiliza esta opción si no puedes escanear
                    el código QR.
                  </p>

                </div>

                <form
                  className="attendant-manual-form"
                  onSubmit={handleBusquedaManual}
                >

                  <input
                    type="text"
                    value={codigoManual}
                    onChange={(event) =>
                      setCodigoManual(event.target.value)
                    }
                    placeholder="Ejemplo: EC-7B9020B8"
                    disabled={buscandoManual || !!user}
                  />

                  <button
                    type="submit"
                    className="attendant-primary-button"
                    disabled={
                      buscandoManual ||
                      !codigoManual.trim() ||
                      !!user
                    }
                  >
                    {buscandoManual
                      ? 'Buscando...'
                      : 'Buscar usuario'}
                  </button>

                </form>

              </div>

              {message && (
                <div className="attendant-scan-success">
                  {message}
                </div>
              )}

              {error && (
                <div className="attendant-scan-error">
                  {error}
                </div>
              )}

            </div>

            <div className="attendant-user-card">

              <span className="section-label">
                USUARIO IDENTIFICADO
              </span>

              {!user ? (

                <div className="attendant-user-empty">

                  <h2>
                    Esperando identificación
                  </h2>

                  <p>
                    Escanea un código QR o ingresa manualmente
                    el código del usuario para consultar sus datos.
                  </p>

                </div>

              ) : (

                <div className="attendant-user-result">

                  <div className="attendant-user-avatar">
                    {user.nombres?.charAt(0)}
                    {user.apellidos?.charAt(0)}
                  </div>

                  <h2>
                    {user.nombres} {user.apellidos}
                  </h2>

                  <span className="attendant-user-code">
                    {user.codigo_usuario}
                  </span>

                  <div className="attendant-user-data">

                    <div>
                      <span>
                        PUNTOS DISPONIBLES
                      </span>

                      <strong>
                        {user.puntos_disponibles}
                      </strong>
                    </div>

                    <div>
                      <span>
                        PUNTOS ACUMULADOS
                      </span>

                      <strong>
                        {user.puntos_acumulados}
                      </strong>
                    </div>

                    <div>
                      <span>
                        NIVEL
                      </span>

                      <strong>
                        {user.nivel}
                      </strong>
                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Escanear