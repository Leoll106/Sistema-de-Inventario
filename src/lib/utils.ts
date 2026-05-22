import { clsx, type ClassValue } from 'clsx'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

export const formatDate = (iso: string): string => {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) {
    return 'Hoy ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleString('es-HN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const formatDateShort = (iso: string): string =>
  new Date(iso).toLocaleString('es-HN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export const formatCurrency = (n: number, currency = 'HNL'): string =>
  new Intl.NumberFormat('es-HN', { style: 'currency', currency }).format(n)

export const getStockStatus = (stock: number, min: number) => {
  if (stock === 0) return { label: 'Sin stock', color: 'danger' as const, severity: 'critical' as const }
  if (stock <= min) return { label: 'Stock bajo', color: 'warning' as const, severity: 'low' as const }
  return { label: 'OK', color: 'success' as const, severity: null }
}

export const getRoleLabel = (role: string): string =>
  ({ admin: 'Administrador', bodeguero: 'Bodeguero', viewer: 'Solo lectura' }[role] ?? role)

export const initials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
