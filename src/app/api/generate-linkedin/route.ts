import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { client_id, input_id } = body

    if (!client_id || !input_id) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: client_id, input_id' },
        { status: 400 }
      )
    }

    const bridgeUrl = process.env.BRIDGE_URL || 'http://127.0.0.1:8787'

    const response = await fetch(`${bridgeUrl}/generate-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id, input_id }),
      // LinkedIn posts are faster than blogs, but still give it time
      signal: AbortSignal.timeout(15 * 60 * 1000),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { ok: false, error: `Bridge error ${response.status}: ${text}` },
        { status: 502 }
      )
    }

    const result = await response.json()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
