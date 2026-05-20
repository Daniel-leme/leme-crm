export const BANKS = [
  'Bradesco', 'Itaú', 'Santander', 'Caixa Econômica', 'Banco do Brasil',
  'Nubank', 'Sicredi', 'Sicoob', 'BMG', 'BV', 'Pan', 'Safra', 'Inter',
  'C6 Bank', 'C6 Consignado', 'Outro',
]

export const CONTRACT_TYPES = [
  'Financiamento de Veículo',
  'Financiamento Imobiliário',
  'Empréstimo Pessoal',
  'Crédito Consignado',
  'Crédito com Garantia',
  'Outro',
]

export const LEAD_SOURCES = [
  'Meta (Facebook/Instagram)',
  'Google Ads',
  'Orgânico',
  'Indicação',
  'TikTok',
  'WhatsApp',
  'Outro',
]

export const STATUSES = [
  'Novo',
  'Em Análise',
  'Aguardando Documentos',
  'Contrato Enviado',
  'Em Negociação',
  'Concluído',
  'Cancelado',
]

export const STATUS_META = {
  'Novo':                  { bg: 'var(--color-blue-bg)',   color: 'var(--color-blue-dark)',   icon: 'ti-circle' },
  'Em Análise':            { bg: 'var(--color-amber-bg)',  color: 'var(--color-amber-dark)',  icon: 'ti-loader' },
  'Aguardando Documentos': { bg: 'var(--color-pink-bg)',   color: 'var(--color-pink-dark)',   icon: 'ti-paperclip' },
  'Contrato Enviado':      { bg: 'var(--color-purple-bg)', color: 'var(--color-purple-dark)', icon: 'ti-file-signature' },
  'Em Negociação':         { bg: 'var(--color-purple-bg)', color: 'var(--color-purple-dark)', icon: 'ti-messages' },
  'Concluído':             { bg: 'var(--color-green-bg)',  color: 'var(--color-green-dark)',  icon: 'ti-circle-check' },
  'Cancelado':             { bg: 'var(--color-red-bg)',    color: 'var(--color-red-dark)',    icon: 'ti-circle-x' },
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

export const fmtDate = (v) => {
  // espera yyyy-mm-dd ou dd/mm/yyyy. Normaliza para dd/mm/yyyy de exibição.
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
  bank: '',
  contractType: '',
  contractNumber: '',
  source: '',
  status: 'Novo',
  feePercent: 50,
  notes: '',
  contractFile: null,
  contractName: '',
  createdAt: new Date().toISOString(),
})
