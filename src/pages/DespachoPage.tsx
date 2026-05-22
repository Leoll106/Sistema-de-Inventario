import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ArrowUpFromLine, AlertTriangle, SendHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProducts } from '@/hooks/useProducts'
import { useMovements } from '@/hooks/useMovements'
import { despachoSchema, type DespachoFormData } from '@/validations/schemas'
import { getStockStatus, formatDate, cn } from '@/lib/utils'
import { Button, Input, Select, Textarea, Card, CardHeader, CardBody, Badge, EmptyState, PageHeader, Spinner } from '@/components/ui'
import type { ProductWithCategory } from '@/types'

export function DespachoPage() {
  const { products, loading: prodLoading, refetch } = useProducts()
  const { movements, loading: movLoading } = useMovements(100)
  const [saving, setSaving] = useState(false)
  const [selectedProd, setSelectedProd] = useState<ProductWithCategory | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DespachoFormData>({
    resolver: zodResolver(despachoSchema),
    defaultValues: { product_id: '', quantity: 1, reference: '', requester: '', notes: '' },
  })

  const productId = watch('product_id')
  const quantity  = watch('quantity')

  useEffect(() => {
    setSelectedProd(products.find((x) => x.id === productId) ?? null)
  }, [productId, products])

  const stockInsuficiente = selectedProd !== null && quantity > selectedProd.stock

  const todaySalidas = movements.filter(
    (m) => m.type === 'SALIDA' && new Date(m.created_at).toDateString() === new Date().toDateString()
  )

  const onSubmit = async (data: DespachoFormData) => {
    if (!selectedProd) return
    if (data.quantity > selectedProd.stock) {
      toast.error(`Stock insuficiente. Disponible: ${selectedProd.stock} ${selectedProd.unit}`)
      return
    }
    setSaving(true)
    const notes = [data.notes, data.requester ? `Solicitante: ${data.requester}` : ''].filter(Boolean).join(' | ')
    const { error } = await supabase.rpc('rpc_despacho', {
      p_product_id: data.product_id,
      p_quantity:   data.quantity,
      p_reference:  data.reference || null,
      p_notes:      notes || null,
    })
    if (error) {
      toast.error(error.message.includes('Stock insuficiente') ? error.message : `Error: ${error.message}`)
    } else {
      const newStock = selectedProd.stock - data.quantity
      const st = getStockStatus(newStock, selectedProd.min_stock)
      if (st.color !== 'success') {
        toast(`⚠️ Stock bajo en ${selectedProd.name}: quedan ${newStock} ${selectedProd.unit}`, { icon: '⚠️' })
      } else {
        toast.success(`Salida registrada: -${data.quantity} ${selectedProd.unit} de ${selectedProd.name}`)
      }
      reset({ product_id: '', quantity: 1, reference: '', requester: '', notes: '' })
      setSelectedProd(null)
      refetch()
    }
    setSaving(false)
  }

  if (prodLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="animate-fade-in">
      <PageHeader title="Despacho" subtitle="Registrar salida de productos del almacén" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-danger" />
                <span className="text-sm font-medium text-slate-200">Nueva salida</span>
              </div>
            </CardHeader>
            <CardBody>
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Select label="Producto *" error={errors.product_id?.message} {...register('product_id')}>
                  <option value="">Seleccionar producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock === 0}>
                      [{p.code}] {p.name} — Stock: {p.stock} {p.unit}{p.stock === 0 ? ' ✗' : ''}
                    </option>
                  ))}
                </Select>

                {selectedProd && (
                  <div className={cn(
                    'p-3 rounded-lg border space-y-2',
                    stockInsuficiente ? 'bg-danger/5 border-danger/20' : 'bg-surface-2 border-white/8',
                  )}>
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
                    {stockInsuficiente && (
                      <div className="flex items-center gap-1.5 text-xs text-danger mt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Cantidad supera el stock disponible ({selectedProd.stock} {selectedProd.unit})
                      </div>
                    )}
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
                    label="Solicitante / Área *"
                    placeholder="Área o persona"
                    error={errors.requester?.message}
                    {...register('requester')}
                  />
                </div>

                <Input
                  label="Referencia / OC *"
                  placeholder="OC-001, proyecto..."
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
                  variant="danger"
                  size="lg"
                  loading={saving}
                  disabled={stockInsuficiente}
                  className="w-full"
                  icon={<SendHorizontal className="w-4 h-4" />}
                >
                  Confirmar Salida
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <span className="text-sm font-medium text-slate-200">Salidas del día</span>
              <Badge color="red">{todaySalidas.length} registradas</Badge>
            </CardHeader>
            {movLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : todaySalidas.length === 0 ? (
              <EmptyState icon="📤" title="Sin salidas hoy" description="Los despachos confirmados aparecerán aquí" />
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {todaySalidas.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-2/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center text-danger flex-shrink-0 mt-0.5">
                      <ArrowUpFromLine className="w-4 h-4" />
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
                          <span className="text-sm font-semibold text-danger">-{m.quantity}</span>
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
