import { useState } from 'react'
import { STATUSES, STATUS_META, fmtDate } from '../constants'
import StatusBadge from './StatusBadge'
import { generateContractPDF } from '../utils/contractPdf'

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <i className={`ti ${icon}`} aria-hidden="true"
        style={{ fontSize: 15, color: 'var(--color-text-hint)', marginTop: 1, flexShrink: 0, width: 18 }} />
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

export default function LeadDetail({ lead, settings, onEdit, onDelete, onStatusChange }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const initials = (lead.name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
  const createdAt = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const whatsappLink = `https://wa.me/55${(lead.phone || '').replace(/\D/g, '')}`

  const handleGenerate = (action = 'download') => {
    // Validação mínima
    const missing = []
    if (!lead.name)    missing.push('Nome')
    if (!lead.cpf)     missing.push('CPF')
    if (!lead.address) missing.push('Endereço')
    if (missing.length) {
      alert(`Para gerar o contrato faltam: ${missing.join(', ')}. Clique em "Editar" e preencha esses campos.`)
      return
    }

    const doc = generateContractPDF(lead, settings)
    const filename = `Contrato_${(lead.name || 'lead').replace(/\s+/g, '_')}.pdf`

    if (action === 'preview') {
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } else {
      doc.save(filename)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--color-blue-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 600, color: 'var(--color-blue-dark)', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--color-text-primary)' }}>{lead.name}</h3>
            <div style={{ marginTop: 5, display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge status={lead.status} />
              <span style={{ fontSize: 12, color: 'var(--color-text-hint)' }}>
                · {lead.feePercent ?? 50}% honorários
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {lead.phone && (
              <a
                href={whatsappLink} target="_blank" rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: '#E7F8EE', color: '#1A6B35',
                  fontSize: 13, fontWeight: 500, textDecoration: 'none',
                }}
              >
                <i className="ti ti-brand-whatsapp" style={{ fontSize: 15 }} aria-hidden="true" />
                WhatsApp
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

        <div>
          <InfoRow icon="ti-id"               label="CPF"              value={lead.cpf} />
          <InfoRow icon="ti-license"          label="RG"               value={lead.rg} />
          <InfoRow icon="ti-cake"             label="Nascimento"       value={fmtDate(lead.birthDate)} />
          <InfoRow icon="ti-mail"             label="E-mail"           value={lead.email} />
          <InfoRow icon="ti-phone"            label="Telefone"         value={lead.phone} />
          <InfoRow icon="ti-map-pin"          label="Endereço"         value={lead.address} />
          <InfoRow icon="ti-building-bank"    label="Banco"            value={lead.bank} />
          <InfoRow icon="ti-file-description" label="Tipo"             value={lead.contractType} />
          <InfoRow icon="ti-hash"             label="Nº contrato"      value={lead.contractNumber} />
          <InfoRow icon="ti-target"           label="Origem"           value={lead.source} />
          <InfoRow icon="ti-calendar"         label="Cadastrado em"    value={createdAt} />
        </div>
      </div>

      {/* ── Gerar contrato de assessoria ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #FDFCF8 0%, #F7F3E8 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <i className="ti ti-file-signature" style={{ fontSize: 20, color: 'var(--color-blue-mid)' }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Contrato de Assessoria
          </p>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Gera o PDF do contrato entre <strong>{settings.companyName}</strong> e <strong>{lead.name || 'o cliente'}</strong>,
          com {lead.feePercent ?? 50}% de honorários sobre os proventos. Depois é só enviar pelo Autentique para assinatura.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleGenerate('preview')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-med)',
              background: '#fff', fontSize: 13, fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            <i className="ti ti-eye" style={{ fontSize: 15 }} /> Visualizar
          </button>
          <button
            onClick={() => handleGenerate('download')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--color-blue-mid)', color: '#fff',
              fontSize: 13, fontWeight: 500,
            }}
          >
            <i className="ti ti-download" style={{ fontSize: 15 }} /> Baixar PDF
          </button>
        </div>

        {previewUrl && (
          <div style={{ marginTop: 14 }}>
            <iframe
              src={previewUrl}
              title="Pré-visualização do contrato"
              style={{ width: '100%', height: 520, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            />
          </div>
        )}
      </div>

      {/* ── Status rápido ────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Alterar status
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {STATUSES.map(s => {
            const meta = STATUS_META[s]
            const active = lead.status === s
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: active ? `1.5px solid ${meta.color}` : '1px solid var(--color-border)',
                  background: active ? meta.bg : 'transparent',
                  color: active ? meta.color : 'var(--color-text-secondary)',
                  fontWeight: active ? 500 : 400,
                  transition: 'all 0.12s',
                }}
              >
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
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Observações
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {lead.notes}
          </p>
        </div>
      )}

      {/* ── Contrato bancário anexado ────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Contrato bancário enviado
        </p>

        {lead.contractFile ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <i className="ti ti-file-check" aria-hidden="true" style={{ fontSize: 18, color: 'var(--color-blue-mid)' }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{lead.contractName}</span>
              <a
                href={lead.contractFile}
                download={lead.contractName}
                style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-blue-mid)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" /> Baixar
              </a>
            </div>

            {lead.contractFile.startsWith('data:image') ? (
              <img
                src={lead.contractFile}
                alt="Contrato"
                style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            ) : (
              <iframe
                src={lead.contractFile}
                title="Contrato PDF"
                style={{ width: '100%', height: 520, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            )}
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-hint)', fontSize: 13 }}>
            <i className="ti ti-file-off" aria-hidden="true" style={{ fontSize: 28, display: 'block', marginBottom: 6 }} />
            Nenhum contrato anexado. Clique em Editar para enviar.
          </div>
        )}
      </div>
    </div>
  )
}
