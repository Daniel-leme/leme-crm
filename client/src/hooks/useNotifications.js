import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'leme_notif_fired'
const CHECK_INTERVAL = 60_000 // 1 minuto

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function nowHHMM() {
  return new Date().toTimeString().slice(0, 5)
}

// Retorna minutos até dueDate+dueTime a partir de agora (negativo = já passou)
function minutesUntil(dueDate, dueTime) {
  // Usa string ISO local para evitar interpretação UTC de new Date('YYYY-MM-DD')
  const target = new Date(`${dueDate}T${dueTime}:00`)
  return Math.round((target - Date.now()) / 60_000)
}

function loadFired() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}
function saveFired(set) {
  // mantém só os disparos dos últimos 2 dias para não crescer indefinidamente
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 2)
  const cutStr = cutoff.toISOString().slice(0, 10)
  const filtered = [...set].filter(k => {
    const date = k.split('|')[2]
    return date && date >= cutStr
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

function playTone(freq, start, duration, ctx, gain) {
  const osc = ctx.createOscillator()
  osc.connect(gain)
  osc.frequency.value = freq
  osc.type = 'sine'
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration)
}

function playBeep(kind = 'now') {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    if (kind === 'now') {
      // bip bip bip — três bipes agudos rápidos
      gain.gain.setValueAtTime(0.28, ctx.currentTime)
      playTone(1046, 0.00, 0.10, ctx, gain)
      playTone(1046, 0.18, 0.10, ctx, gain)
      playTone(1318, 0.36, 0.16, ctx, gain)
    } else if (kind === 'soon') {
      // pip pip — dois bipes médios suaves
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      playTone(740, 0.00, 0.12, ctx, gain)
      playTone(740, 0.22, 0.12, ctx, gain)
    } else if (kind === 'allday') {
      // buuum — um bipe grave e longo
      gain.gain.setValueAtTime(0.22, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
      playTone(440, 0.00, 0.65, ctx, gain)
    } else if (kind === 'late_notime') {
      // bum... bum — dois bipes graves com pausa
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      playTone(330, 0.00, 0.18, ctx, gain)
      playTone(330, 0.38, 0.18, ctx, gain)
    }
  } catch {}
}

function requestPushPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function sendPush(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}

// Chaves de disparo por tarefa — usadas também para limpar ao editar
// at15|ID|YYYY-MM-DD  → aviso 15 min antes (só para tarefas com hora)
// at00|ID|YYYY-MM-DD  → aviso na hora (só para tarefas com hora)
// day|ID|YYYY-MM-DD   → aviso às 07:00 do dia (sem hora OU atrasada de dia anterior)
export function firedKeysForTask(taskId, dueDate) {
  return [
    `at15|${taskId}|${dueDate}`,
    `at00|${taskId}|${dueDate}`,
    `day|${taskId}|${dueDate}`,
  ]
}

function buildAlerts(tasks) {
  const today = todayStr()
  const now   = nowHHMM()
  const alerts = []

  console.log('[notif] buildAlerts — hoje:', today, 'agora:', now, 'tasks:', tasks.length)

  for (const t of tasks) {
    if (t.status === 'done') continue
    if (!t.dueDate || t.dueDate > today) {
      if (t.dueDate && t.dueTime) console.log('[notif] skip futuro:', t.id, t.dueDate, t.dueTime)
      continue
    }

    if (!t.dueTime) {
      if (t.dueDate === today && now >= '07:00') {
        alerts.push({ key: `day|${t.id}|${t.dueDate}`, task: t, kind: 'allday' })
      }
      if (t.dueDate < today && now >= '07:00') {
        alerts.push({ key: `day|${t.id}|${today}`, task: t, kind: 'late_notime' })
      }
    } else {
      const mins = minutesUntil(t.dueDate, t.dueTime)
      console.log('[notif] tarefa com hora:', t.id, t.dueDate, t.dueTime, '→ mins:', mins)

      if (mins >= 13 && mins <= 17) {
        alerts.push({ key: `at15|${t.id}|${t.dueDate}`, task: t, kind: 'soon' })
      }

      if (mins <= 1 && mins >= -59) {
        alerts.push({ key: `at00|${t.id}|${t.dueDate}`, task: t, kind: 'now' })
      }

      if (t.dueDate < today && now >= '07:00') {
        alerts.push({ key: `day|${t.id}|${today}`, task: t, kind: 'late_notime' })
      }
    }
  }
  console.log('[notif] alerts gerados:', alerts.map(a => a.key))
  return alerts
}

function alertMessage(alert) {
  const name  = alert.task.lead_name || 'Lead'
  const type  = alert.task.type      || 'Tarefa'
  const time  = alert.task.dueTime   || ''
  if (alert.kind === 'soon')       return { title: `⏰ Tarefa em 15 min`,    body: `${type} — ${name}${time ? ` às ${time}` : ''}` }
  if (alert.kind === 'now')        return { title: `🔔 Tarefa agora!`,        body: `${type} — ${name}${time ? ` às ${time}` : ''}` }
  if (alert.kind === 'allday')     return { title: `📋 Tarefa para hoje`,     body: `${type} — ${name}` }
  if (alert.kind === 'late_notime') return { title: `⚠️ Tarefa atrasada`,     body: `${type} — ${name}` }
  return { title: 'Tarefa', body: name }
}

export function useNotifications(tasks) {
  const [notifications, setNotifications] = useState([])   // histórico visível no sino
  const [toasts,        setToasts]        = useState([])   // toasts temporários na tela
  const firedRef = useRef(loadFired())
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  // Pede permissão push na montagem
  useEffect(() => { requestPushPermission() }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.toastId !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const check = useCallback(() => {
    const alerts = buildAlerts(tasksRef.current)
    const fired  = firedRef.current
    const newNotifs = []
    const newToasts = []

    console.log('[notif] fired set:', [...fired])

    for (const alert of alerts) {
      if (fired.has(alert.key)) { console.log('[notif] já disparado:', alert.key); continue }
      fired.add(alert.key)

      const msg = alertMessage(alert)
      const notif = {
        id:      alert.key,
        title:   msg.title,
        body:    msg.body,
        kind:    alert.kind,
        task:    alert.task,
        time:    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }
      newNotifs.push(notif)
      newToasts.push({ ...notif, toastId: alert.key + '_toast' })

      sendPush(msg.title, msg.body)
      playBeep(alert.kind)
    }

    if (newNotifs.length > 0) {
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 50))
      setToasts(prev => [...prev, ...newToasts])
      saveFired(fired)
    }
  }, [])

  // Verifica na montagem, quando tasks muda, e a cada minuto
  useEffect(() => {
    check()
  }, [tasks]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [check])

  // Remove toasts automaticamente após 8s
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 8_000)
    return () => clearTimeout(timer)
  }, [toasts])

  const unreadCount = notifications.length

  // Dispara notificação fake para teste — remover depois
  const triggerTest = useCallback((kind = 'now') => {
    const fakeTask = { id: 'test_' + Date.now(), lead_id: null, lead_name: 'Lead de Teste', type: 'WhatsApp / Follow-up', dueDate: todayStr(), dueTime: nowHHMM() }
    const alert = { key: 'test_' + Date.now(), task: fakeTask, kind }
    const msg = alertMessage(alert)
    const notif = { id: alert.key, title: msg.title, body: msg.body, kind, task: fakeTask, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    setNotifications(prev => [notif, ...prev].slice(0, 50))
    setToasts(prev => [...prev, { ...notif, toastId: alert.key + '_toast' }])
    sendPush(msg.title, msg.body)
    playBeep(kind)
  }, [])

  const resetFired = useCallback(() => {
    firedRef.current = new Set()
    localStorage.removeItem(STORAGE_KEY)
    check()
  }, [check])

  // Chama após editar/reagendar uma tarefa para limpar os disparos anteriores dela
  const clearFiredForTask = useCallback((taskId, dueDate) => {
    const keys = firedKeysForTask(taskId, dueDate)
    keys.forEach(k => firedRef.current.delete(k))
    saveFired(firedRef.current)
  }, [])

  return { notifications, unreadCount, toasts, dismissToast, clearNotifications, check, triggerTest, resetFired, clearFiredForTask }
}
