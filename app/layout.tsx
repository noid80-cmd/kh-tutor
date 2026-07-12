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
      <body>
        {children}
        <a href="https://www.khmusic.co.kr" target="_blank" rel="noopener noreferrer"
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, textAlign: 'center',
            padding: '8px 0 10px', background: 'rgba(15,12,8,0.88)', backdropFilter: 'blur(8px)',
            fontSize: 11, fontWeight: 600, color: 'rgba(212,168,67,0.7)', letterSpacing: '0.15em',
            textDecoration: 'none', zIndex: 9999, whiteSpace: 'nowrap' }}>
          by KHMUSIC
        </a>
      </body>
    </html>
  )
}
