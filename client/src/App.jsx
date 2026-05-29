import { useState, useEffect, useCallback } from 'react'
import { emptyLead } from './constants'
import {
  apiListLeads, apiCreateLead, apiUpdateLead, apiDeleteLead,
  apiGetSettings, apiUpdateSettings, apiHealth,
  apiListOperations, apiUpdateOperation,
  apiListTasks, apiUpdateContract,
} from './utils/api'
import LeadList       from './components/LeadList'
import ConfirmModal, { AlertModal } from './components/ConfirmModal'
import LeadForm       from './components/LeadForm'
import LeadDetail, { LeadTasksPanel } from './components/LeadDetail'
import Settings       from './components/Settings'
import LemeLogo       from './components/LemeLogo'
import OperationList  from './components/OperationList'
import OperationDetail from './components/OperationDetail'
import TaskList       from './components/TaskList'
import NewLeadModal   from './components/NewLeadModal'
import { NotificationBell, NotificationToasts } from './components/NotificationCenter'
import { useNotifications } from './hooks/useNotifications'

const SIDEBAR_W   = 230
const CONTENT_MAX = 920

function TaskSidePanel({ lead, settings, onTaskCreated, onTaskEdited, onTaskDeleted, onContractUpdate }) {
  const [pendingCount, setPendingCount] = useState(0)
  return (
    <aside style={{
      width: 290, flexShrink: 0,
      borderLeft: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <i className="ti ti-checkbox" style={{ fontSize: 15, color: 'var(--color-blue-mid)' }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Tarefas</span>
        {pendingCount > 0 && (
          <span style={{ fontSize: 11, background: 'var(--color-blue-bg)', color: 'var(--color-blue-dark)', padding: '1px 7px', borderRadius: 99, fontWeight: 600, marginLeft: 'auto' }}>
            {pendingCount}
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <LeadTasksPanel
          lead={lead}
          settings={settings}
          onTaskCreated={onTaskCreated}
          onTaskEdited={onTaskEdited}
          onTaskDeleted={onTaskDeleted}
          onPendingCount={setPendingCount}
          onContractUpdate={onContractUpdate}
        />
      </div>
    </aside>
  )
}

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
  const [leads,        setLeads]        = useState([])
  const [operations,   setOperations]   = useState([])
  const [tasks,        setTasks]        = useState([])
  const [settings,     setSettings]     = useState(null)
  const [view,         setView]         = useState('list')
  const [selectedId,   setSelectedId]   = useState(null)
  const [selectedOpId, setSelectedOpId] = useState(null)
  const [form,         setForm]         = useState(emptyLead())
  const [saving,       setSaving]       = useState(false)
  const [connState,    setConnState]    = useState('checking')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [alertMsg, setAlertMsg] = useState(null) // { title, message }
  const [menuOpen,     setMenuOpen]     = useState(false)
  const isMobile = useIsMobile()

  // ─── Carga inicial ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [ls, ops, st, ts] = await Promise.all([apiListLeads(), apiListOperations(), apiGetSettings(), apiListTasks()])
      setLeads(ls)
      setOperations(ops)
      setSettings(st)
      setTasks(ts)
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

  // Reclassificação automática: força re-render a cada 60s sem nova chamada ao servidor
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Central de notificações
  const { notifications, unreadCount, toasts, dismissToast, clearNotifications, removeNotificationsForTask, clearFiredForTask } = useNotifications(tasks)

  useEffect(() => { setMenuOpen(false) }, [view])

  const flashSaving = () => { setSaving(true); setTimeout(() => setSaving(false), 900) }

  // ── Leads ──────────────────────────────────────────────────────────────────
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const openNew      = ()     => { setForm(emptyLead()); setNewLeadOpen(true) }
  const openEdit     = (lead) => { setForm({ ...lead }); setView('form') }
  const openDetail   = (lead) => { setSelectedId(lead.id); setView('detail') }
  const openSettings = ()     => { setView('settings') }
  const goList       = ()     => { setView('list'); setSelectedId(null); setSelectedOpId(null); setForm(emptyLead()) }
  const goOperations = ()     => { setView('operations'); setSelectedId(null); setSelectedOpId(null) }
  const goTasks      = ()     => { setView('tasks'); setSelectedId(null); setSelectedOpId(null) }

  const showAlert = (title, message) => setAlertMsg({ title, message })

  const submitForm = async () => {
    if (!form.phone.trim()) { showAlert('Campo obrigatório', 'O telefone/WhatsApp é obrigatório.'); return }
    if (!form.source.trim()) { showAlert('Campo obrigatório', 'A origem é obrigatória.'); return }
    const finalForm = { ...form, name: form.name.trim() || 'Sem nome', responsible: form.responsible || 'Riquelme' }
    const exists = leads.some(l => l.id === form.id)
    try {
      const saved = exists ? await apiUpdateLead(finalForm.id, finalForm) : await apiCreateLead(finalForm)
      flashSaving()
      await refresh()
      if (exists) { setSelectedId(saved.id); setView('detail') }
    } catch (e) { showAlert('Erro ao salvar', e.message) }
  }

  const submitNewLead = async (data) => {
    try {
      await apiCreateLead({ ...emptyLead(), ...data })
      flashSaving()
      await refresh()
      setNewLeadOpen(false)
    } catch (e) { showAlert('Erro ao salvar', e.message) }
  }

  const submitNewLeadAndOpen = async (data) => {
    try {
      const saved = await apiCreateLead({ ...emptyLead(), ...data })
      flashSaving()
      await refresh()
      setNewLeadOpen(false)
      setSelectedId(saved.id)
      setView('detail')
    } catch (e) { showAlert('Erro ao salvar', e.message) }
  }

  const deleteLead = async () => {
    try { await apiDeleteLead(selectedId); flashSaving(); await refresh(); goList() }
    catch (e) { showAlert('Erro ao excluir', e.message) }
  }

  const changeStatus = async (action, lossReason) => {
    let payload
    if (action === '__lost__') {
      payload = { isLost: true, lossReason: lossReason || '' }
    } else if (action === '__revive__') {
      payload = { isLost: false }
    } else {
      payload = { status: action, isLost: false }
    }
    try {
      await apiUpdateLead(selectedId, payload)
      flashSaving()
      await refresh()
    } catch (e) { showAlert('Erro', e.message) }
  }

  const saveSettings = async (newSettings) => {
    try { await apiUpdateSettings(newSettings); setSettings(newSettings); flashSaving() }
    catch (e) { showAlert('Erro ao salvar configurações', e.message) }
  }

  // ── Operations ─────────────────────────────────────────────────────────────
  const openOperation = (op) => { setSelectedOpId(op.id); setView('operation-detail') }

  const changeOperationStatus = async (action, lossReason) => {
    let payload
    if (action === '__lost__') {
      payload = { isLost: true, lossReason: lossReason || '' }
    } else if (action === '__revive__') {
      payload = { isLost: false }
    } else {
      payload = { status: action, isLost: false }
    }
    try {
      await apiUpdateOperation(selectedOpId, payload)
      flashSaving()
      await refresh()
    } catch (e) { showAlert('Erro', e.message) }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const selected   = leads.find(l => l.id === selectedId) || null
  const selectedOp = operations.find(o => o.id === selectedOpId) || null

  const isCommercialView = view === 'list' || view === 'detail' || view === 'form'
  const isOperationsView = view === 'operations' || view === 'operation-detail'
  const isTasksView      = view === 'tasks'

  const pageTitleMap = {
    list:             'Funil Comercial',
    form:             leads.some(l => l.id === form.id) ? 'Editar Lead' : 'Novo Lead',
    detail:           selected?.name || 'Lead',
    settings:         'Configurações',
    operations:       'Funil Operacional',
    'operation-detail': selectedOp?.lead_name || 'Operação',
    tasks:            'Tarefas',
  }
  const pageTitle = pageTitleMap[view] || ''
  const showBack  = view === 'form' || view === 'detail' || view === 'settings' || view === 'operation-detail'

  const openLeadById = (leadId) => {
    const lead = leads.find(l => l.id === leadId)
    if (lead) openDetail(lead)
  }

  const handleBack = () => {
    if (view === 'operation-detail') { setView('operations'); setSelectedOpId(null) }
    else if (view === 'form' && selectedId) { setForm(emptyLead()); setView('detail') }
    else goList()
  }

  // ── Nav items ─────────────────────────────────────────────────────────────
  const todayStr      = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const pendingTasks  = tasks.filter(t => t.status !== 'done')
  const activeLeadsForOrphan = leads.filter(l => !l.isLost && l.status !== 'Contrato Assinado')
  const leadsWithTask = new Set(pendingTasks.map(t => t.lead_id))

  const nowTime = new Date().toTimeString().slice(0, 5)
  const isLateTask = (t) =>
    t.dueDate && (t.dueDate < todayStr || (t.dueDate === todayStr && t.dueTime && t.dueTime <= nowTime))

  const taskBadges = {
    late:   pendingTasks.filter(isLateTask).length,
    orphan: activeLeadsForOrphan.filter(l => !leadsWithTask.has(l.id)).length,
    today:  pendingTasks.filter(t => t.dueDate === todayStr && !isLateTask(t)).length,
  }

  const navItems = [
    { icon: 'ti-briefcase',  label: 'Funil Comercial',    action: goList,       active: isCommercialView },
    { icon: 'ti-settings-2', label: 'Funil Operacional',  action: goOperations, active: isOperationsView },
    { icon: 'ti-checkbox',   label: 'Tarefas',            action: goTasks,      active: isTasksView, taskBadges },
    { icon: 'ti-settings',   label: 'Configurações',      action: openSettings, active: view === 'settings' },
  ]

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
            {item.label === 'Funil Operacional' && operations.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11, background: '#1565C0', color: '#fff', borderRadius: 99, padding: '1px 7px', fontWeight: 600 }}>
                {operations.filter(o => o.status !== '12. Concluído' && !o.isLost).length}
              </span>
            )}
            {item.taskBadges && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                {item.taskBadges.late   > 0 && <span style={{ fontSize: 10, background: '#DC2626', color: '#fff', borderRadius: 99, padding: '1px 6px', fontWeight: 700, lineHeight: 1.4 }}>{item.taskBadges.late}</span>}
                {item.taskBadges.orphan > 0 && <span style={{ fontSize: 10, background: '#D97706', color: '#fff', borderRadius: 99, padding: '1px 6px', fontWeight: 700, lineHeight: 1.4 }}>{item.taskBadges.orphan}</span>}
                {item.taskBadges.today  > 0 && <span style={{ fontSize: 10, background: '#1565C0', color: '#fff', borderRadius: 99, padding: '1px 6px', fontWeight: 700, lineHeight: 1.4 }}>{item.taskBadges.today}</span>}
              </div>
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: '10px 10px 0' }}>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          width: '100%', padding: '10px 0',
          borderRadius: 'var(--radius-md)', border: 'none',
          background: 'var(--color-blue-mid)', color: '#fff',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(21,101,192,0.25)',
        }}>
          <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" />
          Novo Lead
        </button>
      </div>

      <div style={{ padding: '12px 20px 0', borderTop: '1px solid var(--color-border)', marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: connState === 'online' ? '#28a745' : connState === 'offline' ? '#dc3545' : '#aaa', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {connState === 'online' ? 'Servidor conectado' : connState === 'offline' ? 'Servidor offline' : 'Verificando...'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-hint)' }}>
          {leads.length} lead{leads.length !== 1 ? 's' : ''} · {operations.length} operaç{operations.length !== 1 ? 'ões' : 'ão'}
        </p>
      </div>
    </>
  )

  // Nav items simplificados para bottom nav mobile (sem "Novo Lead" no nav — está no header)
  const mobileNavItems = [
    { icon: 'ti-briefcase',  label: 'Comercial',  action: goList,       active: isCommercialView },
    { icon: 'ti-settings-2', label: 'Operacional', action: goOperations, active: isOperationsView },
    { icon: 'ti-checkbox',   label: 'Tarefas',     action: goTasks,      active: isTasksView },
    { icon: 'ti-plus',       label: 'Novo Lead',   action: openNew,      active: view === 'form' },
    { icon: 'ti-settings',   label: 'Config',      action: openSettings, active: view === 'settings' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar desktop ─────────────────────────────────────────────────── */}
      {!isMobile && (
        <aside style={{ width: SIDEBAR_W, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '0 0 16px' }}>
          <SidebarContent />
        </aside>
      )}

      {/* ── Drawer mobile ───────────────────────────────────────────────────── */}
      {isMobile && menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
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
            {isMobile && !showBack && (
              <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px 6px', flexShrink: 0 }}>
                <i className="ti ti-menu-2" aria-hidden="true" />
              </button>
            )}
            {showBack && (
              <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: 13, padding: '4px 6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', flexShrink: 0 }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true" />
                {!isMobile && 'Voltar'}
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: isMobile ? 15 : 16, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pageTitle}
            </h1>
            {saving && <span style={{ fontSize: 11, color: 'var(--color-text-hint)', flexShrink: 0 }}><i className="ti ti-check" style={{ fontSize: 12 }} /> Salvo</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onClear={clearNotifications}
              onOpenLead={openLeadById}
            />
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Coluna principal */}
          <div style={{ flex: 1, overflowY: 'scroll', padding: isMobile ? '16px' : '28px', minWidth: 0 }}>
            <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto' }}>

              {connState === 'offline' && (
                <div style={{ background: 'var(--color-red-bg)', color: 'var(--color-red-dark)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 18, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-alert-triangle" />
                  Servidor offline. Confira se o <code>iniciar.bat</code> está rodando.
                </div>
              )}

              {view === 'list' && (
                <LeadList leads={leads} tasks={tasks} onSelect={openDetail} onNew={openNew} />
              )}

              {view === 'form' && (
                <LeadForm form={form} onChange={setForm} onSubmit={submitForm} onCancel={handleBack} isEditing={leads.some(l => l.id === form.id)} settings={settings} sidebarWidth={isMobile ? 0 : SIDEBAR_W} />
              )}

              {view === 'detail' && selected && settings && (
                <LeadDetail
                  lead={selected}
                  settings={settings}
                  onEdit={() => openEdit(selected)}
                  onDelete={() => setConfirmDelete(true)}
                  onStatusChange={changeStatus}
                  onOpenOperation={openOperation}
                  onRefresh={refresh}
                  onTaskEdited={clearFiredForTask}
                  onTaskDeleted={removeNotificationsForTask}
                />
              )}

              {view === 'settings' && settings && (
                <Settings settings={settings} onSave={saveSettings} />
              )}

              {view === 'operations' && (
                <OperationList operations={operations} onSelect={openOperation} />
              )}

              {view === 'tasks' && settings && (
                <TaskList leads={leads} onOpenLead={openDetail} settings={settings} onTaskChanged={refresh} onTaskEdited={clearFiredForTask} onTaskDeleted={removeNotificationsForTask} />
              )}

              {view === 'operation-detail' && selectedOp && settings && (
                <OperationDetail
                  operation={selectedOp}
                  settings={settings}
                  onStatusChange={changeOperationStatus}
                  onOpenLead={() => { setSelectedId(selectedOp.lead_id); setView('detail') }}
                />
              )}
            </div>
          </div>

          {/* Painel lateral de tarefas — só na view detail */}
          {view === 'detail' && selected && settings && !isMobile && (
            <TaskSidePanel
              lead={selected}
              settings={settings}
              onTaskCreated={refresh}
              onTaskEdited={clearFiredForTask}
              onTaskDeleted={removeNotificationsForTask}
              onContractUpdate={async (contractId, data) => {
                await apiUpdateContract(selected.id, contractId, data)
                refresh()
              }}
            />
          )}

        </div>

        {/* ── Bottom nav mobile ──────────────────────────────────────────────── */}
        {isMobile && (
          <nav style={{ display: 'flex', borderTop: '1px solid var(--color-border)', background: '#fff', flexShrink: 0 }}>
            {mobileNavItems.map(item => (
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

      {/* Toasts de notificação */}
      <NotificationToasts
        toasts={toasts}
        onDismiss={dismissToast}
        onOpenLead={openLeadById}
      />

      {/* Modal de novo lead */}
      <NewLeadModal
        open={newLeadOpen}
        onClose={() => setNewLeadOpen(false)}
        onSubmit={submitNewLead}
        onSubmitAndOpen={submitNewLeadAndOpen}
        settings={settings}
      />

      <AlertModal
        open={!!alertMsg}
        title={alertMsg?.title}
        message={alertMsg?.message}
        onClose={() => setAlertMsg(null)}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Excluir lead"
        message="Esta ação é permanente e não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => { setConfirmDelete(false); deleteLead() }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
