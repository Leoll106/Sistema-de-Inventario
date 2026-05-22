import { useState, useMemo } from 'react'
import { Search, Download } from 'lucide-react'
import { useMovements } from '@/hooks/useMovements'
import { exportHistorialPDF, exportHistorialExcel } from '@/lib/exports'
import { formatDateShort, cn } from '@/lib/utils'
import { Button, Card, Badge, EmptyState, PageHeader, Spinner } from '@/components/ui'
import type { MovementType } from '@/types'

const TYPE_COLORS: Record<MovementType, string> = {
  ENTRADA: 'green',
  SALIDA:  'red',
  AJUSTE:  'purple',
}

export function HistorialPage() {
  const { movements, loading } = useMovements(500)
  const [search, setSearch]   = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [exporting, setExporting]   = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return movements.filter((m) =>
      (!typeFilter || m.type === typeFilter) &&
      (!q ||
        m.products?.name?.toLowerCase().includes(q) ||
        m.products?.code?.toLowerCase().includes(q) ||
        (m.reference ?? '').toLowerCase().includes(q) ||
        (m.user_name ?? '').toLowerCase().includes(q))
    )
  }, [movements, search, typeFilter])

  const handleExportPDF = async () => {
    setExporting(true)
    await exportHistorialPDF(filtered)
    setExporting(false)
  }
  const handleExportExcel = async () => {
    setExporting(true)
    await exportHistorialExcel(filtered)
    setExporting(false)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Historial de Movimientos"
        subtitle="Registro completo de entradas, salidas y ajustes"
        actions={
          <div className="flex gap-2">
            <Button variant="warning" size="sm" loading={exporting} onClick={handleExportPDF} icon={<Download className="w-3.5 h-3.5" />}>PDF</Button>
            <Button variant="success" size="sm" loading={exporting} onClick={handleExportExcel} icon={<Download className="w-3.5 h-3.5" />}>Excel</Button>
          </div>
        }
      />

      <Card>
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-white/8 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por producto, código, referencia o usuario..."
              className="w-full pl-8 pr-3 py-2 bg-surface-2 border border-white/8 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/15 transition-all"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-2 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand/60"
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">Solo Entradas</option>
            <option value="SALIDA">Solo Salidas</option>
            <option value="AJUSTE">Solo Ajustes</option>
          </select>
          <span className="text-xs text-slate-500 font-mono">{filtered.length} registros</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📋" title="Sin movimientos" description="Ajusta el filtro o realiza tu primer movimiento" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Referencia', 'Usuario', 'Saldo', 'Notas'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-2/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{formatDateShort(m.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge color={TYPE_COLORS[m.type] as 'green' | 'red' | 'purple'}>{m.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-200">{m.products?.name ?? '—'}</span>
                      <p className="text-[10px] text-slate-500 font-mono">{m.products?.code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-semibold font-mono', m.type === 'ENTRADA' ? 'text-success' : m.type === 'SALIDA' ? 'text-danger' : 'text-purple-400')}>
                        {m.type === 'ENTRADA' ? '+' : m.type === 'SALIDA' ? '-' : '~'}{m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{m.reference ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{m.user_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-300">{m.balance}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-36 truncate" title={m.notes ?? ''}>{m.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
