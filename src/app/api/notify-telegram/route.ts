import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chat_id, title, client_naam } = body

    if (!chat_id || !title || !client_naam) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: chat_id, title, client_naam' },
        { status: 400 }
      )
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' },
        { status: 500 }
      )
    }

    const message = `✅ Content goedgekeurd: ${title}\nKlant: ${client_naam}\nKlaar om te publiceren.`

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id,
          text: message,
        }),
      }
    )

    const result = await response.json()

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.description || 'Telegram API error' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
