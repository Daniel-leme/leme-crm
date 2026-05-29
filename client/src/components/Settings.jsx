import { useState, useRef } from 'react'
import { DEFAULT_BANKS, LEAD_SOURCES, LOSS_REASONS, DEFAULT_TASK_TYPES } from '../constants'

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
  const dragIdx = useRef(null)
  const [overIdx, setOverIdx] = useState(null)

  const add = () => {
    const v = input.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setInput('')
  }

  const remove = (item) => onChange(items.filter(i => i !== item))

  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver = (e, i) => { e.preventDefault(); setOverIdx(i) }
  const onDrop = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) { setOverIdx(null); return }
    const next = [...items]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(i, 0, moved)
    onChange(next)
    dragIdx.current = null
    setOverIdx(null)
  }
  const onDragEnd = () => { dragIdx.current = null; setOverIdx(null) }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
        {items.map((item, i) => (
          <span
            key={item}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            onDragEnd={onDragEnd}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: overIdx === i ? 'var(--color-blue-mid)' : 'var(--color-blue-bg)',
              color: overIdx === i ? '#fff' : 'var(--color-blue-dark)',
              padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
              cursor: 'grab', userSelect: 'none',
              opacity: dragIdx.current === i ? 0.4 : 1,
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            <i className="ti ti-grip-vertical" style={{ fontSize: 11, opacity: 0.5 }} />
            {item}
            <button
              onClick={() => remove(item)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 13, padding: 0, lineHeight: 1, opacity: 0.6 }}
            >×</button>
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
    banks:        JSON.parse(settings.banks        || JSON.stringify(DEFAULT_BANKS)),
    responsibles: JSON.parse(settings.responsibles || '["Riquelme","Daniel"]'),
    lossReasons:  JSON.parse(settings.lossReasons  || JSON.stringify(LOSS_REASONS)),
    leadSources:  JSON.parse(settings.leadSources  || JSON.stringify(LEAD_SOURCES)),
    taskTypes:    JSON.parse(settings.taskTypes    || JSON.stringify(DEFAULT_TASK_TYPES)),
  })
  const set = (k, v) => setForm({ ...form, [k]: v })
  const dirty = JSON.stringify(form) !== JSON.stringify({
    ...settings,
    banks:        JSON.parse(settings.banks        || JSON.stringify(DEFAULT_BANKS)),
    responsibles: JSON.parse(settings.responsibles || '["Riquelme","Daniel"]'),
    lossReasons:  JSON.parse(settings.lossReasons  || JSON.stringify(LOSS_REASONS)),
    leadSources:  JSON.parse(settings.leadSources  || JSON.stringify(LEAD_SOURCES)),
    taskTypes:    JSON.parse(settings.taskTypes    || JSON.stringify(DEFAULT_TASK_TYPES)),
  })

  const handleSave = () => {
    onSave({
      ...form,
      banks:        JSON.stringify(form.banks),
      responsibles: JSON.stringify(form.responsibles),
      lossReasons:  JSON.stringify(form.lossReasons),
      leadSources:  JSON.stringify(form.leadSources),
      taskTypes:    JSON.stringify(form.taskTypes),
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

      {/* ── Bancos ───────────────────────────────────────────────────────── */}
      <SectionTitle icon="ti-building-bank" label="Bancos disponíveis" />
      <TagEditor
        items={form.banks}
        onChange={v => set('banks', v)}
        placeholder="Nome do banco…"
      />

      {/* ── Origens de lead ──────────────────────────────────────────────── */}
      <SectionTitle icon="ti-antenna" label="Origens de lead" />
      <TagEditor
        items={form.leadSources}
        onChange={v => set('leadSources', v)}
        placeholder="Nova origem…"
      />

      {/* ── Tipos de tarefa ──────────────────────────────────────────────── */}
      <SectionTitle icon="ti-checkbox" label="Tipos de tarefa" />
      <TagEditor
        items={form.taskTypes}
        onChange={v => set('taskTypes', v)}
        placeholder="Novo tipo de tarefa…"
      />

      {/* ── Motivos de perda ─────────────────────────────────────────────── */}
      <SectionTitle icon="ti-circle-x" label="Motivos de perda" />
      <TagEditor
        items={form.lossReasons}
        onChange={v => set('lossReasons', v)}
        placeholder="Novo motivo de perda…"
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

      {/* ── Regras do funil ──────────────────────────────────────────────── */}
      <SectionTitle icon="ti-filter" label="Regras do funil de contratos" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Bloqueios */}
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <i className="ti ti-lock" style={{ fontSize: 14, color: '#C2410C' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bloqueios de avanço</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { from: 'Qualificação', to: 'Qualificado e além', rule: 'Exige pelo menos 1 contrato bancário cadastrado' },
              { from: 'Revisão', to: 'Negociação e além', rule: 'Exige pelo menos 1 contrato com status "Contrato revisado" E soma do valor embutido > R$ 0' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: '#7C2D12' }}>
                <i className="ti ti-arrow-right" style={{ fontSize: 12, marginTop: 1, flexShrink: 0, color: '#EA580C' }} />
                <span><strong>{r.from} → {r.to}:</strong> {r.rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-avanços */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <i className="ti ti-bolt" style={{ fontSize: 14, color: '#15803D' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Auto-avanços automáticos</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { trigger: 'Contrato → "Revisar contrato"', condition: 'Lead em 2. Qualificado', result: '→ 3. Revisão' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8, fontSize: 12, color: '#166534' }}>
                <i className="ti ti-point-filled" style={{ fontSize: 8, color: '#22C55E' }} />
                <span><strong>{r.trigger}</strong> {r.condition && <span style={{ opacity: 0.7 }}>({r.condition})</span>}</span>
                <span style={{ background: '#22C55E', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{r.result}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-hint)' }}>
          <i className="ti ti-info-circle" style={{ marginRight: 4 }} />
          Estas regras são fixas e aplicadas automaticamente pelo sistema. Não podem ser alteradas aqui.
        </p>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
        <button onClick={() => setForm({ ...settings, banks: JSON.parse(settings.banks || '[]'), responsibles: JSON.parse(settings.responsibles || '[]'), lossReasons: JSON.parse(settings.lossReasons || JSON.stringify(LOSS_REASONS)), leadSources: JSON.parse(settings.leadSources || JSON.stringify(LEAD_SOURCES)) })} disabled={!dirty} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, opacity: dirty ? 1 : 0.4, cursor: dirty ? 'pointer' : 'default' }}>
          Desfazer
        </button>
        <button onClick={handleSave} disabled={!dirty} style={{ padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-blue-mid)', color: '#fff', fontSize: 13, fontWeight: 500, opacity: dirty ? 1 : 0.4, cursor: dirty ? 'pointer' : 'default' }}>
          Salvar configurações
        </button>
      </div>
    </div>
  )
}
