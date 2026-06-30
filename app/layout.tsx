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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>{children}</body>
    </html>
  )
}
