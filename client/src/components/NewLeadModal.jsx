import { useState, useRef, useEffect } from 'react'
import { LEAD_SOURCES, fmtPhone, DEFAULT_BANKS } from '../constants'

const accent   = 'var(--color-blue-mid)'
const accentBg = 'var(--color-blue-bg)'

function pill(extra = {}) {
  return {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 99,
    border: '1.5px solid var(--color-border)',
    background: '#fff', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit', boxSizing: 'border-box',
    ...extra,
  }
}

function Label({ children }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-hint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {children}
    </span>
  )
}

function Dropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={pill({
          width: '100%', justifyContent: 'space-between',
          border: open ? `1.5px solid ${accent}` : '1.5px solid var(--color-border)',
          background: open ? accentBg : '#fff',
        })}
      >
        <span style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-hint)' }}>
          {value || placeholder}
        </span>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 13, color: 'var(--color-text-hint)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
          background: '#fff', borderRadius: 12, border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: value === opt ? 600 : 400,
                background: value === opt ? accentBg : 'transparent',
                color: value === opt ? accent : 'var(--color-text-primary)',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NewLeadModal({ open, onClose, onSubmit, onSubmitAndOpen, settings }) {
  const responsibles = settings?.responsibles ? JSON.parse(settings.responsibles) : ['Riquelme', 'Daniel']
  const leadSources  = settings?.leadSources  ? JSON.parse(settings.leadSources)  : LEAD_SOURCES

  const [name,        setName]        = useState('')
  const [phone,       setPhone]       = useState('')
  const [source,      setSource]      = useState('')
  const [responsible, setResponsible] = useState(responsibles[0] || 'Riquelme')
  const [notes,       setNotes]       = useState('')
  const [showNotes,   setShowNotes]   = useState(false)
  const [adCampaign,  setAdCampaign]  = useState('')
  const [adSet,       setAdSet]       = useState('')
  const [adName,      setAdName]      = useState('')
  const [showAds,     setShowAds]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (!open) return
    setName(''); setPhone(''); setSource('')
    setResponsible(responsibles[0] || 'Riquelme')
    setNotes(''); setShowNotes(false)
    setAdCampaign(''); setAdSet(''); setAdName(''); setShowAds(false)
    setError('')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const buildData = () => ({ name: name.trim() || 'Sem nome', phone, source, responsible, notes, adCampaign, adSet, adName, status: 'Novo Lead' })

  const handleSubmit = () => {
    if (!phone.trim()) { setError('O telefone/WhatsApp é obrigatório.'); return }
    if (!source.trim()) { setError('A origem é obrigatória.'); return }
    setError('')
    onSubmit(buildData())
  }

  const handleSubmitAndOpen = () => {
    if (!phone.trim()) { setError('O telefone/WhatsApp é obrigatório.'); return }
    if (!source.trim()) { setError('A origem é obrigatória.'); return }
    setError('')
    onSubmitAndOpen(buildData())
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative', overflow: 'visible' }}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-hint)', fontSize: 18, lineHeight: 1, padding: 4, zIndex: 1 }}
        >
          <i className="ti ti-x" />
        </button>

        <div style={{ padding: '28px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 24 }}>

          {/* Header pílula */}
          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, background: accentBg, borderRadius: 99, padding: '6px 14px 6px 6px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <i className="ti ti-user-plus" style={{ fontSize: 14, color: accent }} />
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: accent }}>Novo Lead</p>
          </div>

          {/* Campos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Responsável */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label>Responsável</Label>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--color-border)', borderRadius: 99, padding: 3, userSelect: 'none' }}>
                {responsibles.map(r => {
                  const active = responsible === r
                  return (
                    <span
                      key={r}
                      onClick={() => setResponsible(r)}
                      style={{
                        flex: 1, textAlign: 'center',
                        padding: '5px 14px', borderRadius: 99, fontSize: 12,
                        fontWeight: active ? 600 : 400, cursor: 'pointer',
                        background: active ? '#fff' : 'transparent',
                        color: active ? 'var(--color-text-primary)' : 'var(--color-text-hint)',
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                        transition: 'all 0.18s',
                      }}
                    >
                      {r.split(' ')[0]}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Nome — 100% */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label>Nome</Label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Lisiane Godoi"
                style={{ fontSize: 13, padding: '7px 12px', borderRadius: 99, border: '1.5px solid var(--color-border)', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* Telefone + Origem — 50/50 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1 }}><Label>Telefone / WhatsApp *</Label></span>
                <span style={{ flex: 1 }}><Label>Origem *</Label></span>
              </div>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <div style={{ flex: '0 0 50%', minWidth: 0 }}>
                  <input
                    value={phone}
                    onChange={e => setPhone(fmtPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    type="tel"
                    style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '7px 12px', borderRadius: 99, border: '1.5px solid var(--color-border)', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ flex: '0 0 50%', minWidth: 0 }}>
                  <Dropdown value={source} onChange={setSource} options={leadSources} placeholder="Origem…" />
                </div>
              </div>
            </div>

            {/* Meta Ads — colapsável */}
            <div>
              <button
                onClick={() => setShowAds(o => !o)}
                style={pill({ width: '100%', justifyContent: 'space-between', background: showAds ? accentBg : 'transparent', border: `1.5px dashed ${showAds ? accent : 'var(--color-border)'}`, color: showAds ? accent : 'var(--color-text-hint)' })}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-ad-2" style={{ fontSize: 13 }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Meta Ads</span>
                </span>
                <i className={`ti ti-chevron-${showAds ? 'up' : 'down'}`} style={{ fontSize: 13, flexShrink: 0 }} />
              </button>
              {showAds && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ flex: 1 }}><Label>Campanha</Label></span>
                    <span style={{ flex: 1 }}><Label>Conjunto</Label></span>
                    <span style={{ flex: 1 }}><Label>Anúncio</Label></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={adCampaign}
                      onChange={e => setAdCampaign(e.target.value)}
                      placeholder="Campanha"
                      style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '7px 10px', borderRadius: 99, border: '1.5px solid var(--color-border)', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <input
                      value={adSet}
                      onChange={e => setAdSet(e.target.value)}
                      placeholder="Conjunto"
                      style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '7px 10px', borderRadius: 99, border: '1.5px solid var(--color-border)', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <input
                      value={adName}
                      onChange={e => setAdName(e.target.value)}
                      placeholder="Anúncio"
                      style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '7px 10px', borderRadius: 99, border: '1.5px solid var(--color-border)', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Observações — secundário */}
            {!showNotes ? (
              <button
                onClick={() => setShowNotes(true)}
                style={pill({ border: '1.5px dashed var(--color-border)', color: 'var(--color-text-hint)', fontSize: 12, background: 'transparent', width: '100%', justifyContent: 'center' })}
              >
                <i className="ti ti-plus" style={{ fontSize: 12 }} />Adicionar observação
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label>Observações</Label>
                <textarea
                  autoFocus
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Anotações, próximos passos…"
                  rows={3}
                  style={{ fontSize: 13, padding: '10px 14px', borderRadius: 14, border: '1.5px solid var(--color-border)', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
            )}

          </div>

          {/* Erro */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 8, background: 'var(--color-red-bg)', border: '1px solid var(--color-red-dark)' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 13, color: 'var(--color-red-dark)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--color-red-dark)' }}>{error}</span>
            </div>
          )}

          {/* Footer pílula */}
          <div style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 99, padding: '4px 4px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', whiteSpace: 'nowrap' }}>
            <button
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 99, border: 'none', background: 'transparent', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <i className="ti ti-x" style={{ fontSize: 12 }} />Cancelar
            </button>
            <div style={{ width: 1, height: 18, background: 'var(--color-border)', flexShrink: 0 }} />
            <button
              onClick={handleSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 99, border: 'none', background: 'transparent', fontSize: 12, color: accent, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <i className="ti ti-check" style={{ fontSize: 12 }} />Adicionar
            </button>
            <button
              onClick={handleSubmitAndOpen}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 99, border: 'none', background: accent, fontSize: 12, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(21,101,192,0.3)' }}
            >
              <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />Adicionar e ir
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
