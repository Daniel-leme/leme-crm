export function AlertModal({ open, title, message, onClose }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 320, boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 20 }}>

          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF8E1', borderRadius: 99, padding: '6px 14px 6px 6px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: '#D97706' }} />
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#D97706' }}>{title}</p>
          </div>

          {message && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>{message}</p>
          )}

          <div style={{ alignSelf: 'center' }}>
            <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 22px', borderRadius: 99, border: 'none', background: '#D97706', fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(217,119,6,0.35)' }}>
              <i className="ti ti-check" style={{ fontSize: 13 }} />Entendido
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function ConfirmModal({ open, title, message, confirmLabel = 'Excluir', onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 320, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative' }}>
        <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 20 }}>

          {/* Header */}
          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF1F0', borderRadius: 99, padding: '6px 14px 6px 6px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <i className="ti ti-trash" style={{ fontSize: 14, color: '#E53E3E' }} />
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#E53E3E' }}>{title}</p>
          </div>

          {/* Mensagem */}
          {message && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>{message}</p>
          )}

          {/* Footer */}
          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 99, padding: '4px 5px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 99, border: 'none', background: 'transparent', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <i className="ti ti-x" style={{ fontSize: 13 }} />Cancelar
            </button>
            <button onClick={onConfirm} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 99, border: 'none', background: '#E53E3E', fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(229,62,62,0.35)' }}>
              <i className="ti ti-trash" style={{ fontSize: 13 }} />{confirmLabel}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
