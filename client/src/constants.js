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

// ─── Contratos bancários do cliente ──────────────────────────────────────────

export const BANK_CONTRACT_TYPES = [
  'Financiamento de Veículo',
  'Empréstimo Pessoal',
  'Consignado',
  'Cartão de Crédito',
  'Outro',
]

export const BANK_CONTRACT_STATUSES = [
  'Aguardando envio',
  'Assistência segunda via',
  'Revisar contrato',
  'Contrato revisado',
]

export const BANK_CONTRACT_STATUS_META = {
  'Aguardando envio':       { color: '#B45309', bg: '#FEF3C7', icon: 'ti-clock' },
  'Assistência segunda via':{ color: '#1D4ED8', bg: '#DBEAFE', icon: 'ti-headset' },
  'Revisar contrato':       { color: '#7C3AED', bg: '#EDE9FE', icon: 'ti-file-search' },
  'Contrato revisado':      { color: '#15803D', bg: '#DCFCE7', icon: 'ti-circle-check' },
}

export const LEAD_SOURCES = [
  'Anúncio',
  'Orgânico',
  'Indicação',
  'WhatsApp',
  'Outro',
]

// ─── Funil Comercial ──────────────────────────────────────────────────────────

export const COMMERCIAL_STATUSES = [
  '0. Novo Lead',
  '1. Qualificação',
  '2. Qualificado',
  '3. Revisão',
  '4. Negociação',
  '5. Contrato Assinado',
]

// Perdido não é um status — é um sub-estado (isLost=1) dentro de qualquer status 0~4
// O lead permanece no seu status atual, mas fica inativo (isLost=true)
export const COMMERCIAL_LOSS_STATUSES = ['Perdido'] // mantido apenas para compatibilidade de badge

export const LOSS_REASONS = [
  'Desqualificado',
  'Sem Valores',
  'Sem Contato',
  'Desistiu',
]

export const COMMERCIAL_STATUS_META = {
  '0. Novo Lead':       { bg: '#F1EFE8',                      color: '#5C5C5A',                     icon: 'ti-user-plus' },
  '1. Qualificação':    { bg: '#FFF8E1',                      color: '#B45309',                     icon: 'ti-phone' },
  '2. Qualificado':     { bg: 'var(--color-blue-bg)',          color: 'var(--color-blue-dark)',       icon: 'ti-circle-check' },
  '3. Revisão':         { bg: 'var(--color-purple-bg)',        color: 'var(--color-purple-dark)',     icon: 'ti-file-search' },
  '4. Negociação':      { bg: '#FFF0E6',                      color: '#C05B00',                     icon: 'ti-messages' },
  '5. Contrato Assinado': { bg: '#D4EDDA',                    color: '#155724',                     icon: 'ti-file-check' },
  'Perdido':            { bg: 'var(--color-red-bg)',           color: 'var(--color-red-dark)',        icon: 'ti-circle-x' },
}

// ─── Funil Operacional ────────────────────────────────────────────────────────

export const OPERATIONAL_STATUSES = [
  '6. Documentação',
  '7. Solicitação de Estorno',
  '8. Aguardando Estorno',
  '9. Cobrança',
  '10. Transferência de Repasses',
  '11. Concluído',
]

// Perdido operacional = sub-estado (isLost) dentro de qualquer status 6~10
export const OPERATIONAL_LOSS_STATUSES = ['Perdido']

export const OPERATIONAL_STATUS_META = {
  '6. Documentação':              { bg: '#E3F2FD', color: '#1565C0', icon: 'ti-file-text' },
  '7. Solicitação de Estorno':    { bg: '#FFF8E1', color: '#F57F17', icon: 'ti-send' },
  '8. Aguardando Estorno':        { bg: '#FFF3E0', color: '#E65100', icon: 'ti-hourglass' },
  '9. Cobrança':                  { bg: '#F3E5F5', color: '#6A1B9A', icon: 'ti-cash' },
  '10. Transferência de Repasses':{ bg: '#C8E6C9', color: '#1B5E20', icon: 'ti-transfer' },
  '11. Concluído':                { bg: '#A5D6A7', color: '#1B5E20', icon: 'ti-trophy' },
  'Perdido':                      { bg: 'var(--color-red-bg)', color: 'var(--color-red-dark)', icon: 'ti-circle-x' },
}

// Compatibilidade: STATUS_META e STATUSES combinados para StatusBadge e outros usos legados
export const STATUSES = [...COMMERCIAL_STATUSES, ...COMMERCIAL_LOSS_STATUSES]

export const STATUS_META = {
  ...COMMERCIAL_STATUS_META,
  ...OPERATIONAL_STATUS_META,
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

export const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const fmtPhone = (v) => {
  const d = (v || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  // 8 dígitos: fixo → (DD) XXXX-XXXX; 9 dígitos: celular → (DD) 9XXXX-XXXX
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
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
  responsible: 'Riquelme',
  bank: '',
  contractType: '',
  contractNumber: '',
  source: '',
  adSource: '',
  adCampaign: '',
  adSet: '',
  adName: '',
  status: '0. Novo Lead',
  feePercent: 50,
  embeddedValue: '',
  productsCount: '',
  notes: '',
  nextContact: '',
  lossReason: '',
  lastActiveStatus: '',
  contractFile: null,
  contractName: '',
  createdAt: new Date().toISOString(),
})
