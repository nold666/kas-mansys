'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  formatPeriod,
  formatCurrency,
  calculateFine,
  getDaysLate,
  addPeriods,
} from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Clock,
  XCircle,
  CalendarRange,
} from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 20, stiffness: 300 },
  },
} as const

const MONTH_OPTIONS = [1, 2, 3, 6, 12]

function BayarContent() {
  const searchParams = useSearchParams()
  const memberId = searchParams.get('member')
  const period = searchParams.get('period') || new Date().toISOString().slice(0, 7)
  const router = useRouter()

  const [member, setMember] = useState<{ id: string; name: string } | null>(null)
  const [selectedCount, setSelectedCount] = useState(1)
  const [statusByPeriod, setStatusByPeriod] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>('')

  const kasAmount = parseInt(process.env.NEXT_PUBLIC_KAS_AMOUNT || '10000')
  const fine = calculateFine(period)
  const selectedPeriods = addPeriods(period, selectedCount)
  const blockedPeriod = selectedPeriods.find(
    (p) => statusByPeriod[p] === 'paid' || statusByPeriod[p] === 'pending'
  )
  const blockedStatus = blockedPeriod ? statusByPeriod[blockedPeriod] : null
  const total = kasAmount * selectedCount + fine
  const canSubmit = !blockedPeriod && !!file

  useEffect(() => {
    if (memberId) {
      loadData()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, period, selectedCount])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, name')
        .eq('id', memberId!)
        .single()

      if (memberError) throw memberError
      setMember(memberData)

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('period, status')
        .eq('member_id', memberId!)
        .in('period', selectedPeriods)

      if (paymentError) throw paymentError
      const map: Record<string, string> = {}
      for (const row of paymentData || []) {
        map[(row as { period: string }).period] = (row as { status: string }).status
      }
      setStatusByPeriod(map)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB')
      return
    }

    if (!selectedFile.type.startsWith('image/')) {
      setError('File harus berupa gambar')
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setError('')
  }

  async function handleSubmit() {
    if (!file || !member || !canSubmit) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('memberId', member.id)
      formData.append('periods', JSON.stringify(selectedPeriods))

      const response = await fetch('/api/proof/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      setSuccess(true)
    } catch (err) {
      console.error('Error uploading proof:', err)
      setError('Gagal mengupload bukti pembayaran')
    } finally {
      setUploading(false)
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
            <div className="absolute inset-0 rounded-full border-4 border-apple-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-apple-blue border-transparent animate-spin" />
          </div>
          <p className="mt-6 text-apple-gray-500">Memuat data...</p>
        </motion.div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="container-main">
        <div className="glass-panel max-w-md mx-auto text-center rounded-3xl p-8">
          <AlertCircle className="w-16 h-16 text-apple-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold tracking-tight mb-2">Anggota tidak ditemukan</h2>
          <button onClick={() => router.push('/')} className="btn btn-primary mt-4">
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 250 }}
          className="glass-panel max-w-md mx-auto text-center rounded-3xl p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
          >
            <CheckCircle className="w-16 h-16 text-apple-green mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Bukti Terkirim!</h2>
          <p className="text-apple-gray-500 mb-6">
            Bukti untuk {selectedCount} bulan ({formatPeriod(selectedPeriods[0])} –{' '}
            {formatPeriod(selectedPeriods[selectedPeriods.length - 1])}) telah diupload.
            Silakan tunggu verifikasi admin.
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Kembali ke Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  if (blockedStatus === 'paid') {
    return (
      <div className="container-main">
        <div className="glass-panel max-w-md mx-auto text-center rounded-3xl p-8">
          <CheckCircle className="w-16 h-16 text-apple-green mx-auto mb-4" />
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Sudah Lunas</h2>
          <p className="text-apple-gray-500 mb-6">
            {formatPeriod(blockedPeriod!)} sudah diverifikasi.
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (blockedStatus === 'pending') {
    return (
      <div className="container-main">
        <div className="glass-panel max-w-md mx-auto text-center rounded-3xl p-8">
          <Clock className="w-16 h-16 text-apple-orange mx-auto mb-4" />
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Menunggu Verifikasi</h2>
          <p className="text-apple-gray-500 mb-6">
            Bukti untuk {formatPeriod(blockedPeriod!)} sudah diupload. Silakan tunggu verifikasi admin.
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="container-main">
      <div className="max-w-2xl mx-auto">
        <motion.button
          variants={itemVariants}
          whileHover={{ x: -4 }}
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-apple-gray-500 hover:text-apple-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </motion.button>

        {/* Info pembayaran */}
        <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarRange className="w-6 h-6 text-apple-blue" />
            <h1 className="text-2xl font-semibold tracking-tight">Pembayaran Kas</h1>
          </div>
          <p className="text-apple-gray-800 text-lg">{member.name}</p>
          <p className="text-apple-gray-500 text-sm">{formatPeriod(period)}</p>

          {/* Month count selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-apple-gray-500 mb-2">
              Bayar berapa bulan?
            </label>
            <div className="flex gap-1 p-1 bg-apple-gray-100/80 rounded-2xl">
              {MONTH_OPTIONS.map((count) => {
                const isSelected = count === selectedCount
                return (
                  <button
                    key={count}
                    onClick={() => setSelectedCount(count)}
                    className={`relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isSelected ? 'text-apple-blue' : 'text-apple-gray-500'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="month-count-indicator"
                        className="absolute inset-0 bg-white rounded-xl shadow-apple-sm"
                        transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                      />
                    )}
                    <span className="relative z-10">{count} Bulan</span>
                  </button>
                )
              })}
            </div>
            <AnimatePresence>
              <motion.p
                key={selectedPeriods.join(',')}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-apple-gray-500 mt-2"
              >
                {selectedPeriods.map(formatPeriod).join(', ')}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <motion.div whileHover={{ scale: 1.02 }} className="bg-apple-gray-50/80 rounded-2xl p-4">
              <p className="text-xs text-apple-gray-500 mb-1">Pokok ({selectedCount}×)</p>
              <p className="text-2xl font-bold text-apple-gray-800">
                {formatCurrency(kasAmount * selectedCount)}
              </p>
            </motion.div>
            {fine > 0 && (
              <motion.div whileHover={{ scale: 1.02 }} className="bg-amber-50/80 rounded-2xl p-4">
                <p className="text-xs text-amber-700/70 mb-1">Denda</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(fine)}</p>
                <p className="text-xs text-amber-600/80 mt-1">
                  {getDaysLate(period)} hari × Rp2.000 (hanya periode berjalan)
                </p>
              </motion.div>
            )}
          </div>

          <motion.div
            layout
            className="bg-blue-50/80 border border-apple-blue/10 rounded-2xl p-5 mt-4"
          >
            <p className="text-xs text-apple-blue/80 font-medium mb-1">Total Bayar</p>
            <motion.p
              key={total}
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 250 }}
              className="text-4xl font-bold tracking-tight text-apple-blue"
            >
              {formatCurrency(total)}
            </motion.p>
          </motion.div>
        </motion.div>

        {/* QRIS */}
        <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-6 md:p-8 mb-6 text-center">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Scan QRIS</h2>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-5 rounded-3xl shadow-apple-sm border border-apple-gray-100 inline-block"
          >
            <img
              src="/qris.jpg"
              alt="QRIS"
              className="w-64 h-64 object-contain"
            />
          </motion.div>
          <p className="text-apple-gray-800 mt-4 font-semibold">Nominal: {formatCurrency(total)}</p>
          <p className="text-sm text-apple-gray-500 mt-1">Transfer sesuai nominal</p>
        </motion.div>

        {/* Upload bukti */}
        <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Upload Bukti</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-apple-gray-500 mb-2">
                Foto Bukti Transfer
              </label>
              <div className="border-2 border-dashed border-apple-gray-200 hover:border-apple-blue/40 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-white/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="proof-upload"
                />
                <label htmlFor="proof-upload" className="cursor-pointer block">
                  {preview ? (
                    <div>
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-xs mx-auto rounded-2xl shadow-apple-sm"
                      />
                      <p className="text-sm text-apple-gray-500 mt-3">Klik untuk ganti gambar</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-apple-gray-300 mx-auto mb-2" />
                      <p className="text-apple-gray-800 font-medium">Klik untuk upload bukti</p>
                      <p className="text-sm text-apple-gray-400 mt-1">JPG, PNG · Maks 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!canSubmit || uploading}
              className="btn btn-primary w-full py-4 text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Mengirim...' : `Kirim Bukti (${selectedCount} Bulan)`}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function BayarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-apple-gray-200 border-t-apple-blue animate-spin mx-auto" />
          <p className="mt-4 text-apple-gray-500">Memuat...</p>
        </div>
      </div>
    }>
      <BayarContent />
    </Suspense>
  )
}
