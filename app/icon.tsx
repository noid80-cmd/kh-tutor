import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

async function loadFont() {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@900',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }
  ).then(r => r.text())
  const url = css.match(/src: url\((.+?)\) format/)?.[1]
  if (!url) return null
  return fetch(url).then(r => r.arrayBuffer())
}

export default async function Icon() {
  const fontData = await loadFont()

  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'linear-gradient(145deg, #d4942a, #7a5010)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 25, fontWeight: 900, color: '#0e0c08',
          fontFamily: 'Cinzel, serif',
          display: 'flex',
          lineHeight: 1,
          marginTop: -2,
        }}>K</div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: 'Cinzel', data: fontData, style: 'normal' as const, weight: 900 }] : [],
    }
  )
}
