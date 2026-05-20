import { useState } from 'react'
import { STATUSES } from '../constants'
import StatusBadge from './StatusBadge'

const METRIC_CARDS = [
  { label: 'Total de Leads', key: null,             bg: 'var(--color-gray-bg)',   color: 'var(--color-gray-dark)',   icon: 'ti-users' },
  { label: 'Novos',          key: 'Novo',           bg: 'var(--color-blue-bg)',   color: 'var(--color-blue-dark)',   icon: 'ti-circle' },
  { label: 'Em Análise',     key: 'Em Análise',     bg: 'var(--color-amber-bg)',  color: 'var(--color-amber-dark)',  icon: 'ti-loader' },
  { label: 'Em Negociação',  key: 'Em Negociação',  bg: 'var(--color-purple-bg)', color: 'var(--color-purple-dark)', icon: 'ti-messages' },
  { label: 'Concluídos',     key: 'Concluído',      bg: 'var(--color-green-bg)',  color: 'var(--color-green-dark)',  icon: 'ti-circle-check' },
]

function Initials({ name }) {
  const letters = (name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      background: 'var(--color-blue-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600, color: 'var(--color-blue-dark)',
      flexShrink: 0,
    }}>
      {letters}
    </div>
  )
}

export default function LeadList({ leads, onSelect, onNew }) {
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilter] = useState('Todos')

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch =
      (l.name || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.cpf || '').includes(q) ||
      (l.bank || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'Todos' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const count = (key) => key ? leads.filter(l => l.status === key).length : leads.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Metric cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
      }}>
        {METRIC_CARDS.map(m => (
          <div key={m.label} style={{
            background: m.bg, borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            border: filterStatus === (m.key || 'Todos') ? `1.5px solid ${m.color}` : '1.5px solid transparent',
          }} onClick={() => setFilter(m.key || 'Todos')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <i className={`ti ${m.icon}`} style={{ fontSize: 14, color: m.color }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: m.color, opacity: 0.8 }}>{m.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: m.color, lineHeight: 1 }}>
              {count(m.key)}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <i className="ti ti-search" aria-hidden="true" style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--color-text-hint)',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF, telefone ou banco…"
            style={{ paddingLeft: 34 }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 180 }}
        >
          <option value="Todos">Todos os status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button
          onClick={onNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-blue-mid)', color: '#fff',
            border: 'none', fontWeight: 500, fontSize: 14,
            whiteSpace: 'nowrap',
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 17 }} aria-hidden="true" />
          Novo Lead
        </button>
      </div>

      {/* Lead rows */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 0',
          color: 'var(--color-text-hint)', fontSize: 14,
        }}>
          <i className="ti ti-users-group" aria-hidden="true"
            style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
          {leads.length === 0
            ? 'Nenhum lead cadastrado ainda.'
            : 'Nenhum lead encontrado para esse filtro.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(lead => (
            <div
              key={lead.id}
              onClick={() => onSelect(lead)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-med)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Initials name={lead.name} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {lead.name}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                  {lead.phone || lead.cpf || '—'}
                  {lead.bank        ? ` · ${lead.bank}` : ''}
                  {lead.contractType? ` · ${lead.contractType}` : ''}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <StatusBadge status={lead.status} size="sm" />
                <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>
                  {lead.feePercent ?? 50}% assessoria
                </span>
              </div>

              <i className="ti ti-chevron-right" aria-hidden="true"
                style={{ fontSize: 15, color: 'var(--color-text-hint)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
