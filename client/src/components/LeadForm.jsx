import { useRef } from 'react'
import { BANKS, CONTRACT_TYPES, LEAD_SOURCES, STATUSES, fmtPhone, fmtCpf } from '../constants'

function Field({ label, hint, children, full }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1 / -1' : 'auto' }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>{hint}</span>}
    </div>
  )
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      paddingBottom: 6, borderBottom: '1px solid var(--color-border)',
    }}>
      <i className={`ti ${icon}`} aria-hidden="true"
        style={{ fontSize: 15, color: 'var(--color-text-secondary)' }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}

export default function LeadForm({ form, onChange, onSubmit, onCancel, isEditing }) {
  const fileRef = useRef()
  const set = (key, value) => onChange({ ...form, [key]: value })

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange({ ...form, contractFile: ev.target.result, contractName: file.name })
    }
    reader.readAsDataURL(file)
  }

  const removeContract = (e) => {
    e.stopPropagation()
    onChange({ ...form, contractFile: null, contractName: '' })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Dados pessoais ────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-user" label="Dados do titular (Contratante)" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <Field label="Nome completo *" full>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ex: Lisiane Godoi"
          />
        </Field>

        <Field label="CPF *">
          <input
            value={form.cpf}
            onChange={e => set('cpf', fmtCpf(e.target.value))}
            placeholder="000.000.000-00"
          />
        </Field>
        <Field label="RG" hint="Com órgão emissor (ex: 12.345.678 SSP/SP)">
          <input
            value={form.rg}
            onChange={e => set('rg', e.target.value)}
            placeholder="00.000.000 SSP/UF"
          />
        </Field>
        <Field label="Data de nascimento">
          <input
            type="date"
            value={form.birthDate}
            onChange={e => set('birthDate', e.target.value)}
          />
        </Field>

        <Field label="E-mail *" hint="Para envio do contrato via Autentique">
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="cliente@email.com"
          />
        </Field>
        <Field label="Telefone / WhatsApp *">
          <input
            value={form.phone}
            onChange={e => set('phone', fmtPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            type="tel"
          />
        </Field>
        <div></div>

        <Field label="Endereço completo *" full hint="Rua, nº, bairro, cidade — UF, CEP">
          <input
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Rua Caxias do Sul, 471, Centro, Palmeira das Missões - RS, 98300-000"
          />
        </Field>
      </div>

      {/* ── Dados do contrato a revisar ───────────────────────────────────── */}
      <SectionTitle icon="ti-file-description" label="Contrato a revisar" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <Field label="Banco">
          <select value={form.bank} onChange={e => set('bank', e.target.value)}>
            <option value="">Selecionar…</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Tipo">
          <select value={form.contractType} onChange={e => set('contractType', e.target.value)}>
            <option value="">Selecionar…</option>
            {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Nº do contrato / cédula" hint="Ex: 6053799866">
          <input
            value={form.contractNumber}
            onChange={e => set('contractNumber', e.target.value)}
            placeholder="000000000"
          />
        </Field>
      </div>

      <Field label="Origem do lead">
        <select value={form.source} onChange={e => set('source', e.target.value)}>
          <option value="">Selecionar…</option>
          {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      {/* ── Honorários ────────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-percentage" label="Honorários da assessoria" />

      <Field
        label={`Percentual cobrado: ${form.feePercent ?? 50}%`}
        hint="Entre 20% e 50%. Padrão: 50%."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min="20"
            max="50"
            step="1"
            value={form.feePercent ?? 50}
            onChange={e => set('feePercent', Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="20"
            max="50"
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

      {/* ── Status ────────────────────────────────────────────────────────── */}
      <Field label="Status">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
          {STATUSES.map(s => {
            const active = form.status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                style={{
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  padding: '5px 12px', borderRadius: 'var(--radius-full)',
                  border: active ? '1.5px solid var(--color-blue-mid)' : '1px solid var(--color-border)',
                  background: active ? 'var(--color-blue-bg)' : 'transparent',
                  color: active ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </Field>

      {/* ── Observações ───────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-notes" label="Observações" />

      <textarea
        value={form.notes}
        onChange={e => set('notes', e.target.value)}
        placeholder="Seguros encontrados, valores estimados de estorno, anotações importantes…"
        rows={4}
      />

      {/* ── Upload do contrato bancário ───────────────────────────────────── */}
      <SectionTitle icon="ti-upload" label="Contrato bancário (do cliente)" />

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <div
        onClick={() => fileRef.current.click()}
        style={{
          border: '1.5px dashed var(--color-border-med)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 16px',
          textAlign: 'center', cursor: 'pointer',
          background: 'var(--color-bg)',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-blue-mid)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-med)'}
      >
        {form.contractName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <i className="ti ti-file-check" aria-hidden="true"
              style={{ fontSize: 22, color: 'var(--color-blue-mid)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {form.contractName}
            </span>
            <button
              onClick={removeContract}
              style={{
                background: 'none', border: 'none',
                color: 'var(--color-red-mid)', fontSize: 13, padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Remover arquivo"
            >
              <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <i className="ti ti-cloud-upload" aria-hidden="true"
              style={{ fontSize: 28, color: 'var(--color-text-hint)', display: 'block', marginBottom: 6 }} />
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Clique para enviar o contrato do banco
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-hint)' }}>
              PDF ou imagem (JPG, PNG)
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            fontSize: 14, color: 'var(--color-text-secondary)',
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          style={{
            flex: 2, padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--color-blue-mid)',
            color: '#fff', fontSize: 14, fontWeight: 500,
          }}
        >
          {isEditing ? 'Salvar alterações' : 'Adicionar lead'}
        </button>
      </div>
    </div>
  )
}
