export default function IconPreview() {
  const fonts = [
    { name: 'Playfair Display', label: '1. Playfair Display (현재)', weight: 900 },
    { name: 'Abril Fatface', label: '2. Abril Fatface', weight: 400 },
    { name: 'Cinzel', label: '3. Cinzel', weight: 900 },
    { name: 'Oswald', label: '4. Oswald', weight: 700 },
    { name: 'Bebas Neue', label: '5. Bebas Neue', weight: 400 },
    { name: 'Anton', label: '6. Anton', weight: 400 },
    { name: 'Black Ops One', label: '7. Black Ops One', weight: 400 },
    { name: 'Righteous', label: '8. Righteous', weight: 400 },
  ]

  const imports = fonts.map(f =>
    `https://fonts.googleapis.com/css2?family=${f.name.replace(/ /g, '+')}:wght@${f.weight}&display=swap`
  ).join('&')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Abril+Fatface&family=Cinzel:wght@900&family=Oswald:wght@700&family=Bebas+Neue&family=Anton&family=Black+Ops+One&family=Righteous&display=swap');
      `}</style>

      <div style={{ background: '#111', minHeight: '100vh', padding: 40 }}>
        <h1 style={{ color: '#d4a843', fontWeight: 800, marginBottom: 8, fontFamily: 'sans-serif' }}>폰트 샘플</h1>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 40, fontFamily: 'sans-serif' }}>마음에 드는 번호 알려주세요</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
          {fonts.map(f => (
            <div key={f.name} style={{ textAlign: 'center' }}>
              <div style={{
                width: 160, height: 160, borderRadius: 36,
                background: 'linear-gradient(145deg, #d4942a, #7a5010)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: 120, fontWeight: f.weight, color: '#0e0c08',
                  fontFamily: `'${f.name}', serif`,
                  lineHeight: 1,
                  marginTop: -6,
                }}>K</span>
              </div>
              <p style={{ color: '#aaa', marginTop: 12, fontSize: 13, fontFamily: 'sans-serif' }}>{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
