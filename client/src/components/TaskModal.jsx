import { useState, useEffect } from 'react'
import { DEFAULT_TASK_TYPES } from '../constants'

const today = () => new Date().toISOString().slice(0, 10)

export default function TaskModal({
  open,
  onClose,
  onSave,
  lead,
  contractId,
  contractLabel,   // ex: "Itaú · Empréstimo Pessoal" — exibido no header quando é tarefa de contrato
  prefillType,
  prefillDescription,
  prefillAssignedTo,
  isRequired,      // true = modal obrigatório (não pode fechar sem preencher)
  contractMode,    // true = modo simplificado: só data, hora, responsável
  responsibles,
  taskTypes,
  editTask,
}) {
  const [type,        setType]        = useState('Ligação')
  const [description, setDescription] = useState('')
  const [assignedTo,  setAssignedTo]  = useState('')
  const [dueDate,     setDueDate]     = useState(today())
  const [dueTime,     setDueTime]     = useState('')
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (!open) return
    if (editTask) {
      setType(editTask.type || 'Ligação')
      setDescription(editTask.description || '')
      setAssignedTo(editTask.assignedTo || '')
      setDueDate(editTask.dueDate || today())
      setDueTime(editTask.dueTime || '')
    } else {
      setType(prefillType || 'Ligação')
      setDescription(contractMode ? '' : (prefillDescription || ''))
      setAssignedTo(prefillAssignedTo || '')
      setDueDate(today())
      setDueTime('')
    }
    setError('')
  }, [open, editTask, prefillType, prefillDescription, prefillAssignedTo, contractMode])

  if (!open) return null

  const handleSave = () => {
    if (!dueDate) { setError('Informe a data da tarefa.'); return }
    if (!assignedTo) { setError('Informe o responsável.'); return }
    onSave({
      lead_id:     lead?.id,
      contract_id: contractId || '',
      type,
      description,
      assignedTo,
      dueDate,
      dueTime,
      status:  'pending',
      isAuto:  !!contractId,
    })
  }

  const handleBackdrop = () => {
    if (isRequired) { setError('Preencha a data e responsável antes de continuar.'); return }
    onClose()
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className={contractMode ? 'ti ti-file-description' : 'ti ti-checkbox'} style={{ fontSize: 18, color: contractMode ? '#7C3AED' : '#1565C0', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
              {editTask ? 'Editar tarefa' : contractMode ? prefillType : 'Nova tarefa'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {contractMode && contractLabel
                ? contractLabel
                : lead ? `${lead.name || '(sem nome)'}${lead.phone ? ` · ${lead.phone}` : ''}` : ''}
            </p>
          </div>
          {!isRequired && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-hint)', padding: 4 }}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        {/* Aviso obrigatório */}
        {isRequired && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: '#FFF8E1', borderRadius: 'var(--radius-md)', border: '1px solid #F9A825', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <i className="ti ti-alert-triangle" style={{ color: '#F57F17', fontSize: 15, marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#7A4F00' }}>
              {contractMode
                ? 'Agende a tarefa para confirmar a mudança de status do contrato.'
                : 'Este status exige uma tarefa agendada. Preencha para continuar.'}
            </span>
          </div>
        )}

        {/* Formulário */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Tipo — só em modo normal ou edição */}
          {!contractMode && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Tipo de tarefa</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                {(taskTypes || DEFAULT_TASK_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Descrição — sempre visível */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa…"
              rows={2}
              style={{ resize: 'vertical', minHeight: 56 }}
            />
          </div>

          {/* Data + Hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Data *</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Hora (opcional)</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Responsável *</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">Selecionar…</option>
              {(responsibles || ['Riquelme', 'Daniel']).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-red-dark)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 13 }} />{error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {!isRequired && (
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: contractMode ? '#7C3AED' : 'var(--color-blue-mid)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            {editTask ? 'Salvar alterações' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}
