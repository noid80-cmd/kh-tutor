import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'noid80@hanmail.net'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { instructor, lines, total_before, tax, total_after, range, callerEmail } = await req.json()

  if (callerEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '권한이 없어요' }, { status: 403 })
  }

  if (!instructor?.email) {
    return NextResponse.json({ error: '강사 이메일이 없어요' }, { status: 400 })
  }

  const rows = lines.map((l: { lesson_type: string; count: number; rate: number; subtotal: number }) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee">${l.lesson_type}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center">${l.count}회</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right">${l.rate.toLocaleString('ko-KR')}원</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${l.subtotal.toLocaleString('ko-KR')}원</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:'Apple SD Gothic Neo',sans-serif">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#1a1a2e,#2d2d44);padding:32px 32px 28px;text-align:center">
    <div style="display:inline-flex;width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);align-items:center;justify-content:center;margin-bottom:12px">
      <span style="color:#fff;font-weight:900;font-size:18px">KH</span>
    </div>
    <div style="color:#fff;font-size:22px;font-weight:900;margin-bottom:4px">KH Music &amp; Studio</div>
    <div style="color:rgba(255,255,255,0.5);font-size:13px">강의료 명세서</div>
  </div>

  <div style="padding:28px 32px">
    <div style="background:#f8f8f6;border-radius:12px;padding:20px;margin-bottom:24px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><div style="color:#999;font-size:11px;margin-bottom:3px">강사명</div><div style="font-weight:700;font-size:15px">${instructor.name}</div></div>
        <div><div style="color:#999;font-size:11px;margin-bottom:3px">등급</div><div style="font-weight:700;font-size:15px">${instructor.grade}</div></div>
        <div><div style="color:#999;font-size:11px;margin-bottom:3px">정산기간</div><div style="font-weight:600;font-size:13px">${range.start} ~ ${range.end}</div></div>
        <div><div style="color:#999;font-size:11px;margin-bottom:3px">지급일</div><div style="font-weight:600;font-size:13px">${range.payLabel}</div></div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead>
        <tr style="background:#f0ece0">
          <th style="padding:10px 12px;font-size:12px;font-weight:700;text-align:left;border-bottom:2px solid #e8e4d8">수업 종류</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;text-align:center;border-bottom:2px solid #e8e4d8">횟수</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;text-align:right;border-bottom:2px solid #e8e4d8">단가</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;text-align:right;border-bottom:2px solid #e8e4d8">금액</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="background:#f8f8f6;border-radius:12px;padding:18px 20px">
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:8px">
        <span>세전 합계</span><span>${total_before.toLocaleString('ko-KR')}원</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#c0392b;margin-bottom:12px">
        <span>원천징수 (3.3%)</span><span>-${tax.toLocaleString('ko-KR')}원</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-top:2px solid #ddd;padding-top:12px">
        <span style="font-size:16px;font-weight:900">지급액</span>
        <span style="font-size:20px;font-weight:900;color:#5b4fc0">${total_after.toLocaleString('ko-KR')}원</span>
      </div>
    </div>
  </div>

  <div style="background:#f8f8f6;padding:20px 32px;text-align:center;border-top:1px solid #eee">
    <div style="color:#999;font-size:12px">문의: KH Music &amp; Studio</div>
  </div>
</div>
</body></html>`

  const { error } = await resend.emails.send({
    from: 'KH Music <payslip@khmusic.co.kr>',
    to: [instructor.email],
    subject: `[KH Music] ${instructor.name} 강사님 ${range.payLabel} 명세서`,
    html,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
