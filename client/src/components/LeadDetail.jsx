import { useState, useRef } from 'react'
import { STATUSES, STATUS_META, fmtDate, fmtCurrency } from '../constants'
import StatusBadge from './StatusBadge'
import { generateContractPDF } from '../utils/contractPdf'

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
      {/* Cabeçalho preto */}
      <div style={{ background: 'linear-gradient(135deg, #1A1917 0%, #2C2A27 100%)', padding: '18px 20px' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {settings?.companyName || 'Leme Financeira'}
        </p>
        <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: '#fff' }}>Relatório de Análise</h2>
      </div>

      {/* Itens */}
      <div style={{ padding: '0 20px 20px' }}>
        {[
          {
            icon: 'ti-user-circle',
            label: 'Responsável',
            value: <span style={{ fontWeight: 600 }}>{(lead.name || '').toUpperCase()}</span>,
          },
          {
            icon: 'ti-alert-circle',
            label: 'Produtos Indevidos',
            value: products > 0
              ? <span style={{ background: '#FDECEA', color: '#C0392B', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                  {products} produto{products !== 1 ? 's' : ''} detectado{products !== 1 ? 's' : ''}
                </span>
              : <span style={{ color: '#999', fontSize: 13 }}>Análise em andamento</span>,
          },
          {
            icon: 'ti-calendar',
            label: 'Data da Análise',
            value: <span style={{ fontWeight: 500 }}>{today}</span>,
          },
          {
            icon: 'ti-clock',
            label: 'Prazo para Recebimento',
            value: <span style={{ fontWeight: 600 }}>No máximo 5 dias úteis</span>,
          },
          {
            icon: 'ti-bolt',
            label: 'Valor Estimado para Recuperar',
            value: value > 0
              ? <span style={{ fontSize: 22, fontWeight: 700, color: '#1A1917' }}>{fmtCurrency(value)}</span>
              : <span style={{ color: '#999', fontSize: 13 }}>A calcular</span>,
            highlight: value > 0,
          },
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

      {/* Footer */}
      <div style={{ background: '#F7F5F0', padding: '12px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#999' }}>
          {settings?.companyName || 'Leme Financeira'} · CNPJ {settings?.companyCnpj || ''}
        </p>
      </div>
    </div>
  )
}

// ─── LeadDetail principal ─────────────────────────────────────────────────────
export default function LeadDetail({ lead, settings, onEdit, onDelete, onStatusChange }) {
  const [previewContract, setPreviewContract] = useState(null)
  const [showReport, setShowReport]           = useState(false)
  // Valor editável só para o relatório — pré-preenche com o valor embutido do lead
  const [reportValue, setReportValue]         = useState(lead.embeddedValue || '')
  const reportRef = useRef()

  const initials   = (lead.name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
  const createdAt  = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  const whatsappLink = `https://wa.me/55${(lead.phone || '').replace(/\D/g, '')}`
  const emb  = parseFloat(lead.embeddedValue) || 0
  const leme = emb * ((lead.feePercent ?? 50) / 100)

  const handlePrintReport = () => {
    const el = reportRef.current
    if (!el) return
    const w = window.open('', '_blank', 'width=420,height=680')
    w.document.write(`
      <html><head><title>Relatório — ${lead.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css"/>
      <style>body{margin:20px;background:#f5f5f5;display:flex;justify-content:center;}@media print{body{background:#fff;margin:0;}}</style>
      </head><body>${el.outerHTML}<script>window.print();setTimeout(()=>window.close(),1000)</script></body></html>
    `)
    w.document.close()
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600, color: 'var(--color-blue-dark)', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{lead.name}</h3>
            <div style={{ marginTop: 5, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusBadge status={lead.status} />
              {lead.responsible && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--color-border)' }}>{lead.responsible}</span>}
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
        {lead.nextContact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-border)', background: 'var(--color-amber-bg)', margin: '4px -20px -1px', padding: '10px 20px' }}>
            <i className="ti ti-bell-ringing" style={{ fontSize: 16, color: 'var(--color-amber-dark)', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontSize: 12, color: 'var(--color-amber-dark)', fontWeight: 500 }}>
              Próximo contato: {new Date(lead.nextContact).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* ── Painel de valores ─────────────────────────────────────────────── */}
      {(emb > 0 || lead.productsCount > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Produtos indevidos', value: `${lead.productsCount || 0} produto(s)`, icon: 'ti-alert-circle', bg: '#FDECEA', color: '#C0392B' },
            { label: 'Valor embutido',     value: fmtCurrency(emb),                        icon: 'ti-coin',         bg: '#FFF3CD', color: '#7A4F00' },
            { label: `Honorários (${lead.feePercent ?? 50}%)`, value: fmtCurrency(leme),   icon: 'ti-cash',         bg: 'var(--color-green-bg)', color: 'var(--color-green-dark)' },
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
      )}

      {/* ── Relatório para o cliente ──────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-chart-bar" style={{ fontSize: 18, color: '#1A1917' }} aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Relatório para o cliente</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowReport(!showReport)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 13, cursor: 'pointer' }}>
              <i className={`ti ${showReport ? 'ti-eye-off' : 'ti-eye'}`} style={{ fontSize: 14 }} aria-hidden="true" />
              {showReport ? 'Ocultar' : 'Visualizar'}
            </button>
            <button onClick={handlePrintReport} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: '#1A1917', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <i className="ti ti-printer" style={{ fontSize: 14 }} aria-hidden="true" /> Imprimir / Print
            </button>
          </div>
        </div>

        {/* Campo editável do valor para o relatório */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, background: 'var(--color-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <i className="ti ti-currency-dollar" style={{ fontSize: 16, color: 'var(--color-text-secondary)', flexShrink: 0 }} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Valor no relatório (editável aqui — não salva no lead)
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={reportValue}
              onChange={e => setReportValue(e.target.value)}
              placeholder="Ex: 1988.00"
              style={{ border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, padding: 0, width: '100%', outline: 'none' }}
            />
          </div>
          {parseFloat(reportValue) > 0 && (
            <span style={{ fontSize: 13, color: 'var(--color-green-dark)', fontWeight: 600, flexShrink: 0 }}>
              {fmtCurrency(parseFloat(reportValue))}
            </span>
          )}
        </div>

        {/* Preview do card */}
        {showReport && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
            <ReportCard lead={lead} settings={settings} reportRef={reportRef} reportValue={reportValue} />
          </div>
        )}
        {/* Sempre presente no DOM para o print funcionar mesmo oculto */}
        {!showReport && (
          <div style={{ display: 'none' }}>
            <ReportCard lead={lead} settings={settings} reportRef={reportRef} reportValue={reportValue} />
          </div>
        )}
      </div>

      {/* ── Contrato de assessoria ────────────────────────────────────────── */}
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

      {/* ── Status rápido ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avançar etapa</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {STATUSES.map(s => {
            const meta   = STATUS_META[s]
            const active = lead.status === s
            return (
              <button key={s} onClick={() => onStatusChange(s)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 12px', borderRadius: 'var(--radius-full)', border: active ? `1.5px solid ${meta.color}` : '1px solid var(--color-border)', background: active ? meta.bg : 'transparent', color: active ? meta.color : 'var(--color-text-secondary)', fontWeight: active ? 500 : 400, cursor: 'pointer' }}>
                <i className={`ti ${meta.icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Observações ──────────────────────────────────────────────────── */}
      {lead.notes && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Observações</p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
        </div>
      )}

      {/* ── Contrato bancário ─────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contrato bancário enviado</p>
        {lead.contractFile ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <i className="ti ti-file-check" style={{ fontSize: 18, color: 'var(--color-blue-mid)' }} aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{lead.contractName}</span>
              <a href={lead.contractFile} download={lead.contractName} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-blue-mid)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" /> Baixar
              </a>
            </div>
            {lead.contractFile.startsWith('data:image')
              ? <img src={lead.contractFile} alt="Contrato" style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
              : <iframe src={lead.contractFile} title="Contrato PDF" style={{ width: '100%', height: 520, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
            }
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-hint)', fontSize: 13 }}>
            <i className="ti ti-file-off" style={{ fontSize: 28, display: 'block', marginBottom: 6 }} aria-hidden="true" />
            Nenhum contrato anexado. Clique em Editar para enviar.
          </div>
        )}
      </div>
    </div>
  )
}
