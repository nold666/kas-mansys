// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!session || !expected || session !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { period } = await req.json()
  if (!/^\d{4}-\d{2}$/.test(period || '')) {
    return NextResponse.json({ error: 'Periode tidak valid' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { data: members, error: mErr } = await supabase
    .from('members')
    .select('id')
    .eq('active', true)

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  if (!members?.length) return NextResponse.json({ ok: true, inserted: 0 })

  const rows = members.map((m: { id: string }) => ({
    member_id: m.id,
    period,
    amount: 10000,
    status: 'unpaid' as const,
  }))

  const { error } = await supabase
    .from('payments')
    .upsert(rows as any, { onConflict: 'member_id,period', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, inserted: rows.length })
}