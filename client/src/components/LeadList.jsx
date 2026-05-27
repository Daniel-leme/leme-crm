import { useState } from 'react'
import { COMMERCIAL_STATUSES, COMMERCIAL_STATUS_META, fmtCurrency } from '../constants'
import StatusBadge from './StatusBadge'

function Initials({ name }) {
  const letters = (name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      background: 'var(--color-blue-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600, color: 'var(--color-blue-dark)', flexShrink: 0,
    }}>{letters}</div>
  )
}

function LeadRow({ lead, onSelect }) {
  const emb  = parseFloat(lead.embeddedValue) || 0
  const lost = !!lead.isLost
  return (
    <div
      onClick={() => onSelect(lead)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 'var(--radius-lg)',
        border: `1px solid ${lost ? 'var(--color-red-border, #f5c6cb)' : 'var(--color-border)'}`,
        background: lost ? 'var(--color-red-bg)' : 'var(--color-surface)',
        cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
        opacity: lost ? 0.75 : 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      <Initials name={lead.name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{lead.name || '(sem nome)'}</p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>
          {lead.phone || '—'}
          {lead.bank ? ` · ${lead.bank}` : ''}
          {lead.responsible ? ` · ${lead.responsible}` : ''}
        </p>
        {lost && lead.lossReason && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-red-dark)', fontWeight: 500 }}>
            <i className="ti ti-circle-x" style={{ fontSize: 11, marginRight: 3 }} />
            Perdido — {lead.lossReason}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <StatusBadge status={lost ? 'Perdido' : lead.status} size="sm" />
        {emb > 0 && (
          <span style={{ fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 500 }}>
            {fmtCurrency(emb)}
          </span>
        )}
      </div>
      <i className="ti ti-chevron-right" style={{ fontSize: 15, color: 'var(--color-text-hint)', flexShrink: 0 }} aria-hidden="true" />
    </div>
  )
}

// ── Esteira do funil (conveyor belt) ──────────────────────────────────────────
function ConveyorBelt({ leads, filterStatus, onFilter }) {
  const activeLeads = leads.filter(l => !l.isLost)
  const lostLeads   = leads.filter(l => !!l.isLost)

  const beltItems = COMMERCIAL_STATUSES.map(s => ({
    status: s,
    meta:   COMMERCIAL_STATUS_META[s],
    count:  activeLeads.filter(l => l.status === s).length,
  }))

  const isAll      = filterStatus === 'Todos'
  const isLostView = filterStatus === 'Perdas'

  // Card isolado (Todos / Perdas)
  const soloCard = (active, accentColor, accentBg) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 3, padding: '9px 16px', flexShrink: 0,
    border: active ? `1.5px solid ${accentColor}` : '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    background: active ? accentBg : 'var(--color-surface)',
    cursor: 'pointer', transition: 'background 0.15s',
    outline: 'none',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, width: '100%' }}>

      {/* Card "Todos" — isolado à esquerda */}
      <button onClick={() => onFilter('Todos')} style={soloCard(isAll, '#2C2C2A', '#F1EFE8')}>
        <i className="ti ti-layout-list" style={{ fontSize: 14, color: isAll ? '#2C2C2A' : 'var(--color-text-hint)' }} />
        <span style={{ fontSize: 10, fontWeight: isAll ? 600 : 400, color: isAll ? '#2C2C2A' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          Todos
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: isAll ? '#2C2C2A' : 'var(--color-text-primary)' }}>
          {activeLeads.length}
        </span>
      </button>

      {/* Barra central — ocupa todo o espaço restante, cards colados sem divisória */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'stretch', overflow: 'hidden',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface)',
      }}>
        {beltItems.map((item, idx) => {
          const isActive = filterStatus === item.status
          const isFirst  = idx === 0
          const isLast   = idx === beltItems.length - 1
          return (
            <button
              key={item.status}
              onClick={() => onFilter(item.status)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '9px 4px',
                border: 'none', outline: 'none',
                background: isActive ? item.meta.bg : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
                // borda lateral interna só quando ativo — destaca sem criar linhas em todos
                borderLeft:  isActive && !isFirst ? `1.5px solid ${item.meta.color}` : 'none',
                borderRight: isActive && !isLast  ? `1.5px solid ${item.meta.color}` : 'none',
                borderTop:    isActive ? `1.5px solid ${item.meta.color}` : 'none',
                borderBottom: isActive ? `1.5px solid ${item.meta.color}` : 'none',
                borderRadius: isFirst
                  ? 'calc(var(--radius-lg) - 1px) 0 0 calc(var(--radius-lg) - 1px)'
                  : isLast
                  ? '0 calc(var(--radius-lg) - 1px) calc(var(--radius-lg) - 1px) 0'
                  : 0,
                position: 'relative', zIndex: isActive ? 1 : 0,
              }}
            >
              <i className={`ti ${item.meta.icon}`} style={{ fontSize: 13, color: isActive ? item.meta.color : 'var(--color-text-hint)' }} />
              <span style={{
                fontSize: 10, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap',
                maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center',
                color: isActive ? item.meta.color : 'var(--color-text-secondary)',
              }}>
                {item.status.replace(/^\d+\.\s*/, '')}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: isActive ? item.meta.color : 'var(--color-text-primary)' }}>
                {item.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Card "Perdas" — isolado à direita */}
      <button onClick={() => onFilter('Perdas')} style={soloCard(isLostView, 'var(--color-red-dark)', 'var(--color-red-bg)')}>
        <i className="ti ti-circle-x" style={{ fontSize: 14, color: isLostView ? 'var(--color-red-dark)' : 'var(--color-text-hint)' }} />
        <span style={{ fontSize: 10, fontWeight: isLostView ? 600 : 400, color: isLostView ? 'var(--color-red-dark)' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          Perdas
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: isLostView ? 'var(--color-red-dark)' : 'var(--color-text-primary)' }}>
          {lostLeads.length}
        </span>
      </button>

    </div>
  )
}

export default function LeadList({ leads, onSelect, onNew }) {
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilter]   = useState('Todos')
  const [filterResp, setFilterResp] = useState('Todos')

  const activeLeads = leads.filter(l => !l.isLost)
  const lostLeads   = leads.filter(l => !!l.isLost)

  const responsibles = ['Todos', ...Array.from(new Set(leads.map(l => l.responsible).filter(Boolean)))]

  const showingLosses = filterStatus === 'Perdas'

  const applyFilters = (list) => list.filter(l => {
    const q = search.toLowerCase()
    const matchSearch =
      (l.name || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.cpf || '').includes(q) ||
      (l.bank || '').toLowerCase().includes(q)
    const matchStatus = (filterStatus === 'Todos' || showingLosses) ? true : l.status === filterStatus
    const matchResp   = filterResp === 'Todos' || l.responsible === filterResp
    return matchSearch && matchStatus && matchResp
  })

  const filteredActive = showingLosses ? [] : applyFilters(activeLeads)
  const filteredLost   = showingLosses ? applyFilters(lostLeads) : []

  // Métricas — baseadas em leads ativos (não perdidos)
  const totalEmbedded = activeLeads.reduce((s, l) => s + (parseFloat(l.embeddedValue) || 0), 0)
  const totalLeme     = activeLeads.reduce((s, l) => {
    const emb = parseFloat(l.embeddedValue) || 0
    return s + emb * ((l.feePercent ?? 50) / 100)
  }, 0)
  const concluded = activeLeads.filter(l => l.status === '5. Contrato Assinado').length
  const active    = activeLeads.filter(l => l.status !== '5. Contrato Assinado').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Cards de métricas ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total de leads',       value: activeLeads.length,          icon: 'ti-users',    bg: '#F1EFE8',                    color: '#2C2C2A' },
          { label: 'Em negociação',        value: active,                      icon: 'ti-loader',   bg: 'var(--color-blue-bg)',        color: 'var(--color-blue-dark)' },
          { label: 'Contrato assinado',    value: concluded,                   icon: 'ti-trophy',   bg: 'var(--color-green-bg)',       color: 'var(--color-green-dark)' },
          { label: 'Valor embutido',       value: fmtCurrency(totalEmbedded),  icon: 'ti-coin',     bg: '#FFF3CD',                    color: '#7A4F00' },
          { label: 'Estimado Leme',        value: fmtCurrency(totalLeme),      icon: 'ti-cash',     bg: 'var(--color-green-bg)',       color: 'var(--color-green-dark)' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <i className={`ti ${m.icon}`} style={{ fontSize: 14, color: m.color }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: m.color, opacity: 0.8 }}>{m.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: typeof m.value === 'string' ? 15 : 26, fontWeight: 600, color: m.color, lineHeight: 1 }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Esteira do funil ─────────────────────────────────────────────── */}
      <ConveyorBelt leads={leads} filterStatus={filterStatus} onFilter={setFilter} />

      {/* ── Barra de busca + filtro responsável ──────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--color-text-hint)' }} aria-hidden="true" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CPF, telefone ou banco…" style={{ paddingLeft: 34 }} />
        </div>
        <select value={filterResp} onChange={e => setFilterResp(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          {responsibles.map(r => <option key={r} value={r}>{r === 'Todos' ? 'Todos os responsáveis' : r}</option>)}
        </select>
        <button onClick={onNew} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-blue-mid)', color: '#fff', border: 'none', fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap' }}>
          <i className="ti ti-plus" style={{ fontSize: 17 }} aria-hidden="true" /> Novo Lead
        </button>
      </div>

      {/* ── Lista principal ───────────────────────────────────────────────── */}
      {!showingLosses && (
        filteredActive.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-hint)', fontSize: 14 }}>
            <i className="ti ti-users-group" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true" />
            {activeLeads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhum lead encontrado para esse filtro.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredActive.map(lead => <LeadRow key={lead.id} lead={lead} onSelect={onSelect} />)}
          </div>
        )
      )}

      {/* ── Seção de perdas ───────────────────────────────────────────────── */}
      {showingLosses && (
        filteredLost.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-hint)', fontSize: 14 }}>
            <i className="ti ti-circle-x" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true" />
            Nenhuma perda registrada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredLost.map(lead => <LeadRow key={lead.id} lead={lead} onSelect={onSelect} />)}
          </div>
        )
      )}
    </div>
  )
}
