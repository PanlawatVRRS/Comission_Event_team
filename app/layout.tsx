import './globals.css'
import MainLayout from '@/components/MainLayout'
import { LanguageProvider } from '@/lib/i18n'
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
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* เช็กธีม/ภาษาตั้งต้นจาก localStorage ป้องกันหน้ากะพริบตอนรีโหลด */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                const savedLang = localStorage.getItem('lang');
                if (savedLang === 'th' || savedLang === 'en') {
                  document.documentElement.lang = savedLang;
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <LanguageProvider>
          <MainLayout>{children}</MainLayout>
        </LanguageProvider>
      </body>
    </html>
  )
}