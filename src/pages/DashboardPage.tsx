import { useMemo } from 'react'
import { Package, TrendingUp, AlertTriangle, Activity } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useMovements } from '@/hooks/useMovements'
import { useAuthStore } from '@/lib/authStore'
import { formatDate, getStockStatus, cn } from '@/lib/utils'
import { Card, CardHeader, CardBody, Badge, EmptyState, PageHeader, Spinner, StockBar } from '@/components/ui'

export function DashboardPage() {
  const { profile } = useAuthStore()
  const { products, loading: prodLoading } = useProducts()
  const { movements, loading: movLoading }  = useMovements(50)

  const today = new Date().toDateString()

  const kpis = useMemo(() => {
    const alerts     = products.filter((p) => p.stock <= p.min_stock)
    const todayMovs  = movements.filter((m) => new Date(m.created_at).toDateString() === today)
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0)
    return { total: products.length, alerts: alerts.length, todayMovs: todayMovs.length, totalStock }
  }, [products, movements, today])

  const alertProducts = useMemo(
    () => products.filter((p) => p.stock <= p.min_stock).sort((a, b) => a.stock - b.stock).slice(0, 6),
    [products],
  )
  const recentMovements = movements.slice(0, 8)

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  if (prodLoading || movLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greeting}, ${profile?.full_name.split(' ')[0]} 👋`}
        subtitle={new Date().toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Productos" value={kpis.total} icon={<Package className="w-5 h-5" />} color="brand" sub="en sistema" />
        <KpiCard label="Stock crítico" value={kpis.alerts} icon={<AlertTriangle className="w-5 h-5" />} color={kpis.alerts > 0 ? 'danger' : 'success'} sub="bajo mínimo" />
        <KpiCard label="Movimientos hoy" value={kpis.todayMovs} icon={<Activity className="w-5 h-5" />} color="teal" sub="entradas + salidas" />
        <KpiCard label="Stock total" value={kpis.totalStock.toLocaleString()} icon={<TrendingUp className="w-5 h-5" />} color="purple" sub="unidades" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-slate-200">Alertas de stock mínimo</span>
            </div>
            <Badge color={kpis.alerts > 0 ? 'yellow' : 'green'}>
              {kpis.alerts} {kpis.alerts === 1 ? 'alerta' : 'alertas'}
            </Badge>
          </CardHeader>
          {alertProducts.length === 0 ? (
            <EmptyState icon="✅" title="Sin alertas de stock" description="Todos los productos están sobre el mínimo" />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {alertProducts.map((p) => {
                const st = getStockStatus(p.stock, p.min_stock)
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/30 transition-colors">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0',
                      st.severity === 'critical' ? 'bg-danger/10' : 'bg-warning/10',
                    )}>
                      {st.severity === 'critical' ? '🚨' : '⚠️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        Stock: <span className={st.color === 'danger' ? 'text-danger' : 'text-warning'}>{p.stock} {p.unit}</span>
                        {' '}· Mín: {p.min_stock} · {p.location}
                      </p>
                    </div>
                    <Badge color={st.color === 'danger' ? 'red' : 'yellow'}>{st.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Recent movements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-slate-200">Últimos movimientos</span>
            </div>
            <Badge color="gray">{movements.length} registros</Badge>
          </CardHeader>
          {recentMovements.length === 0 ? (
            <EmptyState icon="📋" title="Sin movimientos aún" />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentMovements.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/30 transition-colors">
                  <div className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0',
                    m.type === 'ENTRADA' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                  )}>
                    {m.type === 'ENTRADA' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{m.products?.name ?? '—'}</p>
                    <p className="text-xs text-slate-500">{m.reference ?? '—'} · {m.user_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-sm font-medium', m.type === 'ENTRADA' ? 'text-success' : 'text-danger')}>
                      {m.type === 'ENTRADA' ? '+' : '-'}{m.quantity}
                    </p>
                    <p className="text-[10px] text-slate-600">{formatDate(m.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stock by category */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <span className="text-sm font-medium text-slate-200">Estado del inventario</span>
            <span className="text-xs text-slate-500">{products.length} productos activos</span>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {products.slice(0, 8).map((p) => {
                const st = getStockStatus(p.stock, p.min_stock)
                return (
                  <div key={p.id} className="p-3 bg-surface-2 rounded-lg border border-white/6">
                    <p className="text-xs text-slate-500 truncate mb-1">{p.name}</p>
                    <p className={cn('text-lg font-semibold font-mono', {
                      'text-danger': st.color === 'danger',
                      'text-warning': st.color === 'warning',
                      'text-success': st.color === 'success',
                    })}>
                      {p.stock}
                      <span className="text-xs font-normal text-slate-500 ml-1">{p.unit}</span>
                    </p>
                    <StockBar stock={p.stock} min={p.min_stock} />
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; sub: string
}) {
  const colorMap: Record<string, string> = {
    brand:   'bg-brand/10 text-brand-light',
    danger:  'bg-danger/10 text-danger',
    success: 'bg-success/10 text-success',
    teal:    'bg-teal-500/10 text-teal-300',
    purple:  'bg-purple-500/10 text-purple-300',
  }
  return (
    <div className="bg-surface-1 border border-white/8 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorMap[color] ?? 'bg-white/5 text-slate-400')}>
          {icon}
        </div>
      </div>
      <div className="font-mono text-3xl font-light text-slate-100 tracking-tight">{value}</div>
      <div className="text-xs text-slate-600 mt-1">{sub}</div>
    </div>
  )
}
