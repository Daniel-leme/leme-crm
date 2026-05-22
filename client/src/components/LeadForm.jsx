import { useRef } from 'react'
import { CONTRACT_TYPES, LEAD_SOURCES, STATUSES, DEFAULT_BANKS, fmtPhone, fmtCpf } from '../constants'

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

export default function LeadForm({ form, onChange, onSubmit, onCancel, isEditing, settings }) {
  const fileRef = useRef()
  const set = (key, value) => onChange({ ...form, [key]: value })

  const banks = settings?.banks ? JSON.parse(settings.banks) : DEFAULT_BANKS
  const responsibles = settings?.responsibles ? JSON.parse(settings.responsibles) : ['Daniel', 'Riquelme']

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange({ ...form, contractFile: ev.target.result, contractName: file.name })
    reader.readAsDataURL(file)
  }

  const removeContract = (e) => {
    e.stopPropagation()
    onChange({ ...form, contractFile: null, contractName: '' })
    if (fileRef.current) fileRef.current.value = ''
  }

  // Calcula valor estimado para a Leme (feePercent% do embeddedValue)
  const embedded = parseFloat(form.embeddedValue) || 0
  const lemeValue = embedded * ((form.feePercent ?? 50) / 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Responsável + Funil ───────────────────────────────────────────── */}
      <SectionTitle icon="ti-adjustments-horizontal" label="Atribuição" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Responsável">
          <select value={form.responsible||''} onChange={e => set('responsible', e.target.value)}>
            <option value="">Selecionar…</option>
            {responsibles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Etapa do funil">
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {/* ── Dados pessoais ────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-user" label="Dados do titular" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <Field label="Nome completo *" full>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Lisiane Godoi" />
        </Field>
        <Field label="Telefone / WhatsApp *">
          <input value={form.phone} onChange={e => set('phone', fmtPhone(e.target.value))} placeholder="(11) 99999-9999" type="tel" />
        </Field>
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
        <Field label="Endereço completo" full hint="Rua, nº, bairro, cidade — UF, CEP">
          <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua Caxias do Sul, 471, Centro, Palmeira das Missões - RS" />
        </Field>
      </div>

      {/* ── Contrato ──────────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-file-description" label="Contrato a revisar" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <Field label="Banco">
          <select value={form.bank} onChange={e => set('bank', e.target.value)}>
            <option value="">Selecionar…</option>
            {banks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Tipo">
          <select value={form.contractType} onChange={e => set('contractType', e.target.value)}>
            <option value="">Selecionar…</option>
            {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Nº do contrato">
          <input value={form.contractNumber} onChange={e => set('contractNumber', e.target.value)} placeholder="000000000" />
        </Field>
        <Field label="Origem">
          <select value={form.source} onChange={e => set('source', e.target.value)}>
            <option value="">Selecionar…</option>
            {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {/* ── Análise / Produtos ────────────────────────────────────────────── */}
      <SectionTitle icon="ti-chart-bar" label="Análise" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <Field label="Qtd. produtos indevidos" hint="Número de produtos detectados">
          <input
            type="number" min="0"
            value={form.productsCount||''}
            onChange={e => set('productsCount', e.target.value)}
            placeholder="Ex: 2"
          />
        </Field>
        <Field label="Valor embutido (R$)" hint="Valor total dos produtos indevidos">
          <input
            type="number" min="0" step="0.01"
            value={form.embeddedValue||''}
            onChange={e => set('embeddedValue', e.target.value)}
            placeholder="Ex: 1988.00"
          />
        </Field>
        <Field label="Honorários da Leme">
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--radius-md)',
            background: embedded > 0 ? 'var(--color-green-bg)' : 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            fontSize: 14, fontWeight: 600,
            color: embedded > 0 ? 'var(--color-green-dark)' : 'var(--color-text-hint)',
          }}>
            {embedded > 0
              ? `R$ ${lemeValue.toFixed(2).replace('.',',')}`
              : '—'
            }
          </div>
        </Field>
      </div>

      {/* ── Honorários % ──────────────────────────────────────────────────── */}
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

      {/* ── Próximo contato ──────────────────────────────────────────────── */}
      <SectionTitle icon="ti-bell" label="Próximo contato" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Data e hora do contato" hint="Você será avisado 15 min antes e na hora certa" full>
          <input
            type="datetime-local"
            value={form.nextContact || ''}
            onChange={e => set('nextContact', e.target.value)}
          />
        </Field>
        {form.nextContact && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-amber-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
            <i className="ti ti-bell-ringing" style={{ fontSize: 16, color: 'var(--color-amber-dark)', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontSize: 12, color: 'var(--color-amber-dark)' }}>
              Lembrete agendado para {new Date(form.nextContact).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <button type="button" onClick={() => set('nextContact', '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-amber-dark)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-x" style={{ fontSize: 13 }} /> Remover
            </button>
          </div>
        )}
      </div>

      {/* ── Observações ───────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-notes" label="Observações" />
      <textarea
        value={form.notes}
        onChange={e => set('notes', e.target.value)}
        placeholder="Anotações importantes, próximos passos, código da campanha (AD001, AD002...)…"
        rows={4}
      />

      {/* ── Upload contrato bancário ──────────────────────────────────────── */}
      <SectionTitle icon="ti-upload" label="Contrato bancário (do cliente)" />
      <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
      <div
        onClick={() => fileRef.current.click()}
        style={{
          border: '1.5px dashed var(--color-border-med)', borderRadius: 'var(--radius-lg)',
          padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
          background: 'var(--color-bg)', transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-blue-mid)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-med)'}
      >
        {form.contractName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <i className="ti ti-file-check" style={{ fontSize: 22, color: 'var(--color-blue-mid)' }} aria-hidden="true" />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{form.contractName}</span>
            <button onClick={removeContract} style={{ background: 'none', border: 'none', color: 'var(--color-red-mid)', fontSize: 13, padding: '2px 6px' }}>
              <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <i className="ti ti-cloud-upload" style={{ fontSize: 28, color: 'var(--color-text-hint)', display: 'block', marginBottom: 6 }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Clique para enviar o contrato do banco</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-hint)' }}>PDF ou imagem (JPG, PNG)</p>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Cancelar
        </button>
        <button type="button" onClick={onSubmit} style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-blue-mid)', color: '#fff', fontSize: 14, fontWeight: 500 }}>
          {isEditing ? 'Salvar alterações' : 'Adicionar lead'}
        </button>
      </div>
    </div>
  )
}
