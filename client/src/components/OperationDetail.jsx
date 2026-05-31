import { useState, useEffect, useCallback } from 'react'
import { OPERATIONAL_STATUSES, OPERATIONAL_STATUS_META, OP_LOSS_REASONS as DEFAULT_LOSS_REASONS, fmtDate, fmtCurrency } from '../constants'
import StatusBadge from './StatusBadge'
import LeadDetail from './LeadDetail'
import ConfirmModal from './ConfirmModal'
import { apiListReceipts, apiCreateReceipt, apiUpdateReceipt, apiDeleteReceipt, apiListPayouts, apiCreatePayout, apiUpdatePayout, apiDeletePayout } from '../utils/api'

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 15, color: 'var(--color-text-hint)', marginTop: 1, flexShrink: 0, width: 18 }} aria-hidden="true" />
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

const CHEVRON_H   = 36
const CHEVRON_P   = 12
const CHEVRON_TIP = 10

function FunnelPipeline({ statuses, statusMeta, currentStatus, isLost, onSelect, extraStep }) {
  const currentIdx = isLost ? statuses.length : statuses.indexOf(currentStatus)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0 }}>
        {statuses.map((step, i) => {
          const meta      = statusMeta[step]
          const isDone    = i < currentIdx
          const isCurrent = i === currentIdx
          const isFirst   = i === 0
          const isLast    = i === statuses.length - 1
          const label     = step.replace(/^\d+\.\s*/, '')
          const showTip   = isDone && !isLast

          let bg, color
          if (isCurrent) { bg = meta.color;        color = '#fff'                   }
          else if (isDone){ bg = '#D6F0DA';         color = '#1B6B2A'                }
          else             { bg = 'var(--color-bg)'; color = 'var(--color-text-hint)' }

          return (
            <button
              key={step}
              onClick={() => onSelect(step, false)}
              title={step}
              style={{
                position: 'relative',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                flex: 1, height: CHEVRON_H,
                paddingLeft: CHEVRON_P, paddingRight: CHEVRON_P,
                background: bg, color,
                border: 'none',
                borderTop:    `1px solid ${isCurrent ? meta.color : isDone ? '#A5D6A7' : 'var(--color-border)'}`,
                borderBottom: `1px solid ${isCurrent ? meta.color : isDone ? '#A5D6A7' : 'var(--color-border)'}`,
                borderLeft:   isFirst ? `1px solid ${isCurrent ? meta.color : isDone ? '#A5D6A7' : 'var(--color-border)'}` : 'none',
                borderRight:  isLast ? `1px solid ${isCurrent ? meta.color : 'var(--color-border)'}` : 'none',
                borderRadius: isFirst ? '8px 0 0 8px' : isLast ? '0 8px 8px 0' : 0,
                cursor: 'pointer',
                fontSize: 11, fontWeight: isCurrent ? 700 : isDone ? 500 : 400,
                whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s',
                zIndex: isCurrent ? 2 : 1, minWidth: 0,
              }}
            >
              <i className={`ti ${meta?.icon || 'ti-circle'}`} style={{ fontSize: 12, flexShrink: 0, width: 14, textAlign: 'center' }} aria-hidden="true" />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', minWidth: 0 }}>{label}</span>
              <i className="ti ti-check" style={{ fontSize: 9, flexShrink: 0, width: 12, textAlign: 'center', visibility: isDone ? 'visible' : 'hidden' }} aria-hidden="true" />
              {showTip && (
                <span style={{ position: 'absolute', right: -(CHEVRON_TIP), width: 0, height: 0, borderTop: `${CHEVRON_H / 2}px solid transparent`, borderBottom: `${CHEVRON_H / 2}px solid transparent`, borderLeft: `${CHEVRON_TIP}px solid ${bg}`, zIndex: 3 }} />
              )}
              {showTip && (
                <span style={{ position: 'absolute', right: -(CHEVRON_TIP + 1), width: 0, height: 0, borderTop: `${CHEVRON_H / 2}px solid transparent`, borderBottom: `${CHEVRON_H / 2}px solid transparent`, borderLeft: `${CHEVRON_TIP + 1}px solid #A5D6A7`, zIndex: 2 }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Perdido — sempre no DOM para não afetar o tamanho do bloco de etapas */}
      <button
        onClick={() => extraStep && onSelect(extraStep, true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          marginLeft: 10, padding: '5px 12px', height: CHEVRON_H,
          borderRadius: 'var(--radius-full)',
          border: isLost ? '1.5px solid var(--color-red-dark)' : '1px solid var(--color-red-border, #f5c6cb)',
          background: isLost ? 'var(--color-red-dark)' : 'transparent',
          color: isLost ? '#fff' : 'var(--color-red-dark)',
          fontSize: 12, fontWeight: isLost ? 700 : 400,
          cursor: extraStep ? 'pointer' : 'default',
          transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          flexShrink: 0,
          visibility: extraStep ? 'visible' : 'hidden',
        }}
      >
        <i className="ti ti-circle-x" style={{ fontSize: 12 }} aria-hidden="true" />
        Perdido
      </button>
    </div>
  )
}

// ─── Modal de motivo de perda ─────────────────────────────────────────────────
function LossReasonModal({ lossReasons, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 380, width: '100%',
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-circle-x" style={{ fontSize: 18, color: 'var(--color-red-dark)' }} aria-hidden="true" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Marcar como Perdido</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Selecione o motivo para confirmar</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {lossReasons.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 10, border: `1.5px solid ${reason === r ? 'var(--color-red-dark)' : 'var(--color-border)'}`,
                background: reason === r ? 'var(--color-red-bg)' : 'transparent',
                color: reason === r ? 'var(--color-red-dark)' : 'var(--color-text-primary)',
                cursor: 'pointer', fontSize: 13, fontWeight: reason === r ? 600 : 400,
                transition: 'all 0.14s', textAlign: 'left',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${reason === r ? 'var(--color-red-dark)' : 'var(--color-border)'}`,
                background: reason === r ? 'var(--color-red-dark)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {reason === r && <i className="ti ti-check" style={{ fontSize: 9, color: '#fff' }} />}
              </div>
              {r}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            Cancelar
          </button>
          <button
            onClick={() => reason && onConfirm(reason)}
            disabled={!reason}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: reason ? 'var(--color-red-dark)' : 'var(--color-border)', color: reason ? '#fff' : 'var(--color-text-hint)', fontSize: 13, fontWeight: 600, cursor: reason ? 'pointer' : 'default', transition: 'all 0.14s' }}
          >
            Confirmar Perda
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, icon, color, bg, children, action }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--color-border)', background: bg }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  )
}

function ReceiptsTotalCell({ label, value, icon, color, bg }) {
  const display = value

  return (
    <div style={{ background: bg, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 16, color }} />
      <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>
        {fmtCurrency(display)}
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, color, opacity: 0.7, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </div>
  )
}

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function parseCurrencyInput(raw) {
  // Remove tudo que não for dígito
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  return parseInt(digits, 10) / 100
}

function formatCurrencyInput(value) {
  // value é número float, retorna string "1.234,56"
  if (!value && value !== 0) return ''
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function CurrencyInput({ value, onChange, placeholder }) {
  const [display, setDisplay] = useState(value ? formatCurrencyInput(value) : '')

  useEffect(() => {
    if (value === 0 || value === '') setDisplay('')
    else if (value !== parseCurrencyInput(display)) setDisplay(formatCurrencyInput(value))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const raw = e.target.value
    const numeric = parseCurrencyInput(raw)
    setDisplay(formatCurrencyInput(numeric))
    onChange(numeric)
  }

  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--color-text-secondary)', pointerEvents: 'none' }}>R$</span>
      <input
        value={display}
        onChange={handleChange}
        placeholder={placeholder || '0,00'}
        inputMode="numeric"
        style={{ width: '100%', paddingLeft: 32 }}
      />
    </div>
  )
}

function ReceiptsSection({ lead, operation, onTotalChange }) {
  const [receipts, setReceipts] = useState([])
  const [modal, setModal] = useState(null) // null | 'new' | receipt obj
  const [form, setForm] = useState({ amount: 0, date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  const load = useCallback(async () => {
    try { setReceipts(await apiListReceipts(lead.id)) } catch (e) { console.error('receipts load:', e) }
  }, [lead.id])

  useEffect(() => { load() }, [load])

  const openNew = () => { setForm({ amount: 0, date: todayLocal(), description: '' }); setModal('new') }
  const openEdit = (r) => { setForm({ amount: parseFloat(r.amount) || 0, date: r.date, description: r.description }); setModal(r) }

  const save = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    try {
      if (modal === 'new') await apiCreateReceipt(lead.id, { ...form })
      else await apiUpdateReceipt(lead.id, modal.id, { ...form })
      await load(); setModal(null)
    } finally { setSaving(false) }
  }

  const del = async () => {
    await apiDeleteReceipt(lead.id, confirmDel.id)
    setConfirmDel(null)
    await load()
  }

  const total = receipts.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  useEffect(() => { onTotalChange?.(total) }, [total]) // eslint-disable-line react-hooks/exhaustive-deps
  const expected = parseFloat(operation?.embeddedValue || lead?.embeddedValue) || 0
  const diff = total - expected
  const pct = expected > 0 ? Math.min(100, Math.round((total / expected) * 100)) : 0

  return (
    <SectionCard title="Recebimentos (PIX do cliente)" icon="ti-arrow-down-circle" color="#15803D" bg="#F0FDF4"
      action={<button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1.5px solid #15803D', background: 'transparent', color: '#15803D', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><i className="ti ti-plus" style={{ fontSize: 12 }} /> Registrar</button>}
    >
      {/* Progresso */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Recebido: <strong style={{ color: '#15803D' }}>{fmtCurrency(total)}</strong></span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Esperado: <strong>{fmtCurrency(expected)}</strong></span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: '#DCFCE7', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: pct >= 100 ? '#15803D' : '#4ADE80', width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>
        {expected > 0 && (
          <div style={{ marginTop: 4, fontSize: 11, color: diff >= 0 ? '#15803D' : '#B45309', textAlign: 'right' }}>
            {pct}% · {diff >= 0 ? `+${fmtCurrency(diff)} a mais` : `${fmtCurrency(Math.abs(diff))} pendente`}
          </div>
        )}
      </div>

      {receipts.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-hint)', textAlign: 'center', padding: '12px 0' }}>Nenhum recebimento registrado.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {receipts.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid #DCFCE7', background: '#F9FFFA' }}>
              <i className="ti ti-circle-check" style={{ fontSize: 14, color: '#15803D', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>{fmtCurrency(r.amount)}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-hint)', marginLeft: 8 }}>{fmtDate(r.date)}</span>
                {r.description && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: 'var(--color-text-hint)', fontSize: 13, borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background='none'}><i className="ti ti-pencil" /></button>
                <button onClick={() => setConfirmDel(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: 'var(--color-text-hint)', fontSize: 13, borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background='none'}><i className="ti ti-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDel}
        title="Excluir recebimento"
        message={confirmDel ? `Remover recebimento de ${fmtCurrency(confirmDel.amount)}?` : ''}
        confirmLabel="Excluir"
        onConfirm={del}
        onCancel={() => setConfirmDel(null)}
      />

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', maxWidth: 360, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}>
            <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>{modal === 'new' ? 'Registrar recebimento' : 'Editar recebimento'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Valor *</label>
                <CurrencyInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Data *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Descrição</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Estorno Banco X parcela 1" style={{ width: '100%' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.amount || !form.date} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#15803D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.amount || !form.date ? 0.6 : 1 }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function PayoutsSection({ lead, onTotalChange }) {
  const [payouts, setPayouts] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ recipient: '', amount: '', date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  const load = useCallback(async () => {
    try { setPayouts(await apiListPayouts(lead.id)) } catch {}
  }, [lead.id])

  useEffect(() => { load() }, [load])

  const openNew = () => { setForm({ recipient: '', amount: 0, date: todayLocal(), description: '' }); setModal('new') }
  const openEdit = (p) => { setForm({ recipient: p.recipient, amount: parseFloat(p.amount) || 0, date: p.date, description: p.description }); setModal(p) }

  const save = async () => {
    if (!form.recipient || !form.amount || !form.date) return
    setSaving(true)
    try {
      if (modal === 'new') await apiCreatePayout(lead.id, { ...form })
      else await apiUpdatePayout(lead.id, modal.id, { ...form })
      await load(); setModal(null)
    } finally { setSaving(false) }
  }

  const togglePaid = async (p) => {
    await apiUpdatePayout(lead.id, p.id, { paid: !p.paid })
    await load()
  }

  const del = async () => {
    await apiDeletePayout(lead.id, confirmDel.id)
    setConfirmDel(null)
    await load()
  }

  const totalPaid = payouts.filter(p => p.paid).reduce((s, p) => s + (parseFloat(p.amount)||0), 0)
  const totalPending = payouts.filter(p => !p.paid).reduce((s, p) => s + (parseFloat(p.amount)||0), 0)
  useEffect(() => { onTotalChange?.(totalPaid) }, [totalPaid]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SectionCard title="Repasses" icon="ti-arrow-up-circle" color="#7C3AED" bg="#F5F3FF"
      action={<button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1.5px solid #7C3AED', background: 'transparent', color: '#7C3AED', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><i className="ti ti-plus" style={{ fontSize: 12 }} /> Adicionar</button>}
    >
      {payouts.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-hint)', textAlign: 'center', padding: '12px 0' }}>Nenhum repasse registrado.</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Pago: <strong style={{ color: '#15803D' }}>{fmtCurrency(totalPaid)}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Pendente: <strong style={{ color: '#B45309' }}>{fmtCurrency(totalPending)}</strong></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {payouts.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${p.paid ? '#DDD6FE' : 'var(--color-border)'}`, background: p.paid ? '#F5F3FF' : 'var(--color-surface)' }}>
                <i className={`ti ${p.paid ? 'ti-circle-check' : 'ti-clock'}`} style={{ fontSize: 14, color: p.paid ? '#7C3AED' : '#B45309', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{fmtCurrency(p.amount)}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>→ {p.recipient}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>{fmtDate(p.date)}</span>
                  </div>
                  {p.description && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  {p.paid ? (
                    <button onClick={() => togglePaid(p)} title="Desfazer pagamento"
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99, border: '1.5px solid #DDD6FE', background: '#EDE9FE', color: '#7C3AED', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      <i className="ti ti-circle-check" style={{ fontSize: 11 }} /> Pago
                    </button>
                  ) : (
                    <button onClick={() => togglePaid(p)} title="Confirmar pagamento"
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99, border: '1.5px solid #7C3AED', background: 'transparent', color: '#7C3AED', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <i className="ti ti-circle-check" style={{ fontSize: 11 }} /> Pagar
                    </button>
                  )}
                  <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: 'var(--color-text-hint)', fontSize: 13, borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background='none'}><i className="ti ti-pencil" /></button>
                  <button onClick={() => setConfirmDel(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: 'var(--color-text-hint)', fontSize: 13, borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background='none'}><i className="ti ti-trash" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        open={!!confirmDel}
        title="Excluir repasse"
        message={confirmDel ? `Remover repasse de ${fmtCurrency(confirmDel.amount)} para ${confirmDel.recipient}?` : ''}
        confirmLabel="Excluir"
        onConfirm={del}
        onCancel={() => setConfirmDel(null)}
      />

      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', maxWidth: 360, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}>
            <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>{modal === 'new' ? 'Adicionar repasse' : 'Editar repasse'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Para quem *</label>
                <input value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} placeholder="Nome do parceiro / indicação" style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Valor *</label>
                <CurrencyInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Data *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Descrição</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: comissão indicação" style={{ width: '100%' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.recipient || !form.amount || !form.date} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.recipient || !form.amount || !form.date ? 0.6 : 1 }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

export default function OperationDetail({ operation, lead, settings, onStatusChange, onOpenLead, onEditLead, onDeleteLead, onLeadStatusChange, onRefresh, onTaskEdited, onTaskDeleted }) {
  const lossReasons = settings?.opLossReasons
    ? JSON.parse(settings.opLossReasons)
    : DEFAULT_LOSS_REASONS

  const [showLossModal, setShowLossModal] = useState(false)
  const [receiptsTotal, setReceiptsTotal] = useState(0)
  const [payoutsTotal,  setPayoutsTotal]  = useState(0)

  const isLost = !!operation.isLost

  const handleStepClick = (step, isLostStep) => {
    if (isLostStep) { setShowLossModal(true) }
    else { onStatusChange && onStatusChange(step) }
  }

  const handleConfirmLoss = (reason) => {
    setShowLossModal(false)
    onStatusChange && onStatusChange('__lost__', reason)
  }

  const handleRevive = () => onStatusChange && onStatusChange('__revive__')

  const whatsappHref = lead?.phone
    ? `https://wa.me/55${(lead.phone).replace(/\D/g, '')}`
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {showLossModal && (
        <LossReasonModal
          lossReasons={lossReasons}
          onConfirm={handleConfirmLoss}
          onCancel={() => setShowLossModal(false)}
        />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>

        {/* Topo: avatar + nome + botões */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 600, color: 'var(--color-blue-dark)',
          }}>
            {(operation.lead_name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{operation.lead_name || '(sem nome)'}</h3>
            <div style={{ marginTop: 5, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {isLost && operation.lossReason && (
                <span style={{ fontSize: 12, color: 'var(--color-red-dark)', background: 'var(--color-red-bg)', padding: '2px 8px', borderRadius: 99 }}>
                  {operation.lossReason}
                </span>
              )}
              {operation.responsible && (
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--color-border)' }}>
                  {operation.responsible}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: '#E7F8EE', color: '#1A6B35', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                <i className="ti ti-brand-whatsapp" style={{ fontSize: 15 }} /> WhatsApp
              </a>
            )}
            {onEditLead && (
              <button onClick={onEditLead}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer' }}>
                <i className="ti ti-edit" style={{ fontSize: 14 }} /> Editar
              </button>
            )}
            {onOpenLead && (
              <button onClick={onOpenLead}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer' }}>
                <i className="ti ti-briefcase" style={{ fontSize: 14 }} /> Ver no comercial
              </button>
            )}
          </div>
        </div>

        {/* Funil operacional — dentro do card, igual ao comercial */}
        <div style={{ marginBottom: 12 }}>
          {isLost && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: 'var(--color-red-bg)', borderRadius: 8, border: '1px solid var(--color-red-border, #f5c6cb)' }}>
              <i className="ti ti-circle-x" style={{ fontSize: 14, color: 'var(--color-red-dark)', flexShrink: 0 }} aria-hidden="true" />
              <span style={{ fontSize: 12, color: 'var(--color-red-dark)', fontWeight: 500, flex: 1 }}>
                Perdido — <strong>{operation.lossReason || 'sem motivo'}</strong>
                {operation.lastActiveStatus ? ` · estava em ${operation.lastActiveStatus}` : ''}
              </span>
              <button onClick={handleRevive} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--color-red-dark)', background: '#fff', color: 'var(--color-red-dark)', fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
                Reativar
              </button>
            </div>
          )}
          <FunnelPipeline
            statuses={OPERATIONAL_STATUSES}
            statusMeta={OPERATIONAL_STATUS_META}
            currentStatus={operation.status}
            isLost={isLost}
            onSelect={handleStepClick}
            extraStep={operation.status !== 'Concluído' ? 'Perdido' : null}
          />
        </div>

        {/* Informações do lead */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
          <InfoRow icon="ti-phone"        label="Telefone"      value={lead?.phone} />
          <InfoRow icon="ti-mail"         label="E-mail"        value={lead?.email} />
          <InfoRow icon="ti-id-badge"     label="CPF"           value={lead?.cpf} />
          <InfoRow icon="ti-user"         label="Responsável"   value={lead?.responsible} />
          <InfoRow icon="ti-map-pin"      label="Origem"        value={lead?.source} />
          <InfoRow icon="ti-calendar"     label="Cadastrado em" value={lead?.createdAt ? fmtDate(lead.createdAt.slice(0,10)) : ''} />
          {(lead?.adCampaign || lead?.adSet || lead?.adName) && (
            <InfoRow icon="ti-ad-2" label="Meta Ads"
              value={[lead.adCampaign, lead.adSet, lead.adName].filter(Boolean).join(' · ')} />
          )}
        </div>

        {/* Observações */}
        {lead?.notes && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Observações</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{lead.notes}</p>
          </div>
        )}

        {/* ── Painel financeiro ─────────────────────────────────────────────── */}
        {(() => {
          const embedded   = parseFloat(operation.embeddedValue || lead?.embeddedValue) || 0
          const feePct     = parseFloat(operation.feePercent    || lead?.feePercent)    || 0
          const honorarios = embedded * (feePct / 100)
          const liquido    = receiptsTotal - payoutsTotal
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)', marginTop: 14 }}>
              {[
                { label: 'Valor Embutido',          value: embedded,      icon: 'ti-building-bank', color: '#1565C0', bg: '#EFF6FF' },
                { label: `Honorários (${feePct}%)`, value: honorarios,    icon: 'ti-receipt',        color: '#7C3AED', bg: '#F5F3FF' },
                { label: 'Recebido',                value: receiptsTotal, icon: 'ti-circle-check',   color: '#15803D', bg: '#F0FDF4' },
                { label: 'Repasses (pagos)',         value: payoutsTotal,  icon: 'ti-arrow-up-circle',color: '#B45309', bg: '#FFF8E1' },
                { label: 'Receita Líquida',          value: liquido,       icon: 'ti-coin',           color: liquido >= 0 ? '#15803D' : '#C62828', bg: liquido >= 0 ? '#F0FDF4' : '#FEE2E2' },
              ].map((m, i) => (
                <ReceiptsTotalCell key={i} {...m} />
              ))}
            </div>
          )
        })()}
      </div>

      {/* ── Recebimentos ──────────────────────────────────────────────────── */}
      {lead && <ReceiptsSection lead={lead} operation={operation} onTotalChange={setReceiptsTotal} />}

      {/* ── Repasses ──────────────────────────────────────────────────────── */}
      {lead && <PayoutsSection lead={lead} onTotalChange={setPayoutsTotal} />}

      {/* ── Lead completo (contratos, dados, histórico) ────────────────────── */}
      {lead && settings && (
        <LeadDetail
          lead={lead}
          settings={settings}
          onEdit={onEditLead}
          onDelete={onDeleteLead}
          onStatusChange={onLeadStatusChange}
          onRefresh={onRefresh}
          onTaskEdited={onTaskEdited}
          embedded
        />
      )}

    </div>
  )
}
