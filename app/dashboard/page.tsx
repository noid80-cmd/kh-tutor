'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Instructor } from '@/lib/supabase'

function CustomSelect({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: selected ? '#fff' : 'rgba(255,255,255,0.35)' }}>
        <span>{selected ? selected.label : placeholder}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {options.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="w-full px-4 py-3 text-sm text-left"
              style={{ color: o.value === value ? '#a5b4fc' : 'rgba(255,255,255,0.75)', background: o.value === value ? 'rgba(99,102,241,0.15)' : 'transparent' }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SubjectSelect({ value, onChange, instructorId }: {
  value: string; onChange: (v: string) => void; instructorId: string
}) {
  const [subjects, setSubjects] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!instructorId) { setSubjects([]); return }
    supabase.from('lesson_schedules').select('subject_name')
      .eq('instructor_id', instructorId).not('subject_name', 'is', null)
      .then(({ data }) => {
        const unique = [...new Set((data || []).map((r: any) => r.subject_name).filter(Boolean))] as string[]
        setSubjects(unique)
      })
  }, [instructorId])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setAdding(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function confirmNew() {
    const t = newSubject.trim()
    if (!t) return
    onChange(t)
    if (!subjects.includes(t)) setSubjects(prev => [...prev, t])
    setNewSubject(''); setAdding(false); setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: value ? '#fff' : 'rgba(255,255,255,0.35)' }}>
        <span>{value || '과목명 선택 *'}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {subjects.length === 0 && !adding && (
            <p className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>아직 등록된 과목이 없어요</p>
          )}
          {subjects.map(s => (
            <button key={s} type="button" onClick={() => { onChange(s); setOpen(false) }}
              className="w-full px-4 py-3 text-sm text-left"
              style={{ color: s === value ? '#a5b4fc' : 'rgba(255,255,255,0.75)', background: s === value ? 'rgba(99,102,241,0.15)' : 'transparent' }}>
              {s}
            </button>
          ))}
          {adding ? (
            <div className="px-3 py-2 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <input autoFocus value={newSubject} onChange={e => setNewSubject(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmNew()}
                placeholder="과목명 입력 후 Enter"
                className="flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(99,102,241,0.3)' }} />
              <button type="button" onClick={confirmNew}
                className="px-3 py-2 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>확인</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)}
              className="w-full px-4 py-3 text-sm text-left font-semibold"
              style={{ color: '#818cf8', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              + 과목 추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const ADMIN_EMAILS = ['noid80@hanmail.net']
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const LESSON_TYPES = ['입시반', '오디션반', '부전공', '전문반', '취미반', '단체수업'] as const
type LessonType = typeof LESSON_TYPES[number]

type Tab = 'today' | 'schedule' | 'reports' | 'notify' | 'payroll' | 'manage'

// 정규 스케줄에서 수업 자동 생성 (8주치)
async function generateLessons(weeksAhead = 8) {
  const { data: schedules } = await supabase.from('lesson_schedules').select('*').eq('is_active', true)
  if (!schedules?.length) return 0

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const endDate = new Date(today); endDate.setDate(today.getDate() + weeksAhead * 7)
  let created = 0

  for (const sc of schedules) {
    const scStart = new Date(sc.start_date + 'T00:00:00')
    const scEnd = sc.end_date ? new Date(sc.end_date + 'T00:00:00') : endDate
    const rangeEnd = scEnd < endDate ? scEnd : endDate
    const rangeStart = scStart > today ? scStart : today

    const cur = new Date(rangeStart)
    // 해당 요일로 맞추기
    while (cur.getDay() !== sc.day_of_week) cur.setDate(cur.getDate() + 1)

    while (cur <= rangeEnd) {
      const dateStr = cur.toISOString().split('T')[0]
      const { data: existing } = await supabase.from('lessons').select('id')
        .eq('schedule_id', sc.id).eq('date', dateStr).maybeSingle()
      if (!existing) {
        await supabase.from('lessons').insert({
          schedule_id: sc.id, instructor_id: sc.instructor_id,
          student_id: sc.student_id ?? null, date: dateStr,
          start_time: sc.start_time, duration_minutes: sc.duration_minutes,
          lesson_type: sc.lesson_type ?? '취미반',
          subject_name: sc.subject_name ?? null,
          status: 'scheduled', is_makeup: false,
        })
        created++
      }
      cur.setDate(cur.getDate() + 7)
    }
  }
  return created
}

export default function Dashboard() {
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState<Tab>('today')
  const [loading, setLoading] = useState(true)
  const [noAccess, setNoAccess] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const email = session.user.email ?? ''
      const admin = ADMIN_EMAILS.includes(email)
      setIsAdmin(admin)

      if (!admin) {
        // user_id로 먼저 찾고, 없으면 email로 찾아서 user_id 자동 연결
        let { data } = await supabase.from('instructors').select('*').eq('user_id', session.user.id).maybeSingle()
        if (!data && email) {
          const { data: byEmail } = await supabase.from('instructors').select('*').eq('email', email).maybeSingle()
          if (byEmail) {
            await supabase.from('instructors').update({ user_id: session.user.id }).eq('id', byEmail.id)
            data = { ...byEmail, user_id: session.user.id }
          }
        }
        if (!data) { setNoAccess(true); setLoading(false); return }
        setInstructor(data)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0c12' }}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
    </div>
  )

  if (noAccess) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0c0c12' }}>
      <div className="text-center">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-white font-bold text-lg mb-2">접근 권한이 없어요</p>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>관리자에게 계정 등록을 요청해주세요</p>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
          className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
          로그아웃
        </button>
      </div>
    </div>
  )

  const adminTabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'today',    label: '오늘',   emoji: '📅' },
    { key: 'schedule', label: '스케줄', emoji: '🗓️' },
    { key: 'reports',  label: '평가서', emoji: '📋' },
    { key: 'notify',   label: '알림',   emoji: '🔔' },
    { key: 'payroll',  label: '급여',   emoji: '💰' },
    { key: 'manage',   label: '관리',   emoji: '⚙️' },
  ]
  const instructorTabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'today',    label: '오늘',   emoji: '📅' },
    { key: 'schedule', label: '스케줄', emoji: '🗓️' },
    { key: 'reports',  label: '평가서', emoji: '📋' },
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
                className="flex-1 flex flex-col items-center justify-center py-3 gap-1"
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

  async function load() {
    const query = supabase.from('lessons')
      .select('*, instructor:instructors(name), student:students(name), class_report:class_reports(id, admin_approved_at)')
      .eq('date', today).neq('status', 'cancelled').order('start_time')
    if (!isAdmin && instructor) query.eq('instructor_id', instructor.id)
    const { data } = await query
    setLessons(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [isAdmin, instructor])

  async function cancelLesson(id: string) {
    if (!confirm('이 수업을 취소할까요?')) return
    await supabase.from('lessons').update({ status: 'cancelled' }).eq('id', id)
    load()
  }

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
        <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /></div>
      ) : lessons.length === 0 ? (
        <div className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <p className="text-4xl mb-3">🎵</p><p className="text-sm">오늘 수업이 없어요</p>
        </div>
      ) : (
        lessons.map(l => (
          <div key={l.id} className="px-5 py-4 rounded-2xl space-y-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold text-base">{l.student?.name ?? '단체수업'}</span>
                {l.subject_name && <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{l.subject_name}</span>}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.07)', color: statusColor(l.status) }}>
                  {statusLabel(l.status)}
                </span>
                {l.lesson_type && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{l.lesson_type}</span>}
                {l.is_makeup && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(253,230,138,0.15)', color: '#fde68a' }}>보강</span>}
              </div>
              <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{l.start_time?.slice(0, 5)}</span>
            </div>
            {isAdmin && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{l.instructor?.name} 선생님 · {l.duration_minutes}분</p>}

            {/* 강사: 수업완료+평가서 */}
            {!isAdmin && l.status === 'scheduled' && (
              <CompleteLessonButton lessonId={l.id} onDone={load} />
            )}
            {/* 평가서 작성됨 표시 */}
            {l.class_report && (
              <div className="text-xs px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
                style={{ background: l.class_report.admin_approved_at ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: l.class_report.admin_approved_at ? '#6ee7b7' : 'rgba(255,255,255,0.4)' }}>
                {l.class_report.admin_approved_at ? '✓ 확인완료' : '📋 평가서 작성됨'}
              </div>
            )}
            {/* 취소 버튼 */}
            {l.status === 'scheduled' && (
              <button onClick={() => cancelLesson(l.id)}
                className="text-xs px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(248,113,113,0.6)' }}>
                수업 취소
              </button>
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
    const { error } = await supabase.from('class_reports').insert({
      lesson_id: lessonId, instructor_id: lesson.instructor_id,
      student_id: lesson.student_id, date: lesson.date,
      content, next_goal: nextGoal, student_memo: memo,
    })
    if (error) { alert('오류: ' + error.message); setSaving(false); return }
    await supabase.from('lessons').update({ status: 'completed' }).eq('id', lessonId)
    setSaving(false); setOpen(false); onDone()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2.5 rounded-xl text-sm font-bold transition active:scale-95"
      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
      수업 완료 + 평가서 작성
    </button>
  )

  return (
    <div className="space-y-3">
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
  const [generating, setGenerating] = useState(false)
  const [showMakeup, setShowMakeup] = useState(false)

  const getWeekDates = (offset: number) => {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }

  const dates = getWeekDates(week)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    setLoading(true)
    const query = supabase.from('lessons')
      .select('*, instructor:instructors(name), student:students(name)')
      .gte('date', dates[0]).lte('date', dates[6])
      .neq('status', 'cancelled').order('date').order('start_time')
    if (!isAdmin && instructor) query.eq('instructor_id', instructor.id)
    const { data } = await query
    setLessons(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [week, isAdmin, instructor])

  async function handleGenerate() {
    setGenerating(true)
    const n = await generateLessons(8)
    setGenerating(false)
    alert(`수업 ${n}개가 생성됐어요.`)
    load()
  }

  async function cancelLesson(id: string) {
    if (!confirm('이 수업을 취소할까요?')) return
    await supabase.from('lessons').update({ status: 'cancelled' }).eq('id', id)
    load()
  }

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

      {isAdmin && (
        <div className="flex gap-2">
          <button onClick={handleGenerate} disabled={generating}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
            {generating ? '생성 중...' : '🔄 수업 자동 생성 (8주)'}
          </button>
          <button onClick={() => setShowMakeup(o => !o)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
            style={{ background: 'rgba(253,230,138,0.1)', color: '#fde68a', border: '1px solid rgba(253,230,138,0.2)' }}>
            + 보강 추가
          </button>
        </div>
      )}

      {showMakeup && isAdmin && <MakeupForm onDone={() => { setShowMakeup(false); load() }} />}

      {dates.map((date, i) => {
        const dayLessons = lessons.filter(l => l.date === date)
        const isToday = date === today
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: isToday ? 'rgba(99,102,241,0.2)' : 'transparent', color: isToday ? '#a5b4fc' : 'rgba(255,255,255,0.35)' }}>
                {DAY_NAMES[i]} {new Date(date + 'T12:00:00').getDate()}
              </span>
              {dayLessons.length > 0 && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{dayLessons.length}개</span>}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{l.student?.name ?? '단체수업'}</span>
                        {l.subject_name && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{l.subject_name}</span>}
                        {isAdmin && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{l.instructor?.name}</span>}
                        {l.lesson_type && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>{l.lesson_type}</span>}
                        {l.is_makeup && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(253,230,138,0.15)', color: '#fde68a' }}>보강</span>}
                        {l.status === 'completed' && <span className="text-[10px]" style={{ color: '#6ee7b7' }}>✓</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l.start_time?.slice(0, 5)} · {l.duration_minutes}분</p>
                    </div>
                    {isAdmin && l.status === 'scheduled' && (
                      <button onClick={() => cancelLesson(l.id)}
                        className="text-[10px] px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(248,113,113,0.5)' }}>취소</button>
                    )}
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

function MakeupForm({ onDone }: { onDone: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [form, setForm] = useState({ student_id: '', instructor_id: '', date: '', start_time: '', duration_minutes: '60', lesson_type: '취미반', subject_name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('students').select('id, name').eq('is_active', true).order('name'),
      supabase.from('instructors').select('id, name').eq('is_active', true).order('name'),
    ]).then(([{ data: s }, { data: i }]) => { setStudents(s || []); setInstructors(i || []) })
  }, [])

  async function save() {
    if (!form.student_id || !form.instructor_id || !form.date || !form.start_time) {
      alert('학생, 강사, 날짜, 시간을 입력해주세요.'); return
    }
    setSaving(true)
    const { error } = await supabase.from('lessons').insert({
      instructor_id: form.instructor_id, student_id: form.student_id || null,
      date: form.date, start_time: form.start_time,
      duration_minutes: Number(form.duration_minutes),
      lesson_type: form.lesson_type, subject_name: form.subject_name || null,
      status: 'scheduled', is_makeup: true,
    })
    setSaving(false)
    if (error) { alert('오류: ' + error.message); return }
    onDone()
  }

  return (
    <div className="px-5 py-4 rounded-2xl space-y-3" style={{ background: 'rgba(253,230,138,0.06)', border: '1px solid rgba(253,230,138,0.15)' }}>
      <p className="text-sm font-bold" style={{ color: '#fde68a' }}>보강 수업 추가</p>
      <CustomSelect
        value={form.student_id}
        onChange={v => setForm(f => ({ ...f, student_id: v }))}
        placeholder="학생 선택 *"
        options={students.map(s => ({ value: s.id, label: s.name }))}
      />
      <CustomSelect
        value={form.instructor_id}
        onChange={v => setForm(f => ({ ...f, instructor_id: v, subject_name: '' }))}
        placeholder="강사 선택 *"
        options={instructors.map(i => ({ value: i.id, label: i.name }))}
      />
      <SubjectSelect
        value={form.subject_name}
        onChange={v => setForm(f => ({ ...f, subject_name: v }))}
        instructorId={form.instructor_id}
      />
      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
        className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
      <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
        className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
      <select value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
        className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }}>
        {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m}분</option>)}
      </select>
      <select value={form.lesson_type} onChange={e => setForm(f => ({ ...f, lesson_type: e.target.value }))}
        className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }}>
        {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={onDone} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>취소</button>
        <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: 'rgba(253,230,138,0.2)', color: '#fde68a' }}>
          {saving ? '저장 중...' : '추가'}
        </button>
      </div>
    </div>
  )
}

// ── 평가서 ──────────────────────────────────────────────
function ReportsView({ isAdmin, instructor }: { isAdmin: boolean; instructor: Instructor | null }) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending')

  async function load() {
    setLoading(true)
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
              className="text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: filter === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: filter === f ? '#a5b4fc' : 'rgba(255,255,255,0.35)' }}>
              {f === 'pending' ? '미확인' : '확인완료'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /></div>
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
                  {r.lesson?.is_makeup && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(253,230,138,0.15)', color: '#fde68a' }}>보강</span>}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {isAdmin ? r.instructor?.name + ' · ' : ''}{r.date} {r.lesson?.start_time?.slice(0, 5)}
                </p>
              </div>
              {isAdmin && filter === 'pending' && (
                <button onClick={() => approve(r.id)}
                  className="text-xs font-bold px-4 py-2 rounded-xl active:scale-95"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }}>
                  ✓ 확인
                </button>
              )}
              {filter === 'approved' && <span className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>✓</span>}
            </div>
            <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>수업 내용</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.content}</p>
              </div>
              {r.next_goal && <div><p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>다음 목표</p><p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.next_goal}</p></div>}
              {r.student_memo && <div><p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>메모</p><p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.student_memo}</p></div>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── 알림 ──────────────────────────────────────────────
function NotifyView() {
  const [messages, setMessages] = useState<{ instructor: string; phone: string; text: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const dayName = DAY_NAMES[tomorrow.getDay()]

    supabase.from('lessons')
      .select('start_time, duration_minutes, is_makeup, student:students(name), instructor:instructors(name, phone)')
      .eq('date', tomorrowStr).neq('status', 'cancelled').order('start_time')
      .then(({ data }) => {
        const grouped: Record<string, { instructor: string; phone: string; items: string[] }> = {}
        ;(data || []).forEach((l: any) => {
          const key = l.instructor?.name
          if (!grouped[key]) grouped[key] = { instructor: key, phone: l.instructor?.phone, items: [] }
          grouped[key].items.push(`${l.start_time?.slice(0, 5)} ${l.student?.name}${l.is_makeup ? ' (보강)' : ''}`)
        })
        setMessages(Object.values(grouped).map(g => ({
          instructor: g.instructor, phone: g.phone,
          text: `[KH Music & Studio]\n${g.instructor} 선생님, 내일(${tomorrowStr.slice(5).replace('-', '/')} ${dayName}) 수업 일정입니다.\n\n${g.items.join('\n')}\n\n확인 부탁드립니다 🎵`,
        })))
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-black text-xl">수업 알림</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            내일 {tomorrow.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
        {messages.length > 0 && !sent && (
          <button onClick={sendAll} disabled={sending}
            className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95"
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
        <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /></div>
      ) : messages.length === 0 ? (
        <div className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}><p className="text-4xl mb-3">🔔</p><p className="text-sm">내일 수업이 없어요</p></div>
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

// ── 급여 ──────────────────────────────────────────────
function PayrollView() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<{ instructorId: string; name: string; breakdown: { type: string; count: number; rate: number }[]; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('class_reports')
        .select('instructor_id, instructor:instructors(name), lesson:lessons(lesson_type)')
        .not('admin_approved_at', 'is', null)
        .gte('date', month + '-01').lte('date', month + '-31'),
      supabase.from('instructor_rates').select('*'),
    ]).then(([{ data: reports }, { data: rates }]) => {
      const rateMap: Record<string, Record<string, number>> = {}
      ;(rates || []).forEach((r: any) => {
        if (!rateMap[r.instructor_id]) rateMap[r.instructor_id] = {}
        rateMap[r.instructor_id][r.lesson_type] = r.rate
      })

      const map: Record<string, { name: string; counts: Record<string, number> }> = {}
      ;(reports || []).forEach((r: any) => {
        const iid = r.instructor_id
        if (!map[iid]) map[iid] = { name: r.instructor?.name ?? '', counts: {} }
        const t = r.lesson?.lesson_type ?? '취미반'
        map[iid].counts[t] = (map[iid].counts[t] ?? 0) + 1
      })

      const result = Object.entries(map).map(([iid, { name, counts }]) => {
        const breakdown = Object.entries(counts).map(([type, count]) => ({
          type, count, rate: rateMap[iid]?.[type] ?? 0,
        }))
        const total = breakdown.reduce((s, b) => s + b.count * b.rate, 0)
        return { instructorId: iid, name, breakdown, total }
      }).sort((a, b) => b.total - a.total)

      setData(result)
      setLoading(false)
    })
  }, [month])

  const total = data.reduce((s, d) => s + d.total, 0)

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
        <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /></div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}><p className="text-sm">확인된 평가서가 없어요</p></div>
      ) : (
        data.map((d) => (
          <div key={d.instructorId} className="px-5 py-4 rounded-2xl space-y-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <p className="text-white font-bold">{d.name} 선생님</p>
              <p className="text-lg font-black" style={{ color: '#a5b4fc' }}>{d.total.toLocaleString()}원</p>
            </div>
            <div className="space-y-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {d.breakdown.map(b => (
                <div key={b.type} className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span>{b.type} {b.count}회</span>
                  <span>{b.rate > 0 ? `${b.rate.toLocaleString()}원 × ${b.count} = ${(b.rate * b.count).toLocaleString()}원` : '단가 미설정'}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── 관리 ──────────────────────────────────────────────
function ManageView() {
  const [tab, setTab] = useState<'instructors' | 'students' | 'schedules'>('instructors')
  return (
    <div className="space-y-4">
      <p className="text-white font-black text-xl">관리</p>
      <div className="flex gap-2">
        {([['instructors', '강사'], ['students', '학생'], ['schedules', '정규 수업']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: tab === k ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: tab === k ? '#a5b4fc' : 'rgba(255,255,255,0.35)' }}>
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
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)
  const [ratesOpen, setRatesOpen] = useState<string | null>(null)
  const [ratesForm, setRatesForm] = useState<Record<string, string>>({})
  const [ratesSaving, setRatesSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('instructors').select('*').order('name')
    setList(data || [])
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!form.name || !form.phone) { alert('이름과 전화번호를 입력해주세요.'); return }
    setAdding(true)
    const { error } = await supabase.from('instructors').insert({
      name: form.name, phone: form.phone, email: form.email || null, is_active: true,
    })
    if (error) { alert('오류: ' + error.message); setAdding(false); return }
    setForm({ name: '', phone: '', email: '' })
    setOpen(false); setAdding(false); load()
  }

  async function openRates(instructorId: string) {
    const { data } = await supabase.from('instructor_rates').select('*').eq('instructor_id', instructorId)
    const init: Record<string, string> = {}
    LESSON_TYPES.forEach(t => { init[t] = '' })
    ;(data || []).forEach((r: any) => { init[r.lesson_type] = String(r.rate) })
    setRatesForm(init)
    setRatesOpen(instructorId)
  }

  async function saveRates(instructorId: string) {
    setRatesSaving(true)
    for (const type of LESSON_TYPES) {
      const rate = Number(ratesForm[type] || 0)
      await supabase.from('instructor_rates').upsert(
        { instructor_id: instructorId, lesson_type: type, rate },
        { onConflict: 'instructor_id,lesson_type' }
      )
    }
    setRatesSaving(false)
    setRatesOpen(null)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('instructors').update({ is_active: !current }).eq('id', id)
    load()
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full py-3 rounded-2xl text-sm font-bold"
        style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px dashed rgba(99,102,241,0.3)' }}>
        + 강사 추가
      </button>
      {open && (
        <div className="px-5 py-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[['name', '이름 *', 'text'], ['phone', '전화번호 *', 'text'], ['email', '이메일 (로그인용)', 'email']].map(([k, ph, type]) => (
            <input key={k} placeholder={ph} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
              type={type}
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
        <div key={i.id} className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{i.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{i.phone}</p>
              {i.email && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{i.email}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => ratesOpen === i.id ? setRatesOpen(null) : openRates(i.id)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                단가 설정
              </button>
              <button onClick={() => toggleActive(i.id, i.is_active)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: i.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: i.is_active ? '#6ee7b7' : 'rgba(255,255,255,0.3)' }}>
                {i.is_active ? '활성' : '비활성'}
              </button>
            </div>
          </div>
          {ratesOpen === i.id && (
            <div className="px-5 pb-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold pt-3 mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>수업 타입별 단가 (원/회)</p>
              <div className="grid grid-cols-2 gap-2">
                {LESSON_TYPES.map(t => (
                  <div key={t}>
                    <label className="text-[11px] mb-1 block" style={{ color: 'rgba(255,255,255,0.35)' }}>{t}</label>
                    <input type="number" placeholder="0" value={ratesForm[t] || ''}
                      onChange={e => setRatesForm(f => ({ ...f, [t]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
                  </div>
                ))}
              </div>
              <button onClick={() => saveRates(i.id)} disabled={ratesSaving}
                className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                {ratesSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
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
    if (!form.name) { alert('이름을 입력해주세요.'); return }
    setAdding(true)
    const { error } = await supabase.from('students').insert({
      name: form.name, phone: form.phone,
      instructor_id: form.instructor_id || null, is_active: true,
    })
    if (error) { alert('오류: ' + error.message); setAdding(false); return }
    setForm({ name: '', phone: '', instructor_id: '' }); setOpen(false); setAdding(false); load()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('students').update({ is_active: !current }).eq('id', id)
    load()
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full py-3 rounded-2xl text-sm font-bold"
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
          <CustomSelect
            value={form.instructor_id}
            onChange={v => setForm(f => ({ ...f, instructor_id: v }))}
            placeholder="담당 강사 (선택사항)"
            options={instructors.map(i => ({ value: i.id, label: i.name }))}
          />
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
          <button onClick={() => toggleActive(s.id, s.is_active)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ background: s.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: s.is_active ? '#6ee7b7' : 'rgba(255,255,255,0.3)' }}>
            {s.is_active ? '활성' : '비활성'}
          </button>
        </div>
      ))}
    </div>
  )
}

function ScheduleManager() {
  const [list, setList] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [form, setForm] = useState({ student_id: '', instructor_id: '', day_of_week: '1', start_time: '', duration_minutes: '60', start_date: '', lesson_type: '취미반', subject_name: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  async function load() {
    const [{ data: sc }, { data: st }, { data: ins }] = await Promise.all([
      supabase.from('lesson_schedules').select('*, student:students(name), instructor:instructors(name)').eq('is_active', true).order('day_of_week').order('start_time'),
      supabase.from('students').select('id, name').eq('is_active', true).order('name'),
      supabase.from('instructors').select('id, name').eq('is_active', true).order('name'),
    ])
    setList(sc || []); setStudents(st || []); setInstructors(ins || [])
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!form.student_id || !form.instructor_id || !form.start_time || !form.start_date) {
      alert('학생, 강사, 시간, 시작일을 입력해주세요.'); return
    }
    setAdding(true)
    const isGroup = form.lesson_type === '단체수업'
    const { error } = await supabase.from('lesson_schedules').insert({
      student_id: isGroup ? null : (form.student_id || null),
      instructor_id: form.instructor_id,
      day_of_week: Number(form.day_of_week), start_time: form.start_time,
      duration_minutes: Number(form.duration_minutes), start_date: form.start_date,
      lesson_type: form.lesson_type, subject_name: form.subject_name || null, is_active: true,
    })
    if (error) { alert('오류: ' + error.message); setAdding(false); return }
    setForm({ student_id: '', instructor_id: '', day_of_week: '1', start_time: '', duration_minutes: '60', start_date: '', lesson_type: '취미반', subject_name: '' })
    setOpen(false); setAdding(false); load()
  }

  async function deactivate(id: string) {
    if (!confirm('이 정규 수업을 종료할까요?')) return
    await supabase.from('lesson_schedules').update({ is_active: false }).eq('id', id)
    load()
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
          <CustomSelect
            value={form.lesson_type}
            onChange={v => setForm(f => ({ ...f, lesson_type: v, student_id: '', subject_name: '' }))}
            placeholder="수업 종류 선택"
            options={LESSON_TYPES.map(t => ({ value: t, label: t === '단체수업' ? '단체수업' : `개인레슨 (${t})` }))}
          />
          {form.lesson_type !== '단체수업' && (
            <CustomSelect
              value={form.student_id}
              onChange={v => setForm(f => ({ ...f, student_id: v }))}
              placeholder="학생 선택 *"
              options={students.map(s => ({ value: s.id, label: s.name }))}
            />
          )}
          <CustomSelect
            value={form.instructor_id}
            onChange={v => setForm(f => ({ ...f, instructor_id: v, subject_name: '' }))}
            placeholder="강사 선택 *"
            options={instructors.map(i => ({ value: i.id, label: i.name }))}
          />
          <SubjectSelect
            value={form.subject_name}
            onChange={v => setForm(f => ({ ...f, subject_name: v }))}
            instructorId={form.instructor_id}
          />
          <CustomSelect
            value={form.day_of_week}
            onChange={v => setForm(f => ({ ...f, day_of_week: v }))}
            placeholder="요일 선택"
            options={DAY_NAMES.map((d, i) => ({ value: String(i), label: `${d}요일` }))}
          />
          <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }} />
          <select value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }}>
            {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m}분</option>)}
          </select>
          <select value={form.lesson_type} onChange={e => setForm(f => ({ ...f, lesson_type: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', colorScheme: 'dark' }}>
            {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
              {DAY_NAMES[sc.day_of_week]}요일 {sc.start_time?.slice(0, 5)} · {sc.duration_minutes}분 · {sc.lesson_type ?? '취미반'}{sc.subject_name ? ` · ${sc.subject_name}` : ''} · {sc.instructor?.name}
            </p>
          </div>
          <button onClick={() => deactivate(sc.id)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(248,113,113,0.5)' }}>종료</button>
        </div>
      ))}
    </div>
  )
}
