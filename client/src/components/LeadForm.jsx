import { useState, useEffect, useRef } from 'react'
import { LEAD_SOURCES, COMMERCIAL_STATUSES, COMMERCIAL_STATUS_META, DEFAULT_BANKS, BANK_CONTRACT_TYPES, BANK_CONTRACT_STATUSES, BANK_CONTRACT_STATUS_META, fmtPhone, fmtCpf, fmtCurrency } from '../constants'
import { apiListContracts, apiCreateContract, apiUpdateContract, apiDeleteContract } from '../utils/api'
import { ContractModal, ReviewModal } from './ContractModals'
import ConfirmModal, { AlertModal } from './ConfirmModal'

function Field({ label, hint, children, full, half }) {
  const col = full ? '1 / -1' : half ? 'auto' : 'auto'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: col }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>{hint}</span>}
    </div>
  )
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 6, borderBottom: '1px solid var(--color-border)', marginTop: 4 }}>
      <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 15, color: 'var(--color-text-secondary)' }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}

function Collapsible({ icon, label, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: 'var(--color-bg)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: 'var(--color-text-hint)', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>{label}</span>
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 13, color: 'var(--color-text-hint)', transition: 'transform 0.2s' }} aria-hidden="true" />
      </button>
      {open && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Cartão de contrato (no formulário) ──────────────────────────────────────
function ContractCard({ contract, banks, onUpdate, onDelete }) {
  const [editModal, setEditModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
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
      <div style={{ border: `1px solid ${isReviewed ? '#BBF7D0' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', background: isReviewed ? '#F0FDF4' : 'var(--color-surface)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          {/* Status inline — clicável para ciclar entre os 3 primeiros status */}
          <button
            type="button"
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
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {contract.bank || '(banco não informado)'}
              {contract.type ? <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}> · {contract.type}</span> : ''}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: meta.bg, color: meta.color, fontWeight: 500 }}>
                {contract.status}
              </span>
              {emb > 0 && <span style={{ fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 600 }}>{fmtCurrency(emb)}</span>}
              {products > 0 && <span style={{ fontSize: 11, color: '#C0392B' }}>{products} prod.</span>}
              {contract.pdfName && <span style={{ fontSize: 10, color: 'var(--color-blue-dark)' }}><i className="ti ti-file-text" style={{ fontSize: 10 }} /> {contract.pdfName}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {!isReviewed && (
              <button type="button" onClick={() => setReviewModal(true)} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 'var(--radius-md)', border: '1px solid #7C3AED', background: '#EDE9FE', cursor: 'pointer', color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-file-search" style={{ fontSize: 12 }} /> Revisar
              </button>
            )}
            <button type="button" onClick={() => setEditModal(true)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-edit" style={{ fontSize: 12 }} /> Editar
            </button>
            <button type="button" onClick={onDelete} style={{ fontSize: 11, padding: '4px 7px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-red-mid)', display: 'flex', alignItems: 'center' }}>
              <i className="ti ti-trash" style={{ fontSize: 12 }} />
            </button>
          </div>
        </div>
        {contract.notes && (
          <div style={{ padding: '4px 12px 8px', fontSize: 11, color: 'var(--color-text-hint)', borderTop: '1px solid var(--color-border)' }}>
            {contract.notes}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Bloco de contratos bancários no formulário ───────────────────────────────
function ContractsBlock({ leadId, banks }) {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading]     = useState(true)
  const [addModal, setAddModal]   = useState(false)
  const [confirmContract, setConfirmContract] = useState(null)

  useEffect(() => {
    if (!leadId) { setLoading(false); return }
    apiListContracts(leadId)
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false))
  }, [leadId])

  const handleAdd = async (data) => {
    const created = await apiCreateContract(leadId, data)
    setContracts(prev => [...prev, created])
    setAddModal(false)
  }

  const handleUpdate = async (contract, data) => {
    const updated = await apiUpdateContract(leadId, contract.id, data)
    setContracts(prev => prev.map(c => c.id === contract.id ? updated : c))
  }

  const handleDelete = async (contract) => {
    await apiDeleteContract(leadId, contract.id)
    setContracts(prev => prev.filter(c => c.id !== contract.id))
  }

  const totalEmb = contracts.reduce((s, c) => s + (parseFloat(c.embeddedValue) || 0), 0)

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-file-invoice" style={{ fontSize: 15, color: 'var(--color-text-secondary)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contratos bancários</span>
          {contracts.length > 0 && (
            <span style={{ fontSize: 11, background: 'var(--color-blue-bg)', color: 'var(--color-blue-dark)', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>{contracts.length}</span>
          )}
          {totalEmb > 0 && <span style={{ fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 600 }}>· {fmtCurrency(totalEmb)}</span>}
        </div>
        <button type="button" onClick={() => setAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Adicionar
        </button>
      </div>

      {loading && <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-hint)', padding: '12px 0' }}>Carregando…</p>}

      {!loading && contracts.length === 0 && (
        <div
          onClick={() => setAddModal(true)}
          style={{ border: '1.5px dashed var(--color-border-med)', borderRadius: 'var(--radius-lg)', padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg)', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-blue-mid)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-med)'}
        >
          <i className="ti ti-file-plus" style={{ fontSize: 26, color: 'var(--color-text-hint)', display: 'block', marginBottom: 6 }} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Nenhum contrato bancário cadastrado</p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-text-hint)' }}>Clique para adicionar o primeiro contrato</p>
        </div>
      )}

      {!loading && contracts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contracts.map(c => (
            <ContractCard
              key={c.id}
              contract={c}
              banks={banks}
              onUpdate={(data) => handleUpdate(c, data)}
              onDelete={() => setConfirmContract(c)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmContract}
        title="Remover contrato"
        message={confirmContract ? `Remover contrato ${[confirmContract.bank, confirmContract.type].filter(Boolean).join(' · ')}?` : ''}
        confirmLabel="Remover"
        onConfirm={() => { const c = confirmContract; setConfirmContract(null); handleDelete(c) }}
        onCancel={() => setConfirmContract(null)}
      />
    </>
  )
}

export default function LeadForm({ form, onChange, onSubmit, onCancel, isEditing, settings, sidebarWidth = 0, inModal = false }) {
  const set = (key, value) => onChange({ ...form, [key]: value })

  const banks = settings?.banks ? JSON.parse(settings.banks) : DEFAULT_BANKS
  const responsibles = settings?.responsibles ? JSON.parse(settings.responsibles) : ['Riquelme', 'Daniel']
  const leadSources = settings?.leadSources ? JSON.parse(settings.leadSources) : LEAD_SOURCES

  const isNewLead = form.status === 'Novo Lead'
  const hideAssessoria = ['Novo Lead', 'Qualificação', 'Qualificado', 'Revisão'].includes(form.status)

  const [alertMsg, setAlertMsg] = useState(null)

  // Bloqueia avanço além de Qualificação se não houver contratos
  const BLOCKED_STATUSES = ['Qualificado', 'Revisão', 'Negociação', 'Contrato Assinado']
  const BLOCKED_NEGOCIACAO = ['Negociação', 'Contrato Assinado']
  const handleStatusChange = async (newStatus) => {
    if (isEditing && BLOCKED_STATUSES.includes(newStatus)) {
      try {
        const list = await apiListContracts(form.id)
        if (list.length === 0) {
          setAlertMsg({ title: 'Contrato necessário', message: 'Adicione pelo menos um contrato bancário antes de avançar o lead nesta etapa.' })
          return
        }
        if (BLOCKED_NEGOCIACAO.includes(newStatus)) {
          const hasRevisado = list.some(c => c.status === 'Contrato revisado')
          const totalEmbutido = list.reduce((sum, c) => sum + (parseFloat(c.embeddedValue) || 0), 0)
          if (!hasRevisado || totalEmbutido <= 0) {
            setAlertMsg({ title: 'Revisão necessária', message: 'Para avançar para Negociação é necessário ter pelo menos um contrato revisado e valor embutido total maior que zero.' })
            return
          }
        }
      } catch {}
    }
    set('status', newStatus)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ═══ SEÇÃO 1 — dados básicos (sempre visível) ════════════════════════ */}
      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        background: 'var(--color-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-blue-bg)', color: 'var(--color-blue-dark)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
          <i className="ti ti-user" style={{ fontSize: 16, color: 'var(--color-blue-mid)' }} aria-hidden="true" />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Dados do lead</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)' }}>Informações básicas, origem e atribuição</p>
          </div>
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Responsável + Funil ─────────────────────────────────────────── */}
        <SectionTitle icon="ti-adjustments-horizontal" label="Atribuição" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
          <Field label="Responsável">
            <div
              style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'var(--color-border)', borderRadius: 99,
                padding: 3, cursor: 'pointer', userSelect: 'none',
                width: 'fit-content', gap: 0,
              }}
            >
              {responsibles.map(name => {
                const active = (form.responsible || responsibles[0]) === name
                return (
                  <span key={name} onClick={() => set('responsible', name)} style={{
                    padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 400,
                    background: active ? 'var(--color-surface)' : 'transparent',
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-hint)',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all 0.18s',
                  }}>
                    {name}
                  </span>
                )
              })}
            </div>
          </Field>

          <Field label="Etapa do funil">
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {COMMERCIAL_STATUSES.map((s, i) => {
                const selected = form.status === s
                const meta = COMMERCIAL_STATUS_META[s]
                const isLast = i === COMMERCIAL_STATUSES.length - 1
                return (
                  <label key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', position: 'relative' }}>
                    <input
                      type="radio" name="funnel-status" value={s}
                      checked={selected}
                      onChange={() => handleStatusChange(s)}
                      style={{ display: 'none' }}
                    />
                    {!isLast && (
                      <div style={{
                        position: 'absolute', top: 11, left: '50%', right: '-50%',
                        height: 2, background: 'var(--color-border)', zIndex: 0,
                      }} />
                    )}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', position: 'relative', zIndex: 1,
                      border: `2px solid ${selected ? meta.color : 'var(--color-border-med)'}`,
                      background: selected ? meta.color : 'var(--color-surface)',
                      boxShadow: selected ? `0 0 0 3px ${meta.bg}` : 'none',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: selected ? 600 : 400,
                      color: selected ? meta.color : 'var(--color-text-hint)',
                      textAlign: 'center', lineHeight: 1.2, maxWidth: 60,
                    }}>
                      {s.replace(/^\d+\.\s*/, '')}
                    </span>
                  </label>
                )
              })}
            </div>
          </Field>
        </div>

        {/* ── Dados do titular ────────────────────────────────────────────── */}
        <SectionTitle icon="ti-user" label="Dados do titular" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Nome completo">
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Lisiane Godoi" />
          </Field>
          <Field label="Telefone / WhatsApp *">
            <input value={form.phone} onChange={e => set('phone', fmtPhone(e.target.value))} placeholder="(11) 99999-9999" type="tel" />
          </Field>
          <Field label="Origem *">
            <select value={form.source||''} onChange={e => set('source', e.target.value)}>
              <option value="">Selecionar…</option>
              {leadSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        {/* ── Meta Ads — colapsável ───────────────────────────────────────── */}
        <Collapsible icon="ti-ad-2" label="Meta Ads">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <Field label="Campanha" hint="Nome da campanha no Meta Ads">
              <input value={form.adCampaign||''} onChange={e => set('adCampaign', e.target.value)} placeholder="Ex: Recuperação Bancária BR" />
            </Field>
            <Field label="Conjunto de Anúncios" hint="Ad Set / Grupo de anúncios">
              <input value={form.adSet||''} onChange={e => set('adSet', e.target.value)} placeholder="Ex: Santander 45-60" />
            </Field>
            <Field label="Anúncio" hint="Nome do criativo / anúncio específico">
              <input value={form.adName||''} onChange={e => set('adName', e.target.value)} placeholder="Ex: AD001 – Vídeo Depoimento" />
            </Field>
          </div>
        </Collapsible>

        {/* ── Observações ─────────────────────────────────────────────────── */}
        <SectionTitle icon="ti-notes" label="Observações" />
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Anotações importantes, próximos passos…"
          rows={4}
        />

        </div>{/* fim padding seção 1 */}
      </div>{/* fim seção 1 */}

      {/* ═══ SEÇÃO 2 — Contratos bancários ══════════════════════════════════ */}
      {isEditing && !isNewLead && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-blue-bg)', color: 'var(--color-blue-dark)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
            <i className="ti ti-file-invoice" style={{ fontSize: 16, color: 'var(--color-blue-mid)' }} aria-hidden="true" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Contratos bancários</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)' }}>Contratos do cliente com o banco (financiamento, empréstimo…)</p>
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <ContractsBlock leadId={form.id} banks={banks} />
          </div>
        </div>
      )}

      {/* ═══ SEÇÃO 3 — Contrato de Assessoria ═══════════════════════════════ */}
      {isEditing && !hideAssessoria && (
        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #FDFCF8 0%, #F7F3E8 100%)',
          overflow: 'hidden',
        }}>
          {/* Cabeçalho */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#EDE8D8', color: '#6B5E3E', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
            <i className="ti ti-file-signature" style={{ fontSize: 16, color: 'var(--color-blue-mid)' }} aria-hidden="true" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Contrato de Assessoria</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)' }}>Dados usados para gerar o PDF do contrato com o cliente</p>
            </div>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Honorários */}
            <SectionTitle icon="ti-cash" label="Honorários" />
            <Field label={`Percentual cobrado: ${form.feePercent ?? 50}%`} hint="Entre 20% e 50%. Padrão: 50%.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="range" min="20" max="50" step="1"
                  value={form.feePercent ?? 50}
                  onChange={e => set('feePercent', Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <input type="number" min="20" max="50"
                  value={form.feePercent ?? 50}
                  onChange={e => {
                    let v = Number(e.target.value)
                    if (isNaN(v)) v = 50
                    v = Math.max(20, Math.min(50, v))
                    set('feePercent', v)
                  }}
                  style={{ width: 80, textAlign: 'center' }}
                />
              </div>
            </Field>

            {/* Dados para contrato */}
            <SectionTitle icon="ti-id-badge-2" label="Dados para contrato" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="CPF">
                <input value={form.cpf} onChange={e => set('cpf', fmtCpf(e.target.value))} placeholder="000.000.000-00" />
              </Field>
              <Field label="RG">
                <input value={form.rg} onChange={e => set('rg', e.target.value)} placeholder="00.000.000 SSP/UF" />
              </Field>
              <Field label="Data de nascimento">
                <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
              </Field>
              <Field label="E-mail" hint="Para envio pelo Autentique">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="cliente@email.com" />
              </Field>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: 'span 2' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Endereço completo <span style={{ fontWeight: 400, color: 'var(--color-text-hint)' }}>— Rua, nº, bairro, cidade — UF, CEP</span></label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua Caxias do Sul, 471, Centro, Palmeira das Missões - RS" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Espaço para o conteúdo não ficar atrás dos botões flutuantes (só fora do modal) */}
      {!inModal && <div style={{ height: 72 }} />}

      {/* Actions */}
      {inModal ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <div style={{
            display: 'inline-flex', gap: 8, alignItems: 'center',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
          }}>
            <button type="button" onClick={onCancel} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--radius-full)',
              border: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 500,
            }}>
              <i className="ti ti-x" style={{ fontSize: 14 }} />Cancelar
            </button>
            <button type="button" onClick={onSubmit} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 'var(--radius-full)',
              border: 'none', background: 'var(--color-blue-mid)',
              fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer',
            }}>
              <i className="ti ti-check" style={{ fontSize: 14 }} />Adicionar
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          position: 'fixed', bottom: 20, left: `calc(50vw + ${sidebarWidth / 2}px)`, transform: 'translateX(-50%)',
          zIndex: 100, display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          padding: '6px 8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
        }}>
          <button type="button" onClick={onCancel} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--radius-full)',
            border: 'none', background: 'transparent',
            fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 500,
          }}>
            <i className="ti ti-x" style={{ fontSize: 14 }} />Cancelar
          </button>
          <button type="button" onClick={onSubmit} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 'var(--radius-full)',
            border: 'none', background: 'var(--color-blue-mid)',
            fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}>
            <i className="ti ti-check" style={{ fontSize: 14 }} />
            {isEditing ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      )}

      <AlertModal
        open={!!alertMsg}
        title={alertMsg?.title}
        message={alertMsg?.message}
        onClose={() => setAlertMsg(null)}
      />
    </div>
  )
}
