import { useState, useEffect } from 'react'
import { OPERATIONAL_STATUSES, OPERATIONAL_STATUS_META, LOSS_REASONS as DEFAULT_LOSS_REASONS, fmtCurrency } from '../constants'
import StatusBadge from './StatusBadge'
import { apiUpdateOperation } from '../utils/api'

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>{hint}</span>}
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

export default function OperationDetail({ operation, settings, onStatusChange, onOpenLead, onSaved }) {
  const lossReasons = settings?.lossReasons
    ? JSON.parse(settings.lossReasons)
    : DEFAULT_LOSS_REASONS

  const [form, setForm] = useState({
    repaymentValue:    operation.repaymentValue    || '',
    distributionNotes: operation.distributionNotes || '',
    notes:             operation.notes             || '',
    responsible:       operation.responsible       || '',
  })
  const [saving,        setSaving]        = useState(false)
  const [showLossModal, setShowLossModal] = useState(false)

  useEffect(() => {
    setForm({
      repaymentValue:    operation.repaymentValue    || '',
      distributionNotes: operation.distributionNotes || '',
      notes:             operation.notes             || '',
      responsible:       operation.responsible       || '',
    })
  }, [operation.id, operation.repaymentValue, operation.distributionNotes, operation.notes, operation.responsible])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const isLost = !!operation.isLost

  const emb  = parseFloat(operation.lead_embeddedValue ?? operation.embeddedValue) || 0
  const fee  = operation.lead_feePercent ?? operation.feePercent ?? 50
  const leme = emb * (fee / 100)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await apiUpdateOperation(operation.id, {
        repaymentValue:    parseFloat(form.repaymentValue) || 0,
        distributionNotes: form.distributionNotes,
        notes:             form.notes,
        responsible:       form.responsible,
      })
      if (onSaved) onSaved(updated)
    } catch (e) {
      alert(`Erro ao salvar: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleStepClick = (step, isLostStep) => {
    if (isLostStep) {
      setShowLossModal(true)
    } else {
      onStatusChange && onStatusChange(step)
    }
  }

  const handleConfirmLoss = (reason) => {
    setShowLossModal(false)
    onStatusChange && onStatusChange('__lost__', reason)
  }

  const handleRevive = () => {
    onStatusChange && onStatusChange('__revive__')
  }

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
      <div style={{ background: 'var(--color-surface)', border: `1px solid ${isLost ? 'var(--color-red-border, #f5c6cb)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-xl)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: isLost ? 'var(--color-red-bg)' : '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600, color: isLost ? 'var(--color-red-dark)' : '#1565C0', flexShrink: 0 }}>
            {(operation.lead_name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{operation.lead_name || '(sem nome)'}</h3>
            <div style={{ marginTop: 5, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusBadge status={isLost ? 'Perdido' : operation.status} />
              {operation.lead_bank && (
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--color-border)' }}>
                  {operation.lead_bank}
                </span>
              )}
            </div>
          </div>
          {onOpenLead && (
            <button
              onClick={onOpenLead}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
            >
              <i className="ti ti-briefcase" style={{ fontSize: 14 }} aria-hidden="true" />
              Ver lead comercial
            </button>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {operation.lead_phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <i className="ti ti-phone" style={{ fontSize: 14, flexShrink: 0 }} aria-hidden="true" />
              {operation.lead_phone}
              {operation.lead_source && <span style={{ marginLeft: 4 }}>· {operation.lead_source}</span>}
            </div>
          )}
          {(operation.lead_adCampaign || operation.lead_adSet || operation.lead_adName) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--color-text-hint)', flexWrap: 'wrap' }}>
              <i className="ti ti-ad-2" style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
              <span>
                {[operation.lead_adCampaign, operation.lead_adSet, operation.lead_adName].filter(Boolean).join(' › ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Funil Operacional — esteira de etapas ─────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        border: `1px solid ${isLost ? 'var(--color-red-border, #f5c6cb)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-xl)', padding: '18px 20px',
      }}>
        <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-arrow-right-bar" style={{ fontSize: 14 }} aria-hidden="true" />
          Funil Operacional
        </p>

        {isLost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: 'var(--color-red-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-red-border, #f5c6cb)' }}>
            <i className="ti ti-circle-x" style={{ fontSize: 16, color: 'var(--color-red-dark)', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontSize: 13, color: 'var(--color-red-dark)', fontWeight: 500, flex: 1 }}>
              Operação perdida — <strong>{operation.lossReason || 'sem motivo'}</strong>
              {operation.lastActiveStatus ? ` · estava em ${operation.lastActiveStatus}` : ''}
            </span>
            <button
              onClick={handleRevive}
              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-red-dark)', background: '#fff', color: 'var(--color-red-dark)', fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
            >
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
          extraStep={operation.status !== '11. Concluído' ? 'Perdido' : null}
        />
      </div>

      {/* ── Painel de valores ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Valor embutido',       value: fmtCurrency(emb),  icon: 'ti-coin',         bg: '#FFF3CD', color: '#7A4F00' },
          { label: `Honorários (${fee}%)`, value: fmtCurrency(leme), icon: 'ti-cash',         bg: '#E8F5E9', color: '#2E7D32' },
          { label: 'Repasse (cliente)',     value: fmtCurrency(parseFloat(form.repaymentValue) || 0), icon: 'ti-transfer', bg: '#E3F2FD', color: '#1565C0' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <i className={`ti ${m.icon}`} style={{ fontSize: 14, color: m.color }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: m.color, opacity: 0.8 }}>{m.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Campos editáveis ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dados da operação</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Field label="Valor do Repasse (R$)" hint="Valor que o cliente vai repassar">
            <input
              type="number" min="0" step="0.01"
              value={form.repaymentValue}
              onChange={e => set('repaymentValue', e.target.value)}
              placeholder="0.00"
            />
          </Field>

          <Field label="Responsável">
            <input
              value={form.responsible}
              onChange={e => set('responsible', e.target.value)}
              placeholder="Nome do responsável"
            />
          </Field>

          <Field label="Observações de Distribuição" hint="Obs sobre repasse/distribuição entre os sócios">
            <textarea
              value={form.distributionNotes}
              onChange={e => set('distributionNotes', e.target.value)}
              placeholder="Ex: 50% Daniel, 50% Riquelme…"
              rows={3}
            />
          </Field>

          <Field label="Observações gerais">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Anotações sobre a operação…"
              rows={3}
            />
          </Field>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: '#1565C0', color: '#fff', fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            <i className="ti ti-device-floppy" style={{ fontSize: 16 }} aria-hidden="true" />
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
