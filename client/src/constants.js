// Bancos — editável via painel de Configurações (settings.banks sobrescreve esta lista)
export const DEFAULT_BANKS = [
  'Bradesco', 'Itaú', 'Santander', 'Caixa Econômica', 'Banco do Brasil',
  'Nubank', 'Sicredi', 'Sicoob', 'BMG', 'BV', 'Pan Americano', 'Safra',
  'Inter', 'C6 Bank', 'C6 Consignado', 'Daycoval', 'Facta', 'Agibank',
  'Mercantil', 'Outro',
]

export const CONTRACT_TYPES = [
  'Financiamento',
  'Empréstimo',
]

export const LEAD_SOURCES = [
  'Anúncio',
  'Orgânico',
  'Indicação',
  'WhatsApp',
  'Outro',
]

// Funil fiel ao Excel
export const STATUSES = [
  '0. Qualificação',
  '1. Qualificado',
  '2.0. Envio do contrato',
  '2.1. Assistência 2ª via',
  '3.0. Negociação/contrato',
  '5. Solicitar estorno',
  '6. Aguardando estorno',
  '7. Concluído',
  'Cancelado',
]

export const STATUS_META = {
  '0. Qualificação':        { bg: '#F1EFE8', color: '#2C2C2A', icon: 'ti-circle-dashed' },
  '1. Qualificado':         { bg: 'var(--color-blue-bg)',   color: 'var(--color-blue-dark)',   icon: 'ti-circle-check' },
  '2.0. Envio do contrato': { bg: 'var(--color-purple-bg)', color: 'var(--color-purple-dark)', icon: 'ti-file-arrow-right' },
  '2.1. Assistência 2ª via':{ bg: 'var(--color-amber-bg)',  color: 'var(--color-amber-dark)',  icon: 'ti-headset' },
  '3.0. Negociação/contrato':{ bg: '#EEEDFE', color: '#3C3489', icon: 'ti-messages' },
  '5. Solicitar estorno':   { bg: '#FFF3CD', color: '#7A4F00', icon: 'ti-clock-dollar' },
  '6. Aguardando estorno':  { bg: 'var(--color-pink-bg)',   color: 'var(--color-pink-dark)',   icon: 'ti-hourglass' },
  '7. Concluído':           { bg: 'var(--color-green-bg)',  color: 'var(--color-green-dark)',  icon: 'ti-trophy' },
  'Cancelado':              { bg: 'var(--color-red-bg)',    color: 'var(--color-red-dark)',    icon: 'ti-circle-x' },
}

export const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmtPhone = (v) => {
  const d = (v || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const fmtCpf = (v) => {
  const d = (v || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

export const fmtCurrency = (v) => {
  const n = parseFloat(v) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const fmtDate = (v) => {
  if (!v) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-')
    return `${d}/${m}/${y}`
  }
  return v
}

export const emptyLead = () => ({
  id: genId(),
  name: '',
  cpf: '',
  rg: '',
  birthDate: '',
  email: '',
  phone: '',
  address: '',
  responsible: '',
  bank: '',
  contractType: '',
  contractNumber: '',
  source: '',
  status: '0. Qualificação',
  feePercent: 50,
  embeddedValue: '',   // Valor embutido (produto indevido)
  productsCount: '',   // Qtd de produtos indevidos detectados
  notes: '',
  nextContact: '',
  contractFile: null,
  contractName: '',
  createdAt: new Date().toISOString(),
})
