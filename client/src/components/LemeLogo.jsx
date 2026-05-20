/**
 * Logo da Leme Financeira — um leme náutico estilizado.
 * Você pode trocar facilmente por um SVG/PNG próprio depois.
 */
export default function LemeLogo({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 9,
      background: 'linear-gradient(135deg, var(--color-blue-mid) 0%, var(--color-blue-dark) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(8, 47, 79, 0.25)',
      flexShrink: 0,
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {/* Roda do leme: círculo + 8 pegadores */}
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="7" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
        <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
        <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
        <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
      </svg>
    </div>
  )
}
