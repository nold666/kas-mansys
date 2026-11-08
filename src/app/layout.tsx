import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KAS Lab - Pembayaran Kas Bulanan',
  description: 'Sistem pembayaran kas bulanan lab dengan QRIS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}