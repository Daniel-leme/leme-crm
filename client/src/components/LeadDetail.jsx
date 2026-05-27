import { useState, useEffect } from 'react'
import { COMMERCIAL_STATUSES, COMMERCIAL_STATUS_META, LOSS_REASONS as DEFAULT_LOSS_REASONS, BANK_CONTRACT_STATUSES, BANK_CONTRACT_STATUS_META, DEFAULT_BANKS, fmtDate, fmtCurrency } from '../constants'
import StatusBadge from './StatusBadge'
import { generateContractPDF } from '../utils/contractPdf'
import { apiGetOperationByLead, apiListContracts, apiCreateContract, apiUpdateContract, apiDeleteContract } from '../utils/api'
import { ContractModal, ReviewModal } from './ContractModals'

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
function ContractItem({ contract, banks, onUpdate, onDelete }) {
  const [editModal, setEditModal]     = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [showPdf, setShowPdf]         = useState(false)
  const meta = BANK_CONTRACT_STATUS_META[contract.status] || BANK_CONTRACT_STATUS_META['Aguardando envio']
  const emb = parseFloat(contract.embeddedValue) || 0
  const products = parseInt(contract.productsCount) || 0
  const isReviewed = contract.status === 'Contrato revisado'

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
          onSave={async (data) => { await onUpdate(data); setReviewModal(false) }}
          onClose={() => setReviewModal(false)}
        />
      )}
      <div style={{ border: `1px solid ${isReviewed ? '#BBF7D0' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: isReviewed ? '#F0FDF4' : 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          {/* Status inline — clica para ciclar nos 3 primeiros */}
          <button
            onClick={() => {
              const allowed = BANK_CONTRACT_STATUSES.slice(0, 3)
              const idx = allowed.indexOf(contract.status)
              const next = allowed[(idx + 1) % allowed.length]
              onUpdate({ status: next })
            }}
            title="Clique para mudar status"
            style={{ width: 32, height: 32, borderRadius: '50%', background: meta.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: isReviewed ? 'default' : 'pointer' }}
          >
            <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: meta.color }} />
          </button>
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
            {!isReviewed && (
              <button onClick={() => setReviewModal(true)} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 'var(--radius-md)', border: '1px solid #7C3AED', background: '#EDE9FE', cursor: 'pointer', color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-file-search" style={{ fontSize: 12 }} /> Revisar
              </button>
            )}
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
function BankContractsSection({ lead, settings, onRefreshLead }) {
  const banks = settings?.banks ? JSON.parse(settings.banks) : DEFAULT_BANKS
  const [contracts, setContracts]     = useState([])
  const [addModal, setAddModal]       = useState(false)
  const [loading, setLoading]         = useState(true)
  const [showReport, setShowReport]   = useState(false)

  useEffect(() => {
    setLoading(true)
    apiListContracts(lead.id)
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false))
  }, [lead.id])

  const handleAdd = async (data) => {
    const created = await apiCreateContract(lead.id, data)
    setContracts(prev => [...prev, created])
    setAddModal(false)
    onRefreshLead?.()
  }

  const handleUpdate = async (contract, data) => {
    const updated = await apiUpdateContract(lead.id, contract.id, data)
    setContracts(prev => prev.map(c => c.id === contract.id ? updated : c))
    onRefreshLead?.()
  }

  const handleDelete = async (contract) => {
    if (!window.confirm(`Remover contrato ${contract.bank || ''}?`)) return
    await apiDeleteContract(lead.id, contract.id)
    setContracts(prev => prev.filter(c => c.id !== contract.id))
    onRefreshLead?.()
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
              onUpdate={(data) => handleUpdate(c, data)}
              onDelete={() => handleDelete(c)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── LeadDetail principal ─────────────────────────────────────────────────────
export default function LeadDetail({ lead, settings, onEdit, onDelete, onStatusChange, onOpenOperation, onRefresh }) {
  const lossReasons = settings?.lossReasons
    ? JSON.parse(settings.lossReasons)
    : DEFAULT_LOSS_REASONS

  const [previewContract, setPreviewContract] = useState(null)
  const [operation, setOperation]             = useState(null)
  const [showLossModal, setShowLossModal]     = useState(false)

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

  const BLOCKED_STATUSES = ['2. Qualificado', '3. Revisão', '4. Negociação', '5. Contrato Assinado']
  const BLOCKED_NEGOCIACAO = ['4. Negociação', '5. Contrato Assinado']

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

  const isNewLead = !lead.isLost && lead.status === '0. Novo Lead'
  const hideAssessoria = !lead.isLost && ['0. Novo Lead', '1. Qualificação', '2. Qualificado', '3. Revisão'].includes(lead.status)

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
            const lostFromOperational = lead.status === '5. Contrato Assinado'
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
            extraStep={lead.status !== '5. Contrato Assinado' ? 'Perdido' : null}
          />
        </div>

        <InfoRow icon="ti-id"               label="CPF"           value={lead.cpf} />
        <InfoRow icon="ti-license"          label="RG"            value={lead.rg} />
        <InfoRow icon="ti-cake"             label="Nascimento"    value={fmtDate(lead.birthDate)} />
        <InfoRow icon="ti-mail"             label="E-mail"        value={lead.email} />
        <InfoRow icon="ti-phone"            label="Telefone"      value={lead.phone} />
        <InfoRow icon="ti-map-pin"          label="Endereço"      value={lead.address} />
        <InfoRow icon="ti-building-bank"    label="Banco"         value={lead.bank} />
        <InfoRow icon="ti-file-description" label="Tipo"          value={lead.contractType} />
        <InfoRow icon="ti-hash"             label="Nº contrato"   value={lead.contractNumber} />
        <InfoRow icon="ti-target"           label="Origem"        value={lead.source} />
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
      {!isNewLead && <BankContractsSection lead={lead} settings={settings} onRefreshLead={onRefresh} />}

      {/* ── Contrato de assessoria ────────────────────────────────────────── */}
      {!hideAssessoria && (
        <div style={{ background: 'linear-gradient(135deg, #FDFCF8 0%, #F7F3E8 100%)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <i className="ti ti-file-signature" style={{ fontSize: 20, color: 'var(--color-blue-mid)' }} aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Contrato de Assessoria</span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
            PDF pronto para enviar pelo Autentique. Honorários: {lead.feePercent ?? 50}%.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => handleContractPDF('preview')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-med)', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <i className="ti ti-eye" style={{ fontSize: 15 }} /> Visualizar
            </button>
            <button onClick={() => handleContractPDF('download')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-blue-mid)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <i className="ti ti-download" style={{ fontSize: 15 }} /> Baixar PDF
            </button>
          </div>
          {previewContract && (
            <div style={{ marginTop: 14 }}>
              <iframe src={previewContract} title="Pré-visualização do contrato" style={{ width: '100%', height: 520, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
            </div>
          )}
        </div>
      )}


    </div>
  )
}
