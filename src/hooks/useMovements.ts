import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Movement } from '@/types'

export function useMovements(limit = 200) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading]     = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('movements')
      .select('*, products(name, unit, code)')
      .order('created_at', { ascending: false })
      .limit(limit)
    setMovements((data ?? []) as Movement[])
    setLoading(false)
  }, [limit])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('movements-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'movements' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch])

  return { movements, loading, refetch: fetch }
}
