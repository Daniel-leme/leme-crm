import { useState, useRef, useEffect } from 'react'
import { BANK_CONTRACT_TYPES, BANK_CONTRACT_STATUSES, BANK_CONTRACT_STATUS_META, fmtCurrency } from '../constants'

// ─── Dropdown customizado (sem <select> nativo) ───────────────────────────────
function Dropdown({ value, onChange, options, placeholder = 'Selecionar…', accent, accentBg, fullWidth, error }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const selected = options.find(o => (o.value ?? o) === value)
  const label = selected ? (selected.label ?? selected) : null

  return (
    <div ref={ref} style={{ position: 'relative', width: fullWidth ? '100%' : undefined }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        padding: '8px 10px', borderRadius: 8,
        border: `1.5px solid ${error ? 'var(--color-red-mid)' : open ? (accent || 'var(--color-blue-mid)') : 'var(--color-border)'}`,
        background: open ? (accentBg || 'var(--color-blue-bg)') : '#fff',
        cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        color: label ? 'var(--color-text-primary)' : 'var(--color-text-hint)',
        outline: 'none', transition: 'border-color 0.15s',
      }}>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label || placeholder}
        </span>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 11, color: 'var(--color-text-hint)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          zIndex: 100, background: '#fff', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          border: '1px solid var(--color-border)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {options.map(o => {
            const v = o.value ?? o
            const l = o.label ?? o
            const sel = v === value
            return (
              <button key={v} type="button" onClick={() => { onChange(v); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 12px', border: 'none', cursor: 'pointer',
                background: sel ? (accentBg || 'var(--color-blue-bg)') : 'transparent',
                fontSize: 13, fontWeight: sel ? 600 : 400,
                color: sel ? (accent || 'var(--color-blue-mid)') : 'var(--color-text-primary)',
                textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--color-bg)' }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ flex: 1 }}>{l}</span>
                {sel && <i className="ti ti-check" style={{ fontSize: 12, color: accent || 'var(--color-blue-mid)' }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Footer pill — mesmo padrão do TaskModal ─────────────────────────────────
function FooterPill({ onCancel, onConfirm, confirmLabel, confirmColor, confirmShadow, isRequired }) {
  return (
    <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 99, padding: '4px 5px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      {!isRequired && (
        <button type="button" onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 99, border: 'none', background: 'transparent', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <i className="ti ti-x" style={{ fontSize: 13 }} />Cancelar
        </button>
      )}
      <button type="button" onClick={onConfirm} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 99, border: 'none', background: confirmColor, fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 2px 8px ${confirmShadow}` }}>
        <i className="ti ti-check" style={{ fontSize: 13 }} />{confirmLabel}
      </button>
    </div>
  )
}

// ─── Label de seção — mesmo padrão do TaskModal ───────────────────────────────
const SLabel = ({ children }) => (
  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</span>
)

// ─── Modal de adicionar/editar contrato bancário ──────────────────────────────
export function ContractModal({ initial, banks, onSave, onClose }) {
  const fileRef = useRef()
  const empty = { bank: '', type: '', status: 'Aguardando envio', notes: '', pdfFile: null, pdfName: '' }
  const [data, setData] = useState(initial ? { ...empty, ...initial } : empty)
  const [error, setError] = useState('')
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setData(d => ({ ...d, pdfFile: ev.target.result, pdfName: file.name }))
    reader.readAsDataURL(file)
  }

  const accent = 'var(--color-blue-mid)'
  const accentBg = 'var(--color-blue-bg)'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-hint)', fontSize: 18, lineHeight: 1, padding: 4, zIndex: 1 }}>
          <i className="ti ti-x" />
        </button>

        <div style={{ padding: '28px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 24 }}>

          {/* Header */}
          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, background: accentBg, borderRadius: 99, padding: '6px 14px 6px 6px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <i className="ti ti-file-invoice" style={{ fontSize: 14, color: accent }} />
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: accent }}>
              {initial ? 'Editar contrato' : 'Novo contrato bancário'}
            </p>
          </div>

          {/* Campos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Tipo + Banco — 50/50 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tipo *</span>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Banco</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <Dropdown value={data.type} onChange={v => set('type', v)} options={BANK_CONTRACT_TYPES} placeholder="Selecionar…" accent={accent} accentBg={accentBg} fullWidth error={!data.type} />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown value={data.bank} onChange={v => set('bank', v)} options={banks} placeholder="Selecionar…" accent={accent} accentBg={accentBg} fullWidth />
                </div>
              </div>
            </div>

            {/* Observação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SLabel>Observação</SLabel>
              <textarea value={data.notes} onChange={e => set('notes', e.target.value)} placeholder="Anotações sobre este contrato…" rows={2} style={{ fontSize: 13, resize: 'none' }} />
            </div>

            {/* PDF */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SLabel>PDF do contrato</SLabel>
              <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handleFile} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileRef.current.click()} style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '9px 12px',
                borderRadius: 10, border: '1.5px dashed var(--color-border)',
                background: 'var(--color-bg)', cursor: 'pointer',
                color: data.pdfName ? 'var(--color-blue-dark)' : 'var(--color-text-hint)',
                fontFamily: 'inherit',
              }}>
                <i className={`ti ${data.pdfName ? 'ti-file-check' : 'ti-cloud-upload'}`} style={{ fontSize: 15 }} />
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.pdfName || 'Clique para enviar PDF ou imagem'}</span>
                {data.pdfName && (
                  <span onClick={e => { e.stopPropagation(); setData(d => ({ ...d, pdfFile: null, pdfName: '' })) }} style={{ color: 'var(--color-red-mid)', fontSize: 13, padding: '0 2px' }}>
                    <i className="ti ti-x" style={{ fontSize: 13 }} />
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Erro */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 8, background: 'var(--color-red-bg)', border: '1px solid var(--color-red-dark)' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 13, color: 'var(--color-red-dark)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--color-red-dark)' }}>{error}</span>
            </div>
          )}

          <FooterPill
            onCancel={onClose}
            onConfirm={() => {
              if (!data.type) { setError('Selecione o tipo do contrato.'); return }
              setError('')
              onSave(data)
            }}
            confirmLabel={initial ? 'Salvar alterações' : 'Adicionar contrato'}
            confirmColor={accent}
            confirmShadow="rgba(14,74,120,0.25)"
          />

        </div>
      </div>
    </div>
  )
}

// ─── Modal de revisão ─────────────────────────────────────────────────────────
export function ReviewModal({ contract, onSave, onClose }) {
  const [productsCount, setProductsCount] = useState(contract.productsCount || '')
  const [embeddedValue, setEmbeddedValue] = useState(contract.embeddedValue || '')

  const accent = '#7C3AED'
  const accentBg = '#EDE9FE'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 360, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-hint)', fontSize: 18, lineHeight: 1, padding: 4, zIndex: 1 }}>
          <i className="ti ti-x" />
        </button>

        <div style={{ padding: '28px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 24 }}>

          {/* Header */}
          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, background: accentBg, borderRadius: 99, padding: '6px 14px 6px 6px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <i className="ti ti-file-search" style={{ fontSize: 14, color: accent }} />
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: accent }}>Revisar contrato</p>
          </div>

          {/* Subtítulo do contrato */}
          {(contract.bank || contract.type) && (
            <p style={{ margin: '-16px 0 0', fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              {contract.bank}{contract.type ? ` · ${contract.type}` : ''}
            </p>
          )}

          {/* Campos — 50/50 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <SLabel>Produtos indevidos</SLabel>
              <span style={{ flex: 1 }} />
              <SLabel>Valor embutido (R$)</SLabel>
              <span style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min="0" value={productsCount} onChange={e => setProductsCount(e.target.value)} placeholder="Ex: 2" style={{ flex: 1, fontSize: 13 }} />
              <input type="number" min="0" step="0.01" value={embeddedValue} onChange={e => setEmbeddedValue(e.target.value)} placeholder="Ex: 1988.00" style={{ flex: 1, fontSize: 13 }} />
            </div>
          </div>

          {/* Preview valor */}
          {parseFloat(embeddedValue) > 0 && (
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', border: '1px solid #BBF7D0' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#15803D', opacity: 0.8 }}>Valor identificado</p>
              <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: '#15803D' }}>{fmtCurrency(parseFloat(embeddedValue))}</p>
            </div>
          )}

          {/* Aviso */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '8px 12px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FEF08A' }}>
            <i className="ti ti-info-circle" style={{ fontSize: 13, color: '#B45309', marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#78350F' }}>Ao salvar, o contrato será marcado como <strong>Contrato revisado</strong>.</span>
          </div>

          <FooterPill
            onCancel={onClose}
            onConfirm={() => onSave({ productsCount, embeddedValue, status: 'Contrato revisado' })}
            confirmLabel="Salvar revisão"
            confirmColor="#15803D"
            confirmShadow="rgba(21,128,61,0.25)"
          />

        </div>
      </div>
    </div>
  )
}
