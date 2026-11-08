export function getCurrentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function addPeriods(startPeriod: string, count: number): string[] {
  const [year, month] = startPeriod.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(year, month - 1 + i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

export function getDaysLate(period: string): number {
  const [year, month] = period.split('-').map(Number)
  const deadline = new Date(year, month - 1, parseInt(process.env.NEXT_PUBLIC_DEADLINE_DAY || '2'))
  const today = new Date()

  if (today <= deadline) return 0

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((today.getTime() - deadline.getTime()) / msPerDay)
}

export function calculateFine(period: string): number {
  const daysLate = getDaysLate(period)
  const finePerDay = parseInt(process.env.NEXT_PUBLIC_DENDA_PER_DAY || '2000')

  return daysLate * finePerDay
}

export function calculateTotal(period: string): number {
  const baseAmount = parseInt(process.env.NEXT_PUBLIC_KAS_AMOUNT || '10000')
  const fine = calculateFine(period)
  return baseAmount + fine
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${monthNames[parseInt(month) - 1]} ${year}`
}

export function getStatusBadge(status: string): { label: string; className: string } {
  const map = {
    paid: { label: 'Lunas', className: 'badge-paid' },
    pending: { label: 'Menunggu', className: 'badge-pending' },
    unpaid: { label: 'Belum Bayar', className: 'badge-unpaid' },
    rejected: { label: 'Ditolak', className: 'badge-rejected' },
  }
  return map[status as keyof typeof map] || map.unpaid
}