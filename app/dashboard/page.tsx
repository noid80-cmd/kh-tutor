'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Instructor } from '@/lib/supabase'

const ADMIN_EMAILS = ['noid80@hanmail.net']

type Tab = 'today' | 'schedule' | 'reports' | 'notify' | 'payroll' | 'manage'

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState<Tab>('today')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const email = session.user.email ?? null
      setUserEmail(email)
      const admin = ADMIN_EMAILS.includes(email ?? '')
      setIsAdmin(admin)

      if (!admin) {
        const { data } = await supabase.from('instructors').select('*').eq('user_id', session.user.id).maybeSingle()
        if (!data) { window.location.href = '/login'; return }
        setInstructor(data)
        setTab('today')
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0c12' }}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
    </div>
  )

  const adminTabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'today',    label: '오늘 수업',  emoji: '📅' },
    { key: 'schedule', label: '스케줄',     emoji: '🗓️' },
    { key: 'reports',  label: '평가서',     emoji: '📋' },
    { key: 'notify',   label: '알림',       emoji: '🔔' },
    { key: 'payroll',  label: '급여',       emoji: '💰' },
    { key: 'manage',   label: '관리',       emoji: '⚙️' },
  ]

  const instructorTabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'today',    label: '내 수업',    emoji: '📅' },
    { key: 'schedule', label: '스케줄',     emoji: '🗓️' },
    { key: 'reports',  label: '평가서',     emoji: '📋' },
  ]

  const tabs = isAdmin ? adminTabs : instructorTabs

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0c0c12' }}>

      {/* 헤더 */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(12,12,18,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-white font-black text-sm">KH</span>
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">KH Tutor</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isAdmin ? '관리자' : instructor?.name + ' 선생님'}
              </p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)' }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 pt-5">
        {tab === 'today'    && <TodayView isAdmin={isAdmin} instructor={instructor} />}
        {tab === 'schedule' && <ScheduleView isAdmin={isAdmin} instructor={instructor} />}
        {tab === 'reports'  && <ReportsView isAdmin={isAdmin} instructor={instructor} />}
        {tab === 'notify'   && isAdmin && <NotifyView />}
        {tab === 'payroll'  && isAdmin && <PayrollView />}
        {tab === 'manage'   && isAdmin && <ManageView />}
      </div>

      {/* 하단 탭바 */}
      <div className="fixed bottom-0 left-0 right-0 z-20" style={{ background: 'rgba(12,12,18,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
                style={{ color: active ? '#818cf8' : 'rgba(255,255,255,0.25)' }}>
                <span style={{ fontSize: 20 }}>{t.emoji}</span>
                <span className="text-[10px] font-semibold">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── 오늘 수업 ──────────────────────────────────────────────
function TodayView({ isAdmin, instructor }: { isAdmin: boolean; instructor: Instructor | null }) {
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const query = supabase.from('lessons')
      .select('*, instructor:instructors(name), student:students(name)')
      .eq('date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (!isAdmin && instructor) query.eq('instructor_id', instructor.id)

    query.then(({ data }) => { setLessons(data || []); setLoading(false) })
  }, [isAdmin, instructor, today])

  const statusColor = (s: string) => s === 'completed' ? '#6ee7b7' : s === 'makeup' ? '#fde68a' : '#a5b4fc'
  const statusLabel = (s: string) => s === 'completed' ? '완료' : s === 'makeup' ? '보강' : '예정'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white font-black text-xl">오늘 수업</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <p className="text-4xl mb-3">🎵</p>
          <p className="text-sm">오늘 수업이 없어요</p>
        </div>
      ) : (
        lessons.map(l => (
          <div key={l.id} className="px-5 py-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base">{l.student?.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.15)', color: statusColor(l.status) }}>
                  {statusLabel(l.status)}
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {l.start_time.slice(0, 5)}
              </span>
            </div>
            {isAdmin && (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{l.instructor?.name} 선생님</p>
            )}
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{l.duration_minutes}분</p>

            {!isAdmin && l.status === 'scheduled' && (
              <CompleteLessonButton lessonId={l.id} onDone={() => setLessons(prev => prev.map(x => x.id === l.id ? { ...x, status: 'completed' } : x))} />
            )}
          </div>
        ))
      )}
    </div>
  )
}

function CompleteLessonButton({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [nextGoal, setNextGoal] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!content.trim()) { alert('수업 내용을 입력해주세요.'); return }
    setSaving(true)
    const { data: lesson } = await supabase.from('lessons').select('instructor_id, student_id, date').eq('id', lessonId).single()
    if (!lesson) { setSaving(false); return }
    await supabase.from('class_reports').insert({
      lesson_id: lessonId, instructor_id: lesson.instructor_id,
      student_id: lesson.student_id, date: lesson.date,
      content, next_goal: nextGoal, student_memo: memo,
    })
    await supabase.from('lessons').update({ status: 'completed' }).eq('id', lessonId)
    setSaving(false); setOpen(false); onDone()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition active:scale-95"
      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
      수업 완료 + 평가서 작성
    </button>
  )

  return (
    <div className="mt-3 space-y-3">
      <textarea value={content} onChange={e => setContent(e.target.value)}
        placeholder="수업 내용 (곡명, 진도 등) *" rows={3}
        className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none resize-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
      <textarea value={nextGoal} onChange={e => setNextGoal(e.target.value)}
        placeholder="다음 수업 목표" rows={2}
        className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none resize-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
      <textarea value={memo} onChange={e => setMemo(e.target.value)}
        placeholder="학생 상태 / 메모" rows={2}
        className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none resize-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>취소</button>
        <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
          {saving ? '저장 중...' : '제출'}
        </button>
      </div>
    </div>
  )
}

// ── 스케줄 ──────────────────────────────────────────────
function ScheduleView({ isAdmin, instructor }: { isAdmin: boolean; instructor: Instructor | null }) {
  const [lessons, setLessons] = useState<any[]>([])
  const [week, setWeek] = useState(0)
  const [loading, setLoading] = useState(true)

  const getWeekDates = (offset: number) => {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }

  const dates = getWeekDates(week)

  useEffect(() => {
    const query = supabase.from('lessons')
      .select('*, instructor:instructors(name), student:students(name)')
      .gte('date', dates[0]).lte('date', dates[6])
      .neq('status', 'cancelled')
      .order('date').order('start_time')

    if (!isAdmin && instructor) query.eq('instructor_id', instructor.id)

    query.then(({ data }) => { setLessons(data || []); setLoading(false) })
  }, [week, isAdmin, instructor])

  const dayNames = ['월', '화', '수', '목', '금', '토', '일']
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white font-black text-xl">주간 스케줄</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeek(w => w - 1)} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>‹</button>
          <button onClick={() => setWeek(0)} className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>이번 주</button>
          <button onClick={() => setWeek(w => w + 1)} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>›</button>
        </div>
      </div>

      {dates.map((date, i) => {
        const dayLessons = lessons.filter(l => l.date === date)
        const isToday = date === today
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: isToday ? 'rgba(99,102,241,0.2)' : 'transparent', color: isToday ? '#a5b4fc' : 'rgba(255,255,255,0.35)' }}>
                {dayNames[i]} {new Date(date + 'T12:00:00').getDate()}
              </span>
              {dayLessons.length > 0 && (
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{dayLessons.length}개</span>
              )}
            </div>
            {dayLessons.length === 0 ? (
              <div className="h-10 rounded-xl flex items-center px-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>수업 없음</span>
              </div>
            ) : (
              <div className="space-y-2">
                {dayLessons.map(l => (
                  <div key={l.id} className="px-4 py-3 rounded-xl flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <span className="text-white font-semibold text-sm">{l.student?.name}</span>
                      {isAdmin && <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{l.instructor?.name}</span>}
                      {l.is_makeup && <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(253,230,138,0.15)', color: '#fde68a' }}>보강</span>}
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{l.start_time.slice(0, 5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── 평가서 ──────────────────────────────────────────────
function ReportsView({ isAdmin, instructor }: { isAdmin: boolean; instructor: Instructor | null }) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending')

  async function load() {
    const query = supabase.from('class_reports')
      .select('*, instructor:instructors(name), student:students(name), lesson:lessons(date, start_time, is_makeup)')
      .order('date', { ascending: false })

    if (filter === 'pending') query.is('admin_approved_at', null)
    else query.not('admin_approved_at', 'is', null)

    if (!isAdmin && instructor) query.eq('instructor_id', instructor.id)

    const { data } = await query
    setReports(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter, isAdmin, instructor])

  async function approve(id: string) {
    await supabase.from('class_reports').update({ admin_approved_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white font-black text-xl">수업 평가서</p>
        <div className="flex gap-2">
          {(['pending', 'approved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition"
              style={{
                background: filter === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
              }}>
              {f === 'pending' ? '미확인' : '확인완료'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">{filter === 'pending' ? '미확인 평가서가 없어요' : '확인된 평가서가 없어요'}</p>
        </div>
      ) : (
        reports.map(r => (
          <div key={r.id} className="px-5 py-4 rounded-2xl space-y-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{r.student?.name}</span>
                  {r.lesson?.is_makeup && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(253,230,138,0.15)', color: '#fde68a' }}>보강</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {isAdmin ? r.instructor?.name + ' · ' : ''}{r.date} {r.lesson?.start_time?.slice(0, 5)}
                </p>
              </div>
              {isAdmin && filter === 'pending' && (
                <button onClick={() => approve(r.id)}
                  className="text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }}>
                  ✓ 확인
                </button>
              )}
              {filter === 'approved' && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>✓</span>
              )}
            </div>
            <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>수업 내용</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.content}</p>
              </div>
              {r.next_goal && (
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>다음 목표</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.next_goal}</p>
                </div>
              )}
              {r.student_memo && (
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>메모</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.student_memo}</p>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── 알림 (관리자) ──────────────────────────────────────────────
function NotifyView() {
  const [messages, setMessages] = useState<{ instructor: string; phone: string; text: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][tomorrow.getDay()]

    supabase.from('lessons')
      .select('start_time, duration_minutes, is_makeup, student:students(name), instructor:instructors(name, phone)')
      .eq('date', tomorrowStr)
      .neq('status', 'cancelled')
      .order('start_time')
      .then(({ data }) => {
        const grouped: Record<string, { instructor: string; phone: string; items: string[] }> = {}
        ;(data || []).forEach((l: any) => {
          const key = l.instructor?.name
          if (!grouped[key]) grouped[key] = { instructor: key, phone: l.instructor?.phone, items: [] }
          grouped[key].items.push(`${l.start_time.slice(0, 5)} ${l.student?.name}${l.is_makeup ? ' (보강)' : ''}`)
        })
        const msgs = Object.values(grouped).map(g => ({
          instructor: g.instructor,
          phone: g.phone,
          text: `[KH Music & Studio]\n${g.instructor} 선생님, 내일(${tomorrowStr.slice(5).replace('-', '/')} ${dayName}) 수업 일정입니다.\n\n${g.items.join('\n')}\n\n확인 부탁드립니다 🎵`,
        }))
        setMessages(msgs)
        setLoading(false)
      })
  }, [])

  async function sendAll() {
    setSending(true)
    const res = await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) })
    setSending(false)
    if (res.ok) setSent(true)
    else alert('발송 오류가 발생했어요.')
  }

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-black text-xl">수업 알림</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>내일 {tomorrowStr}</p>
        </div>
        {messages.length > 0 && !sent && (
          <button onClick={sendAll} disabled={sending}
            className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
            {sending ? '발송 중...' : `전체 발송 (${messages.length}명)`}
          </button>
        )}
      </div>

      {sent && (
        <div className="px-5 py-4 rounded-2xl text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-green-400 font-bold">✓ 알림톡 발송 완료</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-sm">내일 수업이 없어요</p>
        </div>
      ) : (
        messages.map((m, i) => (
          <div key={i} className="px-5 py-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-bold">{m.instructor} 선생님</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.phone}</span>
            </div>
            <pre className="text-sm whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit' }}>{m.text}</pre>
          </div>
        ))
      )}
    </div>
  )
}

// ── 급여 (관리자) ──────────────────────────────────────────────
function PayrollView() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<{ instructor: any; count: number; amount: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = month + '-01'
    const end = month + '-31'
    supabase.from('class_reports')
      .select('instructor_id, instructor:instructors(name, rate_per_lesson)')
      .not('admin_approved_at', 'is', null)
      .gte('date', start).lte('date', end)
      .then(({ data: rows }) => {
        const map: Record<string, { instructor: any; count: number }> = {}
        ;(rows || []).forEach((r: any) => {
          if (!map[r.instructor_id]) map[r.instructor_id] = { instructor: r.instructor, count: 0 }
          map[r.instructor_id].count++
        })
        const result = Object.values(map).map(({ instructor, count }) => ({
          instructor, count, amount: count * (instructor?.rate_per_lesson ?? 0),
        })).sort((a, b) => b.amount - a.amount)
        setData(result)
        setLoading(false)
      })
  }, [month])

  const total = data.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white font-black text-xl">급여 정산</p>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
      </div>

      <div className="px-5 py-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>이번 달 총 급여</p>
        <p className="text-3xl font-black text-white mt-1">{total.toLocaleString()}원</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <p className="text-sm">확인된 평가서가 없어요</p>
        </div>
      ) : (
        data.map((d, i) => (
          <div key={i} className="px-5 py-4 rounded-2xl flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-white font-bold">{d.instructor?.name} 선생님</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {d.count}회 × {(d.instructor?.rate_per_lesson ?? 0).toLocaleString()}원
              </p>
            </div>
            <p className="text-lg font-black" style={{ color: '#a5b4fc' }}>{d.amount.toLocaleString()}원</p>
          </div>
        ))
      )}
    </div>
  )
}

// ── 관리 (관리자) ──────────────────────────────────────────────
function ManageView() {
  const [tab, setTab] = useState<'instructors' | 'students' | 'schedules'>('instructors')

  return (
    <div className="space-y-4">
      <p className="text-white font-black text-xl">관리</p>
      <div className="flex gap-2">
        {([['instructors', '강사'], ['students', '학생'], ['schedules', '정규 수업']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
            style={{
              background: tab === k ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              color: tab === k ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
            }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'instructors' && <InstructorManager />}
      {tab === 'students'    && <StudentManager />}
      {tab === 'schedules'   && <ScheduleManager />}
    </div>
  )
}

function InstructorManager() {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', phone: '', email: '', rate_per_lesson: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  async function load() {
    const { data } = await supabase.from('instructors').select('*').order('name')
    setList(data || [])
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!form.name || !form.phone || !form.rate_per_lesson) { alert('이름, 전화번호, 단가를 입력해주세요.'); return }
    setAdding(true)
    const { error } = await supabase.from('instructors').insert({
      name: form.name, phone: form.phone, rate_per_lesson: Number(form.rate_per_lesson), is_active: true,
    })
    if (error) { alert('오류: ' + error.message); setAdding(false); return }
    setForm({ name: '', phone: '', email: '', rate_per_lesson: '' })
    setOpen(false); setAdding(false); load()
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full py-3 rounded-2xl text-sm font-bold transition"
        style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px dashed rgba(99,102,241,0.3)' }}>
        + 강사 추가
      </button>

      {open && (
        <div className="px-5 py-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[['name', '이름 *'], ['phone', '전화번호 *'], ['rate_per_lesson', '수업 단가 (원) *']].map(([k, ph]) => (
            <input key={k} placeholder={ph} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
              type={k === 'rate_per_lesson' ? 'number' : 'text'}
              className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
          ))}
          <button onClick={add} disabled={adding}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
      )}

      {list.map(i => (
        <div key={i.id} className="px-5 py-4 rounded-2xl flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-white font-semibold">{i.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{i.phone} · {i.rate_per_lesson.toLocaleString()}원/회</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: i.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: i.is_active ? '#6ee7b7' : 'rgba(255,255,255,0.3)' }}>
            {i.is_active ? '활성' : '비활성'}
          </span>
        </div>
      ))}
    </div>
  )
}

function StudentManager() {
  const [list, setList] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', phone: '', instructor_id: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  async function load() {
    const [{ data: s }, { data: i }] = await Promise.all([
      supabase.from('students').select('*, instructor:instructors(name)').order('name'),
      supabase.from('instructors').select('id, name').eq('is_active', true).order('name'),
    ])
    setList(s || []); setInstructors(i || [])
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!form.name || !form.instructor_id) { alert('이름과 담당 강사를 선택해주세요.'); return }
    setAdding(true)
    const { error } = await supabase.from('students').insert({ name: form.name, phone: form.phone, instructor_id: form.instructor_id, is_active: true })
    if (error) { alert('오류: ' + error.message); setAdding(false); return }
    setForm({ name: '', phone: '', instructor_id: '' }); setOpen(false); setAdding(false); load()
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full py-3 rounded-2xl text-sm font-bold transition"
        style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px dashed rgba(99,102,241,0.3)' }}>
        + 학생 추가
      </button>

      {open && (
        <div className="px-5 py-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input placeholder="이름 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
          <input placeholder="전화번호" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
          <select value={form.instructor_id} onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }}>
            <option value="">담당 강사 선택 *</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <button onClick={add} disabled={adding}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
      )}

      {list.map(s => (
        <div key={s.id} className="px-5 py-4 rounded-2xl flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-white font-semibold">{s.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.instructor?.name} · {s.phone}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScheduleManager() {
  const [list, setList] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [form, setForm] = useState({ student_id: '', day_of_week: '1', start_time: '', duration_minutes: '60', start_date: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  async function load() {
    const [{ data: sc }, { data: st }] = await Promise.all([
      supabase.from('lesson_schedules').select('*, student:students(name, instructor:instructors(name))').eq('is_active', true).order('day_of_week').order('start_time'),
      supabase.from('students').select('id, name, instructor:instructors(name)').eq('is_active', true).order('name'),
    ])
    setList(sc || []); setStudents(st || [])
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!form.student_id || !form.start_time || !form.start_date) { alert('학생, 시간, 시작일을 입력해주세요.'); return }
    const student = students.find(s => s.id === form.student_id)
    setAdding(true)
    const { error } = await supabase.from('lesson_schedules').insert({
      student_id: form.student_id, instructor_id: student?.instructor?.id,
      day_of_week: Number(form.day_of_week), start_time: form.start_time,
      duration_minutes: Number(form.duration_minutes), start_date: form.start_date, is_active: true,
    })
    if (error) { alert('오류: ' + error.message); setAdding(false); return }
    setForm({ student_id: '', day_of_week: '1', start_time: '', duration_minutes: '60', start_date: '' })
    setOpen(false); setAdding(false); load()
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full py-3 rounded-2xl text-sm font-bold"
        style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px dashed rgba(99,102,241,0.3)' }}>
        + 정규 수업 추가
      </button>

      {open && (
        <div className="px-5 py-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }}>
            <option value="">학생 선택 *</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.instructor?.name})</option>)}
          </select>
          <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }}>
            {dayNames.map((d, i) => <option key={i} value={i}>{d}요일</option>)}
          </select>
          <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
          <select value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }}>
            {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m}분</option>)}
          </select>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>수업 시작일</label>
            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
          </div>
          <button onClick={add} disabled={adding}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
      )}

      {list.map(sc => (
        <div key={sc.id} className="px-5 py-4 rounded-2xl flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-white font-semibold">{sc.student?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {dayNames[sc.day_of_week]}요일 {sc.start_time.slice(0, 5)} · {sc.duration_minutes}분 · {sc.student?.instructor?.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
