import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Mail, Lock, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { loginSchema, type LoginFormData } from '@/validations/schemas'
import { Input, Button } from '@/components/ui'

const DEMO_ACCOUNTS = [
  { label: 'Admin',      email: 'admin@stockflow.com',     password: 'Admin123',   color: 'bg-gradient-brand' },
  { label: 'Bodeguero',  email: 'bodega@stockflow.com',    password: 'Bodega123',  color: 'bg-gradient-success' },
  { label: 'Viewer',     email: 'viewer@stockflow.com',    password: 'Viewer123',  color: 'bg-warning/80' },
]

export function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(
        error.message.includes('Invalid login')
          ? 'Email o contraseña incorrectos'
          : error.message
      )
    }
    setLoading(false)
  }

  const quickLogin = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/4 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-brand rounded-2xl mb-4 shadow-lg shadow-brand/20">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">StockFlow</h1>
          <p className="text-sm text-slate-500 mt-1 font-light">Plataforma de gestión de inventario</p>
        </div>

        {/* Card */}
        <div className="bg-surface-1 border border-white/8 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="usuario@empresa.com"
              error={errors.email?.message}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              {...register('password')}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Iniciar sesión
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-white/8">
            <p className="text-xs text-slate-500 text-center uppercase tracking-widest mb-3">
              Acceso rápido · Demo
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => quickLogin(acc.email, acc.password)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-white/8 hover:border-white/14 transition-all group"
                >
                  <div className={`w-6 h-6 rounded-md ${acc.color} text-white text-xs font-bold flex items-center justify-center`}>
                    {acc.label[0]}
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300">{acc.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 text-center mt-3">
              Haz clic en un rol para auto-completar credenciales
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          StockFlow v1.0 · Powered by Supabase + React
        </p>
      </div>
    </div>
  )
}
