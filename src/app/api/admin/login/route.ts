import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const expected = process.env.ADMIN_PASSWORD

  if (!expected || password !== expected) {
    return NextResponse.json({ error: 'Password salah' }, { status: 401 })
  }

  // ponytail: token static dari env; ganti ke signed JWT kalau butuh multi-admin/expiry
  const token = process.env.ADMIN_SESSION_TOKEN || randomBytes(32).toString('hex')
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return res
}