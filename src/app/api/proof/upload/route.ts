import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const memberId = formData.get('memberId') as string
    const period = formData.get('period') as string
    const periodsRaw = formData.get('periods') as string | null
    let periods = periodsRaw ? (JSON.parse(periodsRaw) as string[]) : period ? [period] : []
    periods = Array.from(new Set(periods)).sort()

    if (!file || !memberId || periods.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!periods.every((p) => /^\d{4}-\d{2}$/.test(p))) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size max 5MB' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    const fileExt = file.name.split('.').pop()
    const fileName = `proofs/${periods[0]}/${memberId}/${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const kasAmount = parseInt(process.env.NEXT_PUBLIC_KAS_AMOUNT || '10000')
    const now = new Date().toISOString()
    const rows = periods.map((p) => ({
      member_id: memberId,
      period: p,
      amount: kasAmount,
      status: 'pending',
      proof_path: fileName,
      submitted_at: now,
    }))
    const { error: updateError } = await supabase
      .from('payments')
      .upsert(rows as any, { onConflict: 'member_id,period' })

    if (updateError) {
      console.error('Payment update error:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: fileName, periods })
  } catch (err) {
    console.error('Proof upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}