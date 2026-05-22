import { useState } from 'react'
import { DEFAULT_BANKS } from '../constants'

function Field({ label, hint, children, full }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1 / -1' : 'auto' }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>{hint}</span>}
    </div>
  )
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 6, borderBottom: '1px solid var(--color-border)', marginTop: 8 }}>
      <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 15, color: 'var(--color-text-secondary)' }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  )
}

function TagEditor({ items, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setInput('')
  }

  const remove = (item) => onChange(items.filter(i => i !== item))

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
        {items.map(item => (
          <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--color-blue-bg)', color: 'var(--color-blue-dark)', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
            {item}
            <button onClick={() => remove(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-blue-dark)', fontSize: 13, padding: 0, lineHeight: 1, opacity: 0.6 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={placeholder} style={{ flex: 1 }} />
        <button onClick={add} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-blue-mid)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          Adicionar
        </button>
      </div>
    </div>
  )
}

export default function Settings({ settings, onSave }) {
  const [form, setForm] = useState({
    ...settings,
    banks:        JSON.parse(settings.banks || JSON.stringify(DEFAULT_BANKS)),
    responsibles: JSON.parse(settings.responsibles || '["Daniel","Riquelme"]'),
  })
  const set = (k, v) => setForm({ ...form, [k]: v })
  const dirty = JSON.stringify(form) !== JSON.stringify({
    ...settings,
    banks:        JSON.parse(settings.banks || JSON.stringify(DEFAULT_BANKS)),
    responsibles: JSON.parse(settings.responsibles || '["Daniel","Riquelme"]'),
  })

  const handleSave = () => {
    onSave({
      ...form,
      banks:        JSON.stringify(form.banks),
      responsibles: JSON.stringify(form.responsibles),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      <div style={{ background: 'var(--color-blue-bg)', padding: '14px 18px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <i className="ti ti-info-circle" style={{ fontSize: 16, color: 'var(--color-blue-dark)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-blue-dark)' }}>Configurações gerais</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-blue-dark)', lineHeight: 1.5 }}>
          Alterações aqui valem para todo o CRM — contratos gerados, listas de bancos, responsáveis, etc.
        </p>
      </div>

      {/* ── Empresa ─────────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-building" label="Dados da empresa" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Nome fantasia">
          <input value={form.companyName || ''} onChange={e => set('companyName', e.target.value)} />
        </Field>
        <Field label="Razão social" hint="Como está registrado no CNPJ">
          <input value={form.companyLegalName || ''} onChange={e => set('companyLegalName', e.target.value)} />
        </Field>
        <Field label="CNPJ">
          <input value={form.companyCnpj || ''} onChange={e => set('companyCnpj', e.target.value)} />
        </Field>
        <Field label="Chave PIX">
          <input value={form.pixKey || ''} onChange={e => set('pixKey', e.target.value)} />
        </Field>
        <Field label="Endereço completo" full>
          <input value={form.companyAddress || ''} onChange={e => set('companyAddress', e.target.value)} />
        </Field>
        <Field label="Foro (cidade/UF)" hint="Para o contrato de assessoria">
          <input value={form.forumCity || ''} onChange={e => set('forumCity', e.target.value)} />
        </Field>
      </div>

      {/* ── Responsáveis ─────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-users" label="Responsáveis (atendentes)" />
      <TagEditor
        items={form.responsibles}
        onChange={v => set('responsibles', v)}
        placeholder="Nome do responsável…"
      />

      {/* ── Bancos ───────────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-building-bank" label="Bancos disponíveis" />
      <TagEditor
        items={form.banks}
        onChange={v => set('banks', v)}
        placeholder="Nome do banco…"
      />

      {/* ── Acesso compartilhado ─────────────────────────────────────────── */}
      <SectionTitle icon="ti-network" label="Acesso compartilhado (Radmin / Hamachi)" />
      <div style={{ padding: '14px 18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Sócio acessando pelo Radmin: no navegador dele, abra o Console (F12) e cole:
        </p>
        <code style={{ display: 'block', padding: '8px 10px', background: '#1A1917', color: '#E4E2DA', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
          localStorage.setItem("LEME_API_BASE", "http://26.250.202.235:4000"); location.reload();
        </code>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
        <button onClick={() => setForm({ ...settings, banks: JSON.parse(settings.banks || '[]'), responsibles: JSON.parse(settings.responsibles || '[]') })} disabled={!dirty} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, opacity: dirty ? 1 : 0.4, cursor: dirty ? 'pointer' : 'default' }}>
          Desfazer
        </button>
        <button onClick={handleSave} disabled={!dirty} style={{ padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-blue-mid)', color: '#fff', fontSize: 13, fontWeight: 500, opacity: dirty ? 1 : 0.4, cursor: dirty ? 'pointer' : 'default' }}>
          Salvar configurações
        </button>
      </div>
    </div>
  )
}
