import { useState, useRef, useEffect } from 'react'

const KIND_META = {
  soon:       { color: '#15803D', bg: '#DCFCE7', icon: 'ti-clock', label: 'Em 15 min' },
  now:        { color: '#C62828', bg: '#FEE2E2', icon: 'ti-alarm',  label: 'Agora!' },
  allday:     { color: '#1565C0', bg: '#E3F2FD', icon: 'ti-calendar-event', label: 'Hoje' },
  late_notime:{ color: '#B45309', bg: '#FFF8E1', icon: 'ti-alert-triangle', label: 'Atrasada' },
  new_op:     { color: '#7C3AED', bg: '#F5F3FF', icon: 'ti-settings-2', label: 'Operacional' },
}

// ── Sino + Painel dropdown ─────────────────────────────────────────────────
export function NotificationBell({ notifications, unreadCount, onClear, onOpenLead }) {
  const [open, setOpen] = useState(false)
  const ref  = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Botão sino */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative',
          width: 38, height: 38,
          borderRadius: 'var(--radius-full)',
          border: open ? '1.5px solid var(--color-blue-mid)' : '1.5px solid var(--color-border)',
          background: open ? 'var(--color-blue-bg)' : 'var(--color-surface)',
          color: open ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        <i className={`ti ${unreadCount > 0 ? 'ti-bell-ringing' : 'ti-bell'}`} style={{ fontSize: 17 }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 17, height: 17, borderRadius: 99,
            background: '#DC2626', color: '#fff',
            fontSize: 10, fontWeight: 700, lineHeight: '17px',
            textAlign: 'center', padding: '0 4px',
            border: '2px solid #fff',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel */}
      {open && (
        <div style={{
          position: 'absolute', top: 46, right: 0,
          width: 340, maxHeight: 480,
          background: '#fff', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column',
          zIndex: 500, overflow: 'hidden',
        }}>
          {/* Header painel */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <i className="ti ti-bell" style={{ fontSize: 15, color: 'var(--color-text-secondary)' }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Notificações
            </span>
            {notifications.length > 0 && (
              <button
                onClick={onClear}
                style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--color-text-hint)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}
              >
                Limpar tudo
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-hint)', fontSize: 13 }}>
                <i className="ti ti-bell-off" style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }} />
                Nenhuma notificação
              </div>
            ) : notifications.map(n => {
              const meta = KIND_META[n.kind] || KIND_META.allday
              return (
                <div
                  key={n.id}
                  onClick={() => { if (n.task?.lead_id && onOpenLead) { onOpenLead(n.task.lead_id); setOpen(false) } }}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: n.task?.lead_id ? 'pointer' : 'default',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (n.task?.lead_id) e.currentTarget.style.background = 'var(--color-bg)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, background: meta.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <i className={`ti ${meta.icon}`} style={{ fontSize: 14, color: meta.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>{n.body}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-hint)', marginTop: 3 }}>{n.time}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Toasts ────────────────────────────────────────────────────────────────
export function NotificationToasts({ toasts, onDismiss, onOpenLead }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column-reverse', gap: 10,
      zIndex: 1000, pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const meta = KIND_META[t.kind] || KIND_META.allday
        return (
          <div
            key={t.toastId}
            style={{
              pointerEvents: 'all',
              display: 'flex', gap: 10, alignItems: 'flex-start',
              background: '#fff', borderRadius: 12,
              border: `1.5px solid ${meta.color}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              padding: '12px 14px',
              minWidth: 280, maxWidth: 340,
              animation: 'slideInToast 0.25s ease',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: meta.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className={`ti ${meta.icon}`} style={{ fontSize: 16, color: meta.color }} />
            </div>
            <div
              style={{ flex: 1, minWidth: 0, cursor: t.task?.lead_id ? 'pointer' : 'default' }}
              onClick={() => { if (t.task?.lead_id && onOpenLead) onOpenLead(t.task.lead_id) }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{t.title}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{t.body}</div>
            </div>
            <button
              onClick={() => onDismiss(t.toastId)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-hint)', fontSize: 14, padding: '0 2px', flexShrink: 0 }}
            >
              <i className="ti ti-x" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
