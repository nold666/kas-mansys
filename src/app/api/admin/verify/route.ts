// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!session || !expected || session !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, action, note } = await req.json()
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  // @ts-ignore
  const { error } = await supabase
    .from('payments')
    .update({
      status: action === 'approve' ? 'paid' : 'rejected',
      note: action === 'reject' ? note || 'Ditolak admin' : null,
      verified_at: action === 'approve' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}