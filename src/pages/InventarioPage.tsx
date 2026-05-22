import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useAuthStore } from '@/lib/authStore'
import { productSchema, type ProductFormData } from '@/validations/schemas'
import { getStockStatus, cn } from '@/lib/utils'
import {
  Button, Input, Select, Modal, Badge, Card, EmptyState,
  PageHeader, Spinner, StockBar,
} from '@/components/ui'
import type { ProductWithCategory } from '@/types'

export function InventarioPage() {
  const { products, loading, refetch } = useProducts()
  const categories = useCategories()
  const { hasRole } = useAuthStore()

  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState<ProductWithCategory | null>(null)
  const [saving, setSaving]       = useState(false)

  const canWrite  = hasRole('admin', 'bodeguero')
  const canDelete = hasRole('admin')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) =>
      (!catFilter || String(p.category_id) === catFilter) &&
      (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.categories?.name?.toLowerCase().includes(q))
    )
  }, [products, search, catFilter])

  const openNew = () => {
    setEditing(null)
    reset({ code: '', name: '', category_id: undefined, unit: 'Unidad', location: '', stock: 0, min_stock: 10, price: 0 })
    setModalOpen(true)
  }

  const openEdit = (p: ProductWithCategory) => {
    setEditing(p)
    reset({
      code: p.code, name: p.name,
      category_id: p.category_id ?? undefined,
      unit: p.unit, location: p.location,
      stock: p.stock, min_stock: p.min_stock, price: p.price,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('products').update({
        code: data.code, name: data.name, category_id: data.category_id,
        unit: data.unit, location: data.location,
        min_stock: data.min_stock, price: data.price,
      }).eq('id', editing.id)
      if (error) toast.error(error.message)
      else { toast.success('Producto actualizado'); setModalOpen(false); refetch() }
    } else {
      const { error } = await supabase.from('products').insert({
        code: data.code, name: data.name, category_id: data.category_id,
        unit: data.unit, location: data.location,
        stock: data.stock, min_stock: data.min_stock, price: data.price,
      })
      if (error) {
        toast.error(error.message.includes('unique') ? `El código "${data.code}" ya existe` : error.message)
      } else {
        toast.success('Producto creado')
        setModalOpen(false)
        refetch()
      }
    }
    setSaving(false)
  }

  const deleteProduct = async (p: ProductWithCategory) => {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('products').update({ active: false }).eq('id', p.id)
    if (error) toast.error(error.message)
    else { toast.success('Producto eliminado'); refetch() }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Inventario"
        subtitle="Gestión de productos y stock"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={refetch} icon={<RefreshCw className="w-3.5 h-3.5" />}>Actualizar</Button>
            {canWrite && <Button variant="success" size="sm" onClick={openNew} icon={<Plus className="w-3.5 h-3.5" />}>Nuevo Producto</Button>}
          </>
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
              placeholder="Buscar por nombre, código o categoría..."
              className="w-full pl-8 pr-3 py-2 bg-surface-2 border border-white/8 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/15 transition-all"
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-surface-2 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand/60 transition-all"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
          <span className="text-xs text-slate-500 font-mono">{filtered.length} productos</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📦" title="Sin productos" description="Agrega tu primer producto o ajusta el filtro" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Código', 'Producto', 'Categoría', 'Ubicación', 'Stock', 'Mínimo', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((p) => {
                  const st = getStockStatus(p.stock, p.min_stock)
                  return (
                    <tr key={p.id} className="hover:bg-surface-2/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.code}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-200">{p.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="blue">{p.categories?.name ?? '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{p.location}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-semibold', {
                          'text-danger':  st.color === 'danger',
                          'text-warning': st.color === 'warning',
                          'text-success': st.color === 'success',
                        })}>
                          {p.stock} <span className="text-xs font-normal text-slate-500">{p.unit}</span>
                        </span>
                        <StockBar stock={p.stock} min={p.min_stock} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.min_stock} {p.unit}</td>
                      <td className="px-4 py-3">
                        <Badge color={st.color === 'danger' ? 'red' : st.color === 'warning' ? 'yellow' : 'green'}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {canWrite ? (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(p)} icon={<Pencil className="w-3 h-3" />} />
                            {canDelete && (
                              <Button variant="danger" size="sm" onClick={() => deleteProduct(p)} icon={<Trash2 className="w-3 h-3" />} />
                            )}
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '✏️ Editar Producto' : '📦 Nuevo Producto'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant={editing ? 'primary' : 'success'} loading={saving} onClick={handleSubmit(onSubmit)}>
              {editing ? 'Actualizar' : 'Crear Producto'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código *"
              placeholder="PRD-001"
              error={errors.code?.message}
              hint="Solo mayúsculas, números y guiones"
              {...register('code')}
              onChange={(e) => setValue('code', e.target.value.toUpperCase())}
            />
            <Select label="Categoría *" error={errors.category_id?.message} {...register('category_id', { valueAsNumber: true })}>
              <option value="">Seleccionar...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <Input label="Nombre del producto *" placeholder="Nombre descriptivo completo" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unidad *" placeholder="Unidad, Metro, Kg..." error={errors.unit?.message} {...register('unit')} />
            <Input label="Ubicación *" placeholder="A-01, B-02..." error={errors.location?.message} {...register('location')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {!editing && (
              <Input label="Stock inicial" type="number" min="0" error={errors.stock?.message} {...register('stock', { valueAsNumber: true })} />
            )}
            <Input label="Stock mínimo *" type="number" min="0" error={errors.min_stock?.message} {...register('min_stock', { valueAsNumber: true })} />
            <Input label="Precio" type="number" min="0" step="0.01" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
