import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!session || !expected || session !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('members')
    .select('id, name, active')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!session || !expected || session !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nama wajib' }, { status: 400 })

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('members')
    .insert({ name: name.trim(), active: true } as any)
    .select('id, name, active')
    .single() as any

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!session || !expected || session !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, active } = await req.json()
  if (!id || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  // @ts-ignore
  const { error } = await supabase.from('members').update({ active }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
