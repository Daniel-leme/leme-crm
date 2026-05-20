import { useState, useEffect, useCallback } from 'react'
import { emptyLead } from './constants'
import {
  apiListLeads, apiCreateLead, apiUpdateLead, apiDeleteLead,
  apiGetSettings, apiUpdateSettings, apiHealth,
} from './utils/api'
import LeadList   from './components/LeadList'
import LeadForm   from './components/LeadForm'
import LeadDetail from './components/LeadDetail'
import Settings   from './components/Settings'
import LemeLogo   from './components/LemeLogo'

const SIDEBAR_W   = 230
const HEADER_H    = 56
const CONTENT_MAX = 920

export default function App() {
  const [leads,      setLeads]      = useState([])
  const [settings,   setSettings]   = useState(null)
  const [view,       setView]       = useState('list')   // list | form | detail | settings
  const [selectedId, setSelectedId] = useState(null)
  const [form,       setForm]       = useState(emptyLead())
  const [saving,     setSaving]     = useState(false)
  const [connState,  setConnState]  = useState('checking') // checking | online | offline

  // ─── Carga inicial ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [ls, st] = await Promise.all([apiListLeads(), apiGetSettings()])
      setLeads(ls)
      setSettings(st)
      setConnState('online')
    } catch (e) {
      console.error('Falha ao conectar com o servidor:', e)
      setConnState('offline')
    }
  }, [])

  useEffect(() => {
    apiHealth().then(() => setConnState('online')).catch(() => setConnState('offline'))
    refresh()
  }, [refresh])

  // ── Salvar indicador ─────────────────────────────────────────────────────
  const flashSaving = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 900)
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  const openNew     = ()     => { setForm(emptyLead()); setView('form') }
  const openEdit    = (lead) => { setForm({ ...lead }); setView('form') }
  const openDetail  = (lead) => { setSelectedId(lead.id); setView('detail') }
  const openSettings= ()     => { setView('settings') }
  const goList      = ()     => { setView('list'); setSelectedId(null); setForm(emptyLead()) }

  const submitForm = async () => {
    if (!form.name.trim()) {
      alert('O nome completo é obrigatório.')
      return
    }
    const exists = leads.some(l => l.id === form.id)
    try {
      const saved = exists
        ? await apiUpdateLead(form.id, form)
        : await apiCreateLead(form)
      flashSaving()
      await refresh()
      if (exists) { setSelectedId(saved.id); setView('detail') }
      else goList()
    } catch (e) {
      alert(`Erro ao salvar: ${e.message}`)
    }
  }

  const deleteLead = async () => {
    if (!window.confirm('Excluir este lead permanentemente?')) return
    try {
      await apiDeleteLead(selectedId)
      flashSaving()
      await refresh()
      goList()
    } catch (e) {
      alert(`Erro ao excluir: ${e.message}`)
    }
  }

  const changeStatus = async (status) => {
    try {
      await apiUpdateLead(selectedId, { ...selected, status })
      flashSaving()
      await refresh()
    } catch (e) {
      alert(`Erro: ${e.message}`)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      await apiUpdateSettings(newSettings)
      setSettings(newSettings)
      flashSaving()
    } catch (e) {
      alert(`Erro ao salvar configurações: ${e.message}`)
    }
  }

  const selected = leads.find(l => l.id === selectedId) || null

  const pageTitle = {
    list:     'Leads',
    form:     leads.some(l => l.id === form.id) ? 'Editar Lead' : 'Novo Lead',
    detail:   selected?.name || 'Lead',
    settings: 'Configurações',
  }[view]

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: '#FFFFFF',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        padding: '0 0 16px',
      }}>
        {/* Logo + nome */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <LemeLogo size={32} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                Leme Financeira
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-hint)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                CRM
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 10px', flex: 1 }}>
          {[
            { icon: 'ti-layout-dashboard', label: 'Leads',         action: goList,     active: view === 'list' || view === 'detail' },
            { icon: 'ti-plus',             label: 'Novo Lead',     action: openNew,    active: view === 'form' && !leads.some(l => l.id === form.id) },
            { icon: 'ti-settings',         label: 'Configurações', action: openSettings, active: view === 'settings' },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                width: '100%', padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: 'none', textAlign: 'left',
                fontSize: 13, fontWeight: item.active ? 500 : 400,
                background: item.active ? 'var(--color-blue-bg)' : 'transparent',
                color:      item.active ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)',
                marginBottom: 2,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!item.active) e.currentTarget.style.background = 'var(--color-bg)' }}
              onMouseLeave={e => { if (!item.active) e.currentTarget.style.background = 'transparent' }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 17 }} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0 20px', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: connState === 'online' ? '#28a745' : connState === 'offline' ? '#dc3545' : '#aaa',
            }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {connState === 'online' ? 'Servidor conectado' : connState === 'offline' ? 'Servidor offline' : 'Verificando...'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-hint)' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} cadastrado{leads.length !== 1 ? 's' : ''}
          </p>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: HEADER_H, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
          background: '#FFFFFF',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {(view === 'form' || view === 'detail' || view === 'settings') && (
              <button
                onClick={goList}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none',
                  color: 'var(--color-text-secondary)', fontSize: 13, padding: '4px 6px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true" />
                Voltar
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {pageTitle}
            </h1>
            {saving && (
              <span style={{ fontSize: 11, color: 'var(--color-text-hint)', marginLeft: 4 }}>
                <i className="ti ti-check" aria-hidden="true" style={{ fontSize: 12 }} /> Salvo
              </span>
            )}
          </div>

          {view === 'list' && (
            <button
              onClick={openNew}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--color-blue-mid)', color: '#fff',
                border: 'none', fontWeight: 500, fontSize: 13,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" />
              Novo Lead
            </button>
          )}
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto' }}>
            {connState === 'offline' && (
              <div style={{
                background: 'var(--color-red-bg)', color: 'var(--color-red-dark)',
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                marginBottom: 18, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <i className="ti ti-alert-triangle" />
                Não foi possível conectar ao servidor. Confira se o backend está rodando em <code>localhost:4000</code> ou ajuste <code>LEME_API_BASE</code>.
              </div>
            )}

            {view === 'list' && (
              <LeadList leads={leads} onSelect={openDetail} onNew={openNew} />
            )}

            {view === 'form' && (
              <LeadForm
                form={form}
                onChange={setForm}
                onSubmit={submitForm}
                onCancel={goList}
                isEditing={leads.some(l => l.id === form.id)}
              />
            )}

            {view === 'detail' && selected && settings && (
              <LeadDetail
                lead={selected}
                settings={settings}
                onEdit={() => openEdit(selected)}
                onDelete={deleteLead}
                onStatusChange={changeStatus}
              />
            )}

            {view === 'settings' && settings && (
              <Settings settings={settings} onSave={saveSettings} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
