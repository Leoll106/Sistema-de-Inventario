import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/authStore'
import { getRoleLabel } from '@/lib/utils'
import { PageHeader, Card, CardHeader, CardBody, Input, Select, Button } from '@/components/ui'

export function ConfigPage() {
  const { profile } = useAuthStore()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    toast.success('Configuración guardada')
    setSaving(false)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Configuración" subtitle="Parámetros del sistema" />

      <div className="max-w-lg space-y-5">
        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-slate-200">🏢 Empresa</span>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input label="Nombre de la empresa" defaultValue="Mi Empresa S.A." />
            <Input label="Almacén principal" defaultValue="Bodega Central" />
            <Select label="Moneda">
              <option value="HNL">Lempira (HNL)</option>
              <option value="USD">Dólar (USD)</option>
              <option value="MXN">Peso Mexicano (MXN)</option>
              <option value="GTQ">Quetzal (GTQ)</option>
            </Select>
            <Button variant="primary" loading={saving} onClick={handleSave}>Guardar cambios</Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-slate-200">👤 Mi perfil</span>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Nombre</p>
                <p className="text-slate-300">{profile?.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="text-slate-300">{profile?.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Rol</p>
                <p className="text-slate-300">{profile ? getRoleLabel(profile.role) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Estado</p>
                <p className="text-success">Activo</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-slate-200">⚙️ Sistema</span>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between"><span>Versión</span><span className="font-mono text-slate-400">StockFlow v1.0</span></div>
              <div className="flex justify-between"><span>Base de datos</span><span className="font-mono text-slate-400">Supabase PostgreSQL</span></div>
              <div className="flex justify-between"><span>Auth</span><span className="font-mono text-slate-400">Supabase Auth</span></div>
              <div className="flex justify-between"><span>Frontend</span><span className="font-mono text-slate-400">React 18 + TypeScript + Tailwind</span></div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
