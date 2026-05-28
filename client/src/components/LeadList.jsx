import { useState } from 'react'
import { COMMERCIAL_STATUSES, COMMERCIAL_STATUS_META, OPERATIONAL_STATUSES, fmtCurrency } from '../constants'
import StatusBadge from './StatusBadge'


const STATUS_SIDE_BG = {
  'Novo Lead':         '#F1EFE8',
  'Qualificação':      '#FFF8E1',
  'Qualificado':       '#EFF6FF',
  'Revisão':           '#F5F3FF',
  'Negociação':        '#FFF0E6',
  'Contrato Assinado': '#D4EDDA',
  'Perdido':           '#FEE2E2',
}

function LeadRow({ lead, onSelect }) {
  const emb       = parseFloat(lead.embeddedValue) || 0
  const leme      = emb * ((lead.feePercent ?? 50) / 100)
  const lost      = !!lead.isLost
  const statusKey = lost ? 'Perdido' : lead.status
  const meta      = COMMERCIAL_STATUS_META[statusKey] || COMMERCIAL_STATUS_META['Novo Lead']
  const sideBg    = STATUS_SIDE_BG[statusKey] || '#F1EFE8'
  const hasValues = emb > 0

  return (
    <div
      onClick={() => onSelect(lead)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        borderRadius: 12,
        border: `1px solid ${lost ? '#f5c6cb' : 'var(--color-border)'}`,
        background: 'var(--color-surface)',
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: lost ? 0.75 : 1,
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = meta.color + '66' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = lost ? '#f5c6cb' : 'var(--color-border)' }}
    >
      {/* ── Coluna esquerda: identidade ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
        {/* Avatar com cor do status */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: meta.bg, border: `2px solid ${meta.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: meta.color,
        }}>
          {(lead.name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'}
        </div>

        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{lead.name || '(sem nome)'}</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-hint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[lead.phone, lead.bank, lead.responsible].filter(Boolean).join(' · ') || '—'}
          </p>
          {lost && (
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-red-dark)', fontWeight: 500 }}>
              Perdido em <strong>{lead.lastActiveStatus || lead.status}</strong>
              {lead.lossReason ? ` · ${lead.lossReason}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* ── Coluna direita: status + potencial ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center',
        padding: '13px 16px', gap: 6,
        borderLeft: `1px solid ${meta.color}22`,
        background: sideBg,
        width: 170, flexShrink: 0,
      }}>
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className={`ti ${meta.icon}`} style={{ fontSize: 13, color: meta.color }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, whiteSpace: 'nowrap' }}>
            {statusKey}
          </span>
        </div>

        {/* Potencial */}
        {hasValues ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#15803D', lineHeight: 1 }}>
              {fmtCurrency(leme)}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-text-hint)', whiteSpace: 'nowrap' }}>
              embutido {fmtCurrency(emb)}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>sem valores</span>
        )}
      </div>
    </div>
  )
}

// ── Esteira do funil (conveyor belt) ──────────────────────────────────────────
// filterStatus pode ser:
//   'Todos' | 'Perdas' | 'Perdas:ETAPA' | 'Contrato Assinado' | qualquer status ativo
function ConveyorBelt({ leads, filterStatus, onFilter }) {
  const activeLeads = leads.filter(l => !l.isLost)
  const lostLeads   = leads.filter(l => !!l.isLost)

  const ACTIVE_STATUSES = COMMERCIAL_STATUSES.filter(s => s !== 'Contrato Assinado')

  const concludedCount = activeLeads.filter(l => l.status === 'Contrato Assinado').length
  const concludedMeta  = COMMERCIAL_STATUS_META['Contrato Assinado']

  const isLostMode  = filterStatus === 'Perdas' || filterStatus.startsWith('Perdas:')
  const isAll       = filterStatus === 'Todos'
  const isConcluded = filterStatus === 'Contrato Assinado'

  // No modo perdas, qual etapa está selecionada dentro da barra?
  const lostStage = isLostMode && filterStatus.startsWith('Perdas:')
    ? filterStatus.slice('Perdas:'.length)
    : null  // null = "todas as perdas" (card esquerdo)

  const RED      = 'var(--color-red-dark)'
  const RED_BG   = 'var(--color-red-bg)'
  const RED_MID  = '#FCA5A5'

  // Conta perdas por etapa (usando lastActiveStatus)
  const lostByStage = (s) => lostLeads.filter(l => (l.lastActiveStatus || l.status) === s).length

  // Perdas operacionais = leads perdidos cujo lastActiveStatus pertence ao funil operacional
  const opLostLeads = lostLeads.filter(l => OPERATIONAL_STATUSES.includes(l.lastActiveStatus))
  const opLostCount = opLostLeads.length
  const isOpLostStage = isLostMode && lostStage === '__op__'

  // Card isolado (solo)
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

      {/* Card esquerdo — "Leads Ativos" ou "Total Perdas" */}
      {isLostMode ? (
        <button
          onClick={() => onFilter('Perdas')}
          style={soloCard(!lostStage, RED, RED_BG)}
        >
          <i className="ti ti-circle-x" style={{ fontSize: 14, color: !lostStage ? RED : 'var(--color-text-hint)' }} />
          <span style={{ fontSize: 10, fontWeight: !lostStage ? 600 : 400, color: !lostStage ? RED : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            Total Perdas
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: !lostStage ? RED : 'var(--color-text-primary)' }}>
            {lostLeads.length}
          </span>
        </button>
      ) : (
        <button onClick={() => onFilter('Todos')} style={soloCard(isAll, '#2C2C2A', '#F1EFE8')}>
          <i className="ti ti-layout-list" style={{ fontSize: 14, color: isAll ? '#2C2C2A' : 'var(--color-text-hint)' }} />
          <span style={{ fontSize: 10, fontWeight: isAll ? 600 : 400, color: isAll ? '#2C2C2A' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            Leads Ativos
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: isAll ? '#2C2C2A' : 'var(--color-text-primary)' }}>
            {activeLeads.filter(l => l.status !== 'Contrato Assinado').length}
          </span>
        </button>
      )}

      {/* Barra central */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'stretch', overflow: 'hidden',
        border: isLostMode ? `1.5px solid ${RED_MID}` : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: isLostMode ? RED_BG : 'var(--color-surface)',
        transition: 'border-color 0.2s, background 0.2s',
      }}>
        {ACTIVE_STATUSES.map((s, idx) => {
          const isFirst   = idx === 0
          const isLast    = idx === ACTIVE_STATUSES.length - 1
          const meta      = COMMERCIAL_STATUS_META[s]
          // No modo normal: destaca o status selecionado; no modo perdas: destaca a etapa de perda
          const isActive  = isLostMode ? lostStage === s : filterStatus === s
          const count     = isLostMode ? lostByStage(s) : activeLeads.filter(l => l.status === s).length
          const activeColor = isLostMode ? RED : meta.color
          const activeBg    = isLostMode ? '#FEE2E2' : meta.bg

          return (
            <button
              key={s}
              onClick={() => onFilter(isLostMode ? `Perdas:${s}` : s)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '9px 2px',
                border: 'none', outline: 'none',
                background: isActive ? activeBg : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
                borderLeft:   isActive && !isFirst ? `1.5px solid ${activeColor}` : 'none',
                borderRight:  isActive && !isLast  ? `1.5px solid ${activeColor}` : 'none',
                borderTop:    isActive ? `1.5px solid ${activeColor}` : 'none',
                borderBottom: isActive ? `1.5px solid ${activeColor}` : 'none',
                borderRadius: isFirst
                  ? 'calc(var(--radius-lg) - 1px) 0 0 calc(var(--radius-lg) - 1px)'
                  : isLast
                  ? '0 calc(var(--radius-lg) - 1px) calc(var(--radius-lg) - 1px) 0'
                  : 0,
                position: 'relative', zIndex: isActive ? 1 : 0,
              }}
            >
              <i
                className={`ti ${isLostMode ? 'ti-circle-x' : meta.icon}`}
                style={{ fontSize: 13, color: isActive ? activeColor : isLostMode ? RED_MID : 'var(--color-text-hint)' }}
              />
              <span style={{
                fontSize: 10, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap',
                maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center',
                color: isActive ? activeColor : isLostMode ? RED : 'var(--color-text-secondary)',
              }}>
                {s}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 700, lineHeight: 1,
                color: isActive ? activeColor : isLostMode ? RED : 'var(--color-text-primary)',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Card "Contrato Assinado" — sempre visível; no modo perdas mostra perdas operacionais */}
      {isLostMode ? (
        <button
          onClick={() => onFilter('Perdas:__op__')}
          style={soloCard(isOpLostStage, RED, RED_BG)}
        >
          <i className="ti ti-circle-x" style={{ fontSize: 14, color: isOpLostStage ? RED : RED_MID }} />
          <span style={{ fontSize: 10, fontWeight: isOpLostStage ? 600 : 400, color: RED, whiteSpace: 'nowrap' }}>
            Contrato Assinado
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: isOpLostStage ? RED : RED }}>
            {opLostCount}
          </span>
        </button>
      ) : (
        <button onClick={() => onFilter('Contrato Assinado')} style={soloCard(isConcluded, concludedMeta.color, concludedMeta.bg)}>
          <i className={`ti ${concludedMeta.icon}`} style={{ fontSize: 14, color: isConcluded ? concludedMeta.color : 'var(--color-text-hint)' }} />
          <span style={{ fontSize: 10, fontWeight: isConcluded ? 600 : 400, color: isConcluded ? concludedMeta.color : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            Contrato Assinado
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: isConcluded ? concludedMeta.color : 'var(--color-text-primary)' }}>
            {concludedCount}
          </span>
        </button>
      )}

      {/* Card "Perdas" — sempre à direita */}
      <button
        onClick={() => onFilter(isLostMode ? 'Todos' : 'Perdas')}
        style={soloCard(isLostMode, RED, RED_BG)}
      >
        <i className="ti ti-circle-x" style={{ fontSize: 14, color: isLostMode ? RED : 'var(--color-text-hint)' }} />
        <span style={{ fontSize: 10, fontWeight: isLostMode ? 600 : 400, color: isLostMode ? RED : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          Perdas
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: isLostMode ? RED : 'var(--color-text-primary)' }}>
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

  const isLostMode  = filterStatus === 'Perdas' || filterStatus.startsWith('Perdas:')
  const lostStage   = isLostMode && filterStatus.startsWith('Perdas:') ? filterStatus.slice('Perdas:'.length) : null
  // lostStage '__op__' = todas as perdas operacionais (vindas do funil operacional)

  const STATUS_ORDER = COMMERCIAL_STATUSES.reduce((acc, s, i) => ({ ...acc, [s]: i }), {})

  const applyFilters = (list) => {
    const q = search.toLowerCase()
    const filtered = list.filter(l => {
      if (!isLostMode && filterStatus === 'Todos' && l.status === 'Contrato Assinado') return false
      const matchSearch =
        (l.name || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.cpf || '').includes(q)
      // No modo perdas por etapa: filtra pelo lastActiveStatus
      const matchStatus = isLostMode
        ? (lostStage === '__op__'
            ? OPERATIONAL_STATUSES.includes(l.lastActiveStatus)
            : lostStage
            ? (l.lastActiveStatus || l.status) === lostStage
            : true)
        : (filterStatus === 'Todos' ? true : l.status === filterStatus)
      const matchResp = filterResp === 'Todos' || l.responsible === filterResp
      return matchSearch && matchStatus && matchResp
    })
    if (!isLostMode && filterStatus === 'Todos') {
      filtered.sort((a, b) => (STATUS_ORDER[b.status] ?? 0) - (STATUS_ORDER[a.status] ?? 0))
    }
    return filtered
  }

  const filteredActive = isLostMode ? [] : applyFilters(activeLeads)
  const filteredLost   = isLostMode ? applyFilters(lostLeads) : []

  // Métricas — baseadas em leads ativos (não perdidos)
  const funnelLeads   = activeLeads.filter(l => l.status !== 'Contrato Assinado')
  const totalEmbedded = funnelLeads.reduce((s, l) => s + (parseFloat(l.embeddedValue) || 0), 0)
  const totalLeme     = funnelLeads.reduce((s, l) => {
    const emb = parseFloat(l.embeddedValue) || 0
    return s + emb * ((l.feePercent ?? 50) / 100)
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Cards de métricas ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {[
          { label: 'Leads Ativos',           value: funnelLeads.length,          icon: 'ti-users',       bg: '#F1EFE8',                  color: '#2C2C2A' },
          { label: 'Valor Embutido',        value: fmtCurrency(totalEmbedded),  icon: 'ti-coin',        bg: '#FFF3CD',                  color: '#7A4F00' },
          { label: 'Potencial de Receita Bruta', value: fmtCurrency(totalLeme), icon: 'ti-trending-up', bg: 'var(--color-green-bg)',     color: 'var(--color-green-dark)' },
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
      {!isLostMode && (
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
      {isLostMode && (
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
