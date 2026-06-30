import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KH Tutor',
  description: 'KH Music & Studio 강사 관리 시스템',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KH Tutor',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
