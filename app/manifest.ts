import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KH Tutor',
    short_name: 'KH Tutor',
    description: 'KH Music & Studio 강사 관리 시스템',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0b08',
    theme_color: '#d4942a',
    icons: [
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon', sizes: '32x32', type: 'image/png' },
    ],
  }
}
