'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Instructor, Student, Assignment, GroupClass, Evaluation, GradeRate, Grade, LessonType } from '@/lib/supabase'

// ── 상수 ──────────────────────────────────────────────────────

const ADMIN_EMAIL = 'noid80@hanmail.net'
const GRADES: Grade[] = ['S', 'A+', 'A', 'A-', 'B']
const LESSON_TYPES: LessonType[] = ['전공', '오디션', '부전공', '전문반', '취미', '단체']
const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const GRADE_COLOR: Record<Grade, string> = { S: '#c0a060', 'A+': '#8878e8', A: '#7090e0', 'A-': '#6098d8', B: '#60b080' }

const GROUP_CLASS_CATEGORIES: Record<string, string[]> = {
  '이론': ['음악통론', '재즈화성학', '전통화성학', '리듬트레이닝', '시창청음', '코드청음', '음향이론'],
  '앙상블': ['베이직앙상블', '팝앙상블', '연주앙상블', '재즈앙상블'],
  '실습': ['액팅', '보컬카피클래스', '건반코드초견', '기타코드초견', '송라이팅', '드럼루디먼트', '음향실습'],
}

function fmt만원(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function getDefaultPayrollRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const start = new Date(y, m - 1, 11).toISOString().split('T')[0]
  const end   = new Date(y, m, 10).toISOString().split('T')[0]
  return { start, end }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// ── 공통 컴포넌트 ─────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding: 40 }}>
      <div style={{ width:28, height:28, border:'3px solid #333', borderTopColor:'#c0a060', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Badge({ grade }: { grade: Grade }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:'50%', background: GRADE_COLOR[grade], color:'#111', fontSize:11, fontWeight:800 }}>
      {grade}
    </span>
  )
}

function StatusBadge({ status }: { status: 'submitted' | 'approved' }) {
  return (
    <span style={{
      fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6,
      background: status === 'approved' ? 'rgba(96,176,128,0.2)' : 'rgba(192,160,96,0.15)',
      color: status === 'approved' ? '#60b080' : '#c0a060',
      border: `1px solid ${status === 'approved' ? 'rgba(96,176,128,0.4)' : 'rgba(192,160,96,0.3)'}`,
    }}>
      {status === 'approved' ? '승인됨' : '검토중'}
    </span>
  )
}

const inputStyle: React.CSSProperties = {
  background:'#1a1a1c', border:'1px solid #333', color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%', boxSizing:'border-box',
}

const selectStyle: React.CSSProperties = {
  background:'#1a1a1c', border:'1px solid #333', color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%',
}

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ background:'#141416', borderRadius:'16px 16px 0 0', padding:'20px 16px 36px', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{children}</div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:5 }}>{label}</label>
      {children}
    </div>
  )
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      background:'#c0a060', color:'#111', border:'none', borderRadius:9, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', opacity: loading ? 0.6 : 1, marginTop:4,
    }}>
      {loading ? '저장 중...' : '저장'}
    </button>
  )
}

// ── 메인 대시보드 ─────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [tab, setTab] = useState<string>('today')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const admin = user.email === ADMIN_EMAIL
      setIsAdmin(admin)
      if (!admin) {
        let { data } = await supabase.from('instructors').select('*').eq('user_id', user.id).maybeSingle()
        if (!data && user.email) {
          const { data: byEmail } = await supabase.from('instructors').select('*').eq('email', user.email).is('user_id', null).maybeSingle()
          if (byEmail) {
            await supabase.from('instructors').update({ user_id: user.id }).eq('id', byEmail.id)
            data = { ...byEmail, user_id: user.id }
          }
        }
        if (!data) { router.push('/login'); return }
        setInstructor(data)
        setTab('today')
      } else {
        setTab('approve')
      }
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ background:'#0e0e10', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner />
    </div>
  )

  const instructorTabs = [
    { id:'today',    label:'오늘 수업' },
    { id:'evals',    label:'평가서' },
    { id:'students', label:'내 학생' },
  ]
  const adminTabs = [
    { id:'approve',  label:'승인' },
    { id:'payroll',  label:'급여' },
    { id:'manage',   label:'관리' },
  ]
  const tabs = isAdmin ? adminTabs : instructorTabs

  return (
    <div style={{ background:'#0e0e10', minHeight:'100vh', color:'#e8e4d8', fontFamily:'system-ui, sans-serif', paddingBottom: 80 }}>
      {/* 헤더 */}
      <div style={{ background:'#141416', borderBottom:'1px solid #222', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'#e8e4d8', letterSpacing:-0.5 }}>KH Music</div>
          {instructor && (
            <div style={{ fontSize:11, color:'#888', marginTop:1, display:'flex', alignItems:'center', gap:5 }}>
              <Badge grade={instructor.grade} />
              <span>{instructor.name} 강사님</span>
            </div>
          )}
          {isAdmin && <div style={{ fontSize:11, color:'#c0a060', marginTop:1 }}>관리자</div>}
        </div>
        <button onClick={handleLogout} style={{ background:'none', border:'1px solid #333', color:'#888', borderRadius:7, padding:'5px 12px', fontSize:12, cursor:'pointer' }}>
          로그아웃
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {!isAdmin && instructor && (
          <>
            {tab === 'today'    && <TodayView    instructor={instructor} />}
            {tab === 'evals'    && <EvalsView    instructor={instructor} />}
            {tab === 'students' && <StudentsView instructor={instructor} />}
          </>
        )}
        {isAdmin && (
          <>
            {tab === 'approve' && <ApproveView />}
            {tab === 'payroll' && <PayrollView />}
            {tab === 'manage'  && <ManageView />}
          </>
        )}
      </div>

      {/* 하단 탭바 */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#141416', borderTop:'1px solid #222', display:'flex', zIndex:100 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, background:'none', border:'none', padding:'10px 4px 14px', cursor:'pointer',
            color: tab === t.id ? '#c0a060' : '#666', fontSize:12, fontWeight: tab === t.id ? 700 : 400,
            borderTop: tab === t.id ? '2px solid #c0a060' : '2px solid transparent',
          }}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 강사: 오늘 수업 ───────────────────────────────────────────

type TodayItem =
  | { kind: 'individual'; assignment: Assignment & { student: Student } }
  | { kind: 'group'; group: GroupClass }

interface EvalFormState {
  attended: boolean
  content: string
  next_goal: string
  date: string
  student_id?: string
  group_id?: string
  lesson_type: LessonType
}

function TodayView({ instructor }: { instructor: Instructor }) {
  const [items, setItems] = useState<TodayItem[]>([])
  const [evals, setEvals] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<EvalFormState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const todayDow = new Date().getDay()

  const loadData = useCallback(async () => {
    setLoading(true)
    const today = todayStr()
    const [asRes, gcRes, evRes] = await Promise.all([
      supabase.from('assignments').select('*, student:students(*)').eq('instructor_id', instructor.id).eq('is_active', true).eq('day_of_week', todayDow),
      supabase.from('group_classes').select('*').eq('instructor_id', instructor.id).eq('is_active', true).eq('day_of_week', todayDow),
      supabase.from('evaluations').select('*').eq('instructor_id', instructor.id).eq('date', today),
    ])
    const todayItems: TodayItem[] = [
      ...(asRes.data ?? []).map((a: any) => ({ kind: 'individual' as const, assignment: a })),
      ...(gcRes.data ?? []).map((g: any) => ({ kind: 'group' as const, group: g })),
    ]
    todayItems.sort((a, b) => {
      const aTime = (a.kind === 'individual' ? a.assignment.start_time : a.group.start_time) ?? '99:99'
      const bTime = (b.kind === 'individual' ? b.assignment.start_time : b.group.start_time) ?? '99:99'
      return aTime.localeCompare(bTime)
    })
    setItems(todayItems)
    setEvals(evRes.data ?? [])
    setLoading(false)
  }, [instructor.id, todayDow])

  useEffect(() => { loadData() }, [loadData])

  function getEvalForItem(item: TodayItem): Evaluation | undefined {
    if (item.kind === 'individual') return evals.find(e => e.student_id === item.assignment.student_id)
    return evals.find(e => e.group_id === item.group.id)
  }

  function openForm(item: TodayItem) {
    const existing = getEvalForItem(item)
    if (existing) return
    const id = item.kind === 'individual' ? item.assignment.id : item.group.id
    if (expandedId === id) { setExpandedId(null); setForm(null); return }
    setExpandedId(id)
    if (item.kind === 'individual') {
      setForm({ attended:true, content:'', next_goal:'', date:todayStr(), student_id:item.assignment.student_id, lesson_type:item.assignment.lesson_type })
    } else {
      setForm({ attended:true, content:'', next_goal:'', date:todayStr(), group_id:item.group.id, lesson_type:'단체' })
    }
  }

  async function submitEval() {
    if (!form) return
    if (!form.content.trim()) { setError('수업 내용을 입력해주세요'); return }
    setSubmitting(true); setError('')
    const { error: err } = await supabase.from('evaluations').insert({
      instructor_id: instructor.id, date: form.date, lesson_type: form.lesson_type,
      student_id: form.student_id ?? null, attended: form.student_id ? form.attended : null,
      group_id: form.group_id ?? null, content: form.content.trim(),
      next_goal: form.next_goal.trim() || null, status: 'submitted',
    })
    if (err) { setError('저장 실패: ' + err.message); setSubmitting(false); return }
    setExpandedId(null); setForm(null)
    await loadData()
    setSubmitting(false)
  }

  if (loading) return <Spinner />

  const today = new Date()
  const dateLabel = `${today.getMonth()+1}월 ${today.getDate()}일 (${DAYS[today.getDay()]})`

  return (
    <div style={{ padding:'18px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800 }}>오늘 수업</div>
          <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{dateLabel}</div>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ background:'#c0a060', color:'#111', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + 수업 추가
        </button>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>
          오늘 정규 스케줄이 없어요
          <div style={{ marginTop:8, fontSize:12, color:'#444' }}>추가 버튼으로 수업을 기록할 수 있어요</div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {items.map(item => {
          const id = item.kind === 'individual' ? item.assignment.id : item.group.id
          const evalDone = getEvalForItem(item)
          const isExpanded = expandedId === id

          return (
            <div key={id} style={{ background:'#141416', borderRadius:12, border:`1px solid ${evalDone ? '#2a3a2a' : '#222'}`, overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  {item.kind === 'individual' ? (
                    <>
                      <div style={{ fontSize:15, fontWeight:700 }}>{item.assignment.student?.name}</div>
                      <div style={{ fontSize:11, color:'#888', marginTop:2 }}>
                        {item.assignment.lesson_type}
                        {item.assignment.start_time && <span style={{ marginLeft:6 }}>{item.assignment.start_time.slice(0,5)}</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize:15, fontWeight:700 }}>{item.group.name}</div>
                      <div style={{ fontSize:11, color:'#888', marginTop:2 }}>
                        단체수업
                        {item.group.start_time && <span style={{ marginLeft:6 }}>{item.group.start_time.slice(0,5)}</span>}
                      </div>
                    </>
                  )}
                </div>
                {evalDone ? (
                  <StatusBadge status={evalDone.status} />
                ) : (
                  <button onClick={() => openForm(item)} style={{
                    background: isExpanded ? '#1e2a1e' : '#1a1a1c',
                    border: `1px solid ${isExpanded ? '#60b080' : '#333'}`,
                    color: isExpanded ? '#60b080' : '#aaa',
                    borderRadius:8, padding:'6px 13px', fontSize:12, fontWeight:600, cursor:'pointer',
                  }}>
                    {isExpanded ? '취소' : '수업 기록'}
                  </button>
                )}
              </div>

              {isExpanded && form && (
                <div style={{ borderTop:'1px solid #222', padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:4 }}>날짜</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => f && ({ ...f, date:e.target.value }))} style={inputStyle} />
                  </div>
                  {form.student_id && (
                    <div>
                      <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:6 }}>출석</label>
                      <div style={{ display:'flex', gap:8 }}>
                        {[true, false].map(v => (
                          <button key={String(v)} onClick={() => setForm(f => f && ({ ...f, attended: v }))} style={{
                            flex:1, padding:'8px', borderRadius:8,
                            border:`1px solid ${form.attended===v ? (v ? '#60b080' : '#e07060') : '#333'}`,
                            background: form.attended===v ? (v ? 'rgba(96,176,128,0.15)' : 'rgba(224,112,96,0.15)') : '#1a1a1c',
                            color: form.attended===v ? (v ? '#60b080' : '#e07060') : '#666',
                            fontSize:13, fontWeight:700, cursor:'pointer',
                          }}>
                            {v ? '출석' : '결석'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:4 }}>수업 내용 <span style={{ color:'#e07060' }}>*</span></label>
                    <textarea value={form.content} onChange={e => setForm(f => f && ({ ...f, content:e.target.value }))}
                      placeholder="오늘 수업에서 다룬 내용을 작성해주세요" rows={3}
                      style={{ background:'#1a1a1c', border:'1px solid #333', color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:4 }}>다음 목표</label>
                    <textarea value={form.next_goal} onChange={e => setForm(f => f && ({ ...f, next_goal:e.target.value }))}
                      placeholder="다음 수업 목표 (선택)" rows={2}
                      style={{ background:'#1a1a1c', border:'1px solid #333', color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
                  </div>
                  {error && <div style={{ color:'#e07060', fontSize:12 }}>{error}</div>}
                  <button onClick={submitEval} disabled={submitting} style={{
                    background:'#c0a060', color:'#111', border:'none', borderRadius:9, padding:'11px', fontSize:14, fontWeight:800, cursor:'pointer', opacity: submitting ? 0.6 : 1,
                  }}>
                    {submitting ? '저장 중...' : '평가서 제출'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAddModal && (
        <AddEvalModal instructorId={instructor.id} onClose={() => setShowAddModal(false)} onDone={() => { setShowAddModal(false); loadData() }} />
      )}
    </div>
  )
}

// ── 수업 추가 모달 ─────────────────────────────────────────────

function AddEvalModal({ instructorId, onClose, onDone }: { instructorId: string; onClose: () => void; onDone: () => void }) {
  const [assignments, setAssignments] = useState<{ studentId:string; studentName:string; lessonType:LessonType }[]>([])
  const [kind, setKind] = useState<'individual' | 'group'>('individual')
  const [studentId, setStudentId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [lessonType, setLessonType] = useState<LessonType>('전공')
  const [attended, setAttended] = useState(true)
  const [content, setContent] = useState('')
  const [nextGoal, setNextGoal] = useState('')
  const [date, setDate] = useState(todayStr())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const uniqueStudents = assignments.reduce<{ id:string; name:string }[]>((acc, a) => {
    if (!acc.find(s => s.id === a.studentId)) acc.push({ id:a.studentId, name:a.studentName })
    return acc
  }, [])

  const availableLessonTypes = assignments.filter(a => a.studentId === studentId).map(a => a.lessonType)

  useEffect(() => {
    supabase.from('assignments').select('student:students(id,name), lesson_type').eq('instructor_id', instructorId).eq('is_active', true)
      .then(({ data }) => {
        setAssignments((data ?? []).map((d: any) => ({ studentId:d.student.id, studentName:d.student.name, lessonType:d.lesson_type })))
      })
  }, [instructorId])

  useEffect(() => {
    if (kind === 'individual' && studentId) {
      const types = assignments.filter(a => a.studentId === studentId).map(a => a.lessonType)
      if (types.length >= 1) setLessonType(types[0])
    }
    if (kind === 'group') setLessonType('단체')
  }, [kind, studentId, assignments])

  async function submit() {
    if (kind === 'individual' && !studentId) { setError('학생을 선택해주세요'); return }
    if (kind === 'group' && !groupName) { setError('수업을 선택해주세요'); return }
    if (!content.trim()) { setError('수업 내용을 입력해주세요'); return }
    setSubmitting(true); setError('')
    const { error: err } = await supabase.from('evaluations').insert({
      instructor_id: instructorId, date, lesson_type: kind === 'group' ? '단체' : lessonType,
      student_id: kind === 'individual' ? studentId : null, attended: kind === 'individual' ? attended : null,
      group_id: null, group_name: kind === 'group' ? groupName : null,
      content: content.trim(), next_goal: nextGoal.trim() || null, status: 'submitted',
    })
    if (err) { setError('저장 실패: ' + err.message); setSubmitting(false); return }
    onDone()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ background:'#141416', borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>수업 추가</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {(['individual','group'] as const).map(k => (
            <button key={k} onClick={() => setKind(k)} style={{
              flex:1, padding:'9px', borderRadius:8, border:`1px solid ${kind===k ? '#c0a060' : '#333'}`,
              background: kind===k ? 'rgba(192,160,96,0.15)' : '#1a1a1c',
              color: kind===k ? '#c0a060' : '#666', fontSize:13, fontWeight:700, cursor:'pointer',
            }}>
              {k === 'individual' ? '개인 레슨' : '단체 수업'}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <FormField label="날짜">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </FormField>
          {kind === 'individual' && (
            <>
              <FormField label="학생 *">
                <select value={studentId} onChange={e => setStudentId(e.target.value)} style={selectStyle}>
                  <option value="">선택하세요</option>
                  {uniqueStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormField>
              {studentId && (
                <FormField label="수업 종류">
                  {availableLessonTypes.length === 1 ? (
                    <div style={{ ...inputStyle, color:'#c0a060', fontWeight:700 }}>{availableLessonTypes[0]}</div>
                  ) : (
                    <select value={lessonType} onChange={e => setLessonType(e.target.value as LessonType)} style={selectStyle}>
                      {availableLessonTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </FormField>
              )}
              <FormField label="출석">
                <div style={{ display:'flex', gap:8 }}>
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setAttended(v)} style={{
                      flex:1, padding:'8px', borderRadius:8,
                      border:`1px solid ${attended===v ? (v ? '#60b080' : '#e07060') : '#333'}`,
                      background: attended===v ? (v ? 'rgba(96,176,128,0.15)' : 'rgba(224,112,96,0.15)') : '#1a1a1c',
                      color: attended===v ? (v ? '#60b080' : '#e07060') : '#666',
                      fontSize:13, fontWeight:700, cursor:'pointer',
                    }}>
                      {v ? '출석' : '결석'}
                    </button>
                  ))}
                </div>
              </FormField>
            </>
          )}
          {kind === 'group' && (
            <FormField label="수업 *">
              <select value={groupName} onChange={e => setGroupName(e.target.value)} style={selectStyle}>
                <option value="">선택하세요</option>
                {Object.entries(GROUP_CLASS_CATEGORIES).map(([cat, classes]) => (
                  <optgroup key={cat} label={cat}>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="수업 내용 *">
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="오늘 수업에서 다룬 내용" rows={3}
              style={{ background:'#1a1a1c', border:'1px solid #333', color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
          </FormField>
          <FormField label="다음 목표">
            <textarea value={nextGoal} onChange={e => setNextGoal(e.target.value)} placeholder="다음 수업 목표 (선택)" rows={2}
              style={{ background:'#1a1a1c', border:'1px solid #333', color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
          </FormField>
          {error && <div style={{ color:'#e07060', fontSize:12 }}>{error}</div>}
          <button onClick={submit} disabled={submitting} style={{
            background:'#c0a060', color:'#111', border:'none', borderRadius:9, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer', opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? '저장 중...' : '평가서 제출'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 강사: 평가서 목록 ─────────────────────────────────────────

function EvalsView({ instructor }: { instructor: Instructor }) {
  const [evals, setEvals] = useState<(Evaluation & { student?: Student; group?: GroupClass })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('evaluations')
      .select('*, student:students(name), group:group_classes(name)')
      .eq('instructor_id', instructor.id)
      .order('date', { ascending:false })
      .limit(60)
      .then(({ data }) => { setEvals(data ?? []); setLoading(false) })
  }, [instructor.id])

  if (loading) return <Spinner />

  return (
    <div style={{ padding:'18px 16px' }}>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:16 }}>평가서 목록</div>
      {evals.length === 0 && <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>아직 작성한 평가서가 없어요</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {evals.map(ev => (
          <div key={ev.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:14, fontWeight:700 }}>{(ev.student as any)?.name ?? ev.group_name ?? (ev.group as any)?.name}</span>
                <span style={{ fontSize:10, color:'#888', background:'#1e1e20', padding:'2px 6px', borderRadius:4 }}>{ev.lesson_type}</span>
              </div>
              <StatusBadge status={ev.status} />
            </div>
            <div style={{ fontSize:11, color:'#666', marginBottom:6 }}>
              {ev.date}
              {ev.student_id && <span style={{ marginLeft:8, color: ev.attended ? '#60b080' : '#e07060' }}>{ev.attended ? '출석' : '결석'}</span>}
            </div>
            <div style={{ fontSize:12, color:'#aaa', lineHeight:1.5 }}>{ev.content}</div>
            {ev.next_goal && <div style={{ fontSize:11, color:'#888', marginTop:5 }}>다음: {ev.next_goal}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 강사: 내 학생 ─────────────────────────────────────────────

function StudentsView({ instructor }: { instructor: Instructor }) {
  const [assignments, setAssignments] = useState<(Assignment & { student: Student })[]>([])
  const [groups, setGroups] = useState<(GroupClass & { group_students: { student: Student }[] })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('assignments').select('*, student:students(*)').eq('instructor_id', instructor.id).eq('is_active', true),
      supabase.from('group_classes').select('*, group_students(student:students(*))').eq('instructor_id', instructor.id).eq('is_active', true),
    ]).then(([asRes, gcRes]) => {
      setAssignments((asRes.data ?? []) as any)
      setGroups((gcRes.data ?? []) as any)
      setLoading(false)
    })
  }, [instructor.id])

  if (loading) return <Spinner />

  return (
    <div style={{ padding:'18px 16px' }}>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:16 }}>내 학생</div>
      <div style={{ fontSize:12, color:'#888', fontWeight:700, marginBottom:8 }}>개인 레슨 ({assignments.length}명)</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
        {assignments.map(a => (
          <div key={a.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>{(a.student as any)?.name}</div>
              {(a.student as any)?.phone && <div style={{ fontSize:11, color:'#666', marginTop:1 }}>{(a.student as any).phone}</div>}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, color:'#c0a060', fontWeight:600 }}>{a.lesson_type}</div>
              {a.day_of_week != null && <div style={{ fontSize:11, color:'#666', marginTop:2 }}>{DAYS[a.day_of_week]} {a.start_time?.slice(0,5)}</div>}
            </div>
          </div>
        ))}
        {assignments.length === 0 && <div style={{ color:'#555', fontSize:13, padding:'8px 0' }}>배정된 학생이 없어요</div>}
      </div>
      <div style={{ fontSize:12, color:'#888', fontWeight:700, marginBottom:8 }}>단체수업 ({groups.length}개)</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {groups.map(g => (
          <div key={g.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', padding:'12px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:14, fontWeight:700 }}>{g.name}</div>
              {g.day_of_week != null && <div style={{ fontSize:11, color:'#888' }}>{DAYS[g.day_of_week]} {g.start_time?.slice(0,5)}</div>}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {g.group_students?.map(gs => (
                <span key={(gs.student as any).id} style={{ background:'#1e1e20', border:'1px solid #333', borderRadius:6, padding:'3px 9px', fontSize:12, color:'#bbb' }}>{(gs.student as any).name}</span>
              ))}
              {(!g.group_students || g.group_students.length === 0) && <span style={{ fontSize:12, color:'#555' }}>학생 없음</span>}
            </div>
          </div>
        ))}
        {groups.length === 0 && <div style={{ color:'#555', fontSize:13, padding:'8px 0' }}>담당 단체수업이 없어요</div>}
      </div>
    </div>
  )
}

// ── 어드민: 평가서 승인 ───────────────────────────────────────

function ApproveView() {
  const [evals, setEvals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'submitted' | 'approved' | 'all'>('submitted')
  const [approving, setApproving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('evaluations')
      .select('*, instructor:instructors(name,grade), student:students(name), group:group_classes(name)')
      .order('date', { ascending:false }).limit(100)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setEvals(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function approve(id: string) {
    setApproving(id)
    await supabase.from('evaluations').update({ status:'approved', approved_at:new Date().toISOString() }).eq('id', id)
    await load()
    setApproving(null)
  }

  return (
    <div style={{ padding:'18px 16px' }}>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:14 }}>평가서 승인</div>
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {(['submitted','approved','all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 13px', borderRadius:7, border:`1px solid ${filter===f ? '#c0a060' : '#333'}`,
            background: filter===f ? 'rgba(192,160,96,0.15)' : '#141416',
            color: filter===f ? '#c0a060' : '#666', fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
            {f === 'submitted' ? '검토중' : f === 'approved' ? '승인됨' : '전체'}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {evals.length === 0 && <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>평가서가 없어요</div>}
          {evals.map(ev => (
            <div key={ev.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', padding:'13px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {ev.instructor && <Badge grade={ev.instructor.grade as Grade} />}
                  <span style={{ fontSize:14, fontWeight:700 }}>{ev.instructor?.name}</span>
                  <span style={{ fontSize:12, color:'#888' }}>→ {ev.student?.name ?? ev.group_name ?? ev.group?.name}</span>
                </div>
                {ev.status === 'approved' ? (
                  <StatusBadge status="approved" />
                ) : (
                  <button onClick={() => approve(ev.id)} disabled={approving === ev.id} style={{
                    background:'#c0a060', color:'#111', border:'none', borderRadius:7, padding:'5px 13px', fontSize:12, fontWeight:700, cursor:'pointer', opacity: approving===ev.id ? 0.6 : 1,
                  }}>
                    {approving === ev.id ? '...' : '승인'}
                  </button>
                )}
              </div>
              <div style={{ fontSize:11, color:'#666', marginBottom:6 }}>
                {ev.date} · {ev.lesson_type}
                {ev.student_id && <span style={{ marginLeft:8, color: ev.attended ? '#60b080' : '#e07060' }}>{ev.attended ? '출석' : '결석'}</span>}
              </div>
              <div style={{ fontSize:12, color:'#aaa', lineHeight:1.5 }}>{ev.content}</div>
              {ev.next_goal && <div style={{ fontSize:11, color:'#666', marginTop:4 }}>다음: {ev.next_goal}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 어드민: 급여 정산 ─────────────────────────────────────────

interface PayrollLine { lesson_type: LessonType; count: number; rate: number; subtotal: number }
interface InstructorPayroll {
  instructor: Instructor
  lines: PayrollLine[]
  total_before: number
  tax: number
  total_after: number
}

function PayrollView() {
  const range = getDefaultPayrollRange()
  const [startDate, setStartDate] = useState(range.start)
  const [endDate, setEndDate]     = useState(range.end)
  const [payrolls, setPayrolls]   = useState<InstructorPayroll[]>([])
  const [loading, setLoading]     = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [calculated, setCalculated] = useState(false)

  async function calculate() {
    setLoading(true)
    const [evRes, instrRes, rateRes] = await Promise.all([
      supabase.from('evaluations').select('*').eq('status','approved').gte('date', startDate).lte('date', endDate),
      supabase.from('instructors').select('*').eq('is_active', true),
      supabase.from('grade_rates').select('*'),
    ])
    const allEvals: Evaluation[]   = evRes.data ?? []
    const instructors: Instructor[] = instrRes.data ?? []
    const rates: GradeRate[]       = rateRes.data ?? []
    const rateMap = new Map<string, number>()
    rates.forEach(r => rateMap.set(`${r.grade}:${r.lesson_type}`, r.rate))

    const result: InstructorPayroll[] = []
    for (const instr of instructors) {
      const myEvals = allEvals.filter(e => {
        if (e.instructor_id !== instr.id) return false
        if (e.student_id && e.attended === false) return false
        return true
      })
      if (myEvals.length === 0) continue
      const counts = new Map<LessonType, number>()
      for (const ev of myEvals) counts.set(ev.lesson_type, (counts.get(ev.lesson_type) ?? 0) + 1)
      const lines: PayrollLine[] = []
      counts.forEach((count, lt) => {
        const rate = rateMap.get(`${instr.grade}:${lt}`) ?? 0
        lines.push({ lesson_type:lt, count, rate, subtotal:count*rate })
      })
      lines.sort((a, b) => LESSON_TYPES.indexOf(a.lesson_type) - LESSON_TYPES.indexOf(b.lesson_type))
      const total_before = lines.reduce((s, l) => s + l.subtotal, 0)
      const tax = Math.round(total_before * 0.033)
      result.push({ instructor:instr, lines, total_before, tax, total_after:total_before - tax })
    }
    result.sort((a, b) => b.total_before - a.total_before)
    setPayrolls(result)
    setCalculated(true)
    setLoading(false)
  }

  return (
    <div style={{ padding:'18px 16px' }}>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:16 }}>급여 정산</div>
      <div style={{ background:'#141416', borderRadius:12, border:'1px solid #222', padding:'14px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:4 }}>시작</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:4 }}>종료</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={calculate} disabled={loading} style={{
            background:'#c0a060', color:'#111', border:'none', borderRadius:8, padding:'9px 16px',
            fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? '계산중' : '정산'}
          </button>
        </div>
      </div>

      {payrolls.length > 0 && (
        <>
          <div style={{ background:'rgba(192,160,96,0.1)', border:'1px solid rgba(192,160,96,0.3)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#c0a060', fontWeight:700, marginBottom:8 }}>
              전체 급여 합계 · {startDate} ~ {endDate}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:12, color:'#888' }}>세전 합계</span>
              <span style={{ fontSize:13, fontWeight:600 }}>{fmt만원(payrolls.reduce((s,p) => s+p.total_before, 0))}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:'#888' }}>원천징수(3.3%)</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#e07060' }}>-{fmt만원(payrolls.reduce((s,p) => s+p.tax, 0))}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:6, borderTop:'1px solid rgba(192,160,96,0.2)' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#c0a060' }}>지급 합계</span>
              <span style={{ fontSize:15, fontWeight:800, color:'#c0a060' }}>{fmt만원(payrolls.reduce((s,p) => s+p.total_after, 0))}</span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {payrolls.map(p => (
              <div key={p.instructor.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', overflow:'hidden' }}>
                <div onClick={() => setExpanded(expanded === p.instructor.id ? null : p.instructor.id)}
                  style={{ padding:'13px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Badge grade={p.instructor.grade} />
                    <span style={{ fontSize:14, fontWeight:700 }}>{p.instructor.name}</span>
                    <span style={{ fontSize:11, color:'#666' }}>{p.lines.reduce((s,l) => s+l.count, 0)}회</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#c0a060' }}>{fmt만원(p.total_after)}</div>
                    <div style={{ fontSize:10, color:'#666' }}>세후</div>
                  </div>
                </div>
                {expanded === p.instructor.id && (
                  <div style={{ borderTop:'1px solid #222', padding:'12px 14px', background:'#111113' }}>
                    {p.lines.map(l => (
                      <div key={l.lesson_type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0' }}>
                        <span style={{ fontSize:12, color:'#aaa', width:50 }}>{l.lesson_type}</span>
                        <span style={{ fontSize:12, color:'#888' }}>{l.count}회 × {fmt만원(l.rate)}</span>
                        <span style={{ fontSize:12, fontWeight:600 }}>{fmt만원(l.subtotal)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop:'1px solid #222', marginTop:8, paddingTop:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#888', marginBottom:3 }}>
                        <span>세전</span><span>{fmt만원(p.total_before)}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#e07060', marginBottom:3 }}>
                        <span>원천징수(3.3%)</span><span>-{fmt만원(p.tax)}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:800, color:'#c0a060', marginTop:6 }}>
                        <span>지급액(세후)</span><span>{fmt만원(p.total_after)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {!loading && calculated && payrolls.length === 0 && (
        <div style={{ textAlign:'center', color:'#555', padding:'30px 0', fontSize:13 }}>해당 기간에 승인된 수업이 없어요</div>
      )}
      {!loading && !calculated && (
        <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>기간을 설정하고 정산 버튼을 눌러주세요</div>
      )}
    </div>
  )
}

// ── 어드민: 관리 ──────────────────────────────────────────────

type ManageTab = 'instructors' | 'students' | 'assignments' | 'groups' | 'rates'

function ManageView() {
  const [subTab, setSubTab] = useState<ManageTab>('instructors')
  const subTabs: { id: ManageTab; label: string }[] = [
    { id:'instructors', label:'강사' },
    { id:'students',    label:'학생' },
    { id:'assignments', label:'배정' },
    { id:'groups',      label:'단체' },
    { id:'rates',       label:'단가' },
  ]
  return (
    <div style={{ padding:'18px 16px' }}>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:14 }}>관리</div>
      <div style={{ display:'flex', gap:6, marginBottom:18, overflowX:'auto', paddingBottom:4 }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            padding:'6px 14px', borderRadius:7, border:`1px solid ${subTab===t.id ? '#c0a060' : '#333'}`,
            background: subTab===t.id ? 'rgba(192,160,96,0.15)' : '#141416',
            color: subTab===t.id ? '#c0a060' : '#888', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
          }}>
            {t.label}
          </button>
        ))}
      </div>
      {subTab === 'instructors'  && <InstructorsManage />}
      {subTab === 'students'     && <StudentsManage />}
      {subTab === 'assignments'  && <AssignmentsManage />}
      {subTab === 'groups'       && <GroupsManage />}
      {subTab === 'rates'        && <RatesManage />}
    </div>
  )
}

// ── 강사 관리 ──────────────────────────────────────────────────

function InstructorsManage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState<Instructor | null>(null)
  const [form, setForm]               = useState({ name:'', phone:'', email:'', grade:'B' as Grade })
  const [saving, setSaving]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('instructors').select('*').order('name')
    setInstructors(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() { setEditing(null); setForm({ name:'', phone:'', email:'', grade:'B' }); setShowForm(true) }
  function openEdit(i: Instructor) { setEditing(i); setForm({ name:i.name, phone:i.phone, email:i.email??'', grade:i.grade }); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    if (!form.phone.trim()) return
    if (!form.email.trim()) { alert('이메일을 입력해주세요'); return }
    setSaving(true)
    if (editing) {
      await supabase.from('instructors').update({ name:form.name, phone:form.phone, email:form.email, grade:form.grade }).eq('id', editing.id)
    } else {
      await supabase.from('instructors').insert({ name:form.name, phone:form.phone, email:form.email, grade:form.grade })
      const { data: { user } } = await supabase.auth.getUser()
      await fetch('/api/create-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, callerEmail: user?.email }),
      })
    }
    await load(); setSaving(false); setShowForm(false)
  }

  async function toggleActive(i: Instructor) {
    await supabase.from('instructors').update({ is_active:!i.is_active }).eq('id', i.id)
    await load()
  }

  async function deleteInstructor(i: Instructor) {
    if (!confirm(`${i.name} 강사를 삭제할까요?`)) return
    await supabase.from('instructors').delete().eq('id', i.id)
    await load()
  }

  async function resetPassword(i: Instructor) {
    if (!i.email) { alert('이메일이 없어요'); return }
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/create-instructor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: i.email, callerEmail: user?.email }),
    })
    const json = await res.json()
    if (json.ok) alert(`${i.name} 강사님 계정 비밀번호가 kh1234로 설정됐어요`)
    else alert('실패: ' + json.error)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button onClick={openNew} style={{ background:'#c0a060', color:'#111', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ 강사 추가</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {instructors.map(i => (
          <div key={i.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', opacity: i.is_active ? 1 : 0.5 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Badge grade={i.grade} />
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>{i.name}</div>
                <div style={{ fontSize:11, color:'#666', marginTop:1 }}>{i.phone}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:7 }}>
              <button onClick={() => openEdit(i)} style={{ background:'#1e1e22', border:'1px solid #333', color:'#aaa', borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer' }}>수정</button>
              <button onClick={() => resetPassword(i)} style={{ background:'#1e1e22', border:'1px solid #333', color:'#7090e0', borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer' }}>비번</button>
              <button onClick={() => toggleActive(i)} style={{ background:'#1e1e22', border:'1px solid #333', color: i.is_active ? '#e07060' : '#60b080', borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer' }}>
                {i.is_active ? '비활성' : '활성'}
              </button>
              <button onClick={() => deleteInstructor(i)} style={{ background:'#1e1e22', border:'1px solid #e07060', color:'#e07060', borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer' }}>삭제</button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <BottomSheet title={editing ? '강사 수정' : '강사 추가'} onClose={() => setShowForm(false)}>
          <FormField label="이름 *"><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inputStyle} placeholder="강사명" /></FormField>
          <FormField label="연락처 *"><input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} style={inputStyle} placeholder="010-0000-0000" /></FormField>
          <FormField label="이메일 *"><input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} style={inputStyle} placeholder="예: hong@gmail.com" /></FormField>
          <FormField label="코드">
            <div style={{ display:'flex', gap:6 }}>
              {GRADES.map(g => (
                <button key={g} onClick={() => setForm(f=>({...f,grade:g}))} style={{
                  flex:1, padding:'8px', borderRadius:8, border:`1px solid ${form.grade===g ? GRADE_COLOR[g] : '#333'}`,
                  background: form.grade===g ? `${GRADE_COLOR[g]}22` : '#1a1a1c',
                  color: form.grade===g ? GRADE_COLOR[g] : '#666', fontSize:13, fontWeight:700, cursor:'pointer',
                }}>
                  {g}
                </button>
              ))}
            </div>
          </FormField>
          <SaveButton onClick={save} loading={saving} />
        </BottomSheet>
      )}
    </div>
  )
}

// ── 학생 관리 ──────────────────────────────────────────────────

function StudentsManage() {
  const [students, setStudents]   = useState<Student[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Student | null>(null)
  const [form, setForm]           = useState({ name:'', phone:'' })
  const [saving, setSaving]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('students').select('*').order('name')
    setStudents(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() { setEditing(null); setForm({ name:'', phone:'' }); setShowForm(true) }
  function openEdit(s: Student) { setEditing(s); setForm({ name:s.name, phone:s.phone??'' }); setShowForm(true) }

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('students').update({ name:form.name, phone:form.phone||null }).eq('id', editing.id)
    } else {
      await supabase.from('students').insert({ name:form.name, phone:form.phone||null })
    }
    await load(); setSaving(false); setShowForm(false)
  }

  async function toggleActive(s: Student) {
    await supabase.from('students').update({ is_active:!s.is_active }).eq('id', s.id)
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button onClick={openNew} style={{ background:'#c0a060', color:'#111', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ 학생 추가</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {students.map(s => (
          <div key={s.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', opacity: s.is_active ? 1 : 0.5 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>{s.name}</div>
              {s.phone && <div style={{ fontSize:11, color:'#666', marginTop:1 }}>{s.phone}</div>}
            </div>
            <div style={{ display:'flex', gap:7 }}>
              <button onClick={() => openEdit(s)} style={{ background:'#1e1e22', border:'1px solid #333', color:'#aaa', borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer' }}>수정</button>
              <button onClick={() => toggleActive(s)} style={{ background:'#1e1e22', border:'1px solid #333', color: s.is_active ? '#e07060' : '#60b080', borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer' }}>
                {s.is_active ? '비활성' : '활성'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <BottomSheet title={editing ? '학생 수정' : '학생 추가'} onClose={() => setShowForm(false)}>
          <FormField label="이름 *"><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inputStyle} placeholder="학생명" /></FormField>
          <FormField label="연락처"><input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} style={inputStyle} placeholder="010-0000-0000 (선택)" /></FormField>
          <SaveButton onClick={save} loading={saving} />
        </BottomSheet>
      )}
    </div>
  )
}

// ── 배정 관리 ──────────────────────────────────────────────────

function AssignmentsManage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [students, setStudents]       = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm] = useState({ instructor_id:'', student_id:'', lesson_type:'전공' as LessonType, day_of_week:'', start_time:'' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [asRes, inRes, stRes] = await Promise.all([
      supabase.from('assignments').select('*, instructor:instructors(name,grade), student:students(name)').eq('is_active', true).order('created_at', { ascending:false }),
      supabase.from('instructors').select('id,name,grade').eq('is_active', true).order('name'),
      supabase.from('students').select('id,name').eq('is_active', true).order('name'),
    ])
    setAssignments(asRes.data ?? [])
    setInstructors(inRes.data ?? [])
    setStudents(stRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    await supabase.from('assignments').insert({
      instructor_id: form.instructor_id, student_id: form.student_id, lesson_type: form.lesson_type,
      day_of_week: form.day_of_week !== '' ? parseInt(form.day_of_week) : null,
      start_time: form.start_time || null,
    })
    setForm({ instructor_id:'', student_id:'', lesson_type:'전공', day_of_week:'', start_time:'' })
    await load(); setSaving(false); setShowForm(false)
  }

  async function deactivate(id: string) {
    await supabase.from('assignments').update({ is_active:false }).eq('id', id)
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button onClick={() => setShowForm(true)} style={{ background:'#c0a060', color:'#111', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ 배정 추가</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {assignments.map((a: any) => (
          <div key={a.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <Badge grade={a.instructor?.grade as Grade} />
                <span style={{ fontSize:13, fontWeight:700 }}>{a.instructor?.name}</span>
                <span style={{ fontSize:12, color:'#888' }}>→ {a.student?.name}</span>
              </div>
              <div style={{ fontSize:11, color:'#888' }}>
                {a.lesson_type}
                {a.day_of_week != null && <span style={{ marginLeft:6 }}>{DAYS[a.day_of_week]}</span>}
                {a.start_time && <span style={{ marginLeft:4 }}>{a.start_time.slice(0,5)}</span>}
              </div>
            </div>
            <button onClick={() => deactivate(a.id)} style={{ background:'#1e1e22', border:'1px solid #333', color:'#e07060', borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer' }}>제거</button>
          </div>
        ))}
        {assignments.length === 0 && <div style={{ color:'#555', fontSize:13, textAlign:'center', padding:'30px 0' }}>배정 없음</div>}
      </div>
      {showForm && (
        <BottomSheet title="배정 추가" onClose={() => setShowForm(false)}>
          <FormField label="강사 *">
            <select value={form.instructor_id} onChange={e => setForm(f=>({...f,instructor_id:e.target.value}))} style={selectStyle}>
              <option value="">선택</option>
              {instructors.map(i => <option key={i.id} value={i.id}>[{i.grade}] {i.name}</option>)}
            </select>
          </FormField>
          <FormField label="학생 *">
            <select value={form.student_id} onChange={e => setForm(f=>({...f,student_id:e.target.value}))} style={selectStyle}>
              <option value="">선택</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="수업 종류">
            <select value={form.lesson_type} onChange={e => setForm(f=>({...f,lesson_type:e.target.value as LessonType}))} style={selectStyle}>
              {(['전공','부전공','전문반','취미'] as LessonType[]).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="요일">
            <select value={form.day_of_week} onChange={e => setForm(f=>({...f,day_of_week:e.target.value}))} style={selectStyle}>
              <option value="">미정</option>
              {DAYS.map((d, i) => <option key={i} value={String(i)}>{d}요일</option>)}
            </select>
          </FormField>
          <FormField label="시작 시간">
            <input type="time" value={form.start_time} onChange={e => setForm(f=>({...f,start_time:e.target.value}))} style={inputStyle} />
          </FormField>
          <SaveButton onClick={save} loading={saving} />
        </BottomSheet>
      )}
    </div>
  )
}

// ── 단체수업 관리 ─────────────────────────────────────────────

function GroupsManage() {
  const [groups, setGroups]           = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm] = useState({ name:'', instructor_id:'', day_of_week:'', start_time:'' })
  const [saving, setSaving]           = useState(false)
  const [studentModal, setStudentModal] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [gcRes, inRes, stRes] = await Promise.all([
      supabase.from('group_classes').select('*, instructor:instructors(name,grade), group_students(student:students(*))').eq('is_active', true).order('name'),
      supabase.from('instructors').select('id,name,grade').eq('is_active', true).order('name'),
      supabase.from('students').select('*').eq('is_active', true).order('name'),
    ])
    setGroups(gcRes.data ?? [])
    setInstructors(inRes.data ?? [])
    setAllStudents(stRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveGroup() {
    setSaving(true)
    await supabase.from('group_classes').insert({
      name:form.name, instructor_id:form.instructor_id,
      day_of_week: form.day_of_week !== '' ? parseInt(form.day_of_week) : null,
      start_time: form.start_time || null,
    })
    setForm({ name:'', instructor_id:'', day_of_week:'', start_time:'' })
    await load(); setSaving(false); setShowForm(false)
  }

  async function addStudent(groupId: string, studentId: string) {
    await supabase.from('group_students').insert({ group_id:groupId, student_id:studentId })
    await load()
  }

  async function removeStudent(groupId: string, studentId: string) {
    await supabase.from('group_students').delete().eq('group_id', groupId).eq('student_id', studentId)
    await load()
  }

  async function deactivateGroup(id: string) {
    await supabase.from('group_classes').update({ is_active:false }).eq('id', id)
    await load()
  }

  if (loading) return <Spinner />

  const currentGroup = studentModal ? groups.find((g: any) => g.id === studentModal) : null
  const currentMembers = new Set<string>(currentGroup?.group_students?.map((gs: any) => gs.student.id) ?? [])

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button onClick={() => setShowForm(true)} style={{ background:'#c0a060', color:'#111', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ 단체수업 추가</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {groups.map((g: any) => (
          <div key={g.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>{g.name}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:1 }}>
                  [{g.instructor?.grade}] {g.instructor?.name}
                  {g.day_of_week != null && <span style={{ marginLeft:6 }}>{DAYS[g.day_of_week]}</span>}
                  {g.start_time && <span style={{ marginLeft:4 }}>{g.start_time.slice(0,5)}</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setStudentModal(g.id)} style={{ background:'#1e1e22', border:'1px solid #333', color:'#aaa', borderRadius:7, padding:'5px 10px', fontSize:11, cursor:'pointer' }}>학생</button>
                <button onClick={() => deactivateGroup(g.id)} style={{ background:'#1e1e22', border:'1px solid #333', color:'#e07060', borderRadius:7, padding:'5px 10px', fontSize:11, cursor:'pointer' }}>제거</button>
              </div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {g.group_students?.map((gs: any) => (
                <span key={gs.student.id} style={{ background:'#1e1e20', border:'1px solid #333', borderRadius:6, padding:'2px 8px', fontSize:11, color:'#bbb' }}>{gs.student.name}</span>
              ))}
              {(!g.group_students || g.group_students.length === 0) && <span style={{ fontSize:11, color:'#555' }}>학생 없음</span>}
            </div>
          </div>
        ))}
        {groups.length === 0 && <div style={{ color:'#555', fontSize:13, textAlign:'center', padding:'30px 0' }}>단체수업 없음</div>}
      </div>
      {showForm && (
        <BottomSheet title="단체수업 추가" onClose={() => setShowForm(false)}>
          <FormField label="수업명 *"><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inputStyle} placeholder="예: 초등 앙상블" /></FormField>
          <FormField label="강사 *">
            <select value={form.instructor_id} onChange={e => setForm(f=>({...f,instructor_id:e.target.value}))} style={selectStyle}>
              <option value="">선택</option>
              {instructors.map(i => <option key={i.id} value={i.id}>[{i.grade}] {i.name}</option>)}
            </select>
          </FormField>
          <FormField label="요일">
            <select value={form.day_of_week} onChange={e => setForm(f=>({...f,day_of_week:e.target.value}))} style={selectStyle}>
              <option value="">미정</option>
              {DAYS.map((d, i) => <option key={i} value={String(i)}>{d}요일</option>)}
            </select>
          </FormField>
          <FormField label="시작 시간">
            <input type="time" value={form.start_time} onChange={e => setForm(f=>({...f,start_time:e.target.value}))} style={inputStyle} />
          </FormField>
          <SaveButton onClick={saveGroup} loading={saving} />
        </BottomSheet>
      )}
      {studentModal && currentGroup && (
        <BottomSheet title={`${currentGroup.name} 학생 관리`} onClose={() => setStudentModal(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {allStudents.map(s => {
              const isMember = currentMembers.has(s.id)
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #1e1e20' }}>
                  <span style={{ fontSize:13, color: isMember ? '#e8e4d8' : '#777' }}>{s.name}</span>
                  <button onClick={() => isMember ? removeStudent(currentGroup.id, s.id) : addStudent(currentGroup.id, s.id)} style={{
                    background: isMember ? 'rgba(224,112,96,0.15)' : 'rgba(96,176,128,0.15)',
                    border: `1px solid ${isMember ? 'rgba(224,112,96,0.4)' : 'rgba(96,176,128,0.4)'}`,
                    color: isMember ? '#e07060' : '#60b080',
                    borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer',
                  }}>
                    {isMember ? '제외' : '추가'}
                  </button>
                </div>
              )
            })}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

// ── 단가 관리 ──────────────────────────────────────────────────

function RatesManage() {
  const [rates, setRates]     = useState<GradeRate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ id:string; rate:number } | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('grade_rates').select('*').order('grade').order('lesson_type')
    setRates(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveRate() {
    if (!editing) return
    setSaving(true)
    await supabase.from('grade_rates').update({ rate:editing.rate }).eq('id', editing.id)
    await load(); setSaving(false); setEditing(null)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ fontSize:12, color:'#888', marginBottom:12 }}>셀을 눌러 단가를 수정할 수 있어요 (단위: 원)</div>
      <div style={{ background:'#141416', borderRadius:10, border:'1px solid #222', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'40px repeat(5, 1fr)', background:'#1a1a1c', borderBottom:'1px solid #222' }}>
          <div style={{ padding:'8px 4px' }} />
          {LESSON_TYPES.map(t => (
            <div key={t} style={{ padding:'8px 2px', textAlign:'center', fontSize:10, fontWeight:700, color:'#aaa' }}>{t}</div>
          ))}
        </div>
        {GRADES.map(grade => (
          <div key={grade} style={{ display:'grid', gridTemplateColumns:'40px repeat(5, 1fr)', borderBottom:'1px solid #1a1a1c' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 0' }}>
              <Badge grade={grade} />
            </div>
            {LESSON_TYPES.map(lt => {
              const r = rates.find(r => r.grade === grade && r.lesson_type === lt)
              if (!r) return <div key={lt} />
              const isEd = editing?.id === r.id
              return (
                <div key={lt} onClick={() => !isEd && setEditing({ id:r.id, rate:r.rate })}
                  style={{ padding:'8px 4px', textAlign:'center', cursor:'pointer', background: isEd ? '#1e2230' : 'transparent', borderRadius:4 }}>
                  {isEd ? (
                    <input
                      type="number" value={editing.rate}
                      onChange={e => setEditing(ed => ed && ({ ...ed, rate: parseInt(e.target.value)||0 }))}
                      onBlur={saveRate}
                      onKeyDown={e => { if (e.key==='Enter') saveRate(); if (e.key==='Escape') setEditing(null) }}
                      autoFocus
                      style={{ width:'100%', background:'transparent', border:'none', color:'#c0a060', textAlign:'center', fontSize:11, fontWeight:700, outline:'none' }}
                    />
                  ) : (
                    <div style={{ fontSize:11, color:'#ddd' }}>{(r.rate/10000).toFixed(r.rate%10000 ? 1 : 0)}만</div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {saving && <div style={{ textAlign:'center', fontSize:11, color:'#888', marginTop:8 }}>저장 중...</div>}
    </div>
  )
}
