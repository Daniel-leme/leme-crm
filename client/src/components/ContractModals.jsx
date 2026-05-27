import { useState, useRef } from 'react'
import { BANK_CONTRACT_TYPES, BANK_CONTRACT_STATUSES, BANK_CONTRACT_STATUS_META, fmtCurrency } from '../constants'

// ─── Modal de adicionar/editar contrato (sem campos de revisão) ───────────────
export function ContractModal({ initial, banks, onSave, onClose }) {
  const fileRef = useRef()
  const STATUSES_ALLOWED = BANK_CONTRACT_STATUSES.slice(0, 3) // os 3 primeiros (excluindo "Contrato revisado")
  const empty = { bank: '', type: '', status: 'Aguardando envio', notes: '', pdfFile: null, pdfName: '' }
  const [data, setData] = useState(initial ? { ...empty, ...initial } : empty)
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setData(d => ({ ...d, pdfFile: ev.target.result, pdfName: file.name }))
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 22px', maxWidth: 460, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-file-invoice" style={{ fontSize: 17, color: 'var(--color-blue-dark)' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{initial ? 'Editar contrato' : 'Novo contrato bancário'}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Preencha os dados do contrato do cliente</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Tipo <span style={{ color: 'var(--color-red-mid)' }}>*</span></label>
            <select value={data.type} onChange={e => set('type', e.target.value)} style={{ fontSize: 13, borderColor: !data.type ? 'var(--color-red-mid)' : undefined }}>
              <option value="">Selecionar…</option>
              {BANK_CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Banco <span style={{ color: 'var(--color-red-mid)' }}>*</span></label>
            <select value={data.bank} onChange={e => set('bank', e.target.value)} style={{ fontSize: 13, borderColor: !data.bank ? 'var(--color-red-mid)' : undefined }}>
              <option value="">Selecionar…</option>
              {banks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Status — apenas os 3 primeiros (não inclui "Contrato revisado") */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Status</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUSES_ALLOWED.map(s => {
                const meta = BANK_CONTRACT_STATUS_META[s]
                const active = data.status === s
                return (
                  <button key={s} type="button" onClick={() => set('status', s)} style={{
                    flex: 1, padding: '7px 6px', borderRadius: 8, fontSize: 11, fontWeight: active ? 600 : 400,
                    border: `1.5px solid ${active ? meta.color : 'var(--color-border)'}`,
                    background: active ? meta.bg : 'transparent',
                    color: active ? meta.color : 'var(--color-text-secondary)',
                    cursor: 'pointer', transition: 'all 0.13s', textAlign: 'center',
                  }}>
                    <i className={`ti ${meta.icon}`} style={{ fontSize: 12, display: 'block', marginBottom: 2 }} />
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Observação</label>
            <textarea value={data.notes} onChange={e => set('notes', e.target.value)} placeholder="Anotações sobre este contrato…" rows={2} style={{ fontSize: 13 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>PDF do contrato</label>
            <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handleFile} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileRef.current.click()} style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 12px',
              borderRadius: 'var(--radius-md)', border: '1.5px dashed var(--color-border-med)',
              background: 'var(--color-bg)', cursor: 'pointer', color: data.pdfName ? 'var(--color-blue-dark)' : 'var(--color-text-hint)',
            }}>
              <i className={`ti ${data.pdfName ? 'ti-file-check' : 'ti-cloud-upload'}`} style={{ fontSize: 16 }} />
              {data.pdfName || 'Clique para enviar PDF ou imagem'}
              {data.pdfName && (
                <span onClick={e => { e.stopPropagation(); setData(d => ({ ...d, pdfFile: null, pdfName: '' })) }} style={{ marginLeft: 'auto', color: 'var(--color-red-mid)', fontSize: 13, padding: '0 4px' }}>
                  <i className="ti ti-x" style={{ fontSize: 13 }} />
                </span>
              )}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!data.type || !data.bank) { alert('Tipo e Banco são obrigatórios.'); return }
              onSave(data)
            }}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: 'var(--color-blue-mid)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {initial ? 'Salvar alterações' : 'Adicionar contrato'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de revisão (produtos indevidos + valor embutido) ───────────────────
export function ReviewModal({ contract, onSave, onClose }) {
  const [productsCount, setProductsCount] = useState(contract.productsCount || '')
  const [embeddedValue, setEmbeddedValue] = useState(contract.embeddedValue || '')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 22px', maxWidth: 380, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-file-search" style={{ fontSize: 17, color: '#7C3AED' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Revisar contrato</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {contract.bank}{contract.type ? ` · ${contract.type}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Qtd. produtos indevidos</label>
            <input
              type="number" min="0"
              value={productsCount}
              onChange={e => setProductsCount(e.target.value)}
              placeholder="Ex: 2"
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Valor embutido (R$)</label>
            <input
              type="number" min="0" step="0.01"
              value={embeddedValue}
              onChange={e => setEmbeddedValue(e.target.value)}
              placeholder="Ex: 1988.00"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>

        {parseFloat(embeddedValue) > 0 && (
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', border: '1px solid #BBF7D0' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#15803D', opacity: 0.8 }}>Valor identificado</p>
            <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: '#15803D' }}>{fmtCurrency(parseFloat(embeddedValue))}</p>
          </div>
        )}

        <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-hint)', background: '#FFFBEB', padding: '8px 12px', borderRadius: 8, border: '1px solid #FEF08A' }}>
          <i className="ti ti-info-circle" style={{ marginRight: 5 }} />
          Ao salvar, o contrato será marcado como <strong>Contrato revisado</strong>.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave({ productsCount, embeddedValue, status: 'Contrato revisado' })}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#15803D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Salvar revisão
          </button>
        </div>
      </div>
    </div>
  )
}
