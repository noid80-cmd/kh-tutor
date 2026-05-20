import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  const channelId = process.env.SOLAPI_KAKAO_CHANNEL_ID

  if (!apiKey || !apiSecret || !channelId) {
    return NextResponse.json({ error: 'Solapi 설정이 없어요.' }, { status: 500 })
  }

  try {
    const { SolapiMessageService } = await import('solapi')
    const service = new SolapiMessageService(apiKey, apiSecret)

    const results = await Promise.allSettled(
      messages.map((m: { phone: string; text: string }) =>
        service.send({
          to: m.phone,
          from: process.env.SOLAPI_SENDER ?? '',
          kakaoOptions: {
            pfId: channelId,
            templateId: process.env.SOLAPI_TEMPLATE_ID ?? '',
            variables: { content: m.text },
          },
        })
      )
    )

    const failed = results.filter(r => r.status === 'rejected').length
    return NextResponse.json({ sent: results.length - failed, failed })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
