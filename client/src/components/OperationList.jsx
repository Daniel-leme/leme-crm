import { useState } from 'react'
import { OPERATIONAL_STATUSES, OPERATIONAL_STATUS_META, fmtCurrency } from '../constants'

const STATUS_SIDE_BG = {
  'Documentação':              '#E3F2FD',
  'Solicitação de Estorno':    '#FFF8E1',
  'Aguardando Estorno':        '#FFF3E0',
  'Cobrança':                  '#F3E5F5',
  'Transferência de Repasses': '#C8E6C9',
  'Concluído':                 '#A5D6A7',
  'Perdido':                   '#FEE2E2',
}

export default function OperationList({ operations, onSelect }) {
  const [filterStatus, setFilter]   = useState('Todos')
  const [filterResp, setFilterResp] = useState('Todos')
  const [search, setSearch]         = useState('')

  const responsibles = ['Todos', ...Array.from(new Set(operations.map(o => o.responsible).filter(Boolean)))]

  const activeOps = operations.filter(o => !o.isLost)
  const lostOps   = operations.filter(o => !!o.isLost)

  const showingLosses = filterStatus === 'Perdas'

  const filtered = (showingLosses ? lostOps : activeOps).filter(op => {
    const q = search.toLowerCase()
    const matchSearch =
      (op.lead_name || '').toLowerCase().includes(q) ||
      (op.lead_phone || '').includes(q) ||
      (op.lead_source || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'Todos' || showingLosses || op.status === filterStatus
    const matchResp   = filterResp === 'Todos' || op.responsible === filterResp
    return matchSearch && matchStatus && matchResp
  })

  // Métricas (apenas operações ativas)
  const concluded    = activeOps.filter(o => o.status === 'Concluído').length
  const totalEmb     = activeOps.reduce((s, o) => s + (parseFloat(o.embeddedValue) || 0), 0)
  const totalReceived = operations
    .filter(o => ['Transferência de Repasses', 'Concluído'].includes(o.status))
    .reduce((s, o) => s + (parseFloat(o.repaymentValue) || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="ti ti-settings-2" style={{ fontSize: 22, color: '#1565C0' }} aria-hidden="true" />
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Funil Operacional</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Operações geradas a partir de contratos assinados</p>
        </div>
      </div>

      {/* ── Cards de métricas ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {[
          { label: 'Em operação',      value: activeOps.length,          icon: 'ti-settings',      bg: '#E3F2FD',  color: '#1565C0' },
          { label: 'Concluídos',       value: concluded,                  icon: 'ti-trophy',        bg: '#A5D6A7',  color: '#1B5E20' },
          { label: 'Valor em aberto',  value: fmtCurrency(totalEmb),      icon: 'ti-coin',          bg: '#FFF3CD',  color: '#7A4F00' },
          { label: 'Repasse recebido', value: fmtCurrency(totalReceived), icon: 'ti-circle-check',  bg: '#C8E6C9',  color: '#1B5E20' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <i className={`ti ${m.icon}`} style={{ fontSize: 14, color: m.color }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: m.color, opacity: 0.85 }}>{m.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: typeof m.value === 'string' ? 15 : 26, fontWeight: 600, color: m.color, lineHeight: 1 }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Barra de status (mesmo padrão do comercial) ──────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, width: '100%' }}>

        {/* Todos — isolado à esquerda */}
        <button
          onClick={() => setFilter('Todos')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, padding: '9px 16px', flexShrink: 0,
            border: filterStatus === 'Todos' ? '1.5px solid #1565C0' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            background: filterStatus === 'Todos' ? '#E3F2FD' : 'var(--color-surface)',
            cursor: 'pointer', transition: 'background 0.15s', outline: 'none',
          }}
        >
          <i className="ti ti-settings-2" style={{ fontSize: 14, color: filterStatus === 'Todos' ? '#1565C0' : 'var(--color-text-hint)' }} />
          <span style={{ fontSize: 10, fontWeight: filterStatus === 'Todos' ? 600 : 400, color: filterStatus === 'Todos' ? '#1565C0' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Todos</span>
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: filterStatus === 'Todos' ? '#1565C0' : 'var(--color-text-primary)' }}>{activeOps.length}</span>
        </button>

        {/* Barra central — cards colados */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'stretch', overflow: 'hidden',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface)',
        }}>
          {OPERATIONAL_STATUSES.map((s, idx) => {
            const isActive = filterStatus === s
            const meta     = OPERATIONAL_STATUS_META[s]
            const isFirst  = idx === 0
            const isLast   = idx === OPERATIONAL_STATUSES.length - 1
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 3, padding: '9px 4px',
                  border: 'none', outline: 'none',
                  background: isActive ? meta.bg : 'transparent',
                  cursor: 'pointer', transition: 'background 0.15s',
                  borderLeft:   isActive && !isFirst ? `1.5px solid ${meta.color}` : 'none',
                  borderRight:  isActive && !isLast  ? `1.5px solid ${meta.color}` : 'none',
                  borderTop:    isActive ? `1.5px solid ${meta.color}` : 'none',
                  borderBottom: isActive ? `1.5px solid ${meta.color}` : 'none',
                  borderRadius: isFirst
                    ? 'calc(var(--radius-lg) - 1px) 0 0 calc(var(--radius-lg) - 1px)'
                    : isLast
                    ? '0 calc(var(--radius-lg) - 1px) calc(var(--radius-lg) - 1px) 0'
                    : 0,
                  position: 'relative', zIndex: isActive ? 1 : 0,
                }}
              >
                <i className={`ti ${meta.icon}`} style={{ fontSize: 13, color: isActive ? meta.color : 'var(--color-text-hint)' }} />
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap',
                  maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center',
                  color: isActive ? meta.color : 'var(--color-text-secondary)',
                }}>
                  {s.replace(/^\d+\.\s*/, '')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: isActive ? meta.color : 'var(--color-text-primary)' }}>
                  {activeOps.filter(o => o.status === s).length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Perdas — isolado à direita */}
        <button
          onClick={() => setFilter('Perdas')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, padding: '9px 16px', flexShrink: 0,
            border: showingLosses ? '1.5px solid var(--color-red-dark)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            background: showingLosses ? 'var(--color-red-bg)' : 'var(--color-surface)',
            cursor: 'pointer', transition: 'background 0.15s', outline: 'none',
          }}
        >
          <i className="ti ti-circle-x" style={{ fontSize: 14, color: showingLosses ? 'var(--color-red-dark)' : 'var(--color-text-hint)' }} />
          <span style={{ fontSize: 10, fontWeight: showingLosses ? 600 : 400, color: showingLosses ? 'var(--color-red-dark)' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Perdas</span>
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: showingLosses ? 'var(--color-red-dark)' : 'var(--color-text-primary)' }}>{lostOps.length}</span>
        </button>

      </div>

      {/* ── Busca + filtro responsável ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--color-text-hint)' }} aria-hidden="true" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou origem…" style={{ paddingLeft: 34 }} />
        </div>
        <select value={filterResp} onChange={e => setFilterResp(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          {responsibles.map(r => <option key={r} value={r}>{r === 'Todos' ? 'Todos os responsáveis' : r}</option>)}
        </select>
      </div>

      {/* ── Lista de operações ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-hint)', fontSize: 14 }}>
          <i className="ti ti-settings-off" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true" />
          {operations.length === 0 ? 'Nenhuma operação ainda. Leads chegam aqui ao assinar contrato.' : 'Nenhuma operação encontrada para esse filtro.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(op => {
            const emb      = parseFloat(op.embeddedValue) || 0
            const repay    = parseFloat(op.repaymentValue) || 0
            const lost     = !!op.isLost
            const statusKey = lost ? 'Perdido' : op.status
            const meta      = OPERATIONAL_STATUS_META[statusKey] || OPERATIONAL_STATUS_META['Documentação']
            const sideBg    = STATUS_SIDE_BG[statusKey] || '#E3F2FD'
            const initials  = (op.lead_name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'

            return (
              <div key={op.id} onClick={() => onSelect(op)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  overflow: 'hidden', cursor: 'pointer',
                  transition: 'box-shadow 0.15s',
                  opacity: lost ? 0.75 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Coluna esquerda — identidade */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: meta.bg, border: `1.5px solid ${meta.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: meta.color,
                  }}>{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {op.lead_name || '(sem nome)'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {op.lead_phone || '—'}
                      {op.lead_source ? ` · ${op.lead_source}` : ''}
                      {op.responsible ? ` · ${op.responsible}` : ''}
                    </p>
                    {lost && op.lossReason && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-red-dark)', fontWeight: 500 }}>
                        <i className="ti ti-circle-x" style={{ fontSize: 11, marginRight: 3 }} />
                        Perdido — {op.lossReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Coluna direita — status + valor */}
                <div style={{
                  width: 170, display: 'flex', flexDirection: 'column',
                  alignItems: 'flex-end', justifyContent: 'center',
                  padding: '10px 14px', gap: 4,
                  background: sideBg,
                  borderLeft: `1px solid ${meta.color}22`,
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                    <i className={`ti ${meta.icon}`} style={{ fontSize: 12, color: meta.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{statusKey}</span>
                  </span>
                  {emb > 0 ? (
                    <>
                      <span style={{ fontSize: 17, fontWeight: 800, color: '#15803D', lineHeight: 1 }}>
                        {fmtCurrency(emb)}
                      </span>
                      {repay > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-hint)', lineHeight: 1 }}>
                          repasse {fmtCurrency(repay)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--color-text-hint)' }}>sem valores</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
