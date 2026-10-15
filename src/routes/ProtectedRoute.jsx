import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const verificarSesion = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error(
          'Error al verificar la sesión:',
          error
        )

        if (mounted) {
          setSession(null)
          setRole(null)
          setLoading(false)
        }

        return
      }

      const currentSession = data.session

      if (!currentSession) {
        if (mounted) {
          setSession(null)
          setRole(null)
          setLoading(false)
        }

        return
      }

      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('rol')
          .eq('id', currentSession.user.id)
          .single()

      if (profileError) {
        console.error(
          'Error al obtener el rol:',
          profileError
        )

        if (mounted) {
          setSession(currentSession)
          setRole(null)
          setLoading(false)
        }

        return
      }

      if (mounted) {
        setSession(currentSession)
        setRole(profile?.rol || null)
        setLoading(false)
      }
    }

    verificarSesion()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {

        if (!currentSession) {
          if (mounted) {
            setSession(null)
            setRole(null)
            setLoading(false)
          }

          return
        }

        const { data: profile, error: profileError } =
          await supabase
            .from('profiles')
            .select('rol')
            .eq('id', currentSession.user.id)
            .single()

        if (profileError) {
          console.error(
            'Error al obtener el rol:',
            profileError
          )

          if (mounted) {
            setSession(currentSession)
            setRole(null)
            setLoading(false)
          }

          return
        }

        if (mounted) {
          setSession(currentSession)
          setRole(profile?.rol || null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="auth-loading">
        Verificando sesión...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    if (role === 'administrador') {
      return <Navigate to="/admin" replace />
    }

    if (role === 'encargado') {
      return <Navigate to="/encargado" replace />
    }

    if (role === 'usuario') {
      return <Navigate to="/usuario" replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute