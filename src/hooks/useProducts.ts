import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProductWithCategory } from '@/types'

export function useProducts() {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name)')
      .eq('active', true)
      .order('name')
    if (error) setError(error.message)
    else setProducts((data ?? []) as ProductWithCategory[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch])

  return { products, loading, error, refetch: fetch }
}
