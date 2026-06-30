export default function IconPreview() {
  return (
    <div style={{ background: '#111', minHeight: '100vh', padding: 40 }}>
      <h1 style={{ color: '#d4a843', fontWeight: 800, marginBottom: 8 }}>KH Tutor 아이콘 샘플</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 40 }}>마음에 드는 번호 알려주세요</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>

        {/* 1. Minimal serif */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0e0c08" />
                <stop offset="100%" stopColor="#1c1508" />
              </linearGradient>
              <linearGradient id="gold1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d060" />
                <stop offset="100%" stopColor="#a07820" />
              </linearGradient>
              <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d4a843" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#d4a843" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg1)" />
            <circle cx="90" cy="90" r="75" fill="url(#glow1)" />
            <text x="90" y="120" textAnchor="middle" fill="url(#gold1)"
              fontSize="110" fontWeight="900" fontFamily="Georgia, serif">K</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>1. 미니멀</p>
        </div>

        {/* 2. Circle emblem */}
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
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg2)" />
            <circle cx="90" cy="90" r="68" fill="none" stroke="url(#gold2)" strokeWidth="2.5" />
            <circle cx="90" cy="90" r="62" fill="none" stroke="#d4a843" strokeWidth="0.5" strokeOpacity="0.3" />
            <text x="90" y="116" textAnchor="middle" fill="url(#gold2)"
              fontSize="82" fontWeight="900" fontFamily="Georgia, serif">K</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>2. 엠블럼</p>
        </div>

        {/* 3. Gold bg inverted */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d4942a" />
                <stop offset="100%" stopColor="#7a5010" />
              </linearGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg3)" />
            <text x="90" y="120" textAnchor="middle" fill="#0e0c08"
              fontSize="110" fontWeight="900" fontFamily="Georgia, serif">K</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>3. 골드 배경</p>
        </div>

        {/* 4. Diamond frame */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0a0808" />
                <stop offset="100%" stopColor="#1a1208" />
              </linearGradient>
              <linearGradient id="gold4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d060" />
                <stop offset="100%" stopColor="#c09030" />
              </linearGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg4)" />
            <polygon points="90,22 158,90 90,158 22,90" fill="none" stroke="url(#gold4)" strokeWidth="2" />
            <polygon points="90,32 148,90 90,148 32,90" fill="none" stroke="#d4a843" strokeWidth="0.5" strokeOpacity="0.3" />
            <text x="90" y="116" textAnchor="middle" fill="url(#gold4)"
              fontSize="82" fontWeight="900" fontFamily="Georgia, serif">K</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>4. 다이아몬드</p>
        </div>

        {/* 5. Bracket frame */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0e0c08" />
                <stop offset="100%" stopColor="#181208" />
              </linearGradient>
              <linearGradient id="gold5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d060" />
                <stop offset="100%" stopColor="#b08828" />
              </linearGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg5)" />
            <path d="M58 38 L38 38 L38 142 L58 142" fill="none" stroke="url(#gold5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M122 38 L142 38 L142 142 L122 142" fill="none" stroke="url(#gold5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <text x="90" y="118" textAnchor="middle" fill="url(#gold5)"
              fontSize="84" fontWeight="900" fontFamily="Georgia, serif">K</text>
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>5. 브라켓</p>
        </div>

        {/* 6. Dot accent */}
        <div style={{ textAlign: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="bg6" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0e0c08" />
                <stop offset="100%" stopColor="#1c1508" />
              </linearGradient>
              <linearGradient id="gold6" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d060" />
                <stop offset="100%" stopColor="#a07820" />
              </linearGradient>
            </defs>
            <rect width="180" height="180" rx="40" fill="url(#bg6)" />
            <text x="90" y="116" textAnchor="middle" fill="url(#gold6)"
              fontSize="100" fontWeight="900" fontFamily="Georgia, serif">K</text>
            <circle cx="90" cy="148" r="5" fill="#d4a843" />
            <circle cx="74" cy="148" r="3" fill="#d4a843" opacity="0.45" />
            <circle cx="106" cy="148" r="3" fill="#d4a843" opacity="0.45" />
          </svg>
          <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>6. 도트</p>
        </div>

      </div>
    </div>
  )
}
