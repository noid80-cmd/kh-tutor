'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('로그인 중...')

  useEffect(() => {
    async function handleCallback() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const hash = window.location.hash
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      // PKCE flow: ?code=xxx
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.session) {
          setStatus('로그인 실패: ' + (error?.message ?? '세션 없음'))
          setTimeout(() => router.replace('/login'), 2000)
          return
        }
        router.replace('/dashboard')
        return
      }

      // Implicit flow: #access_token=xxx
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error || !data.session) {
          setStatus('로그인 실패: ' + (error?.message ?? '세션 없음'))
          setTimeout(() => router.replace('/login'), 2000)
          return
        }
        router.replace('/dashboard')
        return
      }

      // 이미 세션 있으면 바로 이동
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
        return
      }

      setStatus('로그인 정보가 없어요')
      setTimeout(() => router.replace('/login'), 2000)
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      background: '#0c0c12', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid rgba(99,102,241,0.2)',
        borderTopColor: '#6366f1',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
