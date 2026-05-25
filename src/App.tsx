import { useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/authStore'
import { LoginPage } from '@/pages/LoginPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui'
import type { Profile } from '@/types'

export default function App() {
  const { profile, setProfile, setLoading, loading } = useAuthStore()
  const [page, setPage] = useState<string>('dashboard')

  useEffect(() => {
    setPage('dashboard')
  }, [profile?.id])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async (session: Session | null) => {
      if (!isMounted) return

      if (!session?.user) {
        setProfile(null)
        setPage('dashboard')
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error) {
          console.error('Error loading user profile:', error)
          setProfile(null)
          return
        }

        if (data && !data.active) {
          await supabase.auth.signOut()
          setProfile(null)
          toast.error('Tu usuario esta desactivado. Contacta a un administrador.')
          return
        }

        setProfile(data ? { ...(data as Profile), email: session.user.email } : null)
      } catch (error) {
        console.error('Unexpected error loading user profile:', error)
        setProfile(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => loadProfile(session))
      .catch((error) => {
        console.error('Error getting auth session:', error)
        if (isMounted) {
          setProfile(null)
          setLoading(false)
        }
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setProfile(null)
        setPage('dashboard')
        setLoading(false)
        return
      }

      setTimeout(() => {
        void loadProfile(session)
      }, 0)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setProfile, setLoading])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center text-xl">📦</div>
          <Spinner />
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Cargando Inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e2230',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1e2230' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e2230' } },
        }}
      />
      {!profile ? (
        <LoginPage />
      ) : (
        <AppLayout currentPage={page} onNavigate={setPage} />
      )}
    </>
  )
}
