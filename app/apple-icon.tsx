import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: 180, height: 180,
        background: 'linear-gradient(145deg, #d4942a, #7a5010)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 130, fontWeight: 900, color: '#0e0c08',
          fontFamily: 'Georgia, serif', display: 'flex',
          marginTop: 8,
        }}>K</div>
      </div>
    ),
    { ...size }
  )
}
