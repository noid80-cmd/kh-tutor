export default function IconPreview() {
  return (
    <div style={{ background: '#111', minHeight: '100vh', padding: 40 }}>
      <h1 style={{ color: '#d4a843', fontWeight: 800, marginBottom: 8 }}>KH Tutor 아이콘 샘플</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 40 }}>마음에 드는 번호 알려주세요</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>

        {/* 1. Minimal */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0e0c08" />
                <stop offset="100%" stopColor="#1c1508" />
              </linearGradient>
              <linearGradient id="gold1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0c85a" />
                <stop offset="100%" stopColor="#a87820" />
              </linearGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg1)" />
            <text x="90" y="108" textAnchor="middle" fill="url(#gold1)"
              fontSize="80" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="-4">KH</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>1. 미니멀</p>
        </div>

        {/* 2. Emblem Circle */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0e0c08" />
                <stop offset="100%" stopColor="#1c1508" />
              </linearGradient>
              <linearGradient id="gold2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0c85a" />
                <stop offset="100%" stopColor="#c09030" />
              </linearGradient>
              <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d4a843" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#d4a843" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg2)" />
            <circle cx="90" cy="82" r="62" fill="url(#glow2)" />
            <circle cx="90" cy="82" r="60" fill="none" stroke="url(#gold2)" strokeWidth="2" />
            <circle cx="90" cy="82" r="55" fill="none" stroke="#d4a843" strokeWidth="0.5" strokeOpacity="0.4" />
            <text x="90" y="100" textAnchor="middle" fill="url(#gold2)"
              fontSize="52" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="-2">KH</text>
            <text x="90" y="158" textAnchor="middle" fill="#d4a843"
              fontSize="11" fontWeight="700" fontFamily="sans-serif" letterSpacing="4">MUSIC</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>2. 엠블럼</p>
        </div>

        {/* 3. Bracket / Frame */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0e0c08" />
                <stop offset="100%" stopColor="#181208" />
              </linearGradient>
              <linearGradient id="gold3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d060" />
                <stop offset="100%" stopColor="#b08828" />
              </linearGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg3)" />
            {/* top bracket */}
            <path d="M50 52 L50 44 L130 44 L130 52" fill="none" stroke="url(#gold3)" strokeWidth="2.5" strokeLinecap="round" />
            {/* bottom bracket */}
            <path d="M50 128 L50 136 L130 136 L130 128" fill="none" stroke="url(#gold3)" strokeWidth="2.5" strokeLinecap="round" />
            <text x="90" y="104" textAnchor="middle" fill="url(#gold3)"
              fontSize="62" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="-3">KH</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>3. 프레임</p>
        </div>

        {/* 4. Gold BG (inverted) */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c8922a" />
                <stop offset="100%" stopColor="#7a5010" />
              </linearGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg4)" />
            <text x="90" y="108" textAnchor="middle" fill="#0e0c08"
              fontSize="80" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="-4">KH</text>
            <text x="90" y="134" textAnchor="middle" fill="rgba(14,12,8,0.55)"
              fontSize="13" fontWeight="700" fontFamily="sans-serif" letterSpacing="5">MUSIC</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>4. 골드 배경</p>
        </div>

        {/* 5. Music Note */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0e0c08" />
                <stop offset="100%" stopColor="#1c1508" />
              </linearGradient>
              <linearGradient id="gold5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0c85a" />
                <stop offset="100%" stopColor="#a87820" />
              </linearGradient>
              <radialGradient id="glow5" cx="50%" cy="45%" r="40%">
                <stop offset="0%" stopColor="#d4a843" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#d4a843" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg5)" />
            <circle cx="90" cy="90" r="80" fill="url(#glow5)" />
            {/* treble clef simplified path */}
            <text x="44" y="108" fill="url(#gold5)" fontSize="72" fontWeight="900"
              fontFamily="Georgia, serif" letterSpacing="-2">KH</text>
            {/* music note accent top-right */}
            <ellipse cx="145" cy="46" rx="8" ry="6" fill="#d4a843" opacity="0.9" />
            <line x1="153" y1="46" x2="153" y2="22" stroke="#d4a843" strokeWidth="2.5" />
            <ellipse cx="153" cy="22" rx="5" ry="3.5" fill="#d4a843" opacity="0.6" transform="rotate(-15 153 22)" />
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>5. 음표 포인트</p>
        </div>

        {/* 6. Diamond */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg6" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0a0808" />
                <stop offset="100%" stopColor="#1a1208" />
              </linearGradient>
              <linearGradient id="gold6" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d060" />
                <stop offset="100%" stopColor="#c09030" />
              </linearGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg6)" />
            {/* diamond shape */}
            <polygon points="90,28 148,90 90,152 32,90" fill="none" stroke="url(#gold6)" strokeWidth="2" />
            <polygon points="90,38 138,90 90,142 42,90" fill="none" stroke="#d4a843" strokeWidth="0.6" strokeOpacity="0.35" />
            <text x="90" y="107" textAnchor="middle" fill="url(#gold6)"
              fontSize="52" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="-2">KH</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>6. 다이아몬드</p>
        </div>

      </div>
    </div>
  )
}
