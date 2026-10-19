import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

// Synchronous check to see if Supabase auth token is in localStorage
function hasLocalSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token')) && key.endsWith('-auth-token')) {
        const item = localStorage.getItem(key)
        if (item) {
          const parsed = JSON.parse(item)
          if (parsed?.user || parsed?.access_token) return true
        }
      }
    }
  } catch {
    // ignore
  }
  return false
}

/**
 * GuestRoute prevents already-authenticated users from accessing
 * guest-only pages like /signin, /signup, and /verify.
 * If authenticated, redirects immediately with { replace: true }.
 */
export default function GuestRoute({ children }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasLocalSession())
  const [loading, setLoading] = useState(() => !hasLocalSession())

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted) {
          setIsAuthenticated(!!session?.user)
          setLoading(false)
        }
      } catch (err) {
        console.warn('GuestRoute check error:', err)
        if (isMounted) setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsAuthenticated(!!session?.user)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (isAuthenticated) {
    const searchParams = new URLSearchParams(location.search)
    const redirectTo = searchParams.get('redirect') || '/'
    return <Navigate to={redirectTo} replace />
  }

  if (loading) {
    return (
      <div className="relative flex-1 flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return children
}
