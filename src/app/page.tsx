'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentPeriod, formatPeriod, getStatusBadge, calculateFine, calculateTotal, getDaysLate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle, Clock, XCircle, Wallet, Calendar, History } from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], staggerChildren: 0.1 }
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 20, stiffness: 300 }
  },
} as const

const cardHover = {
  y: -4,
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
  transition: { type: 'spring', damping: 20, stiffness: 300 }
} as const

export default function Home() {
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [selectedMemberName, setSelectedMemberName] = useState<string>('')
  const [payment, setPayment] = useState<{
    status: string
    amount: number
    fine: number
    total: number
  } | null>(null)
  const [history, setHistory] = useState<Array<{
    period: string
    status: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const currentPeriod = getCurrentPeriod()

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    if (selectedMemberId) {
      loadPaymentData(selectedMemberId)
    }
  }, [selectedMemberId])

  async function loadMembers() {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name')
        .eq('active', true)
        .order('name')

      if (error) throw error
      const rows = (data || []) as Array<{ id: string; name: string }>
      setMembers(rows)
      if (rows.length > 0) {
        setSelectedMemberId(rows[0].id)
        setSelectedMemberName(rows[0].name)
      }
    } catch (err) {
      console.error('Error loading members:', err)
      setError('Gagal memuat data anggota')
    } finally {
      setLoading(false)
    }
  }

  async function loadPaymentData(memberId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .order('period', { ascending: false })
        .limit(7)

      if (error) throw error

      const paymentRows = (data || []) as Array<{ period: string; status: string; amount?: number }>
      const currentPayment = paymentRows.find(p => p.period === currentPeriod)
      const fine = calculateFine(currentPeriod)
      const total = calculateTotal(currentPeriod)

      setPayment({
        status: currentPayment?.status || 'unpaid',
        amount: currentPayment?.amount || parseInt(process.env.NEXT_PUBLIC_KAS_AMOUNT || '10000'),
        fine,
        total
      })

      const historyData = paymentRows.map(p => ({
        period: p.period,
        status: p.status
      }))
      setHistory(historyData)
    } catch (err) {
      console.error('Error loading payment data:', err)
      setError('Gagal memuat data pembayaran')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-apple-blue border-transparent animate-spin"></div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-apple-gray-500"
          >
            Memuat data...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen"
    >
      {/* Hero Header */}
      <motion.header
        variants={itemVariants}
        className="text-center py-12 px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-3"
        >
          <img src="/logo.png" alt="KAS Lab" className="h-10 w-auto" />
          <span className="text-3xl font-bold tracking-tight text-apple-gray-800">KAS LAB</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-apple-gray-500 text-lg"
        >
          Sistem pembayaran kas bulanan lab
        </motion.p>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-5 py-4 rounded-2xl mb-6"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Member Selection Card */}
        <motion.div variants={itemVariants}>
          <motion.div
            whileHover={cardHover}
            className="glass-panel rounded-3xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-apple-blue" />
              <h2 className="text-xl font-semibold tracking-tight">Pilih Anggota</h2>
            </div>
            <select
              className="w-full p-4 bg-white/80 border-0 rounded-2xl text-lg shadow-sm focus:ring-4 focus:ring-apple-blue/20 transition-all"
              value={selectedMemberId}
              onChange={(e) => {
                const member = members.find(m => m.id === e.target.value)
                setSelectedMemberId(e.target.value)
                setSelectedMemberName(member?.name || '')
              }}
            >
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </motion.div>
        </motion.div>

        {/* Current Period Status Card */}
        <motion.div variants={itemVariants}>
          <motion.div
            whileHover={cardHover}
            className="glass-panel rounded-3xl p-6 mb-6"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-5 h-5 text-apple-blue" />
                  <h2 className="text-xl font-semibold tracking-tight">Kas {formatPeriod(currentPeriod)}</h2>
                </div>
                <p className="text-apple-gray-500">{selectedMemberName}</p>
              </div>
              {payment && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`badge ${getStatusBadge(payment.status).className}`}
                >
                  {getStatusBadge(payment.status).label}
                </motion.span>
              )}
            </div>

            {payment && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/60 rounded-2xl p-4 text-center"
                  >
                    <p className="text-xs text-apple-gray-500 mb-1">Pokok</p>
                    <p className="text-xl font-bold text-apple-gray-800">{formatCurrency(payment.amount)}</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-amber-50/60 rounded-2xl p-4 text-center"
                  >
                    <p className="text-xs text-amber-700/70 mb-1">Denda</p>
                    <p className="text-xl font-bold text-amber-700">{formatCurrency(payment.fine)}</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-blue-50/60 rounded-2xl p-4 text-center"
                  >
                    <p className="text-xs text-blue-700/70 mb-1">Total</p>
                    <p className="text-xl font-bold text-apple-blue">{formatCurrency(payment.total)}</p>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {payment.fine > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl"
                    >
                      <p className="font-medium">⚠ Terlambat {getDaysLate(currentPeriod)} hari</p>
                      <p className="text-sm mt-1 opacity-80">
                        {getDaysLate(currentPeriod)} hari × Rp2.000/hari = {formatCurrency(payment.fine)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="pt-4 border-t border-apple-gray-200/50"
                >
                  {payment.status === 'unpaid' || payment.status === 'rejected' ? (
                    <Link
                      href={`/bayar?member=${selectedMemberId}&period=${currentPeriod}`}
                      className="btn btn-primary flex items-center justify-center gap-2 w-full py-4 text-lg rounded-2xl"
                    >
                      Bayar Sekarang
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  ) : payment.status === 'pending' ? (
                    <div className="text-center py-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-2 text-amber-600"
                      >
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Menunggu verifikasi admin</span>
                      </motion.div>
                      <p className="text-apple-gray-500 text-sm mt-2">
                        Bukti pembayaran telah diupload. Silakan tunggu verifikasi.
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-2"
                    >
                      <div className="inline-flex items-center gap-2 text-apple-green font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span>Sudah Lunas</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* History Card */}
        <motion.div variants={itemVariants}>
          <motion.div
            whileHover={cardHover}
            className="glass-panel rounded-3xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-apple-blue" />
              <h2 className="text-xl font-semibold tracking-tight">Riwayat Pembayaran</h2>
            </div>
            <div className="space-y-2">
              {history.map((item, index) => {
                const badge = getStatusBadge(item.status)
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3 bg-white/40 rounded-2xl hover:bg-white/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`badge ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="font-medium text-apple-gray-800">{formatPeriod(item.period)}</span>
                    </div>
                    {item.status === 'paid' && <CheckCircle className="w-5 h-5 text-apple-green" />}
                    {item.status === 'rejected' && <XCircle className="w-5 h-5 text-apple-red" />}
                    {item.status === 'pending' && <Clock className="w-5 h-5 text-apple-orange" />}
                  </motion.div>
                )
              })}
              {history.length === 0 && (
                <p className="text-center text-apple-gray-400 py-4">Belum ada riwayat pembayaran</p>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Admin Link */}
        <motion.div
          variants={itemVariants}
          className="mt-8 text-center"
        >
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-apple-gray-500 hover:text-apple-gray-800 transition-colors"
          >
            Login Admin
          </Link>
        </motion.div>
      </main>
    </motion.div>
  )
}