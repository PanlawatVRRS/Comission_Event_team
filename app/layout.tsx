import './globals.css'
import MainLayout from '@/components/MainLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ACU Commission Manager',
  description: 'ระบบจัดการและคำนวณกระทบยอด Commission พนักงาน',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}