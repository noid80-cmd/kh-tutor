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
          style={{ position: 'fixed', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            fontSize: 13, color: 'rgba(212,168,67,0.6)', letterSpacing: '0.05em',
            textDecoration: 'underline', textUnderlineOffset: 3, zIndex: 9999, whiteSpace: 'nowrap' }}>
          by KH Music
        </a>
      </body>
    </html>
  )
}
