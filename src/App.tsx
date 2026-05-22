import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
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
    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) setProfile({ ...(data as Profile), email: session.user.email })
      }
      setLoading(false)
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setProfile(null)
        setLoading(false)
        return
      }
      if (session.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) setProfile({ ...(data as Profile), email: session.user.email })
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setProfile, setLoading])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center text-xl">📦</div>
          <Spinner />
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Cargando StockFlow...</p>
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
