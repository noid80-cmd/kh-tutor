import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'noid80@hanmail.net'

export async function POST(req: NextRequest) {
  const { email, callerEmail } = await req.json()

  if (callerEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '권한이 없어요' }, { status: 403 })
  }

  if (!email) {
    return NextResponse.json({ error: '이메일이 필요해요' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: 'kh1234',
    email_confirm: true,
  })

  if (error) {
    // 이미 계정이 있으면 비밀번호만 kh1234로 재설정
    if (error.message.includes('already') || error.message.includes('exists')) {
      const { data: existing } = await supabase.auth.admin.listUsers()
      const user = existing?.users?.find(u => u.email === email)
      if (user) {
        await supabase.auth.admin.updateUserById(user.id, { password: 'kh1234' })
        return NextResponse.json({ ok: true, reset: true })
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
