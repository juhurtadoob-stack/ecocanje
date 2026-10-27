import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMAIL_DOMAIN = '@ecocanje.pe'

function normalizarNombre(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

function generarPasswordTemporal() {
  const caracteres =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'

  const longitud = 14
  let resultado = ''

  const valores = new Uint32Array(longitud)
  crypto.getRandomValues(valores)

  for (let i = 0; i < longitud; i++) {
    resultado += caracteres[valores[i] % caracteres.length]
  }

  return resultado
}

function generarPasswordRestablecimiento() {
  const grupos = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%&*+-_=.?',
  ]
  const caracteres = grupos.join('')
  const valores = new Uint32Array(16)
  crypto.getRandomValues(valores)

  const password = grupos.map((grupo, indice) =>
    grupo[valores[indice] % grupo.length]
  )

  for (let i = grupos.length; i < valores.length; i++) {
    password.push(caracteres[valores[i] % caracteres.length])
  }

  for (let i = password.length - 1; i > 0; i--) {
    const valor = new Uint32Array(1)
    crypto.getRandomValues(valor)
    const indice = valor[0] % (i + 1)
    ;[password[i], password[indice]] = [password[indice], password[i]]
  }

  return password.join('')
}

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

  // =========================================
  // RESTABLECER CONTRASEÑA DE ENCARGADO
  // =========================================

  const [usuarioRestablecer, setUsuarioRestablecer] =
    useState(null)
  const [passwordTemporalRestablecer, setPasswordTemporalRestablecer] =
    useState('')
  const [passwordAdminRestablecer, setPasswordAdminRestablecer] =
    useState('')
  const [mostrarPasswordTemporalRestablecer, setMostrarPasswordTemporalRestablecer] =
    useState(false)
  const [mostrarPasswordAdminRestablecer, setMostrarPasswordAdminRestablecer] =
    useState(false)
  const [passwordRestablecerCopiada, setPasswordRestablecerCopiada] =
    useState(false)
  const [restableciendoPassword, setRestableciendoPassword] =
    useState(false)
  const [errorRestablecerPassword, setErrorRestablecerPassword] =
    useState('')
  const [exitoRestablecerPassword, setExitoRestablecerPassword] =
    useState(false)

  // =========================================
  // ESTADO DE ENCARGADO
  // =========================================

  const [usuarioEstadoEncargado, setUsuarioEstadoEncargado] =
    useState(null)
  const [accionEstadoEncargado, setAccionEstadoEncargado] =
    useState('')
  const [passwordAdminEstado, setPasswordAdminEstado] =
    useState('')
  const [mostrarPasswordAdminEstado, setMostrarPasswordAdminEstado] =
    useState(false)
  const [actualizandoEstadoEncargado, setActualizandoEstadoEncargado] =
    useState(false)
  const [errorEstadoEncargado, setErrorEstadoEncargado] =
    useState('')
  const [exitoEstadoEncargado, setExitoEstadoEncargado] =
    useState('')

  // =========================================
  // CREAR ENCARGADO
  // =========================================

  const [mostrarCrearEncargado, setMostrarCrearEncargado] =
    useState(false)

  const [puntosAcopio, setPuntosAcopio] = useState([])

  const [cargandoPuntos, setCargandoPuntos] =
    useState(false)

  const [puntoAcopioSeleccionado, setPuntoAcopioSeleccionado] =
    useState('')

  const [passwordEncargado, setPasswordEncargado] =
    useState('')

  const [mostrarPasswordEncargado, setMostrarPasswordEncargado] =
    useState(false)

  const [creandoEncargado, setCreandoEncargado] =
    useState(false)

  const [errorEncargado, setErrorEncargado] =
    useState('')

  const [exitoEncargado, setExitoEncargado] =
    useState('')

  const [encargadoCreado, setEncargadoCreado] =
    useState(null)

  const [passwordCopiada, setPasswordCopiada] =
    useState(false)

  // =========================================
  // CARGA INICIAL
  // =========================================

  useEffect(() => {
    cargarDatos()
  }, [])

  // Bloquear el scroll del fondo mientras
  // el modal de crear encargado esté abierto.
  useEffect(() => {
    if (!mostrarCrearEncargado) {
      return
    }

    const overflowAnterior =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowAnterior
    }
  }, [mostrarCrearEncargado])

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

      const encargadoIds = usuariosData
        .filter((usuario) => usuario.rol === 'encargado')
        .map((usuario) => usuario.id)

      let asignaciones = []
      if (encargadoIds.length > 0) {
        const {
          data: asignacionesData,
          error: asignacionesError,
        } = await supabase
          .from('attendant_collection_points')
          .select('encargado_id, estado, created_at')
          .in('encargado_id', encargadoIds)
          .order('created_at', { ascending: false })

        if (asignacionesError) {
          console.error('No se pudo cargar el estado de las asignaciones de encargados.')
        } else {
          asignaciones = asignacionesData || []
        }
      }

      const usuariosConEstado = usuariosData.map((usuario) => {
        if (usuario.rol !== 'encargado') return usuario

        const asignacionesUsuario = asignaciones.filter(
          (asignacion) => asignacion.encargado_id === usuario.id
        )
        const asignacionActiva = asignacionesUsuario.find(
          (asignacion) => asignacion.estado === 'activo'
        )
        const asignacionInactiva = asignacionesUsuario.find(
          (asignacion) => asignacion.estado === 'inactivo'
        )
        const estadoExistente = usuario.estado_asignacion ||
          usuario.estado_encargado ||
          usuario.estado

        return {
          ...usuario,
          estado_asignacion: asignacionActiva
            ? 'activo'
            : asignacionInactiva
              ? 'inactivo'
              : estadoExistente || 'activo',
        }
      })

      setUsuarios(usuariosConEstado)

      const usuarioActual = usuariosConEstado.find(
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

  // =========================================
  // CARGAR PUNTOS DE ACOPIO
  // =========================================

  const cargarPuntosAcopio = async () => {
    setCargandoPuntos(true)
    setErrorEncargado('')

    try {
      const {
        data,
        error: puntosError,
      } = await supabase.rpc(
        'get_admin_collection_points'
      )

      if (puntosError) {
        console.error(
          'Error al cargar puntos de acopio:',
          puntosError
        )

        setErrorEncargado(
          'No se pudieron cargar los puntos de acopio.'
        )

        return
      }

      const puntosActivos = (data || []).filter(
        (punto) => punto.estado === 'activo'
      )

      setPuntosAcopio(puntosActivos)
    } catch (error) {
      console.error(
        'Error al cargar puntos de acopio:',
        error
      )

      setErrorEncargado(
        'Ocurrió un error al cargar los puntos de acopio.'
      )
    } finally {
      setCargandoPuntos(false)
    }
  }

  // =========================================
  // UTILIDADES
  // =========================================

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

  // =========================================
  // CAMBIAR ROL
  // =========================================

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

  const abrirRestablecerPassword = (usuario) => {
    if (!esAdminPrincipal || usuario?.rol !== 'encargado') {
      return
    }

    setUsuarioRestablecer(usuario)
    setPasswordTemporalRestablecer('')
    setPasswordAdminRestablecer('')
    setMostrarPasswordTemporalRestablecer(false)
    setMostrarPasswordAdminRestablecer(false)
    setPasswordRestablecerCopiada(false)
    setErrorRestablecerPassword('')
    setExitoRestablecerPassword(false)
  }

  const cerrarRestablecerPassword = () => {
    if (restableciendoPassword || exitoRestablecerPassword) {
      return
    }

    setUsuarioRestablecer(null)
    setPasswordTemporalRestablecer('')
    setPasswordAdminRestablecer('')
    setMostrarPasswordTemporalRestablecer(false)
    setMostrarPasswordAdminRestablecer(false)
    setPasswordRestablecerCopiada(false)
    setErrorRestablecerPassword('')
    setExitoRestablecerPassword(false)
  }

  const generarPasswordParaRestablecer = () => {
    setPasswordTemporalRestablecer(
      generarPasswordRestablecimiento()
    )
    setMostrarPasswordTemporalRestablecer(true)
    setPasswordRestablecerCopiada(false)
    setErrorRestablecerPassword('')
  }

  const copiarPasswordRestablecer = async () => {
    if (!passwordTemporalRestablecer || restableciendoPassword) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        passwordTemporalRestablecer
      )
      setPasswordRestablecerCopiada(true)
      window.setTimeout(() => {
        setPasswordRestablecerCopiada(false)
      }, 1800)
    } catch {
      setErrorRestablecerPassword(
        'No se pudo copiar la contraseña. Intenta nuevamente.'
      )
    }
  }

  const restablecerPasswordEncargado = async (event) => {
    event.preventDefault()
    setErrorRestablecerPassword('')

    if (!usuarioRestablecer) {
      setErrorRestablecerPassword(
        'No se seleccionó ningún encargado.'
      )
      return
    }

    if (!passwordTemporalRestablecer || !passwordAdminRestablecer) {
      return
    }

    try {
      setRestableciendoPassword(true)

      const { data, error: functionError } =
        await supabase.functions.invoke(
          'admin-reset-attendant-password',
          {
            body: {
              usuario_id: usuarioRestablecer.id,
              password_temporal: passwordTemporalRestablecer,
              password_admin: passwordAdminRestablecer,
            },
          }
        )

      if (functionError) {
        if (functionError.context?.status === 401) {
          setErrorRestablecerPassword(
            'La contraseña del administrador es incorrecta.'
          )
          return
        }

        let mensaje =
          functionError.message ||
          'No se pudo restablecer la contraseña del encargado.'

        try {
          const respuesta = await functionError.context?.clone().json()
          if (respuesta?.error) {
            mensaje = respuesta.error
          }
        } catch {
          // Se usa el mensaje de error disponible.
        }

        setErrorRestablecerPassword(mensaje)
        return
      }

      if (!data?.success) {
        setErrorRestablecerPassword(
          data?.error ||
          'No se pudo restablecer la contraseña del encargado.'
        )
        return
      }

      setPasswordTemporalRestablecer('')
      setPasswordAdminRestablecer('')
      setMostrarPasswordTemporalRestablecer(false)
      setMostrarPasswordAdminRestablecer(false)
      setPasswordRestablecerCopiada(false)
      setExitoRestablecerPassword(true)

      window.setTimeout(() => {
        setUsuarioRestablecer(null)
        setExitoRestablecerPassword(false)
      }, 1800)
    } catch {
      setErrorRestablecerPassword(
        'Ocurrió un error al restablecer la contraseña del encargado.'
      )
    } finally {
      setRestableciendoPassword(false)
    }
  }

  const abrirEstadoEncargado = (usuario) => {
    if (!esAdminPrincipal || usuario?.rol !== 'encargado') return

    const accion = usuario.estado_asignacion === 'activo'
      ? 'desactivar'
      : 'reactivar'

    setUsuarioEstadoEncargado(usuario)
    setAccionEstadoEncargado(accion)
    setPasswordAdminEstado('')
    setMostrarPasswordAdminEstado(false)
    setErrorEstadoEncargado('')
    setExitoEstadoEncargado('')
  }

  const cerrarEstadoEncargado = () => {
    if (actualizandoEstadoEncargado || exitoEstadoEncargado) return

    setUsuarioEstadoEncargado(null)
    setAccionEstadoEncargado('')
    setPasswordAdminEstado('')
    setMostrarPasswordAdminEstado(false)
    setErrorEstadoEncargado('')
    setExitoEstadoEncargado('')
  }

  const cambiarEstadoEncargado = async (event) => {
    event.preventDefault()
    setErrorEstadoEncargado('')

    if (!usuarioEstadoEncargado || !passwordAdminEstado) return

    try {
      setActualizandoEstadoEncargado(true)

      const { data, error: functionError } =
        await supabase.functions.invoke('admin-set-attendant-status', {
          body: {
            usuario_id: usuarioEstadoEncargado.id,
            accion: accionEstadoEncargado,
            password_admin: passwordAdminEstado,
          },
        })

      if (functionError) {
        if (functionError.context?.status === 401) {
          setErrorEstadoEncargado(
            'La contraseña del administrador es incorrecta.'
          )
          return
        }

        let mensaje = functionError.message ||
          `No se pudo ${accionEstadoEncargado} al encargado.`
        try {
          const respuesta = await functionError.context?.clone().json()
          if (respuesta?.error) mensaje = respuesta.error
        } catch {
          // Se conserva el mensaje disponible de la Edge Function.
        }
        setErrorEstadoEncargado(mensaje)
        return
      }

      if (!data?.success) {
        setErrorEstadoEncargado(
          data?.error || `No se pudo ${accionEstadoEncargado} al encargado.`
        )
        return
      }

      const nuevoEstado = accionEstadoEncargado === 'desactivar'
        ? 'inactivo'
        : 'activo'
      setUsuarios((actuales) => actuales.map((usuario) =>
        usuario.id === usuarioEstadoEncargado.id
          ? { ...usuario, estado_asignacion: nuevoEstado }
          : usuario
      ))
      setPasswordAdminEstado('')
      setExitoEstadoEncargado(
        accionEstadoEncargado === 'desactivar'
          ? 'El encargado fue desactivado correctamente.'
          : 'El encargado fue reactivado correctamente.'
      )

      await cargarDatos()
      setUsuarios((actuales) => actuales.map((usuario) =>
        usuario.id === usuarioEstadoEncargado.id
          ? { ...usuario, estado_asignacion: nuevoEstado }
          : usuario
      ))

      window.setTimeout(() => {
        setUsuarioEstadoEncargado(null)
        setAccionEstadoEncargado('')
        setPasswordAdminEstado('')
        setMostrarPasswordAdminEstado(false)
        setExitoEstadoEncargado('')
      }, 1500)
    } catch {
      setErrorEstadoEncargado(
        `Ocurrió un error al ${accionEstadoEncargado} al encargado.`
      )
    } finally {
      setActualizandoEstadoEncargado(false)
    }
  }

  // =========================================
  // CREAR ENCARGADO
  // =========================================

  const abrirCrearEncargado = async () => {
    setMostrarCrearEncargado(true)

    setPuntoAcopioSeleccionado('')
    setPasswordEncargado('')
    setMostrarPasswordEncargado(false)
    setErrorEncargado('')
    setExitoEncargado('')
    setEncargadoCreado(null)
    setPasswordCopiada(false)

    await cargarPuntosAcopio()
  }

  const cerrarCrearEncargado = () => {
    if (creandoEncargado) {
      return
    }

    setMostrarCrearEncargado(false)

    setPuntoAcopioSeleccionado('')
    setPasswordEncargado('')
    setMostrarPasswordEncargado(false)
    setErrorEncargado('')
    setExitoEncargado('')
    setEncargadoCreado(null)
    setPasswordCopiada(false)
  }

  const generarPasswordEncargado = () => {
    const nuevaPassword = generarPasswordTemporal()

    setPasswordEncargado(nuevaPassword)
    setMostrarPasswordEncargado(true)

    // Al generar una nueva contraseña,
    // vuelve a ser obligatorio copiarla.
    setPasswordCopiada(false)

    setErrorEncargado('')
    setExitoEncargado('')
    setEncargadoCreado(null)
  }

  const copiarPasswordEncargado = async () => {
    if (!passwordEncargado) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        passwordEncargado
      )

      // La confirmación permanece activa.
      setPasswordCopiada(true)
      setErrorEncargado('')
    } catch (error) {
      console.error(
        'Error al copiar contraseña:',
        error
      )

      setErrorEncargado(
        'No se pudo copiar la contraseña automáticamente. Intenta nuevamente.'
      )
    }
  }

  const puntoSeleccionado = puntosAcopio.find(
    (punto) =>
      String(punto.id) ===
      String(puntoAcopioSeleccionado)
  )

  const correoEncargado = puntoSeleccionado
    ? `encargado${normalizarNombre(
        puntoSeleccionado.nombre
      )}${EMAIL_DOMAIN}`
    : ''

  const crearEncargado = async (event) => {
    event.preventDefault()

    setErrorEncargado('')
    setExitoEncargado('')

    if (!puntoAcopioSeleccionado) {
      setErrorEncargado(
        'Selecciona un punto de acopio.'
      )
      return
    }

    if (!passwordEncargado) {
      setErrorEncargado(
        'Primero debes generar la contraseña temporal.'
      )
      return
    }

    if (!passwordCopiada) {
      setErrorEncargado(
        'Debes copiar la contraseña temporal antes de crear la cuenta.'
      )
      return
    }

    if (passwordEncargado.length < 8) {
      setErrorEncargado(
        'La contraseña temporal debe tener al menos 8 caracteres.'
      )
      return
    }

    try {
      setCreandoEncargado(true)

      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        'admin-create-attendant',
        {
          body: {
            punto_acopio_id:
              Number(puntoAcopioSeleccionado),
            password_temporal:
              passwordEncargado,
          },
        }
      )

      if (functionError) {
        console.error(
          'Error de la Edge Function:',
          functionError
        )

        setErrorEncargado(
          functionError.message ||
          'No se pudo crear la cuenta del encargado.'
        )

        return
      }

      if (!data?.success) {
        setErrorEncargado(
          data?.error ||
          'No se pudo crear la cuenta del encargado.'
        )

        return
      }

      setEncargadoCreado({
        email:
          data.encargado?.email ||
          correoEncargado,

        puntoAcopio:
          data.encargado?.punto_acopio ||
          puntoSeleccionado?.nombre ||
          '',

        password: passwordEncargado,
      })

      setExitoEncargado(
        'El encargado fue creado correctamente.'
      )

      await cargarDatos()
    } catch (error) {
      console.error(
        'Error al crear encargado:',
        error
      )

      setErrorEncargado(
        error.message ||
        'Ocurrió un error al crear la cuenta del encargado.'
      )
    } finally {
      setCreandoEncargado(false)
    }
  }

  return (
    <main className="admin-users-page">

      {/* =========================================
          HERO
          ========================================= */}

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

      {/* =========================================
          DIRECTORIO
          ========================================= */}

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

          <div className="admin-users-header-actions">

            <button
              type="button"
              className="admin-create-attendant-button"
              onClick={abrirCrearEncargado}
            >
              + Crear encargado
            </button>

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

                            <>
                              {usuario.rol === 'encargado' && (
                                <>
                                  <button
                                    type="button"
                                    className="admin-user-action-button"
                                    onClick={() => abrirEstadoEncargado(usuario)}
                                  >
                                    {usuario.estado_asignacion === 'activo'
                                      ? 'Desactivar'
                                      : 'Reactivar'}
                                  </button>
                                  <br />
                                  <button
                                    type="button"
                                    className="admin-user-action-button"
                                    onClick={() =>
                                      abrirRestablecerPassword(usuario)
                                    }
                                  >
                                    Restablecer contraseña
                                  </button>
                                  <br />
                                </>
                              )}

                              <button
                                type="button"
                                className="admin-user-action-button"
                                onClick={() =>
                                  abrirCambiarRol(usuario)
                                }
                              >
                                Cambiar rol
                              </button>
                            </>

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

      {/* =========================================
          MODAL CREAR ENCARGADO
          ========================================= */}

      {mostrarCrearEncargado && (

        <div
          className="admin-attendant-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target === event.currentTarget &&
              !creandoEncargado
            ) {
              cerrarCrearEncargado()
            }

          }}
        >

          <div
            className="admin-attendant-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-attendant-modal-header">

              <div>

                <span className="section-kicker">
                  GESTIÓN DE CUENTA
                </span>

                <h2>
                  Crear encargado
                </h2>

                <p>
                  Crea una cuenta vinculada a un punto de acopio.
                </p>

              </div>

              <button
                type="button"
                className="admin-attendant-modal-close"
                onClick={cerrarCrearEncargado}
                disabled={creandoEncargado}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>

            {!encargadoCreado && (

              <form
                className="admin-attendant-form"
                onSubmit={crearEncargado}
              >

                {/* PUNTO DE ACOPIO */}

                <div className="admin-attendant-form-group">

                  <label htmlFor="punto-acopio-encargado">
                    Punto de acopio
                  </label>

                  <select
                    id="punto-acopio-encargado"
                    value={puntoAcopioSeleccionado}
                    onChange={(event) => {

                      setPuntoAcopioSeleccionado(
                        event.target.value
                      )

                      setErrorEncargado('')
                      setExitoEncargado('')

                    }}
                    disabled={
                      cargandoPuntos ||
                      creandoEncargado
                    }
                  >

                    <option value="">
                      {cargandoPuntos
                        ? 'Cargando puntos...'
                        : 'Selecciona un punto de acopio'}
                    </option>

                    {puntosAcopio.map((punto) => (

                      <option
                        key={punto.id}
                        value={punto.id}
                      >
                        {punto.nombre}
                      </option>

                    ))}

                  </select>

                  <small>
                    Cada punto de acopio puede tener un solo encargado activo.
                  </small>

                </div>

                {/* CORREO */}

                {puntoSeleccionado && (

                  <div className="admin-attendant-form-group">

                    <label htmlFor="correo-encargado">
                      Correo de acceso
                    </label>

                    <input
                      id="correo-encargado"
                      type="text"
                      value={correoEncargado}
                      readOnly
                    />

                    <small>
                      El correo se genera automáticamente a partir del punto de acopio.
                    </small>

                  </div>

                )}

                {/* CONTRASEÑA */}

                <div className="admin-attendant-form-group">

                  <label htmlFor="password-encargado">
                    Contraseña temporal
                  </label>

                  <div className="admin-attendant-password-row">

                    <div className="password-field">

                      <input
                        id="password-encargado"
                        type={
                          mostrarPasswordEncargado
                            ? 'text'
                            : 'password'
                        }
                        value={passwordEncargado}
                        readOnly
                        placeholder="Genera una contraseña temporal"
                        autoComplete="new-password"
                        disabled={creandoEncargado}
                      />

                      {passwordEncargado && (

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setMostrarPasswordEncargado(
                              !mostrarPasswordEncargado
                            )
                          }
                          disabled={creandoEncargado}
                          aria-label={
                            mostrarPasswordEncargado
                              ? 'Ocultar contraseña'
                              : 'Mostrar contraseña'
                          }
                          title={
                            mostrarPasswordEncargado
                              ? 'Ocultar contraseña'
                              : 'Mostrar contraseña'
                          }
                        >

                          {mostrarPasswordEncargado ? (

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

                      )}

                    </div>

                    <button
                      type="button"
                      className="admin-attendant-generate-button"
                      onClick={generarPasswordEncargado}
                      disabled={
                        creandoEncargado ||
                        !puntoAcopioSeleccionado
                      }
                    >
                      {passwordEncargado
                        ? 'Regenerar'
                        : 'Generar'}
                    </button>

                  </div>

                  <small>
                    La contraseña se genera una sola vez y deberá cambiarse durante el primer acceso.
                  </small>

                </div>

                {/* CONTRASEÑA GENERADA */}

                {passwordEncargado && (

                  <div className="admin-attendant-copy-row">

                    <div>

                      <strong>
                        Contraseña temporal generada
                      </strong>

                      <span>
                        Guárdala o cópiala antes de crear la cuenta.
                      </span>

                    </div>

                    <button
                      type="button"
                      className="admin-attendant-copy-button"
                      onClick={copiarPasswordEncargado}
                      disabled={creandoEncargado}
                    >
                      {passwordCopiada
                        ? 'Copiada ✓'
                        : 'Copiar'}
                    </button>

                  </div>

                )}

                {/* ERROR */}

                {errorEncargado && (

                  <div className="form-message form-message-error">
                    {errorEncargado}
                  </div>

                )}

                {/* ÉXITO */}

                {exitoEncargado && (

                  <div className="form-message form-message-success">
                    {exitoEncargado}
                  </div>

                )}

                {/* ACCIONES */}

                <div className="admin-attendant-modal-actions">

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={cerrarCrearEncargado}
                    disabled={creandoEncargado}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      creandoEncargado ||
                      !puntoAcopioSeleccionado ||
                      !passwordEncargado ||
                      !passwordCopiada
                    }
                  >
                    {creandoEncargado
                      ? 'Creando...'
                      : 'Crear encargado'}
                  </button>

                </div>

              </form>

            )}

            {/* RESULTADO DE CREACIÓN */}

            {encargadoCreado && (

              <div className="admin-attendant-success">

                <div className="admin-attendant-success-icon">
                  ✓
                </div>

                <h3>
                  Encargado creado correctamente
                </h3>

                <p>
                  La cuenta quedó vinculada al punto de acopio seleccionado.
                </p>

                <div className="admin-attendant-success-data">

                  <div>

                    <span>
                      Punto de acopio
                    </span>

                    <strong>
                      {encargadoCreado.puntoAcopio}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Correo de acceso
                    </span>

                    <strong>
                      {encargadoCreado.email}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Contraseña temporal
                    </span>

                    <div className="admin-attendant-success-password">

                      <strong>
                        {encargadoCreado.password}
                      </strong>

                      <button
                        type="button"
                        className="admin-attendant-copy-button"
                        onClick={copiarPasswordEncargado}
                      >
                        {passwordCopiada
                          ? 'Copiada ✓'
                          : 'Copiar'}
                      </button>

                    </div>

                  </div>

                </div>

                <div className="admin-attendant-warning">

                  <strong>
                    Importante
                  </strong>

                  <p>
                    Entrega estas credenciales al encargado de forma segura.
                    La contraseña temporal deberá cambiarse durante su primer acceso.
                  </p>

                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={cerrarCrearEncargado}
                >
                  Finalizar
                </button>

              </div>

            )}

          </div>

        </div>

      )}

      {/* =========================================
          MODAL ESTADO DE ENCARGADO
          ========================================= */}

      {usuarioEstadoEncargado && (

        <div
          className="admin-role-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actualizandoEstadoEncargado &&
              !exitoEstadoEncargado
            ) {
              cerrarEstadoEncargado()
            }
          }}
        >

          <div
            className="admin-role-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >

            <div className="admin-role-modal-header">
              <div>
                <span className="section-kicker">GESTIÓN DE CUENTA</span>
                <h2>
                  {accionEstadoEncargado === 'desactivar'
                    ? 'Desactivar encargado'
                    : 'Reactivar encargado'}
                </h2>
                <p>
                  Confirma tu contraseña actual para continuar.
                </p>
              </div>

              <button
                type="button"
                className="admin-role-modal-close"
                onClick={cerrarEstadoEncargado}
                disabled={actualizandoEstadoEncargado || Boolean(exitoEstadoEncargado)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="admin-role-user">
              <div className="admin-role-user-avatar">
                {(usuarioEstadoEncargado.nombres || 'E').charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>
                  {usuarioEstadoEncargado.nombres || 'Encargado'}{' '}
                  {usuarioEstadoEncargado.apellidos || ''}
                </strong>
                <span>{usuarioEstadoEncargado.email}</span>
                {usuarioEstadoEncargado.punto_acopio_nombre && (
                  <span>Punto de acopio: {usuarioEstadoEncargado.punto_acopio_nombre}</span>
                )}
              </div>
            </div>

            <form
              className="admin-role-form"
              onSubmit={cambiarEstadoEncargado}
            >
              {exitoEstadoEncargado ? (
                <div className="form-message form-message-success">
                  {exitoEstadoEncargado}
                </div>
              ) : (
                <>
                  <div className="admin-role-form-group">
                    <label htmlFor="password-admin-estado-encargado">
                      Contraseña del administrador
                    </label>
                    <div className="password-field">
                      <input
                        id="password-admin-estado-encargado"
                        type={mostrarPasswordAdminEstado ? 'text' : 'password'}
                        value={passwordAdminEstado}
                        onChange={(event) => {
                          setPasswordAdminEstado(event.target.value)
                          setErrorEstadoEncargado('')
                        }}
                        placeholder="Ingresa tu contraseña actual"
                        autoComplete="current-password"
                        disabled={actualizandoEstadoEncargado}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setMostrarPasswordAdminEstado(!mostrarPasswordAdminEstado)}
                        disabled={actualizandoEstadoEncargado}
                        aria-label={mostrarPasswordAdminEstado
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'}
                        title={mostrarPasswordAdminEstado
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'}
                      >
                        {mostrarPasswordAdminEstado ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 3l18 18" />
                            <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-3.1 3.8" />
                            <path d="M6.1 6.8C3.5 6.8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <small>
                      La Edge Function verificará la contraseña antes de cambiar el estado.
                    </small>
                  </div>

                  {errorEstadoEncargado && (
                    <div className="form-message form-message-error">
                      {errorEstadoEncargado}
                    </div>
                  )}
                </>
              )}

              <div className="admin-role-modal-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cerrarEstadoEncargado}
                  disabled={actualizandoEstadoEncargado || Boolean(exitoEstadoEncargado)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    actualizandoEstadoEncargado ||
                    !passwordAdminEstado ||
                    Boolean(exitoEstadoEncargado)
                  }
                >
                  {actualizandoEstadoEncargado
                    ? 'Procesando...'
                    : accionEstadoEncargado === 'desactivar'
                      ? 'Desactivar encargado'
                      : 'Reactivar encargado'}
                </button>
              </div>
            </form>

          </div>

        </div>

      )}

      {/* =========================================
          MODAL RESTABLECER CONTRASEÑA DE ENCARGADO
          ========================================= */}

      {usuarioRestablecer && (

        <div
          className="admin-role-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !restableciendoPassword &&
              !exitoRestablecerPassword
            ) {
              cerrarRestablecerPassword()
            }
          }}
        >

          <div
            className="admin-role-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >

            <div className="admin-role-modal-header">

              <div>
                <span className="section-kicker">
                  GESTIÓN DE CUENTA
                </span>

                <h2>Restablecer contraseña</h2>

                <p>
                  Genera una contraseña temporal para el encargado.
                </p>
              </div>

              <button
                type="button"
                className="admin-role-modal-close"
                onClick={cerrarRestablecerPassword}
                disabled={
                  restableciendoPassword ||
                  exitoRestablecerPassword
                }
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>

            <div className="admin-role-user">

              <div className="admin-role-user-avatar">
                {(usuarioRestablecer.nombres || 'E')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {usuarioRestablecer.nombres || 'Encargado'}{' '}
                  {usuarioRestablecer.apellidos || ''}
                </strong>
                <span>{usuarioRestablecer.email}</span>
                {(usuarioRestablecer.punto_acopio_nombre ||
                  usuarioRestablecer.nombre_punto_acopio ||
                  (typeof usuarioRestablecer.punto_acopio === 'string'
                    ? usuarioRestablecer.punto_acopio
                    : usuarioRestablecer.punto_acopio?.nombre)) && (
                  <span>
                    Punto de acopio:{' '}
                    {usuarioRestablecer.punto_acopio_nombre ||
                      usuarioRestablecer.nombre_punto_acopio ||
                      (typeof usuarioRestablecer.punto_acopio === 'string'
                        ? usuarioRestablecer.punto_acopio
                        : usuarioRestablecer.punto_acopio.nombre)}
                  </span>
                )}
              </div>

            </div>

            <form
              className="admin-role-form"
              onSubmit={restablecerPasswordEncargado}
            >

              {exitoRestablecerPassword ? (
                <div className="form-message form-message-success">
                  <strong>Contraseña restablecida correctamente.</strong>
                  <br />
                  El encargado deberá cambiarla durante su próximo inicio de sesión.
                </div>
              ) : (
                <>
                  <div className="admin-role-form-group">
                    <label htmlFor="password-temporal-restablecer">
                      Nueva contraseña temporal
                    </label>

                    <div className="admin-attendant-password-row">
                      <div className="password-field">
                        <input
                          id="password-temporal-restablecer"
                          type={
                            mostrarPasswordTemporalRestablecer
                              ? 'text'
                              : 'password'
                          }
                          value={passwordTemporalRestablecer}
                          readOnly
                          placeholder="Genera una contraseña temporal"
                          autoComplete="new-password"
                          disabled={restableciendoPassword}
                        />

                        {passwordTemporalRestablecer && (
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                              setMostrarPasswordTemporalRestablecer(
                                !mostrarPasswordTemporalRestablecer
                              )
                            }
                            disabled={restableciendoPassword}
                            aria-label={
                              mostrarPasswordTemporalRestablecer
                                ? 'Ocultar contraseña temporal'
                                : 'Mostrar contraseña temporal'
                            }
                            title={
                              mostrarPasswordTemporalRestablecer
                                ? 'Ocultar contraseña'
                                : 'Mostrar contraseña'
                            }
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              {mostrarPasswordTemporalRestablecer ? (
                                <>
                                  <path d="M3 3l18 18" />
                                  <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-3.1 3.8" />
                                  <path d="M6.1 6.8C3.5 6.8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7" />
                                </>
                              ) : (
                                <>
                                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </>
                              )}
                            </svg>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className="admin-attendant-generate-button"
                        onClick={generarPasswordParaRestablecer}
                        disabled={restableciendoPassword}
                      >
                        Generar
                      </button>
                    </div>

                    {passwordTemporalRestablecer && (
                      <div className="admin-attendant-copy-row">
                        <div>
                          <strong>Contraseña temporal generada</strong>
                          <span>Cópiala para entregarla al encargado.</span>
                        </div>
                        <button
                          type="button"
                          className="admin-attendant-copy-button"
                          onClick={copiarPasswordRestablecer}
                          disabled={restableciendoPassword}
                        >
                          {passwordRestablecerCopiada
                            ? 'Copiado ✓'
                            : 'Copiar'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="admin-role-form-group">
                    <label htmlFor="password-admin-restablecer">
                      Contraseña del administrador
                    </label>

                    <div className="password-field">
                      <input
                        id="password-admin-restablecer"
                        type={
                          mostrarPasswordAdminRestablecer
                            ? 'text'
                            : 'password'
                        }
                        value={passwordAdminRestablecer}
                        onChange={(event) => {
                          setPasswordAdminRestablecer(event.target.value)
                          setErrorRestablecerPassword('')
                        }}
                        placeholder="Ingresa tu contraseña actual"
                        autoComplete="current-password"
                        disabled={restableciendoPassword}
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setMostrarPasswordAdminRestablecer(
                            !mostrarPasswordAdminRestablecer
                          )
                        }
                        disabled={restableciendoPassword}
                        aria-label={
                          mostrarPasswordAdminRestablecer
                            ? 'Ocultar contraseña del administrador'
                            : 'Mostrar contraseña del administrador'
                        }
                        title={
                          mostrarPasswordAdminRestablecer
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          {mostrarPasswordAdminRestablecer ? (
                            <>
                              <path d="M3 3l18 18" />
                              <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-3.1 3.8" />
                              <path d="M6.1 6.8C3.5 6.8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7" />
                            </>
                          ) : (
                            <>
                              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  {errorRestablecerPassword && (
                    <div className="form-message form-message-error">
                      {errorRestablecerPassword}
                    </div>
                  )}
                </>
              )}

              <div className="admin-role-modal-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cerrarRestablecerPassword}
                  disabled={
                    restableciendoPassword ||
                    exitoRestablecerPassword
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    restableciendoPassword ||
                    !passwordTemporalRestablecer ||
                    !passwordAdminRestablecer ||
                    exitoRestablecerPassword
                  }
                >
                  {restableciendoPassword
                    ? 'Restableciendo...'
                    : 'Restablecer contraseña'}
                </button>
              </div>

            </form>

          </div>

        </div>

      )}

      {/* =========================================
          MODAL CAMBIAR ROL
          ========================================= */}

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
