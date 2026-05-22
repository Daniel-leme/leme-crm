import { STATUS_META } from '../constants'

const FALLBACK = { bg: '#F1EFE8', color: '#2C2C2A', icon: 'ti-circle-dashed' }

export default function StatusBadge({ status, size = 'md' }) {
  const meta = STATUS_META[status] || FALLBACK
  const fontSize = size === 'sm' ? '11px' : '12px'
  const padding  = size === 'sm' ? '2px 8px' : '3px 10px'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize, fontWeight: 500, padding,
      borderRadius: 'var(--radius-full)',
      background: meta.bg, color: meta.color,
      whiteSpace: 'nowrap',
    }}>
      <i className={`ti ${meta.icon}`} style={{ fontSize }} aria-hidden="true" />
      {status}
    </span>
  )
}
