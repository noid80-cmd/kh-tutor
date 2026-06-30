'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        window.location.href = session ? '/dashboard' : '/login'
      }
    })
    return () => subscription.unsubscribe()
  }, [])
  return null
}
