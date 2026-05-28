import { STATUS_META } from '../constants'

const FALLBACK = { bg: '#F1EFE8', color: '#2C2C2A', icon: 'ti-circle-dashed' }

export default function StatusBadge({ status, size = 'md' }) {
  const meta = STATUS_META[status] || FALLBACK
  const fontSize  = size === 'sm' ? '12px' : '13px'
  const iconSize  = size === 'sm' ? '11px' : '12px'

  if (size === 'sm') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize, fontWeight: 600, color: meta.color,
        whiteSpace: 'nowrap',
      }}>
        <i className={`ti ${meta.icon}`} style={{ fontSize: iconSize }} aria-hidden="true" />
        {status}
      </span>
    )
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize, fontWeight: 500, padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      background: meta.bg, color: meta.color,
      whiteSpace: 'nowrap',
    }}>
      <i className={`ti ${meta.icon}`} style={{ fontSize: iconSize }} aria-hidden="true" />
      {status}
    </span>
  )
}
