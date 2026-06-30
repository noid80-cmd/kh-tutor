'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Instructor, Student, Assignment, GroupClass, Evaluation, GradeRate, Grade, LessonType } from '@/lib/supabase'

// ── 상수 ──────────────────────────────────────────────────────

const ADMIN_EMAIL = 'noid80@hanmail.net'
const GRADES: Grade[] = ['S', 'A+', 'A', 'A-', 'B']
const LESSON_TYPES: LessonType[] = ['전공', '오디션', '부전공', '전문반', '취미', '단체', '댄스']
const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const GRADE_COLOR: Record<Grade, string> = { S: '#d4a843', 'A+': '#c0a060', A: '#a88840', 'A-': '#907030', B: '#6a9060' }

const GROUP_CLASS_CATEGORIES: Record<string, string[]> = {
  '이론': ['음악통론', '재즈화성학', '전통화성학', '리듬트레이닝', '시창청음', '코드청음', '음향이론'],
  '앙상블': ['베이직앙상블', '팝앙상블', '연주앙상블', '재즈앙상블'],
  '실습': ['액팅', '보컬카피클래스', '건반코드초견', '기타코드초견', '송라이팅', '드럼루디먼트', '음향실습'],
}

function fmt만원(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function getPayrollRange(payDay: 15 | 25, offset = 0) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + offset
  if (payDay === 15) {
    return {
      start:    localDateStr(new Date(y, m - 1, 11)),
      end:      localDateStr(new Date(y, m,     10)),
      payLabel: `${new Date(y, m, 1).getMonth() + 1}월 15일 지급`,
    }
  } else {
    return {
      start:    localDateStr(new Date(y, m - 1, 21)),
      end:      localDateStr(new Date(y, m,     20)),
      payLabel: `${new Date(y, m, 1).getMonth() + 1}월 25일 지급`,
    }
  }
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function todayStr() {
  return localDateStr(new Date())
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
  const [loading, setLoading]     = useState(true)
  const [isAdmin, setIsAdmin]     = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [tab, setTab] = useState<string>('today')

  useEffect(() => {
    async function initUser(session: { user: { id: string; email?: string | null } }) {
      const user = session.user
      const admin = user.email === ADMIN_EMAIL
      setIsAdmin(admin)
      setUserEmail(user.email ?? '')
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
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (!session) { router.push('/login'); return }
        initUser(session)
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })
    return () => subscription.unsubscribe()
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
    { id:'monthly',  label:'이번달' },
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
            {tab === 'monthly'  && <MonthlyView  instructor={instructor} />}
            {tab === 'students' && <StudentsView instructor={instructor} />}
          </>
        )}
        {isAdmin && (
          <>
            {tab === 'approve' && <ApproveView />}
            {tab === 'payroll' && <PayrollView userEmail={userEmail} />}
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

function TodayView({ instructor }: { instructor: Instructor }) {
  const [evals, setEvals] = useState<Evaluation[]>([])
  const [pendingMakeups, setPendingMakeups] = useState<(Evaluation & { student?: Student })[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const today = todayStr()
      const [evRes, mkRes] = await Promise.all([
        supabase.from('evaluations').select('*, student:students(name)').eq('instructor_id', instructor.id).eq('date', today),
        supabase.from('evaluations').select('*, student:students(name)').eq('instructor_id', instructor.id).eq('makeup_done', false).not('makeup_date', 'is', null),
      ])
      const sorted = (evRes.data ?? []).slice().sort((a: any, b: any) =>
        (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
      )
      setEvals(sorted)
      setPendingMakeups((mkRes.data ?? []) as any)
    } finally {
      setLoading(false)
    }
  }, [instructor.id])

  useEffect(() => { loadData() }, [loadData])

  async function completeMakeup(evalId: string) {
    await supabase.from('evaluations').update({ makeup_done: true }).eq('id', evalId)
    await loadData()
  }

  async function deleteEval(id: string) {
    await supabase.from('evaluations').delete().eq('id', id)
    setConfirmDeleteId(null)
    setExpandedId(null)
    await loadData()
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

      {pendingMakeups.length > 0 && (
        <div style={{ background:'rgba(192,160,96,0.08)', border:'1px solid rgba(192,160,96,0.25)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#c0a060', marginBottom:8 }}>보강 대기 ({pendingMakeups.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {pendingMakeups.map(ev => (
              <div key={ev.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:700 }}>{(ev.student as any)?.name}</span>
                  <span style={{ fontSize:11, color:'#888', marginLeft:6 }}>{ev.lesson_type} · 예정 {ev.makeup_date}</span>
                </div>
                <button onClick={() => completeMakeup(ev.id)} style={{
                  background:'rgba(96,176,128,0.15)', border:'1px solid rgba(96,176,128,0.4)',
                  color:'#60b080', borderRadius:7, padding:'4px 10px', fontSize:11, cursor:'pointer',
                }}>완료</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {evals.length === 0 && (
        <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>
          오늘 진행한 수업을 추가해주세요
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {evals.map(ev => {
          const sName = (ev as any).student?.name ?? ev.group_name ?? '단체 수업'
          const hour = ev.start_time ? parseInt(ev.start_time) : null
          const editable = ev.status === 'submitted'
          const isOpen = expandedId === ev.id
          return (
            <div key={ev.id} style={{ background:'#141416', borderRadius:12, border:`1px solid ${isOpen ? '#3a3a2a' : '#222'}`, overflow:'hidden' }}>
              <button
                onClick={() => setExpandedId(isOpen ? null : ev.id)}
                style={{ width:'100%', background:'none', border:'none', padding:'14px 16px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', textAlign:'left' }}
              >
                <div style={{ minWidth:48, textAlign:'center', flexShrink:0 }}>
                  {hour != null ? (
                    <>
                      <div style={{ fontSize:28, fontWeight:900, color:'#c0a060', lineHeight:1 }}>{hour}</div>
                      <div style={{ fontSize:11, color:'#888', marginTop:1 }}>시</div>
                    </>
                  ) : (
                    <div style={{ fontSize:20, color:'#444', fontWeight:700 }}>-</div>
                  )}
                </div>
                <div style={{ width:1, height:40, background:'#2a2a2a', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'#e8e4d8' }}>{sName}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, color:'#888' }}>{ev.lesson_type}</span>
                    <StatusBadge status={ev.status} />
                    {ev.student_id != null && (
                      <span style={{ fontSize:11, fontWeight:700, color: ev.attended ? '#60b080' : '#e07060' }}>
                        {ev.attended ? '출석' : '결석'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ color:'#555', fontSize:18, flexShrink:0 }}>{isOpen ? '∧' : '∨'}</div>
              </button>

              {isOpen && (
                <div style={{ borderTop:'1px solid #1e1e20', padding:'12px 16px 14px', background:'#111113' }}>
                  <div style={{ fontSize:13, color:'#bbb', lineHeight:1.8, whiteSpace:'pre-wrap', marginBottom: editable ? 12 : 0 }}>{ev.content}</div>
                  {ev.next_goal && (
                    <div style={{ fontSize:12, color:'#666', marginBottom: editable ? 12 : 0, paddingTop:8, borderTop:'1px solid #1e1e20' }}>다음: {ev.next_goal}</div>
                  )}
                  {editable && (
                    confirmDeleteId === ev.id ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, background:'rgba(224,80,80,0.08)', border:'1px solid rgba(224,80,80,0.25)', borderRadius:10, padding:'10px 12px' }}>
                        <div style={{ fontSize:13, color:'#e08080', textAlign:'center' }}>이 수업 기록을 삭제할까요?</div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={e => { e.stopPropagation(); deleteEval(ev.id) }} style={{ flex:1, background:'rgba(200,60,60,0.2)', border:'1px solid rgba(200,60,60,0.5)', color:'#ff8888', borderRadius:8, padding:'9px', fontSize:13, fontWeight:700, cursor:'pointer' }}>삭제</button>
                          <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(null) }} style={{ flex:1, background:'#1e1e20', border:'1px solid #333', color:'#888', borderRadius:8, padding:'9px', fontSize:13, fontWeight:600, cursor:'pointer' }}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={e => { e.stopPropagation(); setEditingEval(ev) }} style={{ flex:1, background:'#1e1e2a', border:'1px solid #3a3a5a', color:'#8888cc', borderRadius:8, padding:'8px', fontSize:13, fontWeight:600, cursor:'pointer' }}>수정</button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(ev.id) }} style={{ flex:1, background:'#2a1a1a', border:'1px solid #5a2a2a', color:'#cc6666', borderRadius:8, padding:'8px', fontSize:13, fontWeight:600, cursor:'pointer' }}>삭제</button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAddModal && (
        <AddEvalModal instructorId={instructor.id} onClose={() => setShowAddModal(false)} onDone={() => { setShowAddModal(false); loadData() }} />
      )}
      {editingEval && (
        <EditEvalModal eval={editingEval} onClose={() => setEditingEval(null)} onDone={() => { setEditingEval(null); loadData() }} />
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
  const [startTime, setStartTime] = useState('')
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
    const isAbsent = kind === 'individual' && !attended
    if (!isAbsent && content.trim().length < 50) { setError(`수업 내용을 50자 이상 작성해주세요 (현재 ${content.trim().length}자)`); return }
    if (!isAbsent && nextGoal.trim().length < 5) { setError('다음 목표를 5자 이상 입력해주세요'); return }
    setSubmitting(true); setError('')
    const { error: err } = await supabase.from('evaluations').insert({
      instructor_id: instructorId, date, start_time: startTime || null, lesson_type: kind === 'group' ? '단체' : lessonType,
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
          <FormField label="시간">
            <select value={startTime} onChange={e => setStartTime(e.target.value)} style={selectStyle}>
              <option value="">-</option>
              {Array.from({length:14}, (_,i) => i+9).map(h => (
                <option key={h} value={`${String(h).padStart(2,'0')}:00`}>{h}시</option>
              ))}
            </select>
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
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <label style={{ fontSize:11, color:'#888' }}>수업 내용 *</label>
              <span style={{ fontSize:11, color: content.trim().length >= 50 ? '#60b080' : '#888' }}>{content.trim().length}/50자</span>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="오늘 수업에서 다룬 내용을 50자 이상 작성해주세요" rows={4}
              style={{ background:'#1a1a1c', border:`1px solid ${content.trim().length >= 50 ? '#3a5a3a' : '#333'}`, color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
          </div>
          <FormField label="다음 목표">
            <textarea value={nextGoal} onChange={e => setNextGoal(e.target.value)} placeholder="다음 수업 목표" rows={2}
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

// ── 수업 수정 모달 ─────────────────────────────────────────────

function EditEvalModal({ eval: ev, onClose, onDone }: { eval: Evaluation; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState(ev.date)
  const [startTime, setStartTime] = useState(ev.start_time ?? '')
  const [attended, setAttended] = useState(ev.attended ?? true)
  const [content, setContent] = useState(ev.content)
  const [nextGoal, setNextGoal] = useState(ev.next_goal ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sName = (ev as any).student?.name ?? ev.group_name ?? '단체 수업'

  async function submit() {
    if (!content.trim()) { setError('수업 내용을 입력해주세요'); return }
    const isAbsent = ev.student_id != null && !attended
    if (!isAbsent && content.trim().length < 50) { setError(`수업 내용을 50자 이상 작성해주세요 (현재 ${content.trim().length}자)`); return }
    if (!isAbsent && nextGoal.trim().length < 5) { setError('다음 목표를 5자 이상 입력해주세요'); return }
    setSubmitting(true); setError('')
    const { error: err } = await supabase.from('evaluations').update({
      date, start_time: startTime || null,
      attended: ev.student_id ? attended : null,
      content: content.trim(),
      next_goal: nextGoal.trim() || null,
    }).eq('id', ev.id)
    if (err) { setError('저장 실패: ' + err.message); setSubmitting(false); return }
    onDone()
  }

  return (
    <BottomSheet title={`수정 · ${sName}`} onClose={onClose}>
      <FormField label="날짜">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
      </FormField>
      <FormField label="시간">
        <select value={startTime} onChange={e => setStartTime(e.target.value)} style={selectStyle}>
          <option value="">-</option>
          {Array.from({length:14}, (_,i) => i+9).map(h => (
            <option key={h} value={`${String(h).padStart(2,'0')}:00`}>{h}시</option>
          ))}
        </select>
      </FormField>
      {ev.student_id != null && (
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
      )}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
          <label style={{ fontSize:11, color:'#888' }}>수업 내용 *</label>
          <span style={{ fontSize:11, color: content.trim().length >= 50 ? '#60b080' : '#888' }}>{content.trim().length}/50자</span>
        </div>
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
          style={{ background:'#1a1a1c', border:`1px solid ${content.trim().length >= 50 ? '#3a5a3a' : '#333'}`, color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
      </div>
      <FormField label="다음 목표">
        <textarea value={nextGoal} onChange={e => setNextGoal(e.target.value)} placeholder="다음 수업 목표" rows={2}
          style={{ background:'#1a1a1c', border:'1px solid #333', color:'#e8e4d8', borderRadius:7, padding:'9px 10px', fontSize:13, width:'100%', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
      </FormField>
      {error && <div style={{ color:'#e07060', fontSize:12 }}>{error}</div>}
      <SaveButton onClick={submit} loading={submitting} />
    </BottomSheet>
  )
}

// ── 강사: 이번달 수업 기록 ────────────────────────────────────

function MonthlyView({ instructor }: { instructor: Instructor }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const [evals, setEvals] = useState<(Evaluation & { student?: Student })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEval, setSelectedEval] = useState<(Evaluation & { student?: Student }) | null>(null)

  useEffect(() => {
    setLoading(true)
    const base = new Date()
    const y = base.getFullYear()
    const m = base.getMonth() + monthOffset
    const fd = localDateStr(new Date(y, m, 1))
    const ld = localDateStr(new Date(y, m + 1, 0))
    supabase.from('evaluations')
      .select('*, student:students(name)')
      .eq('instructor_id', instructor.id)
      .gte('date', fd)
      .lte('date', ld)
      .order('date', { ascending: true })
      .then(({ data }) => { setEvals(data ?? []); setLoading(false) })
  }, [instructor.id, monthOffset])

  const base = new Date()
  const labelDate = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1)
  const monthLabel = `${labelDate.getFullYear()}년 ${labelDate.getMonth() + 1}월`

  type EvalRow = Evaluation & { student?: Student }
  type EvalGroup = { label: string; lessonType: string; items: EvalRow[] }
  const groupMap = new Map<string, EvalGroup>()
  const groupOrder: string[] = []
  for (const ev of evals) {
    const key = ev.student_id ? `${ev.student_id}_${ev.lesson_type}` : `g_${ev.group_name ?? ev.group_id ?? 'etc'}`
    if (!groupMap.has(key)) {
      groupOrder.push(key)
      groupMap.set(key, { label: (ev.student as any)?.name ?? ev.group_name ?? '단체수업', lessonType: ev.lesson_type, items: [] })
    }
    groupMap.get(key)!.items.push(ev)
  }

  const navBtn: React.CSSProperties = { background:'#1a1a1c', border:'1px solid #333', color:'#888', borderRadius:8, padding:'7px 18px', fontSize:20, cursor:'pointer', lineHeight:1 }

  return (
    <div style={{ padding:'18px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <button onClick={() => setMonthOffset(o => o - 1)} style={navBtn}>‹</button>
        <div style={{ fontSize:17, fontWeight:800 }}>{monthLabel}</div>
        <button onClick={() => setMonthOffset(o => o + 1)} style={navBtn}>›</button>
      </div>

      {loading ? <Spinner /> : groupOrder.length === 0 ? (
        <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>이달 작성된 수업 기록이 없어요</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {groupOrder.map(key => {
            const g = groupMap.get(key)!
            const allApproved = g.items.every(e => e.status === 'approved')
            return (
              <div key={key} style={{ background:'#141416', borderRadius:12, border:`1px solid ${allApproved ? '#2a3a2a' : '#222'}`, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:15, fontWeight:700 }}>{g.label}</span>
                    <span style={{ fontSize:10, color:'#888', background:'#1e1e20', padding:'2px 6px', borderRadius:4 }}>{g.lessonType}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {allApproved && <span style={{ fontSize:10, fontWeight:700, color:'#60b080' }}>✓ 전체승인</span>}
                    <span style={{ fontSize:12, color:'#c0a060', fontWeight:700 }}>{g.items.length}회</span>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {g.items.map(ev => {
                    const d = new Date(ev.date + 'T00:00:00')
                    const approved = ev.status === 'approved'
                    const absent = ev.student_id != null && !ev.attended
                    const color = approved ? '#60b080' : absent ? '#e07060' : '#c0a060'
                    return (
                      <button key={ev.id} onClick={() => setSelectedEval(selectedEval?.id === ev.id ? null : ev)} style={{
                        background: approved ? 'rgba(96,176,128,0.15)' : absent ? 'rgba(224,112,96,0.1)' : 'rgba(192,160,96,0.1)',
                        border: `1px solid ${approved ? 'rgba(96,176,128,0.5)' : absent ? 'rgba(224,112,96,0.4)' : 'rgba(192,160,96,0.3)'}`,
                        color, borderRadius:8, padding:'5px 11px', cursor:'pointer',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:1,
                      }}>
                        <span style={{ fontSize:13, fontWeight:700 }}>{d.getMonth() + 1}/{d.getDate()}</span>
                        {ev.start_time && <span style={{ fontSize:10, opacity:0.8 }}>{parseInt(ev.start_time)}시</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedEval && (
        <BottomSheet
          title={`${(selectedEval.student as any)?.name ?? (selectedEval as any).group_name ?? '단체'} · ${selectedEval.date}`}
          onClose={() => setSelectedEval(null)}
        >
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <StatusBadge status={selectedEval.status} />
            <span style={{ fontSize:11, color:'#888', background:'#1e1e20', padding:'2px 6px', borderRadius:4 }}>{selectedEval.lesson_type}</span>
            {selectedEval.student_id != null && (
              <span style={{ fontSize:12, fontWeight:700, color: selectedEval.attended ? '#60b080' : '#e07060' }}>
                {selectedEval.attended ? '출석' : '결석'}
              </span>
            )}
          </div>
          <div style={{ fontSize:13, color:'#e8e4d8', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{selectedEval.content}</div>
          {selectedEval.next_goal && (
            <div style={{ fontSize:12, color:'#888', borderTop:'1px solid #222', paddingTop:8 }}>다음: {selectedEval.next_goal}</div>
          )}
        </BottomSheet>
      )}
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

function printPayslip(p: InstructorPayroll, range: { start: string; end: string; payLabel: string }, ex: InstructorExtra) {
  const w = window.open('', '_blank')
  if (!w) return
  const eff_before = p.total_before + ex.bonus
  const eff_tax    = Math.round(eff_before * 0.033)
  const eff_after  = eff_before - eff_tax + ex.parking
  const rows = p.lines.map(l => `
    <tr>
      <td>${l.lesson_type}</td>
      <td style="text-align:center">${l.count}회</td>
      <td style="text-align:right">${l.rate.toLocaleString()}원</td>
      <td style="text-align:right">${l.subtotal.toLocaleString()}원</td>
    </tr>`).join('')
  const extraRows = [
    ex.bonus   > 0 ? `<tr><td>추가수당${ex.bonusNote ? ` (${ex.bonusNote})` : ''}(세전)</td><td style="text-align:center">-</td><td style="text-align:right">-</td><td style="text-align:right">${ex.bonus.toLocaleString()}원</td></tr>` : '',
    ex.parking > 0 ? `<tr><td>주차료(세금없음)</td><td style="text-align:center">-</td><td style="text-align:right">-</td><td style="text-align:right">${ex.parking.toLocaleString()}원</td></tr>` : '',
  ].join('')
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>강의료 명세서</title>
  <style>
    body { font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 480px; margin: 40px auto; color: #111; font-size: 14px; }
    h2 { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
    .sub { color: #888; font-size: 12px; margin-bottom: 24px; }
    .info { background: #f8f8f6; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .info p { margin: 4px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f0ece0; font-size: 12px; padding: 8px 10px; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    .total { margin-top: 16px; padding: 14px 16px; background: #f8f8f6; border-radius: 8px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .total-row.final { font-size: 16px; font-weight: 900; padding-top: 10px; margin-top: 6px; border-top: 2px solid #111; }
    .tax { color: #c0392b; }
    @media print { body { margin: 20px; } }
  </style></head><body>
  <h2>KH Music & Studio</h2>
  <div class="sub">강의료 명세서</div>
  <div class="info">
    <p><b>강사명</b>: ${p.instructor.name}</p>
    <p><b>등급</b>: ${p.instructor.grade}</p>
    <p><b>정산기간</b>: ${range.start} ~ ${range.end}</p>
    <p><b>지급일</b>: ${range.payLabel}</p>
  </div>
  <table>
    <tr><th>수업 종류</th><th style="text-align:center">횟수</th><th style="text-align:right">단가</th><th style="text-align:right">금액</th></tr>
    ${rows}${extraRows}
  </table>
  <div class="total">
    <div class="total-row"><span>세전 합계</span><span>${eff_before.toLocaleString()}원</span></div>
    <div class="total-row tax"><span>원천징수 (3.3%)</span><span>-${eff_tax.toLocaleString()}원</span></div>
    ${ex.parking > 0 ? `<div class="total-row"><span>주차료 (세금없음)</span><span>+${ex.parking.toLocaleString()}원</span></div>` : ''}
    <div class="total-row final"><span>지급액</span><span>${eff_after.toLocaleString()}원</span></div>
  </div>
  <script>window.onload = () => { window.print() }<\/script>
  </body></html>`)
  w.document.close()
}

function PayrollSection({ title, payrolls, range, expanded, setExpanded, userEmail, extras, setExtra, setBonusNote }: {
  title: string
  payrolls: InstructorPayroll[]
  range: { start: string; end: string; payLabel: string }
  expanded: string | null
  setExpanded: (id: string | null) => void
  userEmail: string
  extras: Record<string, InstructorExtra>
  setExtra: (id: string, field: 'parking' | 'bonus', val: number) => void
  setBonusNote: (id: string, val: string) => void
}) {
  const [emailingIds, setEmailingIds] = useState<Set<string>>(new Set())
  const [emailedIds, setEmailedIds]   = useState<Set<string>>(new Set())

  async function sendEmail(p: InstructorPayroll) {
    if (!p.instructor.email) { alert('강사 이메일이 등록되지 않았어요'); return }
    const ex = extras[p.instructor.id] ?? { parking:0, bonus:0, bonusNote:'' }
    const { total_before, tax, total_after } = getEffective(p, ex)
    setEmailingIds(prev => new Set(prev).add(p.instructor.id))
    const res = await fetch('/api/send-payslip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructor: p.instructor,
        lines: p.lines,
        total_before, tax, total_after,
        extras: ex,
        range,
        callerEmail: userEmail,
      }),
    })
    const json = await res.json()
    setEmailingIds(prev => { const s = new Set(prev); s.delete(p.instructor.id); return s })
    if (json.ok) setEmailedIds(prev => new Set(prev).add(p.instructor.id))
    else alert('전송 실패: ' + json.error)
  }

  const extraInputStyle: React.CSSProperties = {
    background:'#0e0e10', border:'1px solid #2a2a2e', color:'#e8e4d8',
    borderRadius:6, padding:'5px 8px', fontSize:12, width:'100%', boxSizing:'border-box',
  }

  if (payrolls.length === 0) return null

  const totalBefore = payrolls.reduce((s,p) => s + getEffective(p, extras[p.instructor.id] ?? {parking:0,bonus:0}).total_before, 0)
  const totalTax    = payrolls.reduce((s,p) => s + getEffective(p, extras[p.instructor.id] ?? {parking:0,bonus:0}).tax, 0)
  const totalAfter  = payrolls.reduce((s,p) => s + getEffective(p, extras[p.instructor.id] ?? {parking:0,bonus:0}).total_after, 0)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <span style={{ fontSize:13, fontWeight:800, color:'#c0a060' }}>{title}</span>
        <span style={{ fontSize:11, color:'#666' }}>{range.start} ~ {range.end}</span>
      </div>
      <div style={{ background:'rgba(192,160,96,0.08)', border:'1px solid rgba(192,160,96,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#888', marginBottom:2 }}>
          <span>세전 합계</span><span>{fmt만원(totalBefore)}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#e07060', marginBottom:2 }}>
          <span>원천징수(3.3%)</span><span>-{fmt만원(totalTax)}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:800, color:'#c0a060' }}>
          <span>지급 합계</span><span>{fmt만원(totalAfter)}</span>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {payrolls.map(p => {
          const ex = extras[p.instructor.id] ?? { parking:0, bonus:0, bonusNote:'' }
          const { total_before: eff_before, tax: eff_tax, total_after: eff_after } = getEffective(p, ex)
          return (
            <div key={p.instructor.id} style={{ background:'#141416', borderRadius:10, border:'1px solid #222', overflow:'hidden' }}>
              <div onClick={() => setExpanded(expanded === p.instructor.id ? null : p.instructor.id)}
                style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Badge grade={p.instructor.grade} />
                  <span style={{ fontSize:14, fontWeight:700 }}>{p.instructor.name}</span>
                  <span style={{ fontSize:11, color:'#666' }}>{p.lines.reduce((s,l) => s+l.count, 0)}회</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#c0a060' }}>{fmt만원(eff_after)}</div>
                    <div style={{ fontSize:10, color:'#666' }}>세후</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={e => { e.stopPropagation(); printPayslip(p, range, ex) }} style={{
                      background:'#1e1e22', border:'1px solid #333', color:'#aaa',
                      borderRadius:7, padding:'5px 10px', fontSize:11, cursor:'pointer', whiteSpace:'nowrap',
                    }}>명세서</button>
                    <button onClick={e => { e.stopPropagation(); sendEmail(p) }}
                      disabled={emailingIds.has(p.instructor.id) || emailedIds.has(p.instructor.id)}
                      style={{
                        background: emailedIds.has(p.instructor.id) ? 'rgba(96,176,128,0.15)' : '#1e1e22',
                        border: `1px solid ${emailedIds.has(p.instructor.id) ? 'rgba(96,176,128,0.4)' : '#333'}`,
                        color: emailedIds.has(p.instructor.id) ? '#60b080' : '#aaa',
                        borderRadius:7, padding:'5px 10px', fontSize:11, cursor:'pointer', whiteSpace:'nowrap',
                        opacity: emailingIds.has(p.instructor.id) ? 0.5 : 1,
                      }}>
                      {emailingIds.has(p.instructor.id) ? '전송중' : emailedIds.has(p.instructor.id) ? '전송됨' : '이메일'}
                    </button>
                  </div>
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
                  {/* 추가 지급 입력 */}
                  <div style={{ borderTop:'1px solid #1e1e22', marginTop:10, paddingTop:10 }}>
                    <div style={{ fontSize:11, color:'#666', fontWeight:700, marginBottom:8 }}>추가 지급</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                      <div>
                        <label style={{ fontSize:10, color:'#666', display:'block', marginBottom:3 }}>주차료 (세금없음, 세후)</label>
                        <input type="number" min={0} value={ex.parking || ''} placeholder="0"
                          onClick={e => e.stopPropagation()}
                          onChange={e => setExtra(p.instructor.id, 'parking', +e.target.value || 0)}
                          style={extraInputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:'#666', display:'block', marginBottom:3 }}>추가수당 세전</label>
                        <input type="number" min={0} value={ex.bonus || ''} placeholder="0"
                          onClick={e => e.stopPropagation()}
                          onChange={e => setExtra(p.instructor.id, 'bonus', +e.target.value || 0)}
                          style={extraInputStyle} />
                      </div>
                    </div>
                    {ex.bonus > 0 && (
                      <div style={{ marginBottom:10 }}>
                        <label style={{ fontSize:10, color:'#666', display:'block', marginBottom:3 }}>추가수당 내용 (예: 모의고사채점료, 릴레이특강)</label>
                        <input type="text" value={ex.bonusNote || ''} placeholder="내용 입력"
                          onClick={e => e.stopPropagation()}
                          onChange={e => setBonusNote(p.instructor.id, e.target.value)}
                          style={extraInputStyle} />
                      </div>
                    )}
                  </div>
                  <div style={{ borderTop:'1px solid #222', marginTop:2, paddingTop:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#888', marginBottom:3 }}>
                      <span>세전</span><span>{fmt만원(eff_before)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#e07060', marginBottom:3 }}>
                      <span>원천징수(3.3%)</span><span>-{fmt만원(eff_tax)}</span>
                    </div>
                    {ex.parking > 0 && (
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6090c0', marginBottom:3 }}>
                        <span>주차료(세금없음)</span><span>+{fmt만원(ex.parking)}</span>
                      </div>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:800, color:'#c0a060', marginTop:6 }}>
                      <span>지급액(세후)</span><span>{fmt만원(eff_after)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface InstructorExtra { parking: number; bonus: number; bonusNote: string }
interface MasterClass { id: string; name: string; net: number }

function getEffective(p: InstructorPayroll, ex: InstructorExtra) {
  const total_before = p.total_before + ex.bonus
  const tax = Math.round(total_before * 0.033)
  const total_after = total_before - tax + ex.parking
  return { total_before, tax, total_after }
}

function downloadBankExcel(payrolls: InstructorPayroll[], extras: Record<string, InstructorExtra>, targetMonth: Date, payDay: 15 | 25) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx')
  const month = targetMonth.getMonth() + 1
  const year = targetMonth.getFullYear()
  const rows = payrolls.map(p => {
    const ex = extras[p.instructor.id] ?? { parking: 0, bonus: 0 }
    const { total_after } = getEffective(p, ex)
    return [p.instructor.bank_code ?? '', p.instructor.account_number ?? '', total_after, p.instructor.name, '급여']
  })
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 6 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Star급여이체')
  XLSX.writeFile(wb, `${year}년_${month}월_${payDay}일_은행이체.xlsx`)
}

function downloadExcel(
  payrolls15: InstructorPayroll[], payrolls25: InstructorPayroll[],
  extras: Record<string, InstructorExtra>, masterClasses: MasterClass[],
  targetMonth: Date
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx')
  const month = targetMonth.getMonth() + 1
  const year = targetMonth.getFullYear()
  const rows: (string | number)[][] = []

  rows.push([`${month}월 세무서(${year})`])
  rows.push(['강사', '세전', '세후', '주민번호'])

  for (const p of payrolls15) {
    const { total_before, total_after } = getEffective(p, extras[p.instructor.id] ?? { parking:0, bonus:0, bonusNote:'' })
    rows.push([p.instructor.name, total_before, total_after, p.instructor.resident_number ?? ''])
  }
  const sum15b = payrolls15.reduce((s,p) => s + getEffective(p, extras[p.instructor.id] ?? {parking:0,bonus:0}).total_before, 0)
  const sum15a = payrolls15.reduce((s,p) => s + getEffective(p, extras[p.instructor.id] ?? {parking:0,bonus:0}).total_after, 0)
  rows.push(['합', sum15b, sum15a, ''])
  rows.push([])

  for (const p of payrolls25) {
    const { total_before, total_after } = getEffective(p, extras[p.instructor.id] ?? { parking:0, bonus:0, bonusNote:'' })
    rows.push([p.instructor.name, total_before, total_after, p.instructor.resident_number ?? ''])
  }
  const sum25b = payrolls25.reduce((s,p) => s + getEffective(p, extras[p.instructor.id] ?? {parking:0,bonus:0}).total_before, 0)
  const sum25a = payrolls25.reduce((s,p) => s + getEffective(p, extras[p.instructor.id] ?? {parking:0,bonus:0}).total_after, 0)
  rows.push(['합', sum25b, sum25a, ''])

  if (masterClasses.length > 0) {
    rows.push([])
    rows.push(['마스터클래스', '세전', '세후', ''])
    for (const mc of masterClasses) {
      const before = Math.ceil(mc.net / 0.967)
      rows.push([mc.name, before, mc.net, ''])
    }
    const mcSumB = masterClasses.reduce((s,mc) => s + Math.ceil(mc.net / 0.967), 0)
    const mcSumA = masterClasses.reduce((s,mc) => s + mc.net, 0)
    rows.push(['합', mcSumB, mcSumA, ''])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '급여')
  XLSX.writeFile(wb, `${year}년_${month}월_세무서.xlsx`)
}

function PayrollView({ userEmail }: { userEmail: string }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const [payrolls15, setPayrolls15] = useState<InstructorPayroll[]>([])
  const [payrolls25, setPayrolls25] = useState<InstructorPayroll[]>([])
  const [loading, setLoading]       = useState(false)
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [calculated, setCalculated] = useState(false)
  const [extras, setExtras]         = useState<Record<string, InstructorExtra>>({})
  const [masterClasses, setMasterClasses] = useState<MasterClass[]>([])

  function setExtra(id: string, field: 'parking' | 'bonus', val: number) {
    setExtras(prev => ({ ...prev, [id]: { ...(prev[id] ?? { parking:0, bonus:0, bonusNote:'' }), [field]: val } }))
  }
  function setBonusNote(id: string, val: string) {
    setExtras(prev => ({ ...prev, [id]: { ...(prev[id] ?? { parking:0, bonus:0, bonusNote:'' }), bonusNote: val } }))
  }
  function addMC() {
    setMasterClasses(prev => [...prev, { id: crypto.randomUUID(), name:'', net:0 }])
  }
  function removeMC(id: string) {
    setMasterClasses(prev => prev.filter(mc => mc.id !== id))
  }
  function updateMC(id: string, field: 'name' | 'net', val: string | number) {
    setMasterClasses(prev => prev.map(mc => mc.id === id ? { ...mc, [field]: val } : mc))
  }

  const range15 = getPayrollRange(15, monthOffset)
  const range25 = getPayrollRange(25, monthOffset)

  async function calculate() {
    setLoading(true)
    const broadStart = range25.start < range15.start ? range25.start : range15.start
    const broadEnd   = range25.end   > range15.end   ? range25.end   : range15.end

    const [evRes, instrRes, rateRes] = await Promise.all([
      supabase.from('evaluations').select('*').eq('status','approved').gte('date', broadStart).lte('date', broadEnd),
      supabase.from('instructors').select('*').eq('is_active', true),
      supabase.from('grade_rates').select('*'),
    ])
    const allEvals: Evaluation[]    = evRes.data ?? []
    const instructors: Instructor[] = instrRes.data ?? []
    const rates: GradeRate[]        = rateRes.data ?? []
    const rateMap = new Map<string, number>()
    rates.forEach(r => rateMap.set(`${r.grade}:${r.lesson_type}`, r.rate))

    function buildPayroll(instr: Instructor, range: { start: string; end: string }) {
      const myEvals = allEvals.filter(e => {
        if (e.instructor_id !== instr.id) return false
        if (e.student_id && e.attended === false) return false
        if (e.date < range.start || e.date > range.end) return false
        return true
      })
      if (myEvals.length === 0) return null
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
      return { instructor:instr, lines, total_before, tax, total_after:total_before - tax }
    }

    const r15: InstructorPayroll[] = []
    const r25: InstructorPayroll[] = []
    for (const instr of instructors) {
      const payDay = (instr.pay_day ?? 15) as 15 | 25
      const p = buildPayroll(instr, payDay === 25 ? range25 : range15)
      if (!p) continue
      if (payDay === 25) r25.push(p)
      else r15.push(p)
    }
    r15.sort((a, b) => b.total_before - a.total_before)
    r25.sort((a, b) => b.total_before - a.total_before)
    setPayrolls15(r15); setPayrolls25(r25)
    setCalculated(true); setLoading(false)
  }

  const now = new Date()
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthLabel = `${targetMonth.getFullYear()}년 ${targetMonth.getMonth() + 1}월`

  return (
    <div style={{ padding:'18px 16px' }}>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:16 }}>급여 정산</div>
      <div style={{ background:'#141416', borderRadius:12, border:'1px solid #222', padding:'14px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <button onClick={() => { setMonthOffset(o => o - 1); setCalculated(false); setExtras({}); setMasterClasses([]) }}
            style={{ background:'#1e1e22', border:'1px solid #333', color:'#aaa', borderRadius:7, padding:'5px 12px', cursor:'pointer' }}>‹</button>
          <span style={{ fontSize:14, fontWeight:700 }}>{monthLabel}</span>
          <button onClick={() => { setMonthOffset(o => o + 1); setCalculated(false); setExtras({}); setMasterClasses([]) }}
            style={{ background:'#1e1e22', border:'1px solid #333', color:'#aaa', borderRadius:7, padding:'5px 12px', cursor:'pointer' }}>›</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
          <div style={{ fontSize:11, color:'#666' }}>15일 지급: {range15.start} ~ {range15.end}</div>
          <div style={{ fontSize:11, color:'#666' }}>25일 지급: {range25.start} ~ {range25.end}</div>
        </div>
        <button onClick={calculate} disabled={loading} style={{
          width:'100%', background:'#c0a060', color:'#111', border:'none', borderRadius:8, padding:'10px',
          fontSize:13, fontWeight:700, cursor:'pointer', opacity: loading ? 0.7 : 1,
        }}>{loading ? '계산 중...' : '정산 계산'}</button>
      </div>

      {calculated && (
        <>
          <PayrollSection title="15일 지급" payrolls={payrolls15} range={range15} expanded={expanded} setExpanded={setExpanded} userEmail={userEmail} extras={extras} setExtra={setExtra} setBonusNote={setBonusNote} />
          <PayrollSection title="25일 지급" payrolls={payrolls25} range={range25} expanded={expanded} setExpanded={setExpanded} userEmail={userEmail} extras={extras} setExtra={setExtra} setBonusNote={setBonusNote} />
          {payrolls15.length === 0 && payrolls25.length === 0 && (
            <div style={{ textAlign:'center', color:'#555', padding:'30px 0', fontSize:13 }}>해당 기간에 승인된 수업이 없어요</div>
          )}
          {(payrolls15.length > 0 || payrolls25.length > 0) && (
            <>
              {/* 마스터클래스 */}
              <div style={{ background:'#141416', borderRadius:12, border:'1px solid #222', padding:'14px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'#8878e8' }}>마스터클래스 (세후 기준)</span>
                  <button onClick={addMC} style={{ background:'#1e1e2a', border:'1px solid #3a3a5a', color:'#8878e8', borderRadius:7, padding:'4px 10px', fontSize:11, cursor:'pointer' }}>+ 추가</button>
                </div>
                {masterClasses.length === 0 && (
                  <div style={{ fontSize:12, color:'#555', textAlign:'center', padding:'8px 0' }}>마스터클래스가 없어요</div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {masterClasses.map(mc => {
                    const gross = Math.ceil(mc.net / 0.967)
                    return (
                      <div key={mc.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:6, alignItems:'center' }}>
                        <input value={mc.name} onChange={e => updateMC(mc.id, 'name', e.target.value)} placeholder="강사명 / 행사명"
                          style={{ background:'#0e0e10', border:'1px solid #2a2a2e', color:'#e8e4d8', borderRadius:6, padding:'6px 8px', fontSize:12 }} />
                        <input type="number" min={0} value={mc.net || ''} onChange={e => updateMC(mc.id, 'net', +e.target.value || 0)} placeholder="세후금액"
                          style={{ background:'#0e0e10', border:'1px solid #2a2a2e', color:'#e8e4d8', borderRadius:6, padding:'6px 8px', fontSize:12, width:90 }} />
                        <span style={{ fontSize:11, color:'#666', whiteSpace:'nowrap' }}>세전 {gross.toLocaleString()}</span>
                        <button onClick={() => removeMC(mc.id)} style={{ background:'none', border:'none', color:'#666', fontSize:16, cursor:'pointer', lineHeight:1, padding:'0 4px' }}>×</button>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={() => downloadExcel(payrolls15, payrolls25, extras, masterClasses, targetMonth)} style={{
                  width:'100%', background:'#1a3a1a', border:'1px solid #2d6a2d', color:'#60b080',
                  borderRadius:9, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer',
                }}>엑셀 다운로드 (세무서용)</button>
                {payrolls15.length > 0 && (
                  <button onClick={() => downloadBankExcel(payrolls15, extras, targetMonth, 15)} style={{
                    width:'100%', background:'#1a2a3a', border:'1px solid #2d4a6a', color:'#6090c0',
                    borderRadius:9, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer',
                  }}>은행이체 엑셀 — 15일</button>
                )}
                {payrolls25.length > 0 && (
                  <button onClick={() => downloadBankExcel(payrolls25, extras, targetMonth, 25)} style={{
                    width:'100%', background:'#1a2a3a', border:'1px solid #2d4a6a', color:'#6090c0',
                    borderRadius:9, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer',
                  }}>은행이체 엑셀 — 25일</button>
                )}
              </div>
            </>
          )}
        </>
      )}
      {!calculated && (
        <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>정산 계산 버튼을 눌러주세요</div>
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
  const [form, setForm]               = useState({ name:'', phone:'', email:'', grade:'B' as Grade, pay_day: 15 as 15 | 25, resident_number:'', bank_code:'', account_number:'' })
  const [saving, setSaving]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('instructors').select('*').order('name')
    setInstructors(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() { setEditing(null); setForm({ name:'', phone:'', email:'', grade:'B', pay_day:15, resident_number:'', bank_code:'', account_number:'' }); setShowForm(true) }
  function openEdit(i: Instructor) { setEditing(i); setForm({ name:i.name, phone:i.phone, email:i.email??'', grade:i.grade, pay_day:i.pay_day??15, resident_number:i.resident_number??'', bank_code:i.bank_code??'', account_number:i.account_number??'' }); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    if (!form.phone.trim()) return
    if (!form.email.trim()) { alert('이메일을 입력해주세요'); return }
    setSaving(true)
    if (editing) {
      await supabase.from('instructors').update({ name:form.name, phone:form.phone, email:form.email, grade:form.grade, pay_day:form.pay_day, resident_number:form.resident_number||null, bank_code:form.bank_code||null, account_number:form.account_number||null }).eq('id', editing.id)
    } else {
      await supabase.from('instructors').insert({ name:form.name, phone:form.phone, email:form.email, grade:form.grade, pay_day:form.pay_day, resident_number:form.resident_number||null, bank_code:form.bank_code||null, account_number:form.account_number||null })
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
          <FormField label="지급일">
            <div style={{ display:'flex', gap:8 }}>
              {([15, 25] as const).map(d => (
                <button key={d} onClick={() => setForm(f=>({...f,pay_day:d}))} style={{
                  flex:1, padding:'9px', borderRadius:8,
                  border:`1px solid ${form.pay_day===d ? '#c0a060' : '#333'}`,
                  background: form.pay_day===d ? 'rgba(192,160,96,0.15)' : '#1a1a1c',
                  color: form.pay_day===d ? '#c0a060' : '#666', fontSize:13, fontWeight:700, cursor:'pointer',
                }}>{d}일</button>
              ))}
            </div>
          </FormField>
          <FormField label="주민번호"><input value={form.resident_number??''} onChange={e => setForm(f=>({...f,resident_number:e.target.value}))} style={inputStyle} placeholder="000000-0000000" /></FormField>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ width:90 }}>
              <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:5 }}>은행코드</label>
              <input value={form.bank_code??''} onChange={e => setForm(f=>({...f,bank_code:e.target.value}))} style={inputStyle} placeholder="020" />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:5 }}>계좌번호</label>
              <input value={form.account_number??''} onChange={e => setForm(f=>({...f,account_number:e.target.value}))} style={inputStyle} placeholder="0000-000-000000" />
            </div>
          </div>
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
  const [form, setForm] = useState({ instructor_id:'', student_id:'', lesson_type:'전공' as LessonType, day_of_week:'', start_time:'', enrolled_at:'' })
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
    if (!form.instructor_id) { alert('강사를 선택해주세요'); return }
    if (!form.student_id) { alert('학생을 선택해주세요'); return }
    setSaving(true)
    await supabase.from('assignments').insert({
      instructor_id: form.instructor_id, student_id: form.student_id, lesson_type: form.lesson_type,
      day_of_week: form.day_of_week !== '' ? parseInt(form.day_of_week) : null,
      start_time: form.start_time || null,
      enrolled_at: form.enrolled_at || null,
    })
    setForm({ instructor_id:'', student_id:'', lesson_type:'전공', day_of_week:'', start_time:'', enrolled_at:'' })
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
                {a.enrolled_at && <span style={{ marginLeft:6, color:'#555' }}>등록 {a.enrolled_at}</span>}
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
              {(['전공','오디션','부전공','전문반','취미','댄스'] as LessonType[]).map(t => <option key={t} value={t}>{t}</option>)}
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
          <FormField label="등록일 (28일 기준)">
            <input type="date" value={form.enrolled_at} onChange={e => setForm(f=>({...f,enrolled_at:e.target.value}))} style={inputStyle} />
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
    if (!form.name.trim()) { alert('수업명을 입력해주세요'); return }
    if (!form.instructor_id) { alert('강사를 선택해주세요'); return }
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
      <div style={{ background:'#141416', borderRadius:10, border:'1px solid #2a2a2e', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'40px repeat(7, 1fr)', background:'#1e1e22', borderBottom:'2px solid #2a2a2e' }}>
          <div style={{ padding:'10px 4px' }} />
          {LESSON_TYPES.map((t, i) => (
            <div key={t} style={{ padding:'10px 2px', textAlign:'center', fontSize:10, fontWeight:700, color:'#aaa', borderLeft: i === 0 ? '1px solid #2a2a2e' : '1px solid #2a2a2e' }}>{t}</div>
          ))}
        </div>
        {GRADES.map((grade, gi) => (
          <div key={grade} style={{ display:'grid', gridTemplateColumns:'40px repeat(7, 1fr)', borderBottom:'1px solid #2a2a2e', background: gi % 2 === 1 ? '#161618' : '#141416' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'12px 0', borderRight:'1px solid #2a2a2e' }}>
              <Badge grade={grade} />
            </div>
            {LESSON_TYPES.map((lt, ci) => {
              const r = rates.find(r => r.grade === grade && r.lesson_type === lt)
              if (!r) return <div key={lt} style={{ borderLeft:'1px solid #222' }} />
              const isEd = editing?.id === r.id
              return (
                <div key={lt} onClick={() => !isEd && setEditing({ id:r.id, rate:r.rate })}
                  style={{ padding:'10px 4px', textAlign:'center', cursor:'pointer', background: isEd ? '#1e2230' : 'transparent', borderLeft:'1px solid #222' }}>
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
                    <div style={{ fontSize:11, color:'#ddd' }}>{r.rate%10000===0 ? `${r.rate/10000}만` : r.rate%1000===0 ? `${(r.rate/10000).toFixed(1)}만` : `${(r.rate/10000).toFixed(2)}만`}</div>
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
