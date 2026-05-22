import { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useMovements } from '@/hooks/useMovements'
import { exportInventarioPDF, exportInventarioExcel, exportHistorialPDF, exportHistorialExcel, exportAlertasPDF } from '@/lib/exports'
import { PageHeader, Card, CardBody, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ReportDef {
  icon: string
  title: string
  desc: string
  color: string
  action: () => Promise<void>
}

export function ReportesPage() {
  const { products, loading: pl } = useProducts()
  const { movements, loading: ml } = useMovements(9999)
  const [loading, setLoading] = useState<string | null>(null)

  const run = async (key: string, fn: () => Promise<void>) => {
    setLoading(key); await fn(); setLoading(null)
  }

  const reports: ReportDef[] = [
    { icon: '📄', title: 'Inventario PDF',     desc: 'Stock actual completo en PDF',     color: 'bg-warning/10 text-warning border-warning/20', action: () => exportInventarioPDF(products) },
    { icon: '📊', title: 'Inventario Excel',   desc: 'Hoja de cálculo editable .xlsx',   color: 'bg-success/10 text-success border-success/20', action: () => exportInventarioExcel(products) },
    { icon: '📋', title: 'Historial PDF',      desc: 'Todos los movimientos en PDF',     color: 'bg-brand/10 text-brand-light border-brand/20', action: () => exportHistorialPDF(movements) },
    { icon: '📈', title: 'Historial Excel',    desc: 'Movimientos detallados .xlsx',     color: 'bg-purple-500/10 text-purple-300 border-purple-500/20', action: () => exportHistorialExcel(movements) },
    { icon: '⚠️', title: 'Alertas PDF',        desc: 'Productos en riesgo de agotarse',  color: 'bg-danger/10 text-danger border-danger/20', action: () => exportAlertasPDF(products) },
  ]

  if (pl || ml) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reportes" subtitle="Exporta la información en PDF o Excel" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r, i) => {
          const key = String(i)
          const busy = loading === key
          return (
            <button
              key={r.title}
              onClick={() => run(key, r.action)}
              disabled={busy}
              className={cn(
                'text-left p-5 rounded-xl border bg-surface-1 hover:bg-surface-2 transition-all group',
                r.color.split(' ')[2],
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border', r.color)}>
                  {busy ? <Spinner className="w-5 h-5" /> : r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-200">{r.title}</p>
                    <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 flex-shrink-0 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-6">
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Resumen del sistema</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Productos activos', value: products.length },
                { label: 'Stock total (unidades)', value: products.reduce((a, p) => a + p.stock, 0).toLocaleString() },
                { label: 'Total movimientos', value: movements.length },
                { label: 'Alertas activas', value: products.filter((p) => p.stock <= p.min_stock).length },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-surface-2 rounded-lg border border-white/6 text-center">
                  <p className="text-2xl font-mono font-light text-slate-100">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
