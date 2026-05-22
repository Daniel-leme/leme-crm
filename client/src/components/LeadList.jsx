import { useState } from 'react'
import { STATUSES, STATUS_META, fmtCurrency } from '../constants'
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

export default function LeadList({ leads, onSelect, onNew }) {
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilter]   = useState('Todos')
  const [filterResp, setFilterResp] = useState('Todos')

  // Responsáveis únicos nos leads
  const responsibles = ['Todos', ...Array.from(new Set(leads.map(l => l.responsible).filter(Boolean)))]

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch =
      (l.name || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.cpf || '').includes(q) ||
      (l.bank || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'Todos' || l.status === filterStatus
    const matchResp   = filterResp === 'Todos' || l.responsible === filterResp
    return matchSearch && matchStatus && matchResp
  })

  // Métricas do funil
  const totalEmbedded = leads.reduce((s, l) => s + (parseFloat(l.embeddedValue) || 0), 0)
  const totalLeme     = leads.reduce((s, l) => {
    const emb = parseFloat(l.embeddedValue) || 0
    return s + emb * ((l.feePercent ?? 50) / 100)
  }, 0)
  const concluded = leads.filter(l => l.status === '7. Concluído').length
  const active    = leads.filter(l => !['7. Concluído','Cancelado'].includes(l.status)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Cards de métricas ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total de leads',    value: leads.length,                     icon: 'ti-users',         bg: '#F1EFE8', color: '#2C2C2A' },
          { label: 'Ativos',            value: active,                           icon: 'ti-loader',        bg: 'var(--color-blue-bg)', color: 'var(--color-blue-dark)' },
          { label: 'Concluídos',        value: concluded,                        icon: 'ti-trophy',        bg: 'var(--color-green-bg)', color: 'var(--color-green-dark)' },
          { label: 'Valor embutido',    value: fmtCurrency(totalEmbedded),       icon: 'ti-coin',          bg: '#FFF3CD', color: '#7A4F00' },
          { label: 'Estimado Leme',     value: fmtCurrency(totalLeme),           icon: 'ti-cash',          bg: 'var(--color-green-bg)', color: 'var(--color-green-dark)' },
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

      {/* ── Filtros do funil (chips) ──────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
          {['Todos', ...STATUSES].map(s => {
            const active = filterStatus === s
            const meta = STATUS_META[s]
            return (
              <button key={s} onClick={() => setFilter(s)} style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 'var(--radius-full)',
                border: active ? `1.5px solid ${meta?.color || 'var(--color-text-primary)'}` : '1px solid var(--color-border)',
                background: active ? (meta?.bg || '#F1EFE8') : 'transparent',
                color: active ? (meta?.color || '#2C2C2A') : 'var(--color-text-secondary)',
                fontWeight: active ? 500 : 400, whiteSpace: 'nowrap', cursor: 'pointer',
              }}>
                {s === 'Todos' ? `Todos (${leads.length})` : `${s} (${leads.filter(l => l.status === s).length})`}
              </button>
            )
          })}
        </div>
      </div>

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

      {/* ── Rows ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-hint)', fontSize: 14 }}>
          <i className="ti ti-users-group" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true" />
          {leads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhum lead encontrado para esse filtro.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(lead => {
            const emb = parseFloat(lead.embeddedValue) || 0
            return (
              <div key={lead.id} onClick={() => onSelect(lead)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-med)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <Initials name={lead.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{lead.name || '(sem nome)'}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                    {lead.phone || '—'}
                    {lead.bank ? ` · ${lead.bank}` : ''}
                    {lead.responsible ? ` · ${lead.responsible}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <StatusBadge status={lead.status} size="sm" />
                  {emb > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 500 }}>
                      {fmtCurrency(emb)}
                    </span>
                  )}
                </div>
                {lead.nextContact && (
                  <i className="ti ti-bell-ringing" style={{ fontSize: 15, color: 'var(--color-amber-dark)', flexShrink: 0 }} title={`Contato: ${new Date(lead.nextContact).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`} aria-hidden="true" />
                )}
                <i className="ti ti-chevron-right" style={{ fontSize: 15, color: 'var(--color-text-hint)', flexShrink: 0 }} aria-hidden="true" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
