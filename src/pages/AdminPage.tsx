import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, UserCheck, UserX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/authStore'
import { createUserSchema, type CreateUserFormData } from '@/validations/schemas'
import { getRoleLabel, initials, cn } from '@/lib/utils'
import { Button, Input, Select, Modal, Badge, Card, EmptyState, PageHeader, Spinner } from '@/components/ui'
import type { Profile } from '@/types'

const roleColorMap: Record<string, string> = {
  admin:     'bg-brand/10 text-brand-light border border-brand/20',
  bodeguero: 'bg-success-muted text-success border border-success/20',
  viewer:    'bg-warning-muted text-warning border border-warning/20',
}
const roleAvatarMap: Record<string, string> = {
  admin:     'bg-gradient-brand',
  bodeguero: 'bg-gradient-success',
  viewer:    'bg-warning/80',
}

export function AdminPage() {
  const { profile: currentProfile } = useAuthStore()
  const [users, setUsers]       = useState<Profile[]>([])
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { full_name: '', email: '', password: '', confirmPassword: '', role: 'viewer' },
  })

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data ?? []) as Profile[])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const onSubmit = async (data: CreateUserFormData) => {
    setSaving(true)
    // Create user via Supabase Admin API through Edge Function or direct auth
    // We use signUp and then update the profile role
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role: data.role },
      },
    })

    if (authError) {
      toast.error(
        authError.message.includes('already registered')
          ? 'Este email ya está registrado en el sistema'
          : authError.message,
      )
      setSaving(false)
      return
    }

    if (authData.user) {
      // Update role in profiles (trigger creates the row, but we ensure role is correct)
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: data.full_name,
        role: data.role,
        active: true,
      })
    }

    toast.success(`Usuario "${data.full_name}" creado con rol ${getRoleLabel(data.role)}`)
    setModalOpen(false)
    reset()
    fetchUsers()
    setSaving(false)
  }

  const toggleActive = async (u: Profile) => {
    if (u.id === currentProfile?.id) { toast.error('No puedes desactivar tu propia cuenta'); return }
    setTogglingId(u.id)
    const { error } = await supabase.from('profiles').update({ active: !u.active }).eq('id', u.id)
    if (error) toast.error(error.message)
    else {
      toast.success(u.active ? `${u.full_name} desactivado` : `${u.full_name} activado`)
      fetchUsers()
    }
    setTogglingId(null)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Usuarios"
        subtitle="Panel de administración de usuarios y roles"
        actions={
          <Button variant="success" size="sm" onClick={() => { reset(); setModalOpen(true) }} icon={<Plus className="w-3.5 h-3.5" />}>
            Nuevo Usuario
          </Button>
        }
      />

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="👤" title="Sin usuarios" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Usuario', 'Email', 'Rol', 'Estado', 'Miembro desde', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-2/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', roleAvatarMap[u.role] ?? 'bg-slate-600')}>
                          {initials(u.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{u.full_name}</p>
                          {u.id === currentProfile?.id && (
                            <span className="text-[10px] text-brand-light font-mono">← Tú</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{u.email ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={cn('text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-1 rounded-md', roleColorMap[u.role] ?? 'bg-white/5 text-slate-400')}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge color={u.active ? 'green' : 'red'}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      {u.id !== currentProfile?.id ? (
                        <Button
                          variant={u.active ? 'danger' : 'success'}
                          size="sm"
                          loading={togglingId === u.id}
                          onClick={() => toggleActive(u)}
                          icon={u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        >
                          {u.active ? 'Desactivar' : 'Activar'}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="👤 Crear nuevo usuario"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="success" loading={saving} onClick={handleSubmit(onSubmit)}>Crear usuario</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Nombre completo *"
            placeholder="Nombre y apellido"
            error={errors.full_name?.message}
            hint="Solo letras y espacios"
            {...register('full_name')}
          />
          <Input
            label="Email *"
            type="email"
            placeholder="usuario@empresa.com"
            error={errors.email?.message}
            hint="Debe ser un correo válido (ej: usuario@empresa.com)"
            {...register('email')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contraseña *"
              type="password"
              placeholder="Mínimo 6 caracteres"
              error={errors.password?.message}
              hint="Al menos 1 mayúscula y 1 número"
              {...register('password')}
            />
            <Input
              label="Confirmar contraseña *"
              type="password"
              placeholder="Repite la contraseña"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
          <Select label="Rol *" error={errors.role?.message} {...register('role')}>
            <option value="viewer">Visitante — Solo consulta</option>
            <option value="bodeguero">Bodeguero — Recepciones y despachos</option>
            <option value="admin">Administrador — Acceso total</option>
          </Select>
          <div className="p-3 bg-surface-2 rounded-lg border border-white/8 text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Permisos por rol:</p>
            <p>🔵 <b>Visitante</b> — Solo puede ver inventario e historial</p>
            <p>🟢 <b>Bodeguero</b> — Puede hacer recepciones, despachos y editar productos</p>
            <p>🟣 <b>Admin</b> — Acceso completo: usuarios, eliminar productos, configuración</p>
          </div>
        </form>
      </Modal>
    </div>
  )
}
