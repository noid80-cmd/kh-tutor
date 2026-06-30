import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: 180, height: 180,
        background: 'linear-gradient(145deg, #0e0c08, #1c1608)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* background glow */}
        <div style={{
          position: 'absolute', width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.18) 0%, transparent 65%)',
          display: 'flex',
        }} />

        {/* top accent line */}
        <div style={{
          position: 'absolute', top: 28, width: 40, height: 2,
          background: 'linear-gradient(90deg, transparent, #d4a843, transparent)',
          display: 'flex',
        }} />

        {/* KH */}
        <div style={{
          fontSize: 68, fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(160deg, #f0c862 0%, #d4a843 50%, #a07820 100%)',
          color: '#d4a843',
          letterSpacing: -3, display: 'flex',
        }}>KH</div>

        {/* Music */}
        <div style={{
          fontSize: 18, fontWeight: 700, color: 'rgba(212,168,67,0.65)',
          letterSpacing: 5, marginTop: 6, display: 'flex',
        }}>MUSIC</div>

        {/* bottom accent line */}
        <div style={{
          position: 'absolute', bottom: 28, width: 40, height: 2,
          background: 'linear-gradient(90deg, transparent, #d4a843, transparent)',
          display: 'flex',
        }} />
      </div>
    ),
    { ...size }
  )
}
