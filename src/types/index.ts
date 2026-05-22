// ─────────────────────────────────────────────
// TIPOS GLOBALES DE STOCKFLOW
// ─────────────────────────────────────────────

export type UserRole = 'admin' | 'bodeguero' | 'viewer'
export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE'

// ── Auth & Usuarios ──────────────────────────
export interface Profile {
  id: string
  full_name: string
  role: UserRole
  active: boolean
  created_at: string
  email?: string
}

// ── Categorías ───────────────────────────────
export interface Category {
  id: number
  name: string
}

// ── Productos ────────────────────────────────
export interface Product {
  id: string
  code: string
  name: string
  category_id: number | null
  category?: Category
  unit: string
  location: string
  stock: number
  min_stock: number
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProductWithCategory extends Product {
  categories: Category | null
}

// ── Movimientos ──────────────────────────────
export interface Movement {
  id: string
  product_id: string
  product?: Product
  type: MovementType
  quantity: number
  reference: string | null
  notes: string | null
  balance: number
  user_id: string | null
  user_name: string | null
  created_at: string
  products?: { name: string; unit: string; code: string }
}

// ── UI helpers ───────────────────────────────
export interface KPI {
  label: string
  value: string | number
  delta?: string
  color?: 'brand' | 'success' | 'warning' | 'danger' | 'info'
}

export interface StockAlert {
  product: Product
  deficit: number
  severity: 'critical' | 'low'
}
