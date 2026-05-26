import { useState, useEffect } from 'react'
import { OPERATIONAL_STATUSES, OPERATIONAL_STATUS_META, LOSS_REASONS, fmtCurrency } from '../constants'
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

export default function OperationDetail({ operation, onStatusChange, onOpenLead, onSaved }) {
  const [form, setForm] = useState({
    repaymentValue:    operation.repaymentValue    || '',
    distributionNotes: operation.distributionNotes || '',
    notes:             operation.notes             || '',
    responsible:       operation.responsible       || '',
  })
  const [saving,           setSaving]           = useState(false)
  const [pendingLossReason, setPendingLossReason] = useState('')

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

  // Dados financeiros vêm sempre do lead (sincronizados automaticamente pelo servidor)
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

  const handleMarkLost = () => {
    if (!pendingLossReason) { alert('Selecione o motivo da perda.'); return }
    onStatusChange && onStatusChange('__lost__', pendingLossReason)
  }

  const handleRevive = () => {
    onStatusChange && onStatusChange('__revive__')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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

        {/* Infos do lead vinculado */}
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

      {/* ── Avançar status operacional ────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: `1px solid ${isLost ? 'var(--color-red-border, #f5c6cb)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>

        {/* Banner de operação perdida */}
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

        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avançar etapa — Funil Operacional</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {OPERATIONAL_STATUSES.map(s => {
            const meta   = OPERATIONAL_STATUS_META[s]
            const active = operation.status === s && !isLost
            return (
              <button key={s} onClick={() => onStatusChange && onStatusChange(s)} style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: active ? `1.5px solid ${meta.color}` : '1px solid var(--color-border)',
                background: active ? meta.bg : 'transparent',
                color: active ? meta.color : 'var(--color-text-secondary)',
                fontWeight: active ? 500 : 400, cursor: 'pointer',
                opacity: isLost ? 0.5 : 1,
              }}>
                <i className={`ti ${meta.icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
                {s}
              </button>
            )
          })}
        </div>

        {/* Seção "Marcar como perdido" — só quando ativa, não no status 12. Concluído */}
        {!isLost && operation.status !== '11. Concluído' && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Marcar como perdido <span style={{ fontWeight: 400, opacity: 0.7 }}>(propaga para o comercial)</span>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={pendingLossReason}
                onChange={e => setPendingLossReason(e.target.value)}
                style={{ fontSize: 12, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', minWidth: 160 }}
              >
                <option value="">Selecionar motivo…</option>
                {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                onClick={handleMarkLost}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <i className="ti ti-circle-x" style={{ fontSize: 12 }} aria-hidden="true" />
                Marcar Perdido
              </button>
            </div>
          </div>
        )}
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
