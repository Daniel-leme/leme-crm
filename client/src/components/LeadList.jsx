import { useState } from 'react'
import { COMMERCIAL_STATUSES, COMMERCIAL_STATUS_META, OPERATIONAL_STATUSES, OPERATIONAL_STATUS_META, fmtCurrency, fmtDate } from '../constants'

const STATUS_DEPTH    = Object.fromEntries(COMMERCIAL_STATUSES.map((s, i) => [s, i]))
const OP_STATUS_DEPTH = Object.fromEntries(OPERATIONAL_STATUSES.map((s, i) => [s, i]))

const STATUS_SIDE_BG = {
  'Novo Lead':         '#F1EFE8',
  'Qualificação':      '#FFF8E1',
  'Qualificado':       '#EFF6FF',
  'Revisão':           '#F5F3FF',
  'Negociação':        '#FFF0E6',
  'Contrato Assinado': '#D4EDDA',
  'Perdido':           '#FEE2E2',
}

function LeadRow({ lead, onSelect, isOrphan, isLate, isToday, nextTask, opStatus }) {
  const emb       = parseFloat(lead.embeddedValue) || 0
  const leme      = emb * ((lead.feePercent ?? 50) / 100)
  const lost      = !!lead.isLost
  const hasValues = emb > 0

  // Se o lead está em "Contrato Assinado" e tem status operacional, usa o meta operacional
  const isContrato  = !lost && lead.status === 'Contrato Assinado' && !!opStatus
  const statusKey   = lost ? 'Perdido' : isContrato ? opStatus : lead.status
  const meta        = isContrato
    ? (OPERATIONAL_STATUS_META[opStatus] || OPERATIONAL_STATUS_META['Documentação'])
    : (COMMERCIAL_STATUS_META[statusKey] || COMMERCIAL_STATUS_META['Novo Lead'])
  // Para operacionais, usa bg mais claro que o meta.bg (que é saturado demais para fundo de coluna)
  const OP_SIDE_BG = {
    'Documentação':              '#EEF4FB',
    'Solicitação de Estorno':    '#FEF9EC',
    'Aguardando Estorno':        '#FEF6EC',
    'Cobrança':                  '#F7F0FE',
    'Transferência de Repasses': '#F0F7F0',
    'Concluído':                 '#F0F7F0',
    'Perdido':                   '#FEF2F2',
  }
  const OP_SIDE_COLOR = {
    'Documentação':              '#1565C0',
    'Solicitação de Estorno':    '#92610A',
    'Aguardando Estorno':        '#9A4500',
    'Cobrança':                  '#6A1B9A',
    'Transferência de Repasses': '#2E6B2E',
    'Concluído':                 '#2E6B2E',
    'Perdido':                   'var(--color-red-dark)',
  }
  const OP_SIDE_ICON = {
    'Documentação':              'ti-file-text',
    'Solicitação de Estorno':    'ti-send',
    'Aguardando Estorno':        'ti-hourglass',
    'Cobrança':                  'ti-cash',
    'Transferência de Repasses': 'ti-transfer',
    'Concluído':                 'ti-trophy',
    'Perdido':                   'ti-circle-x',
  }
  const sideBg = isContrato
    ? (OP_SIDE_BG[opStatus] || '#EEF8EE')
    : (STATUS_SIDE_BG[statusKey] || '#F1EFE8')

  // tarja: atrasada=vermelho grosso, órfã=âmbar grosso, hoje=verde grosso, futura=azul fino, padrão=cinza fino
  const tarjaColor = isLate ? '#EF4444' : isOrphan ? '#F59E0B' : isToday ? '#22C55E' : '#3B82F6'
  const tarjaThick = isLate || isOrphan || isToday
  const tarjaWidth = tarjaThick ? '16px' : '4px'
  const bordaColor = isLate ? '#FCA5A5' : isOrphan ? '#FCD34D' : isToday ? '#86EFAC' : 'var(--color-border)'

  return (
    <div
      onClick={() => onSelect(lead)}
      style={{
        display: 'grid',
        gridTemplateColumns: `${tarjaWidth} 1fr auto`,
        borderRadius: 12,
        border: `1px solid ${lost ? 'var(--color-border)' : bordaColor}`,
        background: 'var(--color-surface)',
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: lost ? 0.75 : 1,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* ── Tarja lateral ── */}
      <div style={{
        background: lost ? '#D1D5DB' : tarjaColor,
        borderRadius: '12px 0 0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!lost && isLate   && <i className="ti ti-alarm-filled"  style={{ fontSize: 8, color: '#fff', lineHeight: 1 }} />}
        {!lost && isOrphan && <span style={{ fontSize: 9, fontWeight: 900, color: '#fff', lineHeight: 1, userSelect: 'none' }}>!</span>}
        {!lost && isToday  && <i className="ti ti-flag-filled"   style={{ fontSize: 8, color: '#fff', lineHeight: 1 }} />}
      </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {isLate                       && <i className="ti ti-alarm"          style={{ fontSize: 11, color: '#C62828', flexShrink: 0 }} />}
            {isOrphan && !isLate          && <i className="ti ti-alert-triangle" style={{ fontSize: 11, color: '#B45309', flexShrink: 0 }} />}
            {isToday  && !isLate          && <i className="ti ti-flag-2"         style={{ fontSize: 11, color: '#15803D', flexShrink: 0 }} />}
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name || '(sem nome)'}</p>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-hint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lost
              ? `Perdido em ${lead.lastActiveStatus || lead.status}${lead.lossReason ? ` · ${lead.lossReason}` : ''}`
              : [lead.phone, lead.bank, lead.responsible].filter(Boolean).join(' · ') || '—'}
          </p>
          {!lost && (() => {
            const taskColor = isLate ? '#C62828' : isOrphan ? '#B45309' : isToday ? '#15803D' : '#1565C0'
            const taskBg    = isLate ? '#FEE2E2' : isOrphan ? '#FEF3C7' : isToday ? '#DCFCE7' : '#DBEAFE'
            const taskIcon  = isLate ? 'ti-alarm' : isOrphan ? 'ti-alert-triangle' : isToday ? 'ti-flag-2' : 'ti-calendar'
            const taskLabel = isOrphan
              ? 'Sem tarefa'
              : nextTask?.dueDate
                ? fmtDate(nextTask.dueDate) + (nextTask.dueTime ? ` ${nextTask.dueTime}` : '')
                : null
            if (!taskLabel) return null
            return (
              <div style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: taskBg }}>
                <i className={`ti ${taskIcon}`} style={{ fontSize: 9, color: taskColor }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: taskColor, whiteSpace: 'nowrap' }}>{taskLabel}</span>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Coluna direita: status + potencial ── */}
      {(() => {
        const rightColor = isContrato ? (OP_SIDE_COLOR[opStatus] || '#1565C0') : meta.color
        const rightIcon  = isContrato ? (OP_SIDE_ICON[opStatus]  || 'ti-file-text') : meta.icon
        return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center',
        padding: '13px 16px', gap: 6,
        borderLeft: `1px solid ${rightColor}22`,
        background: sideBg,
        width: 170, flexShrink: 0,
      }}>
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className={`ti ${rightIcon}`} style={{ fontSize: 13, color: rightColor }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: rightColor, whiteSpace: 'nowrap' }}>
            {statusKey}
          </span>
        </div>

        {/* Potencial */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: hasValues ? '#15803D' : 'var(--color-text-hint)', lineHeight: 1 }}>
            {hasValues ? fmtCurrency(leme) : '—'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-text-hint)', whiteSpace: 'nowrap' }}>
            {hasValues ? `embutido ${fmtCurrency(emb)}` : 'sem valores'}
          </span>
        </div>
      </div>
        )
      })()}
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

function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

// Retorna a tarefa pendente mais urgente de um lead (menor dueDate, priorizando com hora)
function leadNextTask(leadId, tasks) {
  return (tasks || [])
    .filter(t => t.status !== 'done' && t.lead_id === leadId)
    .sort((a, b) => {
      const da = (a.dueDate || '9999') + (a.dueTime ? 'T' + a.dueTime : 'T99:99')
      const db = (b.dueDate || '9999') + (b.dueTime ? 'T' + b.dueTime : 'T99:99')
      return da.localeCompare(db)
    })[0] || null
}

// 0=atrasada, 1=sem tarefa, 2=hoje, 3=futura, 4=contrato assinado (não-concluído), 5=concluído operacional
function taskPriority(lead, nextTask, orphanIds, today, nowTime, opStatusByLead) {
  if (lead.status === 'Contrato Assinado') {
    const opS = opStatusByLead?.[lead.id]
    return opS === 'Concluído' ? 5 : 4
  }
  if (!nextTask) return 1
  if (!nextTask.dueDate || nextTask.dueDate < today) return 0
  if (nextTask.dueDate === today) {
    if (nextTask.dueTime && nextTask.dueTime <= nowTime) return 0
    return 2
  }
  return 3
}

// Chave de ordenação interna dentro do bloco: data+hora, tarefas com hora antes das sem hora
function taskSortKey(nextTask) {
  if (!nextTask || !nextTask.dueDate) return '9999-99-99T99:99'
  return nextTask.dueDate + (nextTask.dueTime ? 'T' + nextTask.dueTime : 'T99:99')
}

export default function LeadList({ leads, tasks, operations, onSelect, onNew }) {
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilter]     = useState('Todos')
  const [filterResp, setFilterResp]   = useState('Todos')
  const [concludedOpen, setConcluded] = useState(false)

  // Mapa leadId → status operacional (para leads em "Contrato Assinado")
  const opStatusByLead = Object.fromEntries(
    (operations || []).map(o => [o.lead_id, o.isLost ? 'Perdido' : o.status])
  )

  const activeLeads = leads.filter(l => !l.isLost)
  const lostLeads   = leads.filter(l => !!l.isLost)

  const today   = todayStr()
  const nowTime = new Date().toTimeString().slice(0, 5) // "HH:MM"
  const pendingTasks = (tasks || []).filter(t => t.status !== 'done')

  // Leads órfãos: ativos (não perdidos, não Contrato Assinado) sem tarefa pending
  const leadsWithTask = new Set(pendingTasks.map(t => t.lead_id))
  const orphanIds = new Set(
    activeLeads
      .filter(l => l.status !== 'Contrato Assinado' && !leadsWithTask.has(l.id))
      .map(l => l.id)
  )

  // Tarefa está atrasada se: data < hoje, OU data = hoje e tem hora <= agora
  const isTaskLate = (t) => {
    if (!t.dueDate) return false
    if (t.dueDate < today) return true
    if (t.dueDate === today && t.dueTime && t.dueTime <= nowTime) return true
    return false
  }

  // Leads com tarefa atrasada
  const lateIds = new Set(
    pendingTasks.filter(isTaskLate).map(t => t.lead_id)
  )
  // Leads com tarefa para hoje (e sem atrasadas)
  const todayIds = new Set(
    pendingTasks
      .filter(t => t.dueDate === today && !isTaskLate(t))
      .map(t => t.lead_id)
  )

  const responsibles = ['Todos', ...Array.from(new Set(leads.map(l => l.responsible).filter(Boolean)))]

  const isLostMode  = filterStatus === 'Perdas' || filterStatus.startsWith('Perdas:')
  const lostStage   = isLostMode && filterStatus.startsWith('Perdas:') ? filterStatus.slice('Perdas:'.length) : null
  // lostStage '__op__' = todas as perdas operacionais (vindas do funil operacional)

  const searching = search.trim().length > 0

  // Remove acentos e normaliza para comparação (ex: "Antonio" bate "Antônio")
  const normalize = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  // Remove tudo que não é dígito (para buscar telefone/CPF sem formatação)
  const onlyDigits = (s) => (s || '').replace(/\D/g, '')

  const applyFilters = (list) => {
    const q        = normalize(search)
    const qDigits  = onlyDigits(search)
    const filtered = list.filter(l => {
      if (!searching && !isLostMode && filterStatus === 'Todos' && l.status === 'Contrato Assinado') return false
      const matchSearch =
        !q ||
        normalize(l.name).includes(q) ||
        (qDigits && onlyDigits(l.phone).includes(qDigits)) ||
        (qDigits && onlyDigits(l.cpf).includes(qDigits))
      const matchStatus = searching
        ? true
        : isLostMode
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
      filtered.sort((a, b) => {
        const ntA = leadNextTask(a.id, pendingTasks)
        const ntB = leadNextTask(b.id, pendingTasks)
        const pA  = taskPriority(a, ntA, orphanIds, today, nowTime, opStatusByLead)
        const pB  = taskPriority(b, ntB, orphanIds, today, nowTime, opStatusByLead)
        if (pA !== pB) return pA - pB
        // Dentro do bloco "Contrato Assinado" (p=4): ordena pela progressão operacional
        if (pA === 4 || pA === 5) {
          const opA = OP_STATUS_DEPTH[opStatusByLead?.[a.id]] ?? 99
          const opB = OP_STATUS_DEPTH[opStatusByLead?.[b.id]] ?? 99
          return opA - opB
        }
        const skA = taskSortKey(ntA)
        const skB = taskSortKey(ntB)
        if (skA !== skB) return skA.localeCompare(skB)
        // Terceiro nível: mais avançado no funil vem primeiro
        const dA = STATUS_DEPTH[a.status] ?? -1
        const dB = STATUS_DEPTH[b.status] ?? -1
        return dB - dA
      })
    }
    return filtered
  }

  // Leads operacionalmente concluídos — saem da lista principal, vão pro acordeão
  const concludedLeads = activeLeads.filter(l =>
    l.status === 'Contrato Assinado' && opStatusByLead[l.id] === 'Concluído'
  )
  const concludedIds = new Set(concludedLeads.map(l => l.id))

  const filteredActive    = (isLostMode && !searching) ? [] : applyFilters(activeLeads.filter(l => !concludedIds.has(l.id)))
  const filteredConcluded = applyFilters(concludedLeads)
  const filteredLost      = (isLostMode || searching) ? applyFilters(lostLeads) : []

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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--color-text-hint)' }} aria-hidden="true" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CPF, telefone ou banco…" style={{ paddingLeft: 34 }} />
        </div>

        {/* Filtro de responsável como pills */}
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
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {r === 'Todos' ? 'Todos' : r}
              </button>
            )
          })}
        </div>

      </div>

      {/* ── Lista principal ───────────────────────────────────────────────── */}
      {(!isLostMode || searching) && (
        filteredActive.length === 0 && filteredConcluded.length === 0 && filteredLost.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-hint)', fontSize: 14 }}>
            <i className="ti ti-users-group" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true" />
            {activeLeads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhum lead encontrado para esse filtro.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredActive.map(lead => (
              <LeadRow key={lead.id} lead={lead} onSelect={onSelect}
                isOrphan={orphanIds.has(lead.id)} isLate={lateIds.has(lead.id)}
                isToday={!lateIds.has(lead.id) && todayIds.has(lead.id)}
                nextTask={leadNextTask(lead.id, pendingTasks)}
                opStatus={opStatusByLead[lead.id]}
              />
            ))}
          </div>
        )
      )}

      {/* ── Acordeão de concluídos ───────────────────────────────────────── */}
      {(!isLostMode || searching) && filteredConcluded.length > 0 && (filterStatus === 'Contrato Assinado' || searching) && (
        <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid #A5D6A7', overflow: 'hidden' }}>

          {/* Cabeçalho clicável */}
          <button
            onClick={() => setConcluded(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 16px', border: 'none', cursor: 'pointer',
              background: concludedOpen || searching ? '#E8F5E9' : '#F1FAF2',
              transition: 'background 0.15s',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: '#A5D6A7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-trophy" style={{ fontSize: 14, color: '#1B5E20' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>
                Concluídos
              </p>
              <p style={{ margin: '1px 0 0', fontSize: 11, color: '#4CAF50' }}>
                {filteredConcluded.length} lead{filteredConcluded.length !== 1 ? 's' : ''} com operação finalizada
              </p>
            </div>
            <i
              className={`ti ${(concludedOpen || searching) ? 'ti-chevron-up' : 'ti-chevron-down'}`}
              style={{ fontSize: 15, color: '#4CAF50', flexShrink: 0 }}
            />
          </button>

          {/* Lista expandida */}
          {(concludedOpen || searching) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 10px 10px' }}>
              {filteredConcluded.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-hint)', padding: '12px 0' }}>
                  Nenhum resultado para esse filtro.
                </p>
              ) : filteredConcluded.map(lead => (
                <LeadRow key={lead.id} lead={lead} onSelect={onSelect}
                  opStatus={opStatusByLead[lead.id]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Seção de perdas ───────────────────────────────────────────────── */}
      {(isLostMode || searching) && filteredLost.length > 0 && (
        searching ? (
          <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid #FCA5A5', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px 6px', background: '#FEE2E2', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-circle-x" style={{ fontSize: 14, color: 'var(--color-red-dark)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-red-dark)' }}>
                Perdidos ({filteredLost.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px 10px' }}>
              {filteredLost.map(lead => <LeadRow key={lead.id} lead={lead} onSelect={onSelect} />)}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredLost.map(lead => <LeadRow key={lead.id} lead={lead} onSelect={onSelect} />)}
          </div>
        )
      )}

      {isLostMode && !searching && filteredLost.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-hint)', fontSize: 14 }}>
          <i className="ti ti-circle-x" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true" />
          Nenhuma perda registrada.
        </div>
      )}
    </div>
  )
}
