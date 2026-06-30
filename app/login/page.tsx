'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: 'kh1234' })
    if (error) {
      setError('등록되지 않은 이메일이에요')
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(212,168,67,0.2)',
    borderRadius: 16, padding: '16px 20px',
    fontSize: 16, outline: 'none', color: '#fff', colorScheme: 'dark' as const,
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0c0b08' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@900&display=swap');`}</style>
      <div className="fixed inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.10) 0%, transparent 70%)',
        }} />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center" style={{ marginBottom: '12vh' }}>
        {/* 로고 */}
        <div className="flex flex-col items-center" style={{ marginBottom: 48 }}>
          <div className="rounded-3xl mb-5 flex items-center justify-center"
            style={{ width: 96, height: 96, background: 'linear-gradient(145deg, #d4942a, #7a5010)', boxShadow: '0 20px 56px rgba(212,148,42,0.4)' }}>
            <span style={{ color: '#3a2000', fontWeight: 900, fontSize: 56, fontFamily: "'Cinzel', serif", lineHeight: 1, marginTop: 4 }}>K</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>KH Tutor</h1>
        </div>

        <div className="w-full flex flex-col" style={{ gap: 12 }}>
          <form onSubmit={handleLogin} className="flex flex-col" style={{ gap: 12 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="이메일" required style={inputStyle} />
            {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-2xl font-bold disabled:opacity-50 transition active:scale-95"
              style={{ background: 'linear-gradient(135deg, #d4942a, #c8a030)', color: '#0e0c08', fontSize: 16, minHeight: 56, boxShadow: '0 8px 24px rgba(212,148,42,0.3)' }}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
