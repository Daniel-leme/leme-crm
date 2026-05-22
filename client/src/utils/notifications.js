/**
 * Serviço de notificações do CRM Leme Financeira
 *
 * Verifica a cada 60 segundos se algum lead tem "Próximo contato"
 * nos próximos 15 minutos ou exatamente agora, e dispara notificações
 * nativas do navegador.
 *
 * Funciona com o navegador minimizado ou em outra aba.
 * NÃO funciona se o navegador for fechado completamente.
 */

// IDs de notificações já disparadas para não repetir
const fired = new Set()

function keyFor(leadId, type) {
  return `${leadId}__${type}`
}

/**
 * Pede permissão ao usuário para exibir notificações.
 * Chame uma vez ao iniciar o app.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied')  return 'denied'
  return await Notification.requestPermission()
}

/**
 * Verifica os leads e dispara notificações quando necessário.
 * @param {Array} leads - lista de leads do CRM
 * @param {Function} onOpenLead - callback recebendo o id do lead para abrir
 */
export function checkNotifications(leads, onOpenLead) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = Date.now()

  for (const lead of leads) {
    if (!lead.nextContact) continue

    const contactTime = new Date(lead.nextContact).getTime()
    if (isNaN(contactTime)) continue

    // Já passou mais de 2 minutos do horário → ignora
    if (now > contactTime + 2 * 60 * 1000) continue

    const diffMin = (contactTime - now) / 60000

    // ── Alerta de 15 minutos antes ──────────────────────────────────────
    if (diffMin >= 14 && diffMin <= 16) {
      const key = keyFor(lead.id, '15min')
      if (!fired.has(key)) {
        fired.add(key)
        const n = new Notification('⏰ Lembrete em 15 minutos', {
          body: `${lead.name}\n${lead.phone || ''}`,
          icon: '/favicon.ico',
          tag: key,
          requireInteraction: true,
        })
        n.onclick = () => { onOpenLead(lead.id); n.close() }
      }
    }

    // ── Alerta na hora exata ────────────────────────────────────────────
    if (diffMin >= -1 && diffMin <= 1) {
      const key = keyFor(lead.id, 'now')
      if (!fired.has(key)) {
        fired.add(key)
        const n = new Notification('📞 Hora do contato!', {
          body: `${lead.name}\n${lead.phone || ''}`,
          icon: '/favicon.ico',
          tag: key,
          requireInteraction: true,
        })
        n.onclick = () => { onOpenLead(lead.id); n.close() }
      }
    }
  }
}

/**
 * Inicia o serviço, verificando a cada 60 segundos.
 * Retorna uma função de cleanup para parar.
 */
export function startNotificationService(getLeads, onOpenLead) {
  const interval = setInterval(() => {
    checkNotifications(getLeads(), onOpenLead)
  }, 60 * 1000)

  // Primeira verificação imediata
  checkNotifications(getLeads(), onOpenLead)

  return () => clearInterval(interval)
}
