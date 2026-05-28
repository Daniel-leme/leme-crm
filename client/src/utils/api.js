/**
 * Cliente HTTP que conversa com o servidor Node/SQLite.
 *
 * Em desenvolvimento, o Vite faz proxy /api → http://localhost:4000.
 * Se quiser apontar para outro host (ex.: sócio acessando via Hamachi),
 * defina `window.localStorage.setItem('LEME_API_BASE', 'http://25.x.x.x:4000')`
 * e recarregue a página.
 */
const apiBase = () => {
  try {
    const stored = localStorage.getItem('LEME_API_BASE')
    if (stored) return stored.replace(/\/$/, '')
  } catch {}
  return '' // mesma origem (proxy do Vite ou produção)
}

const url = (path) => `${apiBase()}${path}`

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} — ${text}`)
  }
  return res.json()
}

// Leads
export const apiListLeads   = ()        => fetch(url('/api/leads')).then(handle)
export const apiGetLead     = (id)      => fetch(url(`/api/leads/${id}`)).then(handle)
export const apiCreateLead  = (lead)    => fetch(url('/api/leads'), {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(lead),
}).then(handle)
export const apiUpdateLead  = (id, lead) => fetch(url(`/api/leads/${id}`), {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(lead),
}).then(handle)
export const apiDeleteLead  = (id) => fetch(url(`/api/leads/${id}`), { method: 'DELETE' }).then(handle)

// Settings
export const apiGetSettings    = ()       => fetch(url('/api/settings')).then(handle)
export const apiUpdateSettings = (obj)    => fetch(url('/api/settings'), {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
}).then(handle)

// Health
export const apiHealth = () => fetch(url('/api/health')).then(handle)

// Patch parcial de lead (ex: só o status)
export const apiPatchLead = (id, patch) => fetch(url(`/api/leads/${id}`), {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(patch),
}).then(handle)

// Contracts (contratos bancários do cliente)
export const apiListContracts   = (leadId)          => fetch(url(`/api/leads/${leadId}/contracts`)).then(handle)
export const apiCreateContract  = (leadId, data)    => fetch(url(`/api/leads/${leadId}/contracts`), {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(handle)
export const apiUpdateContract  = (leadId, id, data) => fetch(url(`/api/leads/${leadId}/contracts/${id}`), {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(handle)
export const apiDeleteContract  = (leadId, id)      => fetch(url(`/api/leads/${leadId}/contracts/${id}`), { method: 'DELETE' }).then(handle)

// Operations
export const apiListOperations       = ()         => fetch(url('/api/operations')).then(handle)
export const apiGetOperation         = (id)       => fetch(url(`/api/operations/${id}`)).then(handle)
export const apiGetOperationByLead   = (leadId)   => fetch(url(`/api/operations/by-lead/${leadId}`)).then(handle)
export const apiUpdateOperation      = (id, data) => fetch(url(`/api/operations/${id}`), {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(handle)

// Tasks
export const apiListTasks          = ()             => fetch(url('/api/tasks')).then(handle)
export const apiListContractTasks  = (contractId)   => fetch(url(`/api/contracts/${contractId}/tasks`)).then(handle)
export const apiListLeadTasks  = (leadId)    => fetch(url(`/api/leads/${leadId}/tasks`)).then(handle)
export const apiCreateTask     = (data)      => fetch(url('/api/tasks'), {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(handle)
export const apiUpdateTask     = (id, data)  => fetch(url(`/api/tasks/${id}`), {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(handle)
export const apiDeleteTask     = (id)        => fetch(url(`/api/tasks/${id}`), { method: 'DELETE' }).then(handle)
