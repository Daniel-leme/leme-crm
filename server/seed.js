require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const run = (sql, params = []) => pool.query(sql, params)
const get = async (sql, params = []) => (await pool.query(sql, params)).rows[0] || null

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const now = new Date().toISOString()
const daysAgo = d => new Date(Date.now() - d * 86400000).toISOString()
const future  = d => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10)
const past    = d => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)

// ─── Dados de seed ────────────────────────────────────────────────────────────

const leads = [
  // 1. Novo Lead — recém chegou
  {
    id: genId(), name: 'Carlos Eduardo Mendes', cpf: '012.345.678-90',
    phone: '(11) 99201-4455', email: 'carlos.mendes@email.com',
    source: 'Instagram', adCampaign: 'campanha-junho', adSet: 'conjunto-1', adName: 'anuncio-beneficio',
    responsible: 'Daniel', status: 'Novo Lead',
    feePercent: 50, embeddedValue: 0, productsCount: 0,
    notes: 'Demonstrou interesse em refinanciamento. Quer saber mais sobre as parcelas.',
    createdAt: daysAgo(1),
  },

  // 2. Novo Lead — chegou hoje
  {
    id: genId(), name: 'Fernanda Lima Costa', cpf: '098.765.432-10',
    phone: '(11) 98765-3322', email: 'fernanda.lima@gmail.com',
    source: 'Facebook', adCampaign: 'campanha-junho', adSet: 'conjunto-2', adName: 'anuncio-consignado',
    responsible: 'Riquelme', status: 'Novo Lead',
    feePercent: 50, embeddedValue: 0, productsCount: 0,
    notes: 'Interessada em empréstimo consignado. Pedir contracheque.',
    createdAt: daysAgo(0),
  },

  // 3. Qualificação
  {
    id: genId(), name: 'Roberto Alves Ferreira', cpf: '111.222.333-44',
    phone: '(11) 97654-8899', email: 'roberto.ferreira@hotmail.com',
    source: 'WhatsApp',
    responsible: 'Daniel', status: 'Qualificação',
    feePercent: 50, embeddedValue: 0, productsCount: 0,
    notes: 'Aposentado INSS. Margem disponível confirmada. Aguardando documentos.',
    createdAt: daysAgo(5),
  },

  // 4. Qualificado
  {
    id: genId(), name: 'Patrícia Souza Andrade', cpf: '222.333.444-55',
    phone: '(11) 96543-7788', email: 'patricia.andrade@gmail.com',
    source: 'Indicação',
    responsible: 'Riquelme', status: 'Qualificado',
    feePercent: 50, embeddedValue: 0, productsCount: 0,
    notes: 'Funcionalismo público estadual. Margem R$780. Documentação em mãos.',
    createdAt: daysAgo(8),
  },

  // 5. Revisão
  {
    id: genId(), name: 'Marcos Antônio Pereira', cpf: '333.444.555-66',
    phone: '(11) 95432-6677', email: 'marcos.pereira@email.com',
    source: 'Google',
    responsible: 'Daniel', status: 'Revisão',
    feePercent: 50, embeddedValue: 0, productsCount: 0,
    notes: 'Contrato enviado ao banco. Aguardando revisão da análise de crédito.',
    createdAt: daysAgo(12),
  },

  // 6. Contrato Assinado — vai gerar operação em Documentação
  {
    id: genId(), name: 'Juliana Castro Oliveira', cpf: '444.555.666-77',
    phone: '(11) 94321-5566', email: 'juliana.oliveira@gmail.com',
    source: 'Instagram', adCampaign: 'campanha-maio',
    responsible: 'Riquelme', status: 'Contrato Assinado',
    feePercent: 50, embeddedValue: 12500, productsCount: 1,
    notes: 'Contrato assinado digitalmente. Aguardando processamento bancário.',
    createdAt: daysAgo(18),
  },

  // 7. Contrato Assinado — operação em Cobrança
  {
    id: genId(), name: 'André Luís Rodrigues', cpf: '555.666.777-88',
    phone: '(11) 93210-4455', email: 'andre.rodrigues@hotmail.com',
    source: 'Facebook',
    responsible: 'Daniel', status: 'Contrato Assinado',
    feePercent: 50, embeddedValue: 8900, productsCount: 1,
    notes: 'Cliente antigo, segunda operação. Confiante no processo.',
    createdAt: daysAgo(30),
  },

  // 8. Contrato Assinado — operação Concluída
  {
    id: genId(), name: 'Sônia Maria Barbosa', cpf: '666.777.888-99',
    phone: '(11) 92109-3344', email: 'sonia.barbosa@gmail.com',
    source: 'Indicação',
    responsible: 'Riquelme', status: 'Contrato Assinado',
    feePercent: 50, embeddedValue: 22000, productsCount: 2,
    notes: 'Operação concluída. Repassado ao cliente. Indicou 2 conhecidos.',
    createdAt: daysAgo(45),
  },

  // 9. Lead Perdido — funil comercial
  {
    id: genId(), name: 'Thiago Nascimento Santos', cpf: '777.888.999-00',
    phone: '(11) 91098-2233', email: 'thiago.santos@email.com',
    source: 'Google',
    responsible: 'Daniel', status: 'Qualificação',
    feePercent: 50, embeddedValue: 0, productsCount: 0,
    isLost: 1, lossReason: 'Sem Contato', lastActiveStatus: 'Qualificação',
    notes: 'Não atendeu ligações. Arquivado após 5 tentativas.',
    createdAt: daysAgo(20),
  },

  // 10. Lead Perdido — qualificado mas desistiu
  {
    id: genId(), name: 'Beatriz Gomes Almeida', cpf: '888.999.000-11',
    phone: '(11) 90987-1122', email: 'beatriz.almeida@gmail.com',
    source: 'Instagram',
    responsible: 'Riquelme', status: 'Qualificado',
    feePercent: 50, embeddedValue: 0, productsCount: 0,
    isLost: 1, lossReason: 'Desistiu', lastActiveStatus: 'Qualificado',
    notes: 'Decidiu não prosseguir. Disse que vai esperar.',
    createdAt: daysAgo(25),
  },
]

// ─── Contratos ────────────────────────────────────────────────────────────────
// Apenas para leads com contratos

const contractsMap = {} // lead index → array de contratos

// Lead índice 4 (Revisão — Marcos): tem um contrato em "Revisar contrato"
contractsMap[4] = [
  {
    id: genId(), bank: 'Bradesco', type: 'Consignado',
    status: 'Revisar contrato',
    embeddedValue: 15000, productsCount: 1,
    notes: 'Pendente análise de margem. Banco solicitou documentação adicional.',
    createdAt: daysAgo(10),
  },
]

// Lead índice 5 (Contrato Assinado — Juliana): 1 contrato aprovado
contractsMap[5] = [
  {
    id: genId(), bank: 'Itaú', type: 'Refinanciamento',
    status: 'Aprovado',
    embeddedValue: 12500, productsCount: 1,
    notes: 'Aprovado. Aguardando liberação do crédito.',
    createdAt: daysAgo(16),
  },
]

// Lead índice 6 (André — operação Cobrança): 1 contrato aprovado
contractsMap[6] = [
  {
    id: genId(), bank: 'Caixa Econômica', type: 'FGTS',
    status: 'Aprovado',
    embeddedValue: 8900, productsCount: 1,
    notes: 'FGTS liberado. Em fase de repasse.',
    createdAt: daysAgo(28),
  },
]

// Lead índice 7 (Sônia — operação Concluída): 2 contratos aprovados
contractsMap[7] = [
  {
    id: genId(), bank: 'Santander', type: 'Consignado',
    status: 'Aprovado',
    embeddedValue: 14000, productsCount: 1,
    notes: 'Primeiro contrato — concluído.',
    createdAt: daysAgo(43),
  },
  {
    id: genId(), bank: 'BMG', type: 'Consignado',
    status: 'Aprovado',
    embeddedValue: 8000, productsCount: 1,
    notes: 'Segundo produto — portabilidade.',
    createdAt: daysAgo(40),
  },
]

// ─── Operações ────────────────────────────────────────────────────────────────
// Criadas para leads 5, 6, 7 (Contrato Assinado)
// Status: Documentação, Cobrança, Concluído

const operationsMap = {}

operationsMap[5] = {
  id: genId(), status: 'Documentação',
  isLost: 0, lossReason: '', lastActiveStatus: '',
  responsible: 'Riquelme',
  embeddedValue: 12500, feePercent: 50,
  createdAt: daysAgo(17),
}

operationsMap[6] = {
  id: genId(), status: 'Cobrança',
  isLost: 0, lossReason: '', lastActiveStatus: '',
  responsible: 'Daniel',
  embeddedValue: 8900, feePercent: 50,
  createdAt: daysAgo(29),
}

operationsMap[7] = {
  id: genId(), status: 'Concluído',
  isLost: 0, lossReason: '', lastActiveStatus: '',
  responsible: 'Riquelme',
  embeddedValue: 22000, feePercent: 50,
  createdAt: daysAgo(44),
}

// ─── Execução ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Limpando dados antigos...')
  await run(`DELETE FROM tasks`)
  await run(`DELETE FROM contracts`)
  await run(`DELETE FROM operations`)
  await run(`DELETE FROM leads`)

  console.log('Inserindo leads...')
  const insertedLeads = []
  for (const l of leads) {
    const id = l.id || genId()
    await run(`
      INSERT INTO leads (
        id, name, cpf, rg, "birthDate", email, phone, address, responsible,
        source, "adCampaign", "adSet", "adName", status,
        "feePercent", "embeddedValue", "productsCount", notes,
        "isLost", "lossReason", "lastActiveStatus",
        "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
    `, [
      id, l.name, l.cpf||'', l.rg||'', l.birthDate||'', l.email||'',
      l.phone||'', l.address||'', l.responsible||'',
      l.source||'', l.adCampaign||'', l.adSet||'', l.adName||'',
      l.status||'Novo Lead',
      l.feePercent??50, l.embeddedValue||0, l.productsCount||0,
      l.notes||'',
      l.isLost||0, l.lossReason||'', l.lastActiveStatus||'',
      l.createdAt||now, now,
    ])
    insertedLeads.push({ ...l, id })
  }
  console.log(`  ✓ ${insertedLeads.length} leads inseridos`)

  console.log('Inserindo contratos...')
  let totalContracts = 0
  for (const [idxStr, contracts] of Object.entries(contractsMap)) {
    const idx = parseInt(idxStr)
    const lead = insertedLeads[idx]
    for (const c of contracts) {
      await run(`
        INSERT INTO contracts (id, lead_id, bank, type, status, "embeddedValue", "productsCount", notes, "pdfFile", "pdfName", "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `, [
        c.id, lead.id, c.bank||'', c.type||'', c.status||'Aguardando envio',
        parseFloat(c.embeddedValue)||0, parseInt(c.productsCount)||0,
        c.notes||'', '', '', c.createdAt||now, now,
      ])
      totalContracts++
    }
  }
  console.log(`  ✓ ${totalContracts} contratos inseridos`)

  console.log('Inserindo operações...')
  let totalOps = 0
  for (const [idxStr, op] of Object.entries(operationsMap)) {
    const idx = parseInt(idxStr)
    const lead = insertedLeads[idx]
    await run(`
      INSERT INTO operations (id, lead_id, status, "isLost", "lossReason", "lastActiveStatus", responsible, "embeddedValue", "feePercent", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      op.id, lead.id, op.status, op.isLost||0, op.lossReason||'', op.lastActiveStatus||'',
      op.responsible||'', op.embeddedValue||0, op.feePercent||50,
      op.createdAt||now, now,
    ])
    totalOps++
  }
  console.log(`  ✓ ${totalOps} operações inseridas`)

  console.log('Inserindo tarefas...')
  const tasks = []

  // Tarefas para leads no funil comercial
  tasks.push({
    lead_id: insertedLeads[0].id, // Carlos — Novo Lead
    contract_id: '', type: 'Ligação',
    description: 'Fazer primeiro contato e explicar as opções de crédito disponíveis.',
    assignedTo: 'Daniel', dueDate: future(0), dueTime: '10:00',
    status: 'pending', isAuto: 0,
  })

  tasks.push({
    lead_id: insertedLeads[1].id, // Fernanda — Novo Lead
    contract_id: '', type: 'WhatsApp / Follow-up',
    description: 'Enviar apresentação dos produtos e solicitar contracheque.',
    assignedTo: 'Riquelme', dueDate: future(1), dueTime: '09:00',
    status: 'pending', isAuto: 0,
  })

  tasks.push({
    lead_id: insertedLeads[2].id, // Roberto — Qualificação
    contract_id: '', type: 'Ligação',
    description: 'Confirmar margem disponível e solicitar documentos: RG, CPF, contracheque.',
    assignedTo: 'Daniel', dueDate: future(0), dueTime: '14:00',
    status: 'pending', isAuto: 0,
  })

  tasks.push({
    lead_id: insertedLeads[3].id, // Patrícia — Qualificado
    contract_id: '', type: 'Reunião',
    description: 'Apresentar simulação de proposta. Margem R$780 — Santander Consignado.',
    assignedTo: 'Riquelme', dueDate: future(2), dueTime: '11:00',
    status: 'pending', isAuto: 0,
  })

  tasks.push({
    lead_id: insertedLeads[4].id, // Marcos — Revisão
    contract_id: contractsMap[4][0].id,
    type: 'Ligação',
    description: 'Ligar para banco e cobrar andamento da análise de crédito.',
    assignedTo: 'Daniel', dueDate: future(1), dueTime: '10:30',
    status: 'pending', isAuto: 1,
  })

  // Tarefas para operações
  tasks.push({
    lead_id: insertedLeads[5].id, // Juliana — Documentação
    contract_id: contractsMap[5][0].id,
    type: 'Envio de documento',
    description: 'Solicitar ao cliente: extrato bancário dos últimos 3 meses e comprovante de renda.',
    assignedTo: 'Riquelme', dueDate: future(1), dueTime: '09:00',
    status: 'pending', isAuto: 0,
  })

  tasks.push({
    lead_id: insertedLeads[6].id, // André — Cobrança
    contract_id: contractsMap[6][0].id,
    type: 'WhatsApp / Follow-up',
    description: 'Cobrar banco sobre status do repasse FGTS. Prazo estourou ontem.',
    assignedTo: 'Daniel', dueDate: past(1), dueTime: '08:00',
    status: 'pending', isAuto: 0,
  })

  // Tarefa concluída — histórico da Sônia
  tasks.push({
    lead_id: insertedLeads[7].id, // Sônia — Concluído
    contract_id: contractsMap[7][0].id,
    type: 'Ligação',
    description: 'Confirmar recebimento do repasse com a cliente.',
    assignedTo: 'Riquelme', dueDate: past(5), dueTime: '11:00',
    status: 'done', isAuto: 0,
  })

  for (const t of tasks) {
    const id = genId()
    await run(`
      INSERT INTO tasks (id, lead_id, contract_id, type, description, "assignedTo", "dueDate", "dueTime", status, "isAuto", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [
      id, t.lead_id, t.contract_id||'', t.type, t.description,
      t.assignedTo||'', t.dueDate||'', t.dueTime||'',
      t.status, t.isAuto?1:0, now, now,
    ])
  }
  console.log(`  ✓ ${tasks.length} tarefas inseridas`)

  console.log('\n✅ Seed concluído com sucesso!\n')
  console.log('Resumo dos dados:')
  console.log('  Leads no funil comercial:')
  console.log('    • Novo Lead:        Carlos Eduardo, Fernanda Lima')
  console.log('    • Qualificação:     Roberto Alves')
  console.log('    • Qualificado:      Patrícia Souza')
  console.log('    • Revisão:          Marcos Antônio (contrato: Bradesco — R$15.000)')
  console.log('    • Contrato Assinado: Juliana, André, Sônia')
  console.log('    • Perdidos:         Thiago (Sem Contato), Beatriz (Desistiu)')
  console.log('  Operações:')
  console.log('    • Documentação:     Juliana Castro (Itaú — R$12.500)')
  console.log('    • Cobrança:         André Luís (Caixa FGTS — R$8.900) ⚠ tarefa atrasada')
  console.log('    • Concluído:        Sônia Maria (Santander+BMG — R$22.000)')
  console.log('  Tarefas: 6 pendentes (1 atrasada), 1 concluída')

  await pool.end()
}

seed().catch(err => { console.error('Erro no seed:', err); process.exit(1) })
