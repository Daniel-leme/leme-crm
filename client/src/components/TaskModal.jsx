import { useState, useEffect, useRef } from 'react'
import { DEFAULT_TASK_TYPES } from '../constants'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const TYPE_ICONS = {
  'Ligação':               'ti-phone',
  'WhatsApp':              'ti-brand-whatsapp',
  'E-mail':                'ti-mail',
  'Reunião':               'ti-users',
  'Visita':                'ti-map-pin',
  'Revisão de contrato':   'ti-file-description',
  'Assistência segunda via': 'ti-file-search',
}

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const WEEKDAYS_SHORT = ['dom','seg','ter','qua','qui','sex','sáb']

function formatDate(iso) {
  if (!iso) return 'Escolher data'
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${d} ${MONTHS_SHORT[m - 1]} · ${WEEKDAYS_SHORT[dt.getDay()]}`
}

function TypeDropdown({ value, onChange, types, accent, accentBg, fullWidth }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const icon = TYPE_ICONS[value] || 'ti-checkbox'

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-flex', width: fullWidth ? '100%' : undefined }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 8px 6px 10px', borderRadius: 99,
          border: `1.5px solid ${open ? accent : 'var(--color-border)'}`,
          background: open ? accentBg : '#fff',
          cursor: 'pointer', fontSize: 12, fontWeight: 600,
          color: open ? accent : 'var(--color-text-primary)',
          outline: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
          width: fullWidth ? '100%' : undefined, overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 13, color: open ? accent : 'var(--color-text-secondary)', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{value}</span>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 11, color: 'var(--color-text-hint)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          border: '1px solid var(--color-border)',
          minWidth: 180, maxHeight: 220, overflowY: 'auto',
        }}>
          {types.map(t => {
            const ic = TYPE_ICONS[t] || 'ti-checkbox'
            const sel = t === value
            return (
              <button key={t} onClick={() => { onChange(t); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px', border: 'none', cursor: 'pointer',
                  background: sel ? accentBg : 'transparent',
                  fontSize: 13, fontWeight: sel ? 700 : 400,
                  color: sel ? accent : 'var(--color-text-primary)',
                  textAlign: 'left', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--color-bg)' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                <i className={`ti ${ic}`} style={{ fontSize: 15, color: sel ? accent : 'var(--color-text-hint)', flexShrink: 0 }} />
                {t}
                {sel && <i className="ti ti-check" style={{ fontSize: 13, marginLeft: 'auto', color: accent }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const SectionLabel = ({ children }) => (
  <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>
    {children}
  </p>
)

// Pílula base
const pill = (extra = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 12px', borderRadius: 99,
  border: '1.5px solid var(--color-border)', background: '#fff',
  cursor: 'pointer', fontSize: 13, fontWeight: 500,
  color: 'var(--color-text-primary)', outline: 'none',
  fontFamily: 'inherit', whiteSpace: 'nowrap',
  ...extra,
})

export default function TaskModal({
  open, onClose, onSave, lead,
  contractId, contractLabel,
  prefillType, prefillDescription, prefillAssignedTo,
  isRequired, contractMode,
  responsibles, taskTypes, editTask,
}) {
  const [type,        setType]        = useState('Ligação')
  const [description, setDescription] = useState('')
  const [assignedTo,  setAssignedTo]  = useState('')
  const [dueDate,     setDueDate]     = useState(todayStr())
  const [dueTime,     setDueTime]     = useState('')
  const [error,       setError]       = useState('')
  const [showDesc,    setShowDesc]    = useState(false)
  const [showTime,    setShowTime]    = useState(false)
  const dateInputRef = useRef(null)
  const timeInputRef = useRef(null)

  const people = responsibles || ['Riquelme', 'Daniel']
  const types  = taskTypes || DEFAULT_TASK_TYPES

  useEffect(() => {
    if (!open) return
    const first = (responsibles || ['Riquelme', 'Daniel'])[0]
    if (editTask) {
      setType(editTask.type || 'Ligação')
      setDescription(editTask.description || '')
      setAssignedTo(editTask.assignedTo || first)
      setDueDate(editTask.dueDate || todayStr())
      setDueTime(editTask.dueTime || '')
      setShowDesc(!!(editTask.description))
      setShowTime(!!(editTask.dueTime))
    } else {
      setType(prefillType || types[0] || 'Ligação')
      setDescription(contractMode ? '' : (prefillDescription || ''))
      setAssignedTo(prefillAssignedTo || first)
      setDueDate(todayStr())
      setDueTime('')
      setShowDesc(false)
      setShowTime(false)
    }
    setError('')
  }, [open, editTask, prefillType, prefillDescription, prefillAssignedTo, contractMode, responsibles])

  if (!open) return null

  const handleSave = () => {
    if (!dueDate)    { setError('Informe a data da tarefa.'); return }
    if (!assignedTo) { setError('Selecione o responsável.'); return }
    onSave({ lead_id: lead?.id, contract_id: contractId || '', type, description, assignedTo, dueDate, dueTime, status: 'pending', isAuto: !!contractId })
  }

  const handleBackdrop = () => {
    if (isRequired) { setError('Preencha a data e responsável antes de continuar.'); return }
    onClose()
  }

  const isContract   = contractMode
  const accent       = isContract ? '#7C3AED' : 'var(--color-blue-mid)'
  const accentBg     = isContract ? '#F3EEFF' : 'var(--color-blue-bg)'
  const accentShadow = isContract ? 'rgba(124,58,237,0.28)' : 'rgba(14,74,120,0.25)'

  // Segmented control de responsável — largura total dividida igualmente
  const Segmented = ({ fullWidth }) => (
    <div
      onClick={() => { const i = people.indexOf(assignedTo); setAssignedTo(people[(i + 1) % people.length]) }}
      style={{ display: 'flex', alignItems: 'center', background: 'var(--color-border)', borderRadius: 99, padding: 3, cursor: 'pointer', userSelect: 'none', width: fullWidth ? '100%' : undefined }}
    >
      {people.map(r => {
        const active = assignedTo === r
        return (
          <span key={r} style={{
            flex: fullWidth ? 1 : undefined,
            textAlign: 'center',
            padding: '5px 10px', borderRadius: 99, fontSize: 12,
            fontWeight: active ? 600 : 400,
            background: active ? '#fff' : 'transparent',
            color: active ? 'var(--color-text-primary)' : 'var(--color-text-hint)',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            transition: 'all 0.18s', whiteSpace: 'nowrap',
          }}>
            {r.split(' ')[0]}
          </span>
        )
      })}
    </div>
  )

  return (
    <div onClick={handleBackdrop} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 340, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'visible', position: 'relative' }}>

        {/* Fechar */}
        {!isRequired && (
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-hint)', fontSize: 18, lineHeight: 1, padding: 4, zIndex: 1 }}>
            <i className="ti ti-x" />
          </button>
        )}

        <div style={{ padding: '28px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 24 }}>

          {/* Header */}
          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, background: accentBg, borderRadius: 99, padding: '6px 14px 6px 6px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <i className={`ti ${isContract ? 'ti-file-description' : editTask ? 'ti-edit' : 'ti-calendar-plus'}`} style={{ fontSize: 14, color: accent }} />
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: accent }}>
              {editTask ? 'Editar tarefa' : isContract ? prefillType : 'Nova tarefa'}
            </p>
          </div>

          {/* Aviso obrigatório */}
          {isRequired && (
            <div style={{ width: '100%', padding: '10px 14px', background: '#FFF8E1', borderRadius: 10, border: '1px solid #F9A825', display: 'flex', gap: 8 }}>
              <i className="ti ti-alert-triangle" style={{ color: '#F57F17', fontSize: 14, marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#7A4F00', lineHeight: 1.5 }}>
                {isContract ? 'Agende a tarefa para confirmar a mudança de status do contrato.' : 'Este status exige uma tarefa agendada. Preencha para continuar.'}
              </span>
            </div>
          )}

          {/* Campos alinhados à esquerda */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Tipo + Responsável — 50/50 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tipo</span>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Responsável</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {!isContract
                    ? <TypeDropdown value={type} onChange={setType} types={types} accent={accent} accentBg={accentBg} fullWidth />
                    : <div style={pill({ border: `1.5px solid ${accent}`, background: accentBg, color: accent, fontWeight: 700, cursor: 'default', width: '100%', justifyContent: 'center', fontSize: 12 })}>
                        <i className="ti ti-file-description" style={{ fontSize: 12, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prefillType}</span>
                      </div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Segmented fullWidth />
                </div>
              </div>
            </div>

            {/* Data + Hora */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Data</span>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Horário</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Data — metade */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <button
                    onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                    style={pill({ fontWeight: 600, width: '100%', justifyContent: 'center' })}
                  >
                    <i className="ti ti-calendar" style={{ fontSize: 13, color: accent }} />
                    {formatDate(dueDate)}
                  </button>
                  <input ref={dateInputRef} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', pointerEvents: 'none', border: 'none', padding: 0 }}
                    tabIndex={-1}
                  />
                </div>
                {/* Hora — metade */}
                <div style={{ flex: 1 }}>
                  {!showTime ? (
                    <button onClick={() => setShowTime(true)} style={pill({ border: '1.5px dashed var(--color-border)', color: 'var(--color-text-hint)', fontSize: 12, background: 'transparent', width: '100%', justifyContent: 'center' })}>
                      <i className="ti ti-clock" style={{ fontSize: 12 }} />+ horário
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
                      <button onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.focus()} style={pill({ fontWeight: 600, flex: 1, justifyContent: 'center' })}>
                        <i className="ti ti-clock" style={{ fontSize: 13, color: accent }} />
                        {dueTime || '‒‒:‒‒'}
                      </button>
                      <input ref={timeInputRef} type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
                        style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: 'calc(100% - 32px)', height: '100%', pointerEvents: 'none', border: 'none', padding: 0 }}
                        tabIndex={-1}
                      />
                      <button onClick={() => { setDueTime(''); setShowTime(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-hint)', fontSize: 15, padding: 2, lineHeight: 1, flexShrink: 0 }}>
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descrição */}
            {!showDesc ? (
              <button onClick={() => setShowDesc(true)} style={pill({ border: '1.5px dashed var(--color-border)', color: 'var(--color-text-hint)', fontSize: 12, background: 'transparent', width: '100%', justifyContent: 'center' })}>
                <i className="ti ti-plus" style={{ fontSize: 12 }} />Adicionar descrição
              </button>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Descrição</span>
                <textarea autoFocus value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da tarefa…" rows={2} style={{ width: '100%', resize: 'none', minHeight: 56, fontSize: 13 }} />
              </div>
            )}

          </div>

          {/* Erro */}
          {error && (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 8, background: 'var(--color-red-bg)', border: '1px solid var(--color-red-dark)' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 13, color: 'var(--color-red-dark)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--color-red-dark)' }}>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 99, padding: '4px 5px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            {!isRequired && (
              <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 99, border: 'none', background: 'transparent', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <i className="ti ti-x" style={{ fontSize: 13 }} />Cancelar
              </button>
            )}
            <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 99, border: 'none', background: accent, fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 2px 8px ${accentShadow}` }}>
              <i className={`ti ${editTask ? 'ti-device-floppy' : 'ti-check'}`} style={{ fontSize: 13 }} />
              {editTask ? 'Salvar' : 'Agendar'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
