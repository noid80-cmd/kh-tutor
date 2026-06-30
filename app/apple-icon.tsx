import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

async function loadFont() {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }
  ).then(r => r.text())
  const url = css.match(/src: url\((.+?)\) format/)?.[1]
  if (!url) return null
  return fetch(url).then(r => r.arrayBuffer())
}

export default async function AppleIcon() {
  const fontData = await loadFont()

  return new ImageResponse(
    (
      <div style={{
        width: 180, height: 180,
        background: 'linear-gradient(145deg, #d4942a, #7a5010)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 138, fontWeight: 900, color: '#0e0c08',
          fontFamily: 'Playfair Display, serif',
          display: 'flex',
          marginTop: -6,
        }}>K</div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: 'Playfair Display', data: fontData, style: 'normal' as const, weight: 900 }] : [],
    }
  )
}
