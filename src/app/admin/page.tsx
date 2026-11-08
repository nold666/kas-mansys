'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatPeriod, getStatusBadge, formatCurrency, getCurrentPeriod } from '@/lib/utils'
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, RefreshCw, Plus, ExternalLink } from 'lucide-react'

type Payment = {
  id: string
  period: string
  amount: number
  status: string
  proof_path: string | null
  submitted_at: string | null
  member: { name: string } | null
}

type Member = {
  id: string
  name: string
  active: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [payments, setPayments] = useState<Payment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  const cardAppear = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 20, stiffness: 300 },
    },
  } as const

  const loadPayments = useCallback(async () => {
    setLoading(true)
    console.log('Loading payments for period:', period)
    const { data, error } = await supabase
      .from('payments')
      .select('id, period, amount, status, proof_path, submitted_at, member:members(name)')
      .eq('period', period)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      setError(error.message)
    } else {
      console.log('Payments loaded:', data)
      setPayments((data as unknown as Payment[]) || [])
    }
    setLoading(false)
  }, [period])

  const loadMembers = useCallback(async () => {
    const res = await fetch('/api/admin/members')
    if (res.status === 401) return router.push('/admin/login')
    if (res.ok) {
      const data = await res.json()
      setMembers(data as Member[])
    }
  }, [router])

  useEffect(() => {
    loadPayments()
    loadMembers()
  }, [loadPayments, loadMembers])

  async function generatePeriod() {
    if (!confirm(`Generate tagihan ${formatPeriod(period)} untuk semua anggota aktif?`)) return
    setGenerating(true)
    setError('')
    const res = await fetch('/api/admin/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    })
    setGenerating(false)
    if (res.status === 401) return router.push('/admin/login')
    if (!res.ok) {
      setError('Gagal generate periode')
      return
    }
    loadPayments()
  }

  async function addMember() {
    if (!newMemberName.trim()) return
    setError('')

    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newMemberName.trim() }),
    })

    if (res.status === 401) return router.push('/admin/login')
    const data = await res.json()
    if (!res.ok) {
      setError(`Gagal menambah anggota: ${data.error || 'Error'}`)
      return
    }

    setMembers(prev => [...prev, data as Member].sort((a, b) => a.name.localeCompare(b.name)))
    setNewMemberName('')
    setShowAddMember(false)
  }

  async function toggleMemberActive(id: string, currentActive: boolean) {
    if (currentActive && !confirm('Nonaktifkan anggota ini?')) return

    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !currentActive }),
    })

    if (res.status === 401) return router.push('/admin/login')
    if (!res.ok) {
      const data = await res.json()
      setError(`Gagal mengubah status: ${data.error || 'Error'}`)
      return
    }
    loadMembers()
  }

  async function verify(id: string, action: 'approve' | 'reject') {
    const note = action === 'reject' ? prompt('Alasan penolakan?') : undefined
    if (action === 'reject' && note === null) return

    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, note }),
    })
    if (res.status === 401) return router.push('/admin/login')
    if (!res.ok) {
      setError('Gagal memverifikasi pembayaran')
      return
    }
    loadPayments()
  }

  function shiftPeriod(months: number) {
    const [year, month] = period.split('-').map(Number)
    const d = new Date(year, month - 1 + months, 1)
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const stats = {
    paid: payments.filter((p) => p.status === 'paid').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    unpaid: payments.filter((p) => !['paid', 'pending'].includes(p.status)).length,
  }

  return (
    <div className="container-main py-8">
      {/* Header */}
      <motion.div
        variants={cardAppear}
        initial="hidden"
        animate="visible"
        className="mb-8 flex items-center gap-4 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-6 w-auto" />
          <h1 className="text-2xl font-bold text-apple-gray-900">Dashboard Admin</h1>
        </div>
        <span className="badge badge-pending text-sm">{formatPeriod(period)}</span>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <motion.div
        variants={cardAppear}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <div className="glass-panel rounded-3xl p-6 text-center">
          <div className="text-3xl font-bold text-apple-green">{stats.paid}</div>
          <p className="text-apple-gray-500 text-sm">Lunas</p>
        </div>
        <div className="glass-panel rounded-3xl p-6 text-center">
          <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
          <p className="text-apple-gray-500 text-sm">Menunggu</p>
        </div>
        <div className="glass-panel rounded-3xl p-6 text-center">
          <div className="text-3xl font-bold text-apple-gray-600">{stats.unpaid}</div>
          <p className="text-apple-gray-500 text-sm">Belum Bayar</p>
        </div>
        <div className="glass-panel rounded-3xl p-6 text-center">
          <div className="text-3xl font-bold text-apple-blue">{payments.length}</div>
          <p className="text-apple-gray-500 text-sm">Total</p>
        </div>
      </motion.div>

      {/* Period Navigation */}
      <motion.div
        variants={cardAppear}
        initial="hidden"
        animate="visible"
        className="glass-panel rounded-3xl p-6 mb-6 flex flex-wrap items-center gap-4"
      >
        <button onClick={() => shiftPeriod(-1)} className="p-2 rounded-xl hover:bg-apple-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium min-w-[160px] text-center">{formatPeriod(period)}</span>
        <button onClick={() => shiftPeriod(1)} className="p-2 rounded-xl hover:bg-apple-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>

        <button onClick={generatePeriod} disabled={generating} className="btn btn-secondary flex items-center gap-2 rounded-xl">
          <RefreshCw className="w-4 h-4" />
          {generating ? 'Generating...' : 'Generate Periode'}
        </button>
      </motion.div>

      {/* Member Management */}
      <motion.div variants={cardAppear} initial="hidden" animate="visible" className="glass-panel rounded-3xl mb-6">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4 text-apple-gray-900">Kelola Anggota</h2>

          {showAddMember && (
            <div className="p-4 bg-apple-gray-100/80 border rounded-3xl mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 p-3 border border-apple-gray-200 rounded-xl focus:ring-2 focus:ring-apple-blue/20 outline-none"
                  placeholder="Nama anggota baru"
                  disabled={!newMemberName.trim()}
                  autoFocus
                />
                <button
                  onClick={addMember}
                  disabled={!newMemberName.trim()}
                  className="btn btn-primary rounded-xl py-2.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setShowAddMember(false)
                    setNewMemberName('')
                  }}
                  className="p-2 text-apple-gray-500 hover:bg-apple-gray-100 rounded-xl"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  m.active
                    ? 'bg-white border-apple-gray-100'
                    : 'bg-apple-gray-100 border-apple-gray-100 text-apple-gray-400'
                }`}
              >
                <span>{m.name}</span>
                <button
                  onClick={() => toggleMemberActive(m.id, m.active)}
                  className={`p-0.5 rounded-full ${
                    m.active ? 'text-apple-red-400 hover:bg-apple-red-50' : 'text-apple-green-400 hover:bg-apple-green-50'
                  }`}
                  title={m.active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {m.active ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Payments Table */}
      <motion.div variants={cardAppear} initial="hidden" animate="visible" className="glass-panel rounded-3xl">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4 text-apple-gray-900">Daftar Pembayaran</h2>
          {loading ? (
            <p className="text-center text-apple-gray-500 py-8">Memuat...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg overflow-hidden">
                <thead className="bg-apple-gray-50">
                  <tr className="text-left">
                    <th className="p-3 font-medium text-apple-gray-600">Anggota</th>
                    <th className="p-3 font-medium text-apple-gray-600">Period</th>
                    <th className="p-3 font-medium text-apple-gray-600">Amount</th>
                    <th className="p-3 font-medium text-apple-gray-600">Status</th>
                    <th className="p-3 font-medium text-apple-gray-600">Bukti</th>
                    <th className="p-3 text-center text-apple-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-gray-100">
                  {payments.map((p) => {
                    const badge = getStatusBadge(p.status)
                    return (
                      <tr key={p.id} className="hover:bg-apple-gray-50">
                        <td className="p-3 font-medium">{p.member?.name}</td>
                        <td className="p-3 text-sm text-apple-gray-500">{formatPeriod(p.period)}</td>
                        <td className="p-3 font-medium">{formatCurrency(p.amount)}</td>
                        <td className="p-3">
                          <span className={`badge ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td className="p-3">
                          {p.proof_path ? (
                            <a
                              href={`/api/proof?path=${encodeURIComponent(p.proof_path)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-apple-blue hover:underline text-sm"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Lihat
                            </a>
                          ) : (
                            <span className="text-apple-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {p.status === 'pending' && (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => verify(p.id, 'approve')}
                                className="p-2 text-apple-green-600 hover:bg-apple-green-50 rounded-xl"
                                title="Verifikasi Lunas"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => verify(p.id, 'reject')}
                                className="p-2 text-apple-red-600 hover:bg-apple-red-50 rounded-xl"
                                title="Tolak"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {p.status === 'paid' && (
                            <div className="text-apple-green-600 flex justify-center">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-apple-gray-500">
                        Belum ada pembayaran untuk periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
