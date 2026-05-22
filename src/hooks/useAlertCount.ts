import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useAlertCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, stock, min_stock')
        .eq('active', true)
      if (data) setCount(data.filter((p) => p.stock <= p.min_stock).length)
    }
    fetch()

    const channel = supabase
      .channel('alert-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return count
}
