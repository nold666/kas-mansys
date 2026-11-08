import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!session || !expected || session !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const supabase = getServiceSupabase()
  const { data, error } = await supabase.storage
    .from('proofs')
    .createSignedUrl(path, 60 * 10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.redirect(data.signedUrl)
}