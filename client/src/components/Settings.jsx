import { useState } from 'react'

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

export default function Settings({ settings, onSave }) {
  const [form, setForm] = useState(settings)
  const set = (k, v) => setForm({ ...form, [k]: v })
  const dirty = JSON.stringify(form) !== JSON.stringify(settings)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      <div style={{ background: 'var(--color-blue-bg)', padding: '14px 18px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <i className="ti ti-info-circle" style={{ fontSize: 16, color: 'var(--color-blue-dark)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-blue-dark)' }}>Sobre estas configurações</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-blue-dark)', lineHeight: 1.5 }}>
          Estes dados aparecem em todo contrato de assessoria gerado. Estão salvos no servidor compartilhado, então
          alterações feitas aqui valem para você e seu sócio.
        </p>
      </div>

      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Dados da empresa</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Nome fantasia">
          <input value={form.companyName || ''} onChange={e => set('companyName', e.target.value)} />
        </Field>
        <Field label="Razão social" hint="Como está registrado o CNPJ">
          <input value={form.companyLegalName || ''} onChange={e => set('companyLegalName', e.target.value)} />
        </Field>
        <Field label="CNPJ">
          <input value={form.companyCnpj || ''} onChange={e => set('companyCnpj', e.target.value)} />
        </Field>
        <Field label="Chave PIX">
          <input value={form.pixKey || ''} onChange={e => set('pixKey', e.target.value)} />
        </Field>
        <Field label="Endereço completo da empresa" full hint="Rua, número, complemento, cidade — UF">
          <input value={form.companyAddress || ''} onChange={e => set('companyAddress', e.target.value)} />
        </Field>
        <Field label="Foro (cidade/UF)" hint="Cidade onde possíveis disputas serão julgadas">
          <input value={form.forumCity || ''} onChange={e => set('forumCity', e.target.value)} />
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
        <button
          onClick={() => setForm(settings)}
          disabled={!dirty}
          style={{
            padding: '9px 18px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            fontSize: 13, opacity: dirty ? 1 : 0.4,
          }}
        >
          Desfazer
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!dirty}
          style={{
            padding: '9px 22px', borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--color-blue-mid)', color: '#fff',
            fontSize: 13, fontWeight: 500,
            opacity: dirty ? 1 : 0.4,
          }}
        >
          Salvar configurações
        </button>
      </div>

      <div style={{ marginTop: 14, padding: '14px 18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Acesso compartilhado</h4>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Para seu sócio acessar pelo Hamachi: <br />
          1. Compartilhe o IP da sua máquina na rede Hamachi (ex: <code>25.x.x.x</code>). <br />
          2. No navegador dele, abra o console (F12) e rode:
        </p>
        <code style={{
          display: 'block', padding: '8px 10px', background: '#1A1917', color: '#E4E2DA',
          borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', wordBreak: 'break-all',
        }}>
          localStorage.setItem("LEME_API_BASE", "http://25.x.x.x:4000"); location.reload();
        </code>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--color-text-hint)' }}>
          Substitua <code>25.x.x.x</code> pelo seu IP do Hamachi.
        </p>
      </div>
    </div>
  )
}
