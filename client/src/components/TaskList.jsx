import { useState, useEffect, useCallback, useRef } from 'react'
import { apiListTasks, apiUpdateTask, apiDeleteTask } from '../utils/api'
import TaskModal from './TaskModal'
import ConfirmModal from './ConfirmModal'

const TYPE_ICONS = {
  'Ligação':               'ti-phone',
  'WhatsApp / Follow-up':  'ti-brand-whatsapp',
  'Reunião':               'ti-users',
  'Envio de documento':    'ti-file-export',
  'Revisão de contrato':   'ti-file-search',
  'Assistência segunda via':'ti-headset',
  'Outro':                 'ti-checkbox',
}

const COLS = [
  { key: 'late',   label: 'Atrasadas',      color: '#C62828', bg: '#FEE2E2', border: '#FECACA', icon: 'ti-alarm',          cardBorder: '#FECACA', cardBg: '#FFF5F5' },
  { key: 'orphan', label: 'Sem tarefa',      color: '#B45309', bg: '#FFF8E1', border: '#FDE68A', icon: 'ti-alert-triangle', cardBorder: '#FDE68A', cardBg: '#FFFBEB' },
  { key: 'today',  label: 'Hoje',            color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', icon: 'ti-flag-filled',    cardBorder: '#86EFAC', cardBg: '#F0FDF4' },
  { key: 'future', label: 'Futuras',         color: '#1565C0', bg: '#E3F2FD', border: '#BFDBFE', icon: 'ti-calendar-time', cardBorder: '#BFDBFE', cardBg: '#EFF6FF' },
]

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function fmtDate(v) {
  if (!v) return ''
  const [y, m, d] = v.split('-')
  return `${d}/${m}/${y}`
}

function classifyTask(t) {
  if (t.status === 'done') return null
  const td  = todayStr()
  const now = new Date().toTimeString().slice(0, 5)
  if (!t.dueDate || t.dueDate < td) return 'late'
  if (t.dueDate === td) {
    if (t.dueTime && t.dueTime <= now) return 'late'
    return 'today'
  }
  return 'future'
}

function sortByDate(arr) {
  return [...arr].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })
}

function TaskCard({ task, onDone, onEdit, onDelete, onOpenLead, col }) {
  const typeIcon  = TYPE_ICONS[task.type] || 'ti-checkbox'
  const accentColor = col.color
  const [hovered, setHovered] = useState(false)

  const handleCardClick = (e) => {
    // só navega se clicar fora de botão
    if (e.target.closest('button')) return
    onOpenLead?.()
  }

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${col.cardBorder}`,
        background: hovered && onOpenLead ? 'var(--color-surface)' : col.cardBg,
        cursor: onOpenLead ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        boxShadow: hovered && onOpenLead ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {/* Linha de destaque colorida no topo */}
      <div style={{ height: 3, background: accentColor, opacity: 0.6, flexShrink: 0 }} />

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Tipo + badge contrato */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className={`ti ${typeIcon}`} style={{ fontSize: 13, color: accentColor, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.type}
          </span>
        </div>

        {/* Badge contrato (separado para não comprimir o tipo) */}
        {!!task.isAuto && !!task.contract_id && (
          <div style={{ display: 'flex' }}>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#EDE9FE', color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-file-description" style={{ fontSize: 10 }} />
              {task.contract_bank || 'Contrato'}{task.contract_type ? ` · ${task.contract_type}` : ''}
            </span>
          </div>
        )}

        {/* Descrição */}
        {task.description ? (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
            {task.description}
          </p>
        ) : null}

        {/* Lead */}
        {task.lead_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-user-circle" style={{ fontSize: 11, color: accentColor, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.lead_name}
            </span>
          </div>
        )}

        {/* Data + responsável */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {task.dueDate && (
            <span style={{ fontSize: 11, color: accentColor, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
              <i className="ti ti-calendar" style={{ fontSize: 11 }} />
              {fmtDate(task.dueDate)}{task.dueTime && task.dueTime !== '0' ? ` ${task.dueTime}` : ''}
            </span>
          )}
          {task.assignedTo && (
            <span style={{ fontSize: 11, color: 'var(--color-text-hint)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-user" style={{ fontSize: 11 }} />
              {task.assignedTo}
            </span>
          )}
        </div>

        {/* Linha divisória */}
        <div style={{ height: 1, background: col.cardBorder, margin: '0 -12px', marginTop: 2 }} />

        {/* Ações */}
        <div style={{ display: 'flex', gap: 6, marginBottom: -2 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDone(task) }}
            title="Concluir tarefa"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '5px 0', borderRadius: 6,
              border: `1.5px solid ${accentColor}`,
              background: 'transparent', color: accentColor,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = col.bg }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <i className="ti ti-circle-check" style={{ fontSize: 12 }} />
            Concluir
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task) }}
            title="Editar tarefa"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 6,
              border: '1.5px solid var(--color-border)',
              background: 'transparent', color: 'var(--color-text-secondary)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <i className="ti ti-pencil" style={{ fontSize: 11 }} />
            Editar
          </button>
          {(() => {
            const locked = !!(task.isAuto && task.contract_id)
            return (
              <button
                onClick={(e) => { e.stopPropagation(); if (!locked) onDelete(task) }}
                title={locked ? 'Tarefa automática — não pode ser excluída' : 'Excluir tarefa'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, borderRadius: 6,
                  border: `1.5px solid ${locked ? 'var(--color-border)' : 'var(--color-border)'}`,
                  background: 'transparent',
                  color: locked ? 'var(--color-border)' : 'var(--color-text-hint)',
                  fontSize: 13, cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.5 : 1,
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => { if (!locked) { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#C62828' } }}
                onMouseLeave={e => { if (!locked) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-hint)' } }}
              >
                <i className={`ti ${locked ? 'ti-trash-off' : 'ti-trash'}`} />
              </button>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

function OrphanCard({ lead, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '10px 12px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #FDE68A',
        background: '#FFFBEB',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#FEF3C7'}
      onMouseLeave={e => e.currentTarget.style.background = '#FFFBEB'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-alert-triangle" style={{ color: '#B45309', fontSize: 13, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.name || '(sem nome)'}
        </span>
        <i className="ti ti-chevron-right" style={{ fontSize: 12, color: '#B45309', flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color: '#B45309' }}>{lead.status}</span>
        {lead.responsible && <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>· {lead.responsible}</span>}
      </div>
    </div>
  )
}

function TypeDropdown({ types, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const active = value !== 'Todos'
  const icon = TYPE_ICONS[value]

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px 6px 10px', borderRadius: 'var(--radius-full)',
          border: `1.5px solid ${active ? '#1A1917' : 'var(--color-border)'}`,
          background: active ? '#1A1917' : 'var(--color-bg)',
          color: active ? '#fff' : 'var(--color-text-secondary)',
          fontSize: 12, fontWeight: active ? 600 : 400,
          cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
      >
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 12 }} />}
        <span>{value === 'Todos' ? 'Tipo de tarefa' : value}</span>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 11, opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: '#fff', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
          zIndex: 200, minWidth: 200, overflow: 'hidden',
        }}>
          {types.map(t => {
            const tIcon = TYPE_ICONS[t]
            const selected = value === t
            return (
              <button
                key={t}
                onClick={() => { onChange(t); setOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 14px', border: 'none', textAlign: 'left',
                  background: selected ? '#F5F4F0' : 'transparent',
                  color: selected ? '#1A1917' : 'var(--color-text-secondary)',
                  fontSize: 12, fontWeight: selected ? 700 : 400,
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--color-bg)' }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: selected ? '#1A1917' : 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {tIcon
                    ? <i className={`ti ${tIcon}`} style={{ fontSize: 13, color: selected ? '#fff' : 'var(--color-text-hint)' }} />
                    : <i className="ti ti-list" style={{ fontSize: 13, color: selected ? '#fff' : 'var(--color-text-hint)' }} />
                  }
                </div>
                {t}
                {selected && <i className="ti ti-check" style={{ marginLeft: 'auto', fontSize: 13, color: '#1A1917' }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Column({ col, children, count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
      {/* Cabeçalho da coluna */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: col.bg,
        marginBottom: 8,
        border: `1px solid ${col.border}`,
      }}>
        <i className={`ti ${col.icon}`} style={{ fontSize: 13, color: col.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: col.color, flex: 1 }}>{col.label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: col.color, background: 'rgba(0,0,0,0.1)', borderRadius: 99, padding: '1px 7px' }}>{count}</span>
      </div>
      {/* Cards com scroll */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: 2 }}>
        {children}
      </div>
    </div>
  )
}

export default function TaskList({ leads, onOpenLead, settings, onTaskChanged, onTaskEdited, onTaskDeleted }) {
  const leadsById = Object.fromEntries((leads || []).map(l => [l.id, l]))
  const [tasks,      setTasks]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editTask,   setEditTask]   = useState(null)
  const [filterResp, setFilterResp] = useState('Todos')
  const [filterType, setFilterType] = useState('Todos')
  const [showDone,   setShowDone]   = useState(false)
  const [confirmTask, setConfirmTask] = useState(null)

  const responsibles = settings?.responsibles
    ? JSON.parse(settings.responsibles)
    : ['Riquelme', 'Daniel']
  const taskTypes = settings?.taskTypes ? JSON.parse(settings.taskTypes) : null

  const load = useCallback(async () => {
    setLoading(true)
    try { setTasks(await apiListTasks()) } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDone = async (task) => {
    await apiUpdateTask(task.id, { status: 'done' })
    await load()
    onTaskChanged?.()
  }
  const handleEdit   = (task) => setEditTask(task)
  const handleDelete = async (task) => {
    onTaskDeleted?.(task.id)
    await apiDeleteTask(task.id)
    await load()
    onTaskChanged?.()
  }
  const handleSaveEdit = async (data) => {
    onTaskEdited?.(editTask.id, editTask.dueDate)
    await apiUpdateTask(editTask.id, data)
    setEditTask(null)
    await load()
    onTaskChanged?.()
  }

  // ── Leads órfãos (ativos, sem tarefa pendente)
  const activeLeads   = (leads || []).filter(l => !l.isLost && l.status !== 'Contrato Assinado')
  const leadsWithTask = new Set(tasks.filter(t => t.status !== 'done').map(t => t.lead_id))
  const orphanLeads   = activeLeads.filter(l => !leadsWithTask.has(l.id))

  // ── Filtros
  const pendingTasks  = tasks.filter(t => t.status !== 'done')
  const presentTypes  = ['Todos', ...Array.from(new Set(pendingTasks.map(t => t.type).filter(Boolean)))]
  const filteredTasks = pendingTasks
    .filter(t => filterResp === 'Todos' || t.assignedTo === filterResp)
    .filter(t => filterType === 'Todos' || t.type === filterType)

  // ── Buckets ordenados por data
  const buckets = {
    late:   sortByDate(filteredTasks.filter(t => classifyTask(t) === 'late')),
    today:  sortByDate(filteredTasks.filter(t => classifyTask(t) === 'today')),
    future: sortByDate(filteredTasks.filter(t => classifyTask(t) === 'future')),
  }

  const doneTasks      = tasks.filter(t => t.status === 'done')
  const totalPending   = pendingTasks.length
  const totalLate      = buckets.late.length

  // Métricas na ordem pedida: Atrasadas, Sem tarefa, Para hoje, Futuras
  const metrics = [
    { label: 'Atrasadas',  value: totalLate,            bg: '#FEE2E2', color: '#C62828', icon: 'ti-alarm' },
    { label: 'Sem tarefa', value: orphanLeads.length,   bg: '#FFF8E1', color: '#B45309', icon: 'ti-alert-triangle' },
    { label: 'Para hoje',  value: buckets.today.length, bg: '#DCFCE7', color: '#15803D', icon: 'ti-flag-filled' },
    { label: 'Futuras',    value: buckets.future.length, bg: '#E3F2FD', color: '#1565C0', icon: 'ti-calendar-time' },
  ]

  // Órfãos só aparecem na col urgente quando filtro de tipo está em "Todos"
  const showOrphans = filterType === 'Todos'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="ti ti-checkbox" style={{ fontSize: 22, color: '#1565C0' }} />
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Central de Tarefas</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {totalPending} pendente{totalPending !== 1 ? 's' : ''}
            {totalLate > 0 ? ` · ${totalLate} atrasada${totalLate !== 1 ? 's' : ''}` : ''}
            {orphanLeads.length > 0 ? ` · ${orphanLeads.length} lead${orphanLeads.length !== 1 ? 's' : ''} sem tarefa` : ''}
          </p>
        </div>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <i className={`ti ${m.icon}`} style={{ fontSize: 13, color: m.color }} />
              <span style={{ fontSize: 11, color: m.color, opacity: 0.85 }}>{m.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {/* Responsável */}
        <div style={{ display: 'flex', gap: 4, padding: '3px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)' }}>
          {['Todos', ...responsibles].map(r => (
            <button key={r} onClick={() => setFilterResp(r)} style={{
              padding: '5px 12px', borderRadius: 'var(--radius-full)', border: 'none',
              background: filterResp === r ? '#1A1917' : 'transparent',
              color: filterResp === r ? '#fff' : 'var(--color-text-secondary)',
              fontSize: 12, fontWeight: filterResp === r ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {r}
            </button>
          ))}
        </div>

        {/* Tipo — dropdown estilizado */}
        {presentTypes.length > 2 && (
          <TypeDropdown
            types={presentTypes}
            value={filterType}
            onChange={setFilterType}
          />
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-hint)', fontSize: 13 }}>Carregando…</p>
      ) : (
        <>
          {/* Grid fixo de 3 colunas */}
          {(totalPending > 0 || orphanLeads.length > 0) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'start' }}>

              {/* Coluna 1 — Urgências */}
              {(() => {
                const latCol   = COLS.find(c => c.key === 'late')
                const orpCol   = COLS.find(c => c.key === 'orphan')
                const hasLate  = buckets.late.length > 0
                const hasOrph  = showOrphans && orphanLeads.length > 0
                const hasAny   = hasLate || hasOrph

                if (!hasAny) {
                  // Estado vazio — cabeçalho neutro "Urgências"
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <i className="ti ti-alert-circle" style={{ fontSize: 13, color: 'var(--color-text-hint)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-hint)', flex: 1 }}>Urgências</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', background: 'rgba(0,0,0,0.06)', borderRadius: 99, padding: '1px 7px' }}>0</span>
                      </div>
                      <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-hint)', fontSize: 12 }}>
                        <i className="ti ti-circle-check" style={{ fontSize: 22, display: 'block', marginBottom: 6, opacity: 0.3 }} />
                        Nenhuma tarefa urgente
                      </div>
                    </div>
                  )
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Atrasadas — só renderiza se houver */}
                    {hasLate && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: latCol.bg, border: `1px solid ${latCol.border}` }}>
                          <i className={`ti ${latCol.icon}`} style={{ fontSize: 13, color: latCol.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: latCol.color, flex: 1 }}>{latCol.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: latCol.color, background: 'rgba(0,0,0,0.1)', borderRadius: 99, padding: '1px 7px' }}>{buckets.late.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {buckets.late.map(task => (
                            <TaskCard key={task.id} task={task} col={latCol} onDone={handleDone} onEdit={handleEdit} onDelete={(t) => setConfirmTask(t)}
                              onOpenLead={onOpenLead && leadsById[task.lead_id] ? () => onOpenLead(leadsById[task.lead_id]) : undefined} />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Separador entre seções */}
                    {hasLate && hasOrph && <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />}

                    {/* Órfãos — só renderiza se houver e filtro de tipo for Todos */}
                    {hasOrph && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: orpCol.bg, border: `1px solid ${orpCol.border}` }}>
                          <i className={`ti ${orpCol.icon}`} style={{ fontSize: 13, color: orpCol.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: orpCol.color, flex: 1 }}>{orpCol.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: orpCol.color, background: 'rgba(0,0,0,0.1)', borderRadius: 99, padding: '1px 7px' }}>{orphanLeads.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {orphanLeads.map(lead => (
                            <OrphanCard key={lead.id} lead={lead} onClick={() => onOpenLead(lead)} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

              {/* Coluna 2 — Hoje */}
              {(() => {
                const col = COLS.find(c => c.key === 'today')
                const list = buckets.today
                return (
                  <Column col={col} count={list.length}>
                    {list.length === 0
                      ? <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--color-text-hint)', fontSize: 12 }}>Nenhuma</div>
                      : list.map(task => (
                        <TaskCard key={task.id} task={task} col={col} onDone={handleDone} onEdit={handleEdit} onDelete={(t) => setConfirmTask(t)}
                          onOpenLead={onOpenLead && leadsById[task.lead_id] ? () => onOpenLead(leadsById[task.lead_id]) : undefined} />
                      ))
                    }
                  </Column>
                )
              })()}

              {/* Coluna 3 — Futuras */}
              {(() => {
                const col = COLS.find(c => c.key === 'future')
                const list = buckets.future
                return (
                  <Column col={col} count={list.length}>
                    {list.length === 0
                      ? <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--color-text-hint)', fontSize: 12 }}>Nenhuma</div>
                      : list.map(task => (
                        <TaskCard key={task.id} task={task} col={col} onDone={handleDone} onEdit={handleEdit} onDelete={(t) => setConfirmTask(t)}
                          onOpenLead={onOpenLead && leadsById[task.lead_id] ? () => onOpenLead(leadsById[task.lead_id]) : undefined} />
                      ))
                    }
                  </Column>
                )
              })()}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-hint)', fontSize: 14 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 40, display: 'block', marginBottom: 12, color: '#4CAF50' }} />
              Tudo em dia! Nenhuma tarefa pendente.
            </div>
          )}

          {/* Tarefas concluídas */}
          {doneTasks.length > 0 && (
            <div>
              <button
                onClick={() => setShowDone(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-hint)', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}
              >
                <i className={`ti ${showDone ? 'ti-chevron-down' : 'ti-chevron-right'}`} style={{ fontSize: 12 }} />
                {doneTasks.length} tarefa{doneTasks.length !== 1 ? 's' : ''} concluída{doneTasks.length !== 1 ? 's' : ''}
              </button>
              {showDone && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, opacity: 0.6 }}>
                  {doneTasks.slice(0, 20).map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                      <i className="ti ti-circle-check" style={{ color: '#4CAF50', fontSize: 15, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, textDecoration: 'line-through', color: 'var(--color-text-secondary)' }}>{task.type}</span>
                        {task.lead_name && <span style={{ fontSize: 11, color: 'var(--color-text-hint)', marginLeft: 6 }}>· {task.lead_name}</span>}
                      </div>
                      <button onClick={() => setConfirmTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-hint)', fontSize: 14 }}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de edição */}
      {editTask && (
        <TaskModal
          open={!!editTask}
          onClose={() => setEditTask(null)}
          onSave={handleSaveEdit}
          lead={{ id: editTask.lead_id, name: editTask.lead_name, phone: editTask.lead_phone }}
          responsibles={responsibles}
          taskTypes={taskTypes}
          editTask={editTask}
          contractMode={!!(editTask.isAuto && editTask.contract_id)}
        />
      )}

      <ConfirmModal
        open={!!confirmTask}
        title="Excluir tarefa"
        message="Esta tarefa será removida permanentemente."
        confirmLabel="Excluir"
        onConfirm={() => { const t = confirmTask; setConfirmTask(null); handleDelete(t) }}
        onCancel={() => setConfirmTask(null)}
      />
    </div>
  )
}
