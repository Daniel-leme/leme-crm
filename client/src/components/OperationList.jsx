import { useState } from 'react'
import { OPERATIONAL_STATUSES, OPERATIONAL_STATUS_META, fmtDate } from '../constants'

const STATUS_SIDE_BG = {
  'Documentação':              '#E3F2FD',
  'Solicitação de Estorno':    '#FFF8E1',
  'Aguardando Estorno':        '#FFF3E0',
  'Cobrança':                  '#F3E5F5',
  'Transferência de Repasses': '#C8E6C9',
  'Concluído':                 '#A5D6A7',
  'Perdido':                   '#FEE2E2',
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function nowHHMM() { return new Date().toTimeString().slice(0, 5) }

function opNextTask(leadId, tasks) {
  return (tasks || [])
    .filter(t => t.status !== 'done' && t.lead_id === leadId)
    .sort((a, b) => {
      const da = (a.dueDate || '9999') + (a.dueTime ? 'T' + a.dueTime : 'T99:99')
      const db = (b.dueDate || '9999') + (b.dueTime ? 'T' + b.dueTime : 'T99:99')
      return da.localeCompare(db)
    })[0] || null
}

function OperationRow({ op, tasks, onSelect }) {
  const lost      = !!op.isLost
  const statusKey = lost ? 'Perdido' : op.status
  const meta      = OPERATIONAL_STATUS_META[statusKey] || OPERATIONAL_STATUS_META['Documentação']
  const sideBg    = STATUS_SIDE_BG[statusKey] || '#E3F2FD'
  const initials  = (op.lead_name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'

  const today   = todayStr()
  const nowTime = nowHHMM()
  const nextTask = lost ? null : opNextTask(op.lead_id, tasks)
  const isOrphan = !lost && op.status !== 'Concluído' && !nextTask
  const isLate   = !lost && !!nextTask && (
    !nextTask.dueDate || nextTask.dueDate < today ||
    (nextTask.dueDate === today && !!nextTask.dueTime && nextTask.dueTime <= nowTime)
  )
  const isToday  = !isLate && !isOrphan && !!nextTask?.dueDate && nextTask.dueDate === today

  const tarjaColor = lost ? '#D1D5DB' : isLate ? '#EF4444' : isOrphan ? '#F59E0B' : isToday ? '#22C55E' : '#3B82F6'
  const tarjaThick = !lost && (isLate || isOrphan || isToday)
  const tarjaWidth = tarjaThick ? '14px' : '4px'
  const bordaColor = lost ? 'var(--color-border)' : isLate ? '#FCA5A5' : isOrphan ? '#FCD34D' : isToday ? '#86EFAC' : 'var(--color-border)'

  const taskColor = isLate ? '#C62828' : isOrphan ? '#B45309' : isToday ? '#15803D' : '#1565C0'
  const taskBg    = isLate ? '#FEE2E2' : isOrphan ? '#FEF3C7' : isToday ? '#DCFCE7' : '#DBEAFE'
  const taskIcon  = isLate ? 'ti-alarm' : isOrphan ? 'ti-alert-triangle' : isToday ? 'ti-flag-2' : 'ti-calendar'
  const taskLabel = isOrphan
    ? 'Sem tarefa'
    : nextTask?.dueDate
      ? fmtDate(nextTask.dueDate) + (nextTask.dueTime ? ` ${nextTask.dueTime}` : '')
      : null

  return (
    <div
      onClick={() => onSelect(op)}
      style={{
        display: 'grid',
        gridTemplateColumns: `${tarjaWidth} 1fr minmax(130px, 160px)`,
        borderRadius: 12,
        border: `1px solid ${bordaColor}`,
        background: 'var(--color-surface)',
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: lost ? 0.75 : 1,
        transition: 'box-shadow 0.15s, grid-template-columns 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Tarja lateral */}
      <div style={{
        background: tarjaColor,
        borderRadius: '12px 0 0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!lost && isLate   && <i className="ti ti-alarm-filled"  style={{ fontSize: 8, color: '#fff', lineHeight: 1 }} />}
        {!lost && isOrphan && <span style={{ fontSize: 9, fontWeight: 900, color: '#fff', lineHeight: 1, userSelect: 'none' }}>!</span>}
        {!lost && isToday  && <i className="ti ti-flag-filled"   style={{ fontSize: 8, color: '#fff', lineHeight: 1 }} />}
      </div>

      {/* Coluna esquerda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: meta.bg, border: `2px solid ${meta.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: meta.color,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {isLate   && <i className="ti ti-alarm"          style={{ fontSize: 11, color: '#C62828', flexShrink: 0 }} />}
            {isOrphan && !isLate && <i className="ti ti-alert-triangle" style={{ fontSize: 11, color: '#B45309', flexShrink: 0 }} />}
            {isToday  && !isLate && <i className="ti ti-flag-2"         style={{ fontSize: 11, color: '#15803D', flexShrink: 0 }} />}
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {op.lead_name || '(sem nome)'}
            </p>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-hint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lost
              ? `Perdido em ${op.lastActiveStatus || op.status}${op.lossReason ? ` · ${op.lossReason}` : ''}`
              : [op.lead_phone, op.lead_source, op.responsible].filter(Boolean).join(' · ') || '—'}
          </p>
          {!lost && taskLabel && (
            <div style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: taskBg }}>
              <i className={`ti ${taskIcon}`} style={{ fontSize: 9, color: taskColor }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: taskColor, whiteSpace: 'nowrap' }}>{taskLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Coluna direita */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center',
        padding: '13px 16px', gap: 4,
        borderLeft: `1px solid ${meta.color}22`,
        background: sideBg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, maxWidth: '100%' }}>
          <i className={`ti ${meta.icon}`} style={{ fontSize: 13, color: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {statusKey}
          </span>
        </div>
        {op.responsible && (
          <span style={{ fontSize: 11, color: 'var(--color-text-hint)', whiteSpace: 'nowrap' }}>
            {op.responsible}
          </span>
        )}
      </div>
    </div>
  )
}

export default function OperationList({ operations, tasks, onSelect }) {
  const [filterStatus, setFilter]   = useState('Todos')
  const [filterResp, setFilterResp] = useState('Todos')
  const [search, setSearch]         = useState('')

  const activeOps = operations.filter(o => !o.isLost)
  const lostOps   = operations.filter(o => !!o.isLost)

  const showingLosses = filterStatus === 'Perdas'

  const responsibles = ['Todos', ...Array.from(new Set(operations.map(o => o.responsible).filter(Boolean)))]

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

  // Métricas
  const concluded = activeOps.filter(o => o.status === 'Concluído').length

  // Operações sem tarefa pendente (órfãs)
  const pendingTasks = (tasks || []).filter(t => t.status !== 'done')
  const opsWithTask  = new Set(pendingTasks.map(t => t.lead_id))
  const orphanOps    = activeOps.filter(o => o.status !== 'Concluído' && !opsWithTask.has(o.lead_id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Banner do funil ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)', color: '#fff' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-settings-2" style={{ fontSize: 18 }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Funil Operacional</p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Execução e entrega pós-contrato</p>
        </div>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {[
          { label: 'Em operação', value: activeOps.length,  icon: 'ti-settings',  bg: '#E3F2FD', color: '#1565C0' },
          { label: 'Concluídos',  value: concluded,          icon: 'ti-trophy',    bg: '#A5D6A7', color: '#1B5E20' },
          { label: 'Perdas',      value: lostOps.length,    icon: 'ti-circle-x',  bg: '#FEE2E2', color: '#C62828' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <i className={`ti ${m.icon}`} style={{ fontSize: 14, color: m.color }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: m.color, opacity: 0.85 }}>{m.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: m.color, lineHeight: 1 }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Alerta de operações sem tarefa */}
      {orphanOps.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 'var(--radius-lg)', background: '#FFF8E1', border: '1px solid #FDE68A' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: '#B45309', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#B45309' }}>
              {orphanOps.length} operaç{orphanOps.length === 1 ? 'ão' : 'ões'} sem tarefa
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {orphanOps.map(op => (
                <button key={op.id} onClick={() => onSelect(op)}
                  style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, border: '1px solid #FCD34D', background: '#FEF3C7', color: '#92400E', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FDE68A'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FEF3C7'}>
                  {op.lead_name || '(sem nome)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Barra de status */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, width: '100%' }}>

        {/* Todos */}
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

        {/* Barra central */}
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

        {/* Perdas */}
        <button
          onClick={() => setFilter(showingLosses ? 'Todos' : 'Perdas')}
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

      {/* Busca + filtro responsável */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--color-text-hint)' }} aria-hidden="true" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou origem…" style={{ paddingLeft: 34 }} />
        </div>

        {responsibles.length > 1 && (
          <div style={{ display: 'flex', gap: 4, padding: '3px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)' }}>
            {responsibles.map(r => {
              const active = filterResp === r
              return (
                <button
                  key={r}
                  onClick={() => setFilterResp(r)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: active ? '#1A1917' : 'transparent',
                    color: active ? '#fff' : 'var(--color-text-secondary)',
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  {r}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-hint)', fontSize: 14 }}>
          <i className="ti ti-settings-off" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true" />
          {operations.length === 0 ? 'Nenhuma operação ainda. Leads chegam aqui ao assinar contrato.' : 'Nenhuma operação encontrada para esse filtro.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(op => <OperationRow key={op.id} op={op} tasks={tasks} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  )
}
