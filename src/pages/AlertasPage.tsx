// AlertasPage
import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { getStockStatus } from '@/lib/utils'
import { Card, CardHeader, Badge, EmptyState, PageHeader, Spinner, StockBar } from '@/components/ui'

export function AlertasPage() {
  const { products, loading } = useProducts()

  const alerts = useMemo(
    () => products.filter((p) => p.stock <= p.min_stock).sort((a, b) => a.stock - b.stock),
    [products],
  )

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Alertas de Stock"
        subtitle="Productos que requieren reposición"
        actions={
          <div className="flex gap-2">
            <Badge color="red">🚨 Sin stock: {alerts.filter((p) => p.stock === 0).length}</Badge>
            <Badge color="yellow">⚠️ Bajo: {alerts.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length}</Badge>
          </div>
        }
      />

      {alerts.length === 0 ? (
        <Card>
          <EmptyState icon="✅" title="¡Todo en orden!" description="Todos los productos están sobre el stock mínimo" />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-slate-200">Productos en alerta</span>
            </div>
            <Badge color="yellow">{alerts.length} productos</Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Código', 'Producto', 'Categoría', 'Stock Actual', 'Mínimo', 'Déficit', 'Ubicación', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {alerts.map((p) => {
                  const st = getStockStatus(p.stock, p.min_stock)
                  const deficit = p.min_stock - p.stock
                  return (
                    <tr key={p.id} className="hover:bg-surface-2/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-200">{p.name}</td>
                      <td className="px-4 py-3"><Badge color="blue">{p.categories?.name ?? '—'}</Badge></td>
                      <td className="px-4 py-3">
                        <span className={st.color === 'danger' ? 'text-danger font-semibold' : 'text-warning font-semibold'}>
                          {p.stock} {p.unit}
                        </span>
                        <StockBar stock={p.stock} min={p.min_stock} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{p.min_stock} {p.unit}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-danger">-{deficit}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{p.location}</td>
                      <td className="px-4 py-3">
                        <Badge color={st.color === 'danger' ? 'red' : 'yellow'}>{st.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
