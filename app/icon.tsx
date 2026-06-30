import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'linear-gradient(145deg, #0e0c08, #1c1608)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* gold glow */}
        <div style={{
          position: 'absolute', width: 24, height: 24, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.35) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          fontSize: 13, fontWeight: 900, color: '#d4a843',
          letterSpacing: -0.5, display: 'flex',
        }}>KH</div>
      </div>
    ),
    { ...size }
  )
}
