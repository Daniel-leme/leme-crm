import { useState, useEffect, useCallback, useRef } from 'react'
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
import { requestNotificationPermission, startNotificationService } from './utils/notifications'

const SIDEBAR_W   = 230
const CONTENT_MAX = 920

// Hook simples para detectar mobile (< 768px)
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function App() {
  const [leads,      setLeads]      = useState([])
  const [settings,   setSettings]   = useState(null)
  const [view,       setView]       = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [form,       setForm]       = useState(emptyLead())
  const [saving,     setSaving]     = useState(false)
  const [connState,  setConnState]  = useState('checking')
  const [notifPerm,  setNotifPerm]  = useState(null)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const leadsRef = useRef([])
  const isMobile = useIsMobile()

  // ─── Carga inicial ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [ls, st] = await Promise.all([apiListLeads(), apiGetSettings()])
      setLeads(ls)
      leadsRef.current = ls
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

  useEffect(() => {
    requestNotificationPermission().then(setNotifPerm)
    const openLead = (id) => { setSelectedId(id); setView('detail') }
    const stop = startNotificationService(() => leadsRef.current, openLead)
    return stop
  }, [])

  // Fechar menu ao mudar de view no mobile
  useEffect(() => { setMenuOpen(false) }, [view])

  const flashSaving = () => { setSaving(true); setTimeout(() => setSaving(false), 900) }

  // ── Actions ──────────────────────────────────────────────────────────────
  const openNew      = ()     => { setForm(emptyLead()); setView('form') }
  const openEdit     = (lead) => { setForm({ ...lead }); setView('form') }
  const openDetail   = (lead) => { setSelectedId(lead.id); setView('detail') }
  const openSettings = ()     => { setView('settings') }
  const goList       = ()     => { setView('list'); setSelectedId(null); setForm(emptyLead()) }

  const submitForm = async () => {
    if (!form.name.trim()) { alert('O nome completo é obrigatório.'); return }
    const exists = leads.some(l => l.id === form.id)
    try {
      const saved = exists ? await apiUpdateLead(form.id, form) : await apiCreateLead(form)
      flashSaving()
      await refresh()
      if (exists) { setSelectedId(saved.id); setView('detail') } else goList()
    } catch (e) { alert(`Erro ao salvar: ${e.message}`) }
  }

  const deleteLead = async () => {
    if (!window.confirm('Excluir este lead permanentemente?')) return
    try { await apiDeleteLead(selectedId); flashSaving(); await refresh(); goList() }
    catch (e) { alert(`Erro ao excluir: ${e.message}`) }
  }

  const changeStatus = async (status) => {
    try { await apiUpdateLead(selectedId, { ...selected, status }); flashSaving(); await refresh() }
    catch (e) { alert(`Erro: ${e.message}`) }
  }

  const saveSettings = async (newSettings) => {
    try { await apiUpdateSettings(newSettings); setSettings(newSettings); flashSaving() }
    catch (e) { alert(`Erro ao salvar configurações: ${e.message}`) }
  }

  const selected  = leads.find(l => l.id === selectedId) || null
  const pageTitle = { list: 'Leads', form: leads.some(l => l.id === form.id) ? 'Editar Lead' : 'Novo Lead', detail: selected?.name || 'Lead', settings: 'Configurações' }[view]
  const showBack  = view === 'form' || view === 'detail' || view === 'settings'

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems = [
    { icon: 'ti-layout-dashboard', label: 'Leads',         action: goList,       active: view === 'list' || view === 'detail' },
    { icon: 'ti-plus',             label: 'Novo Lead',     action: openNew,      active: view === 'form' },
    { icon: 'ti-settings',         label: 'Configurações', action: openSettings, active: view === 'settings' },
  ]

  // ── Sidebar conteúdo (reutilizado desktop e drawer mobile) ────────────────
  const SidebarContent = () => (
    <>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <LemeLogo size={32} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>Leme Financeira</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-hint)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CRM</span>
          </div>
          {isMobile && (
            <button onClick={() => setMenuOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 22, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 4 }}>
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <nav style={{ padding: '0 10px', flex: 1 }}>
        {navItems.map(item => (
          <button key={item.label} onClick={item.action} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            width: '100%', padding: '10px 10px',
            borderRadius: 'var(--radius-md)', border: 'none', textAlign: 'left',
            fontSize: 14, fontWeight: item.active ? 500 : 400,
            background: item.active ? 'var(--color-blue-bg)' : 'transparent',
            color: item.active ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)',
            marginBottom: 4, cursor: 'pointer',
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: '14px 20px 0', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: connState === 'online' ? '#28a745' : connState === 'offline' ? '#dc3545' : '#aaa', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {connState === 'online' ? 'Servidor conectado' : connState === 'offline' ? 'Servidor offline' : 'Verificando...'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-hint)' }}>
          {leads.length} lead{leads.length !== 1 ? 's' : ''} cadastrado{leads.length !== 1 ? 's' : ''}
        </p>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar desktop ─────────────────────────────────────────────────── */}
      {!isMobile && (
        <aside style={{ width: SIDEBAR_W, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '0 0 16px' }}>
          <SidebarContent />
        </aside>
      )}

      {/* ── Drawer mobile (overlay) ─────────────────────────────────────────── */}
      {isMobile && menuOpen && (
        <>
          {/* Fundo escuro */}
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
          {/* Drawer */}
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', padding: '0 0 16px', boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          height: 56, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 28px',
          background: '#fff', borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {/* Hamburguer no mobile */}
            {isMobile && !showBack && (
              <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px 6px', flexShrink: 0 }}>
                <i className="ti ti-menu-2" aria-hidden="true" />
              </button>
            )}
            {showBack && (
              <button onClick={goList} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: 13, padding: '4px 6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', flexShrink: 0 }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true" />
                {!isMobile && 'Voltar'}
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: isMobile ? 15 : 16, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pageTitle}
            </h1>
            {saving && <span style={{ fontSize: 11, color: 'var(--color-text-hint)', flexShrink: 0 }}><i className="ti ti-check" style={{ fontSize: 12 }} /> Salvo</span>}
          </div>

          {view === 'list' && (
            <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isMobile ? '7px 12px' : '7px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-blue-mid)', color: '#fff', border: 'none', fontWeight: 500, fontSize: 13, flexShrink: 0, cursor: 'pointer' }}>
              <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" />
              {isMobile ? 'Novo' : 'Novo Lead'}
            </button>
          )}
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '28px' }}>
          <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto' }}>

            {notifPerm === 'denied' && (
              <div style={{ background: 'var(--color-amber-bg)', color: 'var(--color-amber-dark)', padding: '10px 16px', borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-bell-off" style={{ fontSize: 15 }} />
                Notificações bloqueadas. Permita nas configurações do navegador.
              </div>
            )}

            {connState === 'offline' && (
              <div style={{ background: 'var(--color-red-bg)', color: 'var(--color-red-dark)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 18, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-alert-triangle" />
                Servidor offline. Confira se o <code>iniciar.bat</code> está rodando.
              </div>
            )}

            {view === 'list' && <LeadList leads={leads} onSelect={openDetail} onNew={openNew} />}

            {view === 'form' && (
              <LeadForm form={form} onChange={setForm} onSubmit={submitForm} onCancel={goList} isEditing={leads.some(l => l.id === form.id)} settings={settings} />
            )}

            {view === 'detail' && selected && settings && (
              <LeadDetail lead={selected} settings={settings} onEdit={() => openEdit(selected)} onDelete={deleteLead} onStatusChange={changeStatus} />
            )}

            {view === 'settings' && settings && (
              <Settings settings={settings} onSave={saveSettings} />
            )}
          </div>
        </div>

        {/* ── Bottom nav mobile ──────────────────────────────────────────────── */}
        {isMobile && (
          <nav style={{ display: 'flex', borderTop: '1px solid var(--color-border)', background: '#fff', flexShrink: 0 }}>
            {navItems.map(item => (
              <button key={item.label} onClick={item.action} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                color: item.active ? 'var(--color-blue-mid)' : 'var(--color-text-hint)',
                fontSize: 10, fontWeight: item.active ? 600 : 400,
                borderTop: item.active ? '2px solid var(--color-blue-mid)' : '2px solid transparent',
              }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </main>
    </div>
  )
}
