import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ArrowDownToLine, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProducts } from '@/hooks/useProducts'
import { useMovements } from '@/hooks/useMovements'
import { recepcionSchema, type RecepcionFormData } from '@/validations/schemas'
import { getStockStatus, formatDate, cn } from '@/lib/utils'
import { Button, Input, Select, Textarea, Card, CardHeader, CardBody, Badge, EmptyState, PageHeader, Spinner } from '@/components/ui'
import type { ProductWithCategory } from '@/types'

export function RecepcionPage() {
  const { products, loading: prodLoading, refetch } = useProducts()
  const { movements, loading: movLoading } = useMovements(100)
  const [saving, setSaving] = useState(false)
  const [selectedProd, setSelectedProd] = useState<ProductWithCategory | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<RecepcionFormData>({
    resolver: zodResolver(recepcionSchema),
    defaultValues: { product_id: '', quantity: 1, reference: '', provider: '', notes: '' },
  })

  const productId = watch('product_id')

  useEffect(() => {
    const p = products.find((x) => x.id === productId) ?? null
    setSelectedProd(p)
  }, [productId, products])

  const todayEntradas = movements.filter(
    (m) => m.type === 'ENTRADA' && new Date(m.created_at).toDateString() === new Date().toDateString()
  )

  const onSubmit = async (data: RecepcionFormData) => {
    setSaving(true)
    const notes = [data.notes, data.provider ? `Proveedor: ${data.provider}` : ''].filter(Boolean).join(' | ')
    const { error } = await supabase.rpc('rpc_recepcion', {
      p_product_id: data.product_id,
      p_quantity:   data.quantity,
      p_reference:  data.reference || null,
      p_notes:      notes || null,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`✅ Entrada registrada: +${data.quantity} ${selectedProd?.unit ?? 'unidades'} de ${selectedProd?.name}`)
      reset({ product_id: '', quantity: 1, reference: '', provider: '', notes: '' })
      setSelectedProd(null)
      refetch()
    }
    setSaving(false)
  }

  if (prodLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="animate-fade-in">
      <PageHeader title="Recepción de Mercancía" subtitle="Registrar entrada de productos al almacén" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-slate-200">Nueva entrada</span>
              </div>
            </CardHeader>
            <CardBody>
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Select label="Producto *" error={errors.product_id?.message} {...register('product_id')}>
                  <option value="">Seleccionar producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} — Stock: {p.stock} {p.unit}
                    </option>
                  ))}
                </Select>

                {/* Product info card */}
                {selectedProd ? (
                  <div className="p-3 bg-surface-2 rounded-lg border border-white/8 space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock actual</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Disponible', value: `${selectedProd.stock} ${selectedProd.unit}`, color: getStockStatus(selectedProd.stock, selectedProd.min_stock).color },
                        { label: 'Mínimo',     value: `${selectedProd.min_stock} ${selectedProd.unit}`, color: 'gray' },
                        { label: 'Ubicación',  value: selectedProd.location, color: 'gray' },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                          <p className={cn('text-sm font-semibold', {
                            'text-danger':  item.color === 'danger',
                            'text-warning': item.color === 'warning',
                            'text-success': item.color === 'success',
                            'text-slate-300': item.color === 'gray',
                          })}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-surface-2 rounded-lg border border-white/8 text-center text-xs text-slate-500">
                    Selecciona un producto para ver su estado
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cantidad *"
                    type="number"
                    min="1"
                    error={errors.quantity?.message}
                    {...register('quantity', { valueAsNumber: true })}
                  />
                  <Input
                    label="Proveedor *"
                    placeholder="Nombre del proveedor"
                    error={errors.provider?.message}
                    {...register('provider')}
                  />
                </div>

                <Input
                  label="N° Documento / Factura *"
                  placeholder="FAC-001, GR-002..."
                  error={errors.reference?.message}
                  {...register('reference')}
                />

                <Textarea
                  label="Observaciones *"
                  placeholder="Notas adicionales..."
                  error={errors.notes?.message}
                  {...register('notes')}
                />

                <Button
                  type="submit"
                  variant="success"
                  size="lg"
                  loading={saving}
                  className="w-full"
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Confirmar Entrada
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Today list */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <span className="text-sm font-medium text-slate-200">Entradas del día</span>
              <Badge color="green">{todayEntradas.length} registradas</Badge>
            </CardHeader>
            {movLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : todayEntradas.length === 0 ? (
              <EmptyState icon="📥" title="Sin entradas hoy" description="Las recepciones confirmadas aparecerán aquí" />
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {todayEntradas.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-2/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success flex-shrink-0 mt-0.5">
                      <ArrowDownToLine className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{m.products?.name ?? '—'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {m.reference && <span className="font-mono mr-2">{m.reference}</span>}
                            {m.notes && <span>{m.notes}</span>}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-semibold text-success">+{m.quantity}</span>
                          <p className="text-[10px] text-slate-600">{formatDate(m.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-slate-500">Saldo: <span className="text-slate-400 font-mono">{m.balance}</span></span>
                        <span className="text-[10px] text-slate-600">por {m.user_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
