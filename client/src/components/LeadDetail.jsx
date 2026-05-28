import { useState, useEffect, useCallback } from 'react'
import { COMMERCIAL_STATUSES, COMMERCIAL_STATUS_META, LOSS_REASONS as DEFAULT_LOSS_REASONS, BANK_CONTRACT_STATUSES, BANK_CONTRACT_STATUS_META, DEFAULT_BANKS, fmtDate, fmtCurrency, fmtCpf } from '../constants'
import StatusBadge from './StatusBadge'
import { generateContractPDF } from '../utils/contractPdf'
import { apiGetOperationByLead, apiListContracts, apiCreateContract, apiUpdateContract, apiDeleteContract, apiUpdateLead, apiListLeadTasks, apiListContractTasks, apiCreateTask, apiUpdateTask, apiDeleteTask } from '../utils/api'
import { ContractModal, ReviewModal } from './ContractModals'
import TaskModal from './TaskModal'

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

// ─── Card do Relatório (imprimível) ──────────────────────────────────────────
function ReportCard({ lead, settings, reportRef, reportValue }) {
  const today    = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const products = parseInt(lead.productsCount) || 0
  const value    = parseFloat(reportValue) || 0

  return (
    <div ref={reportRef} style={{
      fontFamily: 'DM Sans, sans-serif',
      width: 340, borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
      background: '#fff',
    }}>
      <div style={{ background: 'linear-gradient(135deg, #1A1917 0%, #2C2A27 100%)', padding: '18px 20px' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {settings?.companyName || 'Leme Financeira'}
        </p>
        <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: '#fff' }}>Relatório de Análise</h2>
      </div>
      <div style={{ padding: '0 20px 20px' }}>
        {[
          { icon: 'ti-user-circle', label: 'Responsável', value: <span style={{ fontWeight: 600 }}>{(lead.name || '').toUpperCase()}</span> },
          { icon: 'ti-alert-circle', label: 'Produtos Indevidos', value: products > 0
            ? <span style={{ background: '#FDECEA', color: '#C0392B', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{products} produto{products !== 1 ? 's' : ''} detectado{products !== 1 ? 's' : ''}</span>
            : <span style={{ color: '#999', fontSize: 13 }}>Análise em andamento</span> },
          { icon: 'ti-calendar', label: 'Data da Análise', value: <span style={{ fontWeight: 500 }}>{today}</span> },
          { icon: 'ti-clock', label: 'Prazo para Recebimento', value: <span style={{ fontWeight: 600 }}>No máximo 5 dias úteis</span> },
          { icon: 'ti-bolt', label: 'Valor Estimado para Recuperar', value: value > 0
            ? <span style={{ fontSize: 22, fontWeight: 700, color: '#1A1917' }}>{fmtCurrency(value)}</span>
            : <span style={{ color: '#999', fontSize: 13 }}>A calcular</span>, highlight: value > 0 },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < 4 ? '1px solid #F0EDE8' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: item.highlight ? '#EBEBEB' : '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 17, color: item.highlight ? '#1A1917' : '#888' }} aria-hidden="true" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#999', marginBottom: 3 }}>{item.label}</p>
              <div>{item.value}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#F7F5F0', padding: '12px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#999' }}>
          {settings?.companyName || 'Leme Financeira'} · CNPJ {settings?.companyCnpj || ''}
        </p>
      </div>
    </div>
  )
}

// ─── Stepper contínuo tipo chevron ───────────────────────────────────────────
// As etapas normais formam um bloco único grudado (sem gap).
// Etapas já concluídas exibem uma "ponta" (◇) no lado direito indicando avanço.
// "Perdido" fica separado com gap maior.
const CHEVRON_H = 36   // altura total em px
const CHEVRON_P = 12   // padding horizontal interno
const CHEVRON_TIP = 10 // largura da ponta de cada chevron

function FunnelPipeline({ statuses, statusMeta, currentStatus, isLost, onSelect, extraStep }) {
  const currentIdx = isLost ? statuses.length : statuses.indexOf(currentStatus)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>

      {/* bloco contínuo de etapas normais — ocupa todo o espaço */}
      <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0 }}>
        {statuses.map((step, i) => {
          const meta      = statusMeta[step]
          const isDone    = i < currentIdx
          const isCurrent = i === currentIdx
          const isFirst   = i === 0
          const isLast    = i === statuses.length - 1
          const label     = step.replace(/^\d+\.\s*/, '')

          let bg, color
          if (isCurrent) { bg = meta.color;        color = '#fff'                   }
          else if (isDone){ bg = '#D6F0DA';         color = '#1B6B2A'                }
          else             { bg = 'var(--color-bg)'; color = 'var(--color-text-hint)' }

          const showTip = isDone && !isLast

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
                whiteSpace: 'nowrap',
                transition: 'background 0.15s, color 0.15s',
                zIndex: isCurrent ? 2 : 1,
                minWidth: 0,
              }}
            >
              <i className={`ti ${meta?.icon || 'ti-circle'}`} style={{ fontSize: 12, flexShrink: 0, width: 14, textAlign: 'center' }} aria-hidden="true" />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', minWidth: 0 }}>{label}</span>
              <i className="ti ti-check" style={{ fontSize: 9, flexShrink: 0, width: 12, textAlign: 'center', visibility: isDone ? 'visible' : 'hidden' }} aria-hidden="true" />

              {showTip && (
                <span style={{
                  position: 'absolute', right: -(CHEVRON_TIP),
                  width: 0, height: 0,
                  borderTop:    `${CHEVRON_H / 2}px solid transparent`,
                  borderBottom: `${CHEVRON_H / 2}px solid transparent`,
                  borderLeft:   `${CHEVRON_TIP}px solid ${bg}`,
                  zIndex: 3,
                }} />
              )}
              {showTip && (
                <span style={{
                  position: 'absolute', right: -(CHEVRON_TIP + 1),
                  width: 0, height: 0,
                  borderTop:    `${CHEVRON_H / 2}px solid transparent`,
                  borderBottom: `${CHEVRON_H / 2}px solid transparent`,
                  borderLeft:   `${CHEVRON_TIP + 1}px solid #A5D6A7`,
                  zIndex: 2,
                }} />
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
          marginLeft: 10,
          padding: '5px 12px', height: CHEVRON_H,
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

// ─── Meta Ads linha única ─────────────────────────────────────────────────────
function MetaAdsRow({ campaign, adSet, adName }) {
  const parts = [campaign, adSet, adName].filter(Boolean)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <i className="ti ti-ad-2" style={{ fontSize: 15, color: 'var(--color-text-hint)', marginTop: 1, flexShrink: 0, width: 18 }} />
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 140, flexShrink: 0 }}>Meta Ads</span>
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {parts.join(' · ')}
      </span>
    </div>
  )
}

// ─── Item de contrato (cartão do lead) ───────────────────────────────────────
const CONTRACT_AUTO_TASK = {
  'Assistência segunda via': { type: 'Assistência segunda via', description: 'Auxiliar cliente a obter segunda via do contrato.' },
  'Revisar contrato':        { type: 'Revisão de contrato',     description: 'Revisar contrato bancário identificado.' },
}

function ContractItem({ contract, banks, onUpdate, onDelete, lead, responsibles, onTaskCreated }) {
  const [editModal, setEditModal]     = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [showPdf, setShowPdf]         = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [autoTaskModal, setAutoTaskModal]   = useState(null) // { type, description }
  const meta = BANK_CONTRACT_STATUS_META[contract.status] || BANK_CONTRACT_STATUS_META['Aguardando envio']
  const emb = parseFloat(contract.embeddedValue) || 0
  const products = parseInt(contract.productsCount) || 0
  const isReviewed = contract.status === 'Contrato revisado'

  const ACTION_STATUSES = BANK_CONTRACT_STATUSES.slice(0, 3) // os 3 que não são "Contrato revisado"

  // Marca como concluídas (fluxo normal: status avança)
  const getContractPendingTasks = async () => {
    const all = await apiListLeadTasks(lead.id)
    return all.filter(t => t.contract_id === contract.id && t.isAuto && t.status !== 'done')
  }

  const concludeContractTasks = async () => {
    try {
      const pending = await getContractPendingTasks()
      await Promise.all(pending.map(t => apiUpdateTask(t.id, { status: 'done' })))
      return pending[0]?.assignedTo || ''
    } catch { return '' }
  }

  const deleteContractTasks = async () => {
    try {
      const pending = await getContractPendingTasks()
      await Promise.all(pending.map(t => apiDeleteTask(t.id)))
    } catch {}
  }

  return (
    <>
      {editModal && (
        <ContractModal
          initial={contract}
          banks={banks}
          onSave={async (data) => { await onUpdate(data); setEditModal(false) }}
          onClose={() => setEditModal(false)}
        />
      )}
      {reviewModal && (
        <ReviewModal
          contract={contract}
          onSave={async (data) => {
            await concludeContractTasks()
            await onUpdate(data)
            setReviewModal(false)
            onTaskCreated?.()
          }}
          onClose={() => setReviewModal(false)}
        />
      )}
      {showActionMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowActionMenu(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 14, padding: '18px 16px', width: '100%', maxWidth: 320,
            boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-bolt" style={{ fontSize: 14, color: '#7C3AED' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Ação do contrato</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {contract.bank || '(banco não informado)'}{contract.type ? ` · ${contract.type}` : ''}
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mudar status para</p>
            {ACTION_STATUSES.map(s => {
              const m = BANK_CONTRACT_STATUS_META[s]
              const isCurrent = contract.status === s
              return (
                <button key={s} onClick={async () => {
                  const autoTask = CONTRACT_AUTO_TASK[s]
                  if (autoTask) {
                    // Busca o responsável da tarefa atual para pré-preencher, sem concluir nada ainda
                    const pending = await getContractPendingTasks()
                    const prevAssignedTo = pending[0]?.assignedTo || ''
                    setShowActionMenu(false)
                    // pendingTaskIds: tarefas a concluir só quando o modal for salvo
                    setAutoTaskModal({ ...autoTask, targetStatus: s, prefillAssignedTo: prevAssignedTo, pendingTaskIds: pending.map(t => t.id) })
                  } else {
                    await deleteContractTasks()
                    onUpdate({ status: s, embeddedValue: 0, productsCount: 0 })
                    setShowActionMenu(false)
                    onTaskCreated?.()
                  }
                }} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 9, border: `1.5px solid ${isCurrent ? m.color : 'var(--color-border)'}`,
                  background: isCurrent ? m.bg : 'var(--color-bg)', cursor: 'pointer',
                  fontSize: 12, color: isCurrent ? m.color : 'var(--color-text-primary)', fontWeight: isCurrent ? 600 : 400,
                  textAlign: 'left', width: '100%',
                }}>
                  <i className={`ti ${m.icon}`} style={{ fontSize: 15, color: m.color, flexShrink: 0 }} />
                  {s}
                  {isCurrent && <i className="ti ti-check" style={{ fontSize: 12, marginLeft: 'auto', color: m.color }} />}
                </button>
              )
            })}
            {!isReviewed && (
              <>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ação</p>
                <button onClick={() => { setReviewModal(true); setShowActionMenu(false) }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 12px',
                  borderRadius: 9, border: 'none', background: '#7C3AED',
                  cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, width: '100%',
                }}>
                  <i className="ti ti-file-search" style={{ fontSize: 15, flexShrink: 0 }} />
                  Preencher revisão
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {autoTaskModal && (
        <TaskModal
          open={!!autoTaskModal}
          onClose={() => setAutoTaskModal(null)}
          onSave={async (data) => {
            // Só agora conclui as tarefas anteriores e muda o status do contrato
            if (autoTaskModal.pendingTaskIds?.length) {
              await Promise.all(autoTaskModal.pendingTaskIds.map(id => apiUpdateTask(id, { status: 'done' })))
            }
            await apiCreateTask(data)
            if (autoTaskModal.targetStatus) {
              const isRevisado = autoTaskModal.targetStatus === 'Contrato revisado'
              await onUpdate({
                status: autoTaskModal.targetStatus,
                ...(isRevisado ? {} : { embeddedValue: 0, productsCount: 0 }),
              })
            }
            setAutoTaskModal(null)
            onTaskCreated?.()
          }}
          lead={lead}
          contractId={contract.id}
          contractLabel={`${contract.bank || ''}${contract.type ? ` · ${contract.type}` : ''}`}
          prefillType={autoTaskModal.type}
          prefillAssignedTo={autoTaskModal.prefillAssignedTo}
          contractMode={true}
          isRequired={true}
          responsibles={responsibles}
        />
      )}

      <div style={{ border: `1px solid ${isReviewed ? '#BBF7D0' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: isReviewed ? '#F0FDF4' : 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: meta.color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
              {contract.bank || '(banco não informado)'}
              {contract.type ? ` · ${contract.type}` : ''}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: meta.bg, color: meta.color, fontWeight: 500 }}>
                {contract.status}
              </span>
              {emb > 0 && <span style={{ fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 600 }}>{fmtCurrency(emb)}</span>}
              {products > 0 && <span style={{ fontSize: 11, color: '#C0392B' }}>{products} prod.</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {contract.pdfFile && (
              <button onClick={() => setShowPdf(v => !v)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-file-text" style={{ fontSize: 12 }} /> PDF
              </button>
            )}
            <button
              onClick={() => setShowActionMenu(true)}
              style={{ fontSize: 11, padding: '4px 9px', borderRadius: 'var(--radius-md)', border: '1px solid #7C3AED', background: '#EDE9FE', cursor: 'pointer', color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <i className="ti ti-bolt" style={{ fontSize: 12 }} /> Ação
            </button>
            <button onClick={() => setEditModal(true)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-edit" style={{ fontSize: 12 }} /> Editar
            </button>
            <button onClick={onDelete} style={{ fontSize: 11, padding: '4px 7px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-red-mid)', display: 'flex', alignItems: 'center' }}>
              <i className="ti ti-trash" style={{ fontSize: 12 }} />
            </button>
          </div>
        </div>
        {contract.notes && (
          <div style={{ padding: '4px 14px 8px', borderTop: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {contract.notes}
          </div>
        )}
        {showPdf && contract.pdfFile && (
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            {contract.pdfFile.startsWith('data:image')
              ? <img src={contract.pdfFile} alt="Contrato" style={{ width: '100%' }} />
              : <iframe src={contract.pdfFile} title="Contrato" style={{ width: '100%', height: 480, border: 'none' }} />
            }
          </div>
        )}
      </div>
    </>
  )
}

// ─── Popup de relatório de contratos revisados ───────────────────────────────
function ContractsReportPopup({ lead, contracts, settings, onClose }) {
  const reviewed = contracts.filter(c => c.status === 'Contrato revisado')
  const total    = reviewed.reduce((s, c) => s + (parseFloat(c.embeddedValue) || 0), 0)
  const totalProducts = reviewed.reduce((s, c) => s + (parseInt(c.productsCount) || 0), 0)
  const today    = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#F5F3EF', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', boxShadow: '0 24px 64px rgba(0,0,0,0.28)', display: 'flex', flexDirection: 'column' }}>

        {/* Header do popup — fora da área imprimível */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderRadius: '20px 20px 0 0', borderBottom: '1px solid #E8E4D8', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-file-analytics" style={{ fontSize: 18, color: '#1A1917' }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Relatório de análise</span>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0EDE8', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 15, color: '#888' }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
          {reviewed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-hint)' }}>
              <i className="ti ti-file-off" style={{ fontSize: 36, display: 'block', marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 13 }}>Nenhum contrato com status "Contrato revisado".</p>
            </div>
          ) : (
            <div style={{ fontFamily: 'DM Sans, sans-serif', width: '100%' }}>

              {/* Cabeçalho escuro */}
              <div style={{ background: 'linear-gradient(135deg, #1A1917 0%, #33302C 100%)', borderRadius: 16, padding: '22px 24px 20px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
                {/* Detalhe decorativo */}
                <div style={{ position: 'absolute', right: -20, top: -20, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', right: 20, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

                <p style={{ margin: '0 0 10px', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {settings?.companyName || 'Leme Financeira'} · Análise de contratos
                </p>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                  {lead.name}
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{today}</p>

                {/* Destaque do valor total */}
                <div style={{ marginTop: 18, padding: '14px 18px', background: 'rgba(255,255,255,0.07)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Valor embutido identificado
                  </p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    {fmtCurrency(total)}
                  </p>
                  {totalProducts > 0 && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      {totalProducts} produto{totalProducts !== 1 ? 's' : ''} indevido{totalProducts !== 1 ? 's' : ''} identificado{totalProducts !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Lista de contratos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: '0 0 4px 2px', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Contratos analisados ({reviewed.length})
                </p>
                {reviewed.map((c, i) => {
                  const emb = parseFloat(c.embeddedValue) || 0
                  const pct = total > 0 ? Math.round((emb / total) * 100) : 0
                  return (
                    <div key={c.id} style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #EDE9E0' }}>
                      {/* Linha principal: número + banco/tipo + badge produtos + valor + % */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#6B5E3E' }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1917' }}>
                            {c.bank || '(banco não informado)'}
                          </span>
                          {c.type && (
                            <span style={{ fontSize: 11, color: '#aaa', marginLeft: 5 }}>· {c.type}</span>
                          )}
                        </div>
                        {parseInt(c.productsCount) > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, background: '#FEF2F2', color: '#B91C1C', padding: '2px 6px', borderRadius: 99, fontWeight: 500, flexShrink: 0 }}>
                            <i className="ti ti-alert-circle" style={{ fontSize: 10 }} />
                            {c.productsCount} prod.
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, background: '#F0FDF4', color: '#15803D', padding: '2px 6px', borderRadius: 99, fontWeight: 500, flexShrink: 0 }}>
                            <i className="ti ti-shield-check" style={{ fontSize: 10 }} />
                            Limpo
                          </span>
                        )}
                        {emb > 0 ? (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>{fmtCurrency(emb)}</span>
                            {total > 0 && <span style={{ fontSize: 10, color: '#bbb', marginLeft: 4 }}>{pct}%</span>}
                          </div>
                        ) : null}
                      </div>
                      {/* Barra de proporção */}
                      {emb > 0 && total > 0 && (
                        <div style={{ marginTop: 6, height: 3, background: '#F0EDE8', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #15803D, #22C55E)', borderRadius: 99 }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Rodapé do relatório */}
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', borderRadius: 10, border: '1px solid #EDE9E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 10, color: '#bbb' }}>
                  {settings?.companyName || 'Leme Financeira'} · CNPJ {settings?.companyCnpj || '—'}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: '#bbb' }}>{today}</p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do popup */}
        <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #E8E4D8', borderRadius: '0 0 20px 20px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 10, border: 'none', background: '#1A1917', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Seção de contratos bancários ────────────────────────────────────────────
function BankContractsSection({ lead, settings, onRefreshLead, onTaskCreated, refreshToken }) {
  const banks = settings?.banks ? JSON.parse(settings.banks) : DEFAULT_BANKS
  const responsibles = settings?.responsibles ? JSON.parse(settings.responsibles) : ['Riquelme', 'Daniel']
  const [contracts, setContracts]       = useState([])
  const [addModal, setAddModal]         = useState(false)
  const [loading, setLoading]           = useState(true)
  const [showReport, setShowReport]     = useState(false)
  const [newContractForTask, setNewContractForTask] = useState(null) // contrato recém-criado aguardando tarefa

  const loadContracts = useCallback(() => {
    setLoading(true)
    apiListContracts(lead.id)
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false))
  }, [lead.id])

  useEffect(() => { loadContracts() }, [loadContracts, refreshToken])

  const handleAdd = async (data) => {
    const created = await apiCreateContract(lead.id, data)
    setAddModal(false)
    loadContracts()
    onRefreshLead?.()
    const autoTask = CONTRACT_AUTO_TASK[created.status]
    if (autoTask) setNewContractForTask({ contract: created, autoTask })
  }

  const handleUpdate = async (contract, data) => {
    await apiUpdateContract(lead.id, contract.id, data)
    loadContracts()
    onRefreshLead?.()
  }

  const handleDelete = async (contract) => {
    if (!window.confirm(`Remover contrato ${contract.bank || ''}?`)) return
    await apiDeleteContract(lead.id, contract.id)
    setContracts(prev => prev.filter(c => c.id !== contract.id))
    onRefreshLead?.()
    onTaskCreated?.()
  }

  const totalEmb = contracts.reduce((s, c) => s + (parseFloat(c.embeddedValue) || 0), 0)
  const reviewedCount = contracts.filter(c => c.status === 'Contrato revisado').length

  return (
    <>
      {addModal && (
        <ContractModal
          initial={null}
          banks={banks}
          onSave={handleAdd}
          onClose={() => setAddModal(false)}
        />
      )}
      {newContractForTask && (
        <TaskModal
          open
          onClose={() => setNewContractForTask(null)}
          onSave={async (data) => {
            await apiCreateTask(data)
            setNewContractForTask(null)
            onTaskCreated?.()
          }}
          lead={lead}
          contractId={newContractForTask.contract.id}
          contractLabel={`${newContractForTask.contract.bank || ''}${newContractForTask.contract.type ? ` · ${newContractForTask.contract.type}` : ''}`}
          prefillType={newContractForTask.autoTask.type}
          contractMode={true}
          isRequired={true}
          responsibles={responsibles}
        />
      )}
      {showReport && (
        <ContractsReportPopup
          lead={lead}
          contracts={contracts}
          settings={settings}
          onClose={() => setShowReport(false)}
        />
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-file-invoice" style={{ fontSize: 18, color: 'var(--color-blue-mid)' }} aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Contratos bancários</span>
            {contracts.length > 0 && (
              <span style={{ fontSize: 12, background: 'var(--color-blue-bg)', color: 'var(--color-blue-dark)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                {contracts.length}
              </span>
            )}
            {totalEmb > 0 && (
              <span style={{ fontSize: 12, color: 'var(--color-green-dark)', fontWeight: 600 }}>· {fmtCurrency(totalEmb)}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowReport(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: reviewedCount > 0 ? '#F7F5F0' : 'transparent', cursor: 'pointer', fontWeight: 500, color: reviewedCount > 0 ? '#1A1917' : 'var(--color-text-secondary)' }}
            >
              <i className="ti ti-chart-bar" style={{ fontSize: 13 }} /> Relatório
              {reviewedCount > 0 && (
                <span style={{ fontSize: 11, background: '#1A1917', color: '#fff', borderRadius: 99, padding: '1px 6px', fontWeight: 700 }}>{reviewedCount}</span>
              )}
            </button>
            <button onClick={() => setAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> Adicionar contrato
            </button>
          </div>
        </div>

        {loading && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-hint)', textAlign: 'center', padding: '16px 0' }}>Carregando…</p>
        )}

        {!loading && contracts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-hint)' }}>
            <i className="ti ti-file-off" style={{ fontSize: 28, display: 'block', marginBottom: 6 }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: 13 }}>Nenhum contrato bancário cadastrado.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contracts.map(c => (
            <ContractItem
              key={c.id}
              contract={c}
              banks={banks}
              lead={lead}
              responsibles={responsibles}
              onUpdate={(data) => handleUpdate(c, data)}
              onDelete={() => handleDelete(c)}
              onTaskCreated={onTaskCreated}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Seção de tarefas do lead ─────────────────────────────────────────────────
const TASK_TYPE_ICONS = {
  'Ligação':               'ti-phone',
  'WhatsApp / Follow-up':  'ti-brand-whatsapp',
  'Reunião':               'ti-users',
  'Envio de documento':    'ti-file-export',
  'Revisão de contrato':   'ti-file-search',
  'Assistência segunda via':'ti-headset',
  'Outro':                 'ti-checkbox',
}

function LeadTasksSection({ lead, settings, onTaskCreated, onContractUpdate, refreshToken }) {
  const responsibles = settings?.responsibles ? JSON.parse(settings.responsibles) : ['Riquelme', 'Daniel']
  const taskTypes    = settings?.taskTypes    ? JSON.parse(settings.taskTypes)    : null
  const [tasks,        setTasks]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [newModal,     setNewModal]     = useState(false)
  const [editTask,     setEditTask]     = useState(null)
  const [resolveTask,  setResolveTask]  = useState(null)  // tarefa auto aguardando resolução
  const [reagendModal, setReagendModal] = useState(null)  // { task, prefillType, prefillDesc }
  const [reviewModal,  setReviewModal]  = useState(null)  // contrato a revisar
  const [reviewTask,   setReviewTask]   = useState(null)  // task original que abriu o reviewModal

  const load = useCallback(async () => {
    setLoading(true)
    try { setTasks(await apiListLeadTasks(lead.id)) } catch {}
    setLoading(false)
  }, [lead.id])

  useEffect(() => { load() }, [load, refreshToken])

  const handleDone = async (task) => {
    // Tarefas auto de contrato têm fluxo especial
    if (task.isAuto && task.contract_id) {
      setResolveTask(task)
      return
    }
    await apiUpdateTask(task.id, { status: 'done' })
    await load()
    onTaskCreated?.()
  }

  // Resolução: contrato recebido → abre próximo passo sem mudar nada ainda
  const handleAutoResolveYes = async (task) => {
    setResolveTask(null)
    if (task.type === 'Assistência segunda via') {
      // Abre modal de agendamento — só executa as mudanças no onSave
      setReagendModal({
        task,
        prefillType: 'Revisão de contrato',
        prefillDesc: 'Revisar contrato bancário identificado.',
        prefillAssignedTo: task.assignedTo || '',
        // flag: ao salvar, deve concluir a tarefa original e mudar status do contrato
        pendingActions: { concludeTask: task, contractUpdate: { id: task.contract_id, data: { status: 'Revisar contrato' } } },
      })
    } else if (task.type === 'Revisão de contrato') {
      // Abre ReviewModal — só executa as mudanças no onSave
      const contracts = await apiListContracts(lead.id)
      const contract  = contracts.find(c => c.id === task.contract_id)
      if (contract) { setReviewModal(contract); setReviewTask(task) }
    }
  }

  // Resolução: não conseguiu → reagenda nova tarefa do mesmo tipo
  const handleAutoResolveNo = (task) => {
    setResolveTask(null)
    setReagendModal({
      task,
      prefillType: task.type,
      prefillDesc: task.description || '',
      prefillAssignedTo: task.assignedTo || '',
    })
  }

  // Salva reagendamento (nova tarefa) — executa todas as ações pendentes atomicamente
  const handleReagend = async (data) => {
    const modal = reagendModal
    setReagendModal(null)
    // Se havia ações pendentes (vindo do fluxo "Sim"), executa agora
    if (modal.pendingActions?.concludeTask) {
      await apiUpdateTask(modal.pendingActions.concludeTask.id, { status: 'done' })
    }
    if (modal.pendingActions?.contractUpdate) {
      await onContractUpdate?.(modal.pendingActions.contractUpdate.id, modal.pendingActions.contractUpdate.data)
    }
    // Agora marca a tarefa original como done (fluxo "Não, reagendar")
    if (!modal.pendingActions) {
      await apiUpdateTask(modal.task.id, { status: 'done' })
    }
    await apiCreateTask({ ...data, contract_id: modal.task.contract_id, isAuto: true })
    await load()
    onTaskCreated?.()
  }

  // Salva revisão do contrato
  const handleReviewSave = async (data) => {
    if (reviewTask) await apiUpdateTask(reviewTask.id, { status: 'done' })
    await onContractUpdate?.(reviewModal.id, data)
    setReviewModal(null)
    setReviewTask(null)
    await load()
    onTaskCreated?.()
  }

  // Cancela ReviewModal sem salvar → reagenda tarefa para não deixar contrato sem tarefa
  const handleReviewClose = () => {
    const task = reviewTask
    setReviewModal(null)
    setReviewTask(null)
    if (task) {
      setReagendModal({
        task,
        prefillType: 'Revisão de contrato',
        prefillDesc: '',
        prefillAssignedTo: task.assignedTo || '',
      })
    }
  }
  const handleDelete = async (task) => {
    if (!window.confirm('Excluir esta tarefa?')) return
    await apiDeleteTask(task.id)
    await load()
    onTaskCreated?.()
  }
  const handleCreate = async (data) => {
    await apiCreateTask(data)
    setNewModal(false)
    await load()
    onTaskCreated?.()
  }
  const handleEdit = async (data) => {
    onTaskEdited?.(editTask.id, editTask.dueDate)
    await apiUpdateTask(editTask.id, data)
    setEditTask(null)
    await load()
    onTaskCreated?.()
  }

  const today = new Date().toISOString().slice(0, 10)
  const pending = tasks.filter(t => t.status !== 'done')
  const done    = tasks.filter(t => t.status === 'done')

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-checkbox" style={{ fontSize: 18, color: 'var(--color-blue-mid)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Tarefas</span>
          {pending.length > 0 && (
            <span style={{ fontSize: 12, background: 'var(--color-blue-bg)', color: 'var(--color-blue-dark)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
              {pending.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setNewModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}
        >
          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Nova tarefa
        </button>
      </div>

      {loading ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-hint)', textAlign: 'center', padding: '12px 0' }}>Carregando…</p>
      ) : pending.length === 0 && done.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-hint)' }}>
          <i className="ti ti-checkbox" style={{ fontSize: 28, display: 'block', marginBottom: 6 }} />
          <p style={{ margin: 0, fontSize: 13 }}>Nenhuma tarefa. Crie uma para não esquecer este lead.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pending.map(task => {
            const isLate = task.dueDate && task.dueDate < today
            const icon = TASK_TYPE_ICONS[task.type] || 'ti-checkbox'
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-lg)', border: `1px solid ${isLate ? '#FECACA' : 'var(--color-border)'}`, background: isLate ? '#FFF5F5' : 'var(--color-bg)' }}>
                <button onClick={() => handleDone(task)} style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isLate ? '#EF4444' : 'var(--color-border)'}`, background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 12, color: isLate ? '#C62828' : 'var(--color-blue-mid)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{task.type}</span>
                    {!!task.isAuto && !!task.contract_id && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: '#EDE9FE', color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <i className="ti ti-file-description" style={{ fontSize: 10 }} />
                        {task.contract_bank || 'Contrato'}{task.contract_type ? ` · ${task.contract_type}` : ''}
                      </span>
                    )}
                  </div>
                  {task.description ? <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>{task.description}</p> : null}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {task.dueDate && (
                      <span style={{ fontSize: 11, color: isLate ? '#C62828' : 'var(--color-text-hint)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <i className="ti ti-calendar" style={{ fontSize: 11 }} />
                        {task.dueDate.split('-').reverse().join('/')}{task.dueTime && task.dueTime !== '0' ? ` às ${task.dueTime}` : ''}
                        {isLate ? ' — ATRASADA' : ''}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-hint)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <i className="ti ti-user" style={{ fontSize: 11 }} />{task.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  <button onClick={() => setEditTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--color-text-hint)', fontSize: 14 }}><i className="ti ti-pencil" /></button>
                  {!(task.isAuto && task.contract_id) && (
                    <button onClick={() => handleDelete(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--color-text-hint)', fontSize: 14 }}><i className="ti ti-trash" /></button>
                  )}
                </div>
              </div>
            )
          })}
          {done.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-hint)' }}>
              + {done.length} tarefa{done.length !== 1 ? 's' : ''} concluída{done.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {newModal && (
        <TaskModal open onClose={() => setNewModal(false)} onSave={handleCreate} lead={lead} responsibles={responsibles} taskTypes={taskTypes} />
      )}
      {editTask && (
        <TaskModal open onClose={() => setEditTask(null)} onSave={handleEdit} lead={lead} responsibles={responsibles} taskTypes={taskTypes} editTask={editTask} contractMode={!!(editTask.isAuto && editTask.contract_id)} />
      )}

      {/* Diálogo de resolução de tarefa automática */}
      {resolveTask && (
        <div onClick={() => setResolveTask(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-checkbox" style={{ fontSize: 15, color: '#1565C0' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Concluir tarefa</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{resolveTask.type}</p>
              </div>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
              {resolveTask.type === 'Assistência segunda via'
                ? 'O contrato foi recebido e está pronto para revisão?'
                : 'A revisão do contrato foi concluída?'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleAutoResolveNo(resolveTask)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}
              >
                {resolveTask.type === 'Assistência segunda via' ? 'Não, reagendar' : 'Não, remarcar'}
              </button>
              <button
                onClick={() => handleAutoResolveYes(resolveTask)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius-md)', border: 'none', background: '#1565C0', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                {resolveTask.type === 'Assistência segunda via' ? 'Sim, revisar contrato' : 'Sim, preencher revisão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reagendamento */}
      {reagendModal && (
        <TaskModal
          open
          onClose={() => setReagendModal(null)}
          onSave={handleReagend}
          lead={lead}
          contractId={reagendModal.task.contract_id}
          contractLabel={`${reagendModal.task.contract_bank || ''}${reagendModal.task.contract_type ? ` · ${reagendModal.task.contract_type}` : ''}`}
          prefillType={reagendModal.prefillType}
          prefillAssignedTo={reagendModal.prefillAssignedTo}
          contractMode={true}
          isRequired={true}
          responsibles={responsibles}
        />
      )}

      {/* ReviewModal ao concluir revisão */}
      {reviewModal && (
        <ReviewModal
          contract={reviewModal}
          onSave={handleReviewSave}
          onClose={handleReviewClose}
        />
      )}
    </div>
  )
}

// ─── LeadDetail principal ─────────────────────────────────────────────────────
export default function LeadDetail({ lead, settings, onEdit, onDelete, onStatusChange, onOpenOperation, onRefresh, onTaskEdited }) {
  const lossReasons = settings?.lossReasons
    ? JSON.parse(settings.lossReasons)
    : DEFAULT_LOSS_REASONS

  const [previewContract, setPreviewContract]     = useState(null)
  const [operation, setOperation]                 = useState(null)
  const [showLossModal, setShowLossModal]         = useState(false)
  const [contractDataModal, setContractDataModal] = useState(false)
  const [contractDataForm, setContractDataForm]   = useState({})
  const [taskRefreshToken, setTaskRefreshToken]   = useState(0)
  const bumpTaskRefresh = useCallback(() => setTaskRefreshToken(v => v + 1), [])

  const CONTRACT_REQUIRED = ['name', 'cpf', 'address']
  const CONTRACT_OPTIONAL = ['rg', 'birthDate', 'email']
  const CONTRACT_FIELD_LABELS = { name: 'Nome', cpf: 'CPF', address: 'Endereço' }
  const hasAllContractData = CONTRACT_REQUIRED.every(f => !!lead[f])
  const missingFields = CONTRACT_REQUIRED.filter(f => !lead[f]).map(f => CONTRACT_FIELD_LABELS[f] || f)

  const openContractDataModal = () => {
    setContractDataForm({
      name:      lead.name      || '',
      cpf:       lead.cpf       || '',
      rg:        lead.rg        || '',
      birthDate: lead.birthDate || '',
      email:     lead.email     || '',
      address:   lead.address   || '',
      feePercent: lead.feePercent ?? 50,
    })
    setPreviewContract(null)
    setContractDataModal(true)
  }

  const saveContractData = async () => {
    await apiUpdateLead(lead.id, contractDataForm)
    setContractDataModal(false)
    onRefresh()
  }

  useEffect(() => {
    apiGetOperationByLead(lead.id)
      .then(setOperation)
      .catch(() => setOperation(null))
  }, [lead.id])

  const initials   = (lead.name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
  const createdAt  = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  const whatsappLink = `https://wa.me/55${(lead.phone || '').replace(/\D/g, '')}`
  const emb  = parseFloat(lead.embeddedValue) || 0
  const leme = emb * ((lead.feePercent ?? 50) / 100)

  const BLOCKED_STATUSES = ['Qualificado', 'Revisão', 'Negociação', 'Contrato Assinado']
  const BLOCKED_NEGOCIACAO = ['Negociação', 'Contrato Assinado']

  const handleStepClick = async (step, isLostStep) => {
    if (isLostStep) {
      setShowLossModal(true)
      return
    }
    if (BLOCKED_STATUSES.includes(step)) {
      try {
        const list = await apiListContracts(lead.id)
        if (list.length === 0) {
          alert('Adicione pelo menos um contrato bancário antes de avançar o lead nesta etapa.')
          return
        }
        if (BLOCKED_NEGOCIACAO.includes(step)) {
          const hasRevisado = list.some(c => c.status === 'Contrato revisado')
          const totalEmbutido = list.reduce((sum, c) => sum + (parseFloat(c.embeddedValue) || 0), 0)
          if (!hasRevisado || totalEmbutido <= 0) {
            alert('Para avançar para Negociação é necessário ter pelo menos um contrato revisado e valor embutido total maior que zero.')
            return
          }
        }
      } catch {}
    }
    onStatusChange(step)
  }

  const handleConfirmLoss = (reason) => {
    setShowLossModal(false)
    onStatusChange('__lost__', reason)
  }

  const handleRevive = () => {
    onStatusChange('__revive__')
  }

  const handleContractPDF = (action) => {
    const missing = []
    if (!lead.name)    missing.push('Nome')
    if (!lead.cpf)     missing.push('CPF')
    if (!lead.address) missing.push('Endereço')
    if (missing.length) { alert(`Para gerar o contrato faltam: ${missing.join(', ')}.`); return }
    const doc = generateContractPDF(lead, settings)
    const filename = `Contrato_${(lead.name || 'lead').replace(/\s+/g, '_')}.pdf`
    if (action === 'preview') {
      setPreviewContract(URL.createObjectURL(doc.output('blob')))
    } else {
      doc.save(filename)
    }
  }

  const responsibleLabel = (() => {
    const v = (lead.responsible || '').trim()
    if (!v || v === '0') return null
    return v
  })()

  const isNewLead = !lead.isLost && lead.status === 'Novo Lead'
  const hideAssessoria = !lead.isLost && ['Novo Lead', 'Qualificação', 'Qualificado', 'Revisão'].includes(lead.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {showLossModal && (
        <LossReasonModal
          lossReasons={lossReasons}
          onConfirm={handleConfirmLoss}
          onCancel={() => setShowLossModal(false)}
        />
      )}

      {/* ── Banner de operação vinculada ──────────────────────────────────── */}
      {operation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--color-green-bg)', border: '1px solid var(--color-green-dark)', flexWrap: 'wrap' }}>
          <i className="ti ti-settings-2" style={{ fontSize: 16, color: 'var(--color-green-dark)', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontSize: 13, color: 'var(--color-green-dark)', fontWeight: 500, flex: 1 }}>
            Este lead tem uma operação ativa — <strong>{operation.status}</strong>
          </span>
          {onOpenOperation && (
            <button
              onClick={() => onOpenOperation(operation)}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-green-dark)', background: '#fff', color: 'var(--color-green-dark)', fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
            >
              Ver Operação
            </button>
          )}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600, color: 'var(--color-blue-dark)', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{lead.name}</h3>
            <div style={{ marginTop: 5, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {!!lead.isLost && !!lead.lossReason && (
                <span style={{ fontSize: 12, color: 'var(--color-red-dark)', background: 'var(--color-red-bg)', padding: '2px 8px', borderRadius: 99 }}>
                  {lead.lossReason}
                </span>
              )}
              {responsibleLabel && (
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--color-border)' }}>
                  {responsibleLabel}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {lead.phone && (
              <a href={whatsappLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: '#E7F8EE', color: '#1A6B35', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                <i className="ti ti-brand-whatsapp" style={{ fontSize: 15 }} aria-hidden="true" /> WhatsApp
              </a>
            )}
            <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13 }}>
              <i className="ti ti-edit" style={{ fontSize: 14 }} aria-hidden="true" /> Editar
            </button>
            <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-red-mid)', fontSize: 13 }}>
              <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />
            </button>
          </div>
        </div>
        {/* Seletor de etapas — antes das infos */}
        <div style={{ marginBottom: 12 }}>
          {!!lead.isLost && (() => {
            const lostFromOperational = lead.status === 'Contrato Assinado'
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: 'var(--color-red-bg)', borderRadius: 8, border: '1px solid var(--color-red-border, #f5c6cb)' }}>
                <i className="ti ti-circle-x" style={{ fontSize: 14, color: 'var(--color-red-dark)', flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontSize: 12, color: 'var(--color-red-dark)', fontWeight: 500, flex: 1 }}>
                  Perdido — <strong>{lead.lossReason || 'sem motivo'}</strong>
                  {lead.lastActiveStatus ? ` · estava em ${lead.lastActiveStatus}` : ''}
                </span>
                {lostFromOperational ? (
                  <span style={{ fontSize: 11, color: 'var(--color-red-dark)', opacity: 0.7, flexShrink: 0, fontStyle: 'italic' }}>Reativar pelo operacional</span>
                ) : (
                  <button onClick={handleRevive} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--color-red-dark)', background: '#fff', color: 'var(--color-red-dark)', fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
                    Reativar
                  </button>
                )}
              </div>
            )
          })()}
          <FunnelPipeline
            statuses={COMMERCIAL_STATUSES}
            statusMeta={COMMERCIAL_STATUS_META}
            currentStatus={lead.status}
            isLost={lead.isLost}
            onSelect={handleStepClick}
            extraStep={lead.status !== 'Contrato Assinado' ? 'Perdido' : null}
          />
        </div>

        <InfoRow icon="ti-phone"            label="Telefone"      value={lead.phone} />
        <InfoRow icon="ti-target"           label="Origem"        value={lead.source} />
        <InfoRow icon="ti-id"               label="CPF"           value={lead.cpf} />
        <InfoRow icon="ti-license"          label="RG"            value={lead.rg} />
        <InfoRow icon="ti-cake"             label="Nascimento"    value={fmtDate(lead.birthDate)} />
        <InfoRow icon="ti-mail"             label="E-mail"        value={lead.email} />
        <InfoRow icon="ti-map-pin"          label="Endereço"      value={lead.address} />
        <InfoRow icon="ti-calendar"         label="Cadastrado em" value={createdAt} />
        {(lead.adCampaign || lead.adSet || lead.adName) && (
          <MetaAdsRow campaign={lead.adCampaign} adSet={lead.adSet} adName={lead.adName} />
        )}

        {/* Observações — sempre visível quando houver conteúdo */}
        {lead.notes && (
          <div style={{
            marginTop: 12,
            background: '#FDFCF5',
            border: '1px solid #E8E4D8',
            borderLeft: '3px solid #C8BF9E',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <i className="ti ti-notes" style={{ fontSize: 13, color: '#A89F88' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#A89F88', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Observações</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>{lead.notes}</p>
          </div>
        )}
      </div>

      {/* ── Contratos bancários ───────────────────────────────────────────── */}
      {!isNewLead && <BankContractsSection lead={lead} settings={settings} onRefreshLead={onRefresh} onTaskCreated={() => { bumpTaskRefresh(); onRefresh() }} refreshToken={taskRefreshToken} />}

      {/* ── Tarefas ───────────────────────────────────────────────────────── */}
      <LeadTasksSection
        lead={lead}
        settings={settings}
        refreshToken={taskRefreshToken}
        onTaskCreated={() => { bumpTaskRefresh(); onRefresh() }}
        onContractUpdate={async (contractId, data) => {
          await apiUpdateContract(lead.id, contractId, data)
          bumpTaskRefresh()
          onRefresh()
        }}
      />

      {/* ── Popup dados do contrato ───────────────────────────────────────── */}
      {contractDataModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setContractDataModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px 22px', maxWidth: 480, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-file-signature" style={{ fontSize: 17, color: 'var(--color-blue-dark)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Dados para contrato</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Usados para gerar o PDF de assessoria</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Nome completo <span style={{ color: 'var(--color-red-mid)' }}>*</span></label>
                <input value={contractDataForm.name} onChange={e => setContractDataForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do cliente" style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>CPF <span style={{ color: 'var(--color-red-mid)' }}>*</span></label>
                <input value={contractDataForm.cpf} onChange={e => setContractDataForm(f => ({ ...f, cpf: fmtCpf(e.target.value) }))} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>RG</label>
                <input value={contractDataForm.rg} onChange={e => setContractDataForm(f => ({ ...f, rg: e.target.value }))} placeholder="00.000.000 SSP/UF" style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Endereço completo <span style={{ color: 'var(--color-red-mid)' }}>*</span></label>
                <input value={contractDataForm.address} onChange={e => setContractDataForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua Caxias do Sul, 471, Centro, Palmeira das Missões - RS" style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>E-mail <span style={{ fontWeight: 400, color: 'var(--color-text-hint)', fontSize: 10 }}>— Autentique</span></label>
                <input type="email" value={contractDataForm.email} onChange={e => setContractDataForm(f => ({ ...f, email: e.target.value }))} placeholder="cliente@email.com" style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Data de nascimento</label>
                <input type="date" value={contractDataForm.birthDate} onChange={e => setContractDataForm(f => ({ ...f, birthDate: e.target.value }))} style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Percentual cobrado: <strong>{contractDataForm.feePercent ?? 50}%</strong> <span style={{ fontWeight: 400, color: 'var(--color-text-hint)', fontSize: 10 }}>— Entre 20% e 50%</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min="20" max="50" step="1"
                    value={contractDataForm.feePercent ?? 50}
                    onChange={e => setContractDataForm(f => ({ ...f, feePercent: Number(e.target.value) }))}
                    style={{ flex: 1 }}
                  />
                  <input type="number" min="20" max="50"
                    value={contractDataForm.feePercent ?? 50}
                    onChange={e => {
                      let v = Number(e.target.value)
                      if (isNaN(v)) v = 50
                      v = Math.max(20, Math.min(50, v))
                      setContractDataForm(f => ({ ...f, feePercent: v }))
                    }}
                    style={{ width: 72, textAlign: 'center', fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setContractDataModal(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                Cancelar
              </button>
              <button type="button" onClick={saveContractData} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: 'var(--color-blue-mid)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Salvar dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contrato de assessoria ────────────────────────────────────────── */}
      {!hideAssessoria && (
        <div style={{ background: 'linear-gradient(135deg, #FDFCF8 0%, #F5F0E8 100%)', border: `1px solid ${hasAllContractData ? '#E2D9C8' : '#FED7AA'}`, borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {/* Lado esquerdo — título */}
            <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-file-signature" style={{ fontSize: 18, color: 'var(--color-blue-mid)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Contrato de Assessoria</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-hint)' }}>PDF · Autentique</p>
              </div>
            </div>
            {/* Lado direito — estimativa */}
            {emb > 0 && (
              <div style={{ padding: '14px 20px', borderLeft: '1px solid #E2D9C8', background: 'rgba(21,128,61,0.05)', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 160 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>Estimativa Leme</p>
                <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#15803D', lineHeight: 1 }}>{fmtCurrency(leme)}</p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#15803D', opacity: 0.6 }}>{lead.feePercent ?? 50}% de {fmtCurrency(emb)}</p>
              </div>
            )}
          </div>

          {/* Corpo */}
          <div style={{ padding: '0 20px 18px', borderTop: '1px solid #E2D9C8' }}>
            {!hasAllContractData ? (
              <div style={{ paddingTop: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: '#C2410C' }}>
                    <i className="ti ti-alert-triangle" style={{ marginRight: 5 }} />
                    Dados insuficientes para gerar o PDF
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
                    Faltam: <strong>{missingFields.join(', ')}</strong>
                  </p>
                </div>
                <button onClick={openContractDataModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: '#EA580C', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  <i className="ti ti-forms" style={{ fontSize: 14 }} /> Preencher dados
                </button>
              </div>
            ) : (
              <div style={{ paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Pronto para enviar pelo Autentique · <strong>{lead.feePercent ?? 50}% honorários</strong>
                </p>
                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                  <button onClick={openContractDataModal} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #C8BBA8', background: 'transparent', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    <i className="ti ti-edit" style={{ fontSize: 13 }} /> Editar dados
                  </button>
                  <button onClick={() => handleContractPDF('preview')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #C8BBA8', background: 'transparent', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    <i className="ti ti-eye" style={{ fontSize: 13 }} /> Visualizar
                  </button>
                  <button onClick={() => handleContractPDF('download')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-blue-mid)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <i className="ti ti-download" style={{ fontSize: 13 }} /> Baixar PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {previewContract && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}
          onClick={() => setPreviewContract(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', width: '100%', maxWidth: 860, height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Contrato de Assessoria — {lead.name}</span>
              <button onClick={() => setPreviewContract(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-secondary)', lineHeight: 1, padding: '2px 6px' }}>
                <i className="ti ti-x" />
              </button>
            </div>
            <iframe src={previewContract} title="Pré-visualização do contrato" style={{ flex: 1, border: 'none', minHeight: 0 }} />
          </div>
        </div>
      )}


    </div>
  )
}
