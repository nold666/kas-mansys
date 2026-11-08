'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, LogIn, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    const data = await res.json()
    if (res.ok) {
      router.push('/admin')
    } else {
      setError(data.error || 'Password salah')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 250 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 200 }}
            className="w-16 h-16 bg-apple-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-4"
          >
            <Lock className="w-8 h-8 text-apple-blue" />
          </motion.div>
          <h1 className="text-2xl font-semibold tracking-tight">Login Admin</h1>
          <p className="text-apple-gray-500 mt-2">Masuk untuk mengelola pembayaran</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 md:p-8">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-apple-gray-500 mb-2">
                Password Admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                autoFocus
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Memproses...' : 'Masuk'}
            </motion.button>
          </form>

          <div className="mt-5 text-center">
            <a href="/" className="text-sm text-apple-gray-500 hover:text-apple-gray-800 transition-colors">
              ← Kembali ke Home
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
