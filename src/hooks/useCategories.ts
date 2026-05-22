import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories((data ?? []) as Category[])
    })
  }, [])

  return categories
}
