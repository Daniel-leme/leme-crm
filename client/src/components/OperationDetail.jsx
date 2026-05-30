import { useState } from 'react'
import { OPERATIONAL_STATUSES, OPERATIONAL_STATUS_META, OP_LOSS_REASONS as DEFAULT_LOSS_REASONS, fmtDate, fmtCurrency } from '../constants'
import StatusBadge from './StatusBadge'

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

export default function OperationDetail({ operation, lead, settings, onStatusChange, onOpenLead, onEditLead, onRefresh, onTaskEdited, onTaskDeleted }) {
  const lossReasons = settings?.opLossReasons
    ? JSON.parse(settings.opLossReasons)
    : DEFAULT_LOSS_REASONS

  const [showLossModal, setShowLossModal] = useState(false)

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

  const emb  = parseFloat(lead?.embeddedValue) || 0
  const leme = emb * ((lead?.feePercent ?? 50) / 100)
  const opMeta = isLost
    ? { color: 'var(--color-red-dark)', bg: 'var(--color-red-bg)' }
    : (OPERATIONAL_STATUS_META[operation.status] || OPERATIONAL_STATUS_META['Documentação'])

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
      <div style={{ background: 'var(--color-surface)', border: `1px solid ${isLost ? 'var(--color-red-border, #f5c6cb)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-xl)', padding: '20px' }}>

        {/* Topo: avatar + nome + botões */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: opMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 600, color: opMeta.color,
          }}>
            {(operation.lead_name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{operation.lead_name || '(sem nome)'}</h3>
            <div style={{ marginTop: 5 }}>
              <StatusBadge status={isLost ? 'Perdido' : operation.status} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--radius-md)', background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                <i className="ti ti-brand-whatsapp" style={{ fontSize: 15 }} />
                WhatsApp
              </a>
            )}
            {onEditLead && (
              <button onClick={onEditLead}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer' }}>
                <i className="ti ti-pencil" style={{ fontSize: 14 }} />
                Editar
              </button>
            )}
            {onOpenLead && (
              <button onClick={onOpenLead}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer' }}>
                <i className="ti ti-briefcase" style={{ fontSize: 14 }} />
                Ver no comercial
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
          {emb > 0 && (
            <InfoRow icon="ti-coin"       label="Valor embutido" value={fmtCurrency(emb)} />
          )}
          {leme > 0 && (
            <InfoRow icon="ti-trending-up" label="Honorários"   value={fmtCurrency(leme)} />
          )}
        </div>

        {/* Observações */}
        {lead?.notes && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Observações</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{lead.notes}</p>
          </div>
        )}
      </div>

    </div>
  )
}
