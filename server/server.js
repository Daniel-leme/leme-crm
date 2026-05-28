const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()

const PORT = process.env.PORT || 4000
const DB_PATH = path.join(__dirname, 'leme-crm.db')

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err); else resolve(this)
    })
  })
}
function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows)
    })
  })
}
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err); else resolve(row)
    })
  })
}

const db = new sqlite3.Database(DB_PATH)

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// Mapeamento de status antigos para novos (funil comercial)
const STATUS_MIGRATION_MAP = {
  '0. Qualificação':         'Qualificação',
  '1. Qualificado':          'Qualificado',
  '0. Novo Lead':            'Novo Lead',
  '1. Qualificação':         'Qualificação',
  '2. Qualificado':          'Qualificado',
  '3. Revisão':              'Revisão',
  '4. Negociação':           'Negociação',
  '5. Contrato Assinado':    'Contrato Assinado',
  '2.0. Envio do contrato':  'Revisão',
  '2.1. Assistência 2ª via': 'Revisão',
  '3.0. Negociação/contrato':'Negociação',
  '5. Solicitar estorno':    'Contrato Assinado',
  '6. Aguardando estorno':   'Contrato Assinado',
  '7. Concluído':            'Contrato Assinado',
  'Cancelado':               'Perdido',
}

// Status antigo → status da operação correspondente
const OPERATION_STATUS_MAP = {
  '5. Solicitar estorno':          'Solicitação de Estorno',
  '6. Aguardando estorno':         'Aguardando Estorno',
  '7. Concluído':                  'Concluído',
  '6. Documentação':               'Documentação',
  '7. Solicitação de Estorno':     'Solicitação de Estorno',
  '8. Aguardando Estorno':         'Aguardando Estorno',
  '9. Cobrança':                   'Cobrança',
  '10. Transferência de Repasses': 'Transferência de Repasses',
  '11. Concluído':                 'Concluído',
}

async function initDb() {
  await run(db, `
    CREATE TABLE IF NOT EXISTS leads (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      cpf             TEXT,
      rg              TEXT,
      birthDate       TEXT,
      email           TEXT,
      phone           TEXT,
      address         TEXT,
      responsible     TEXT,
      bank            TEXT,
      contractType    TEXT,
      contractNumber  TEXT,
      source          TEXT,
      status          TEXT DEFAULT 'Novo Lead',
      feePercent      INTEGER DEFAULT 50,
      embeddedValue   REAL DEFAULT 0,
      productsCount   INTEGER DEFAULT 0,
      notes           TEXT,
      contractFile    TEXT,
      contractName    TEXT,
      nextContact     TEXT,
      createdAt       TEXT NOT NULL,
      updatedAt       TEXT NOT NULL
    )
  `)

  // Migração: adicionar colunas novas se o banco já existia
  const cols = await all(db, `PRAGMA table_info(leads)`)
  const colNames = cols.map(c => c.name)
  if (!colNames.includes('responsible'))   await run(db, `ALTER TABLE leads ADD COLUMN responsible TEXT DEFAULT ''`)
  if (!colNames.includes('embeddedValue')) await run(db, `ALTER TABLE leads ADD COLUMN embeddedValue REAL DEFAULT 0`)
  if (!colNames.includes('nextContact'))   await run(db, `ALTER TABLE leads ADD COLUMN nextContact TEXT DEFAULT ''`)
  if (!colNames.includes('productsCount')) await run(db, `ALTER TABLE leads ADD COLUMN productsCount INTEGER DEFAULT 0`)
  if (!colNames.includes('lossReason'))    await run(db, `ALTER TABLE leads ADD COLUMN lossReason TEXT DEFAULT ''`)
  if (!colNames.includes('lastActiveStatus')) await run(db, `ALTER TABLE leads ADD COLUMN lastActiveStatus TEXT DEFAULT ''`)
  if (!colNames.includes('adCampaign'))    await run(db, `ALTER TABLE leads ADD COLUMN adCampaign TEXT DEFAULT ''`)
  if (!colNames.includes('adSet'))         await run(db, `ALTER TABLE leads ADD COLUMN adSet TEXT DEFAULT ''`)
  if (!colNames.includes('adName'))        await run(db, `ALTER TABLE leads ADD COLUMN adName TEXT DEFAULT ''`)
  if (!colNames.includes('isLost'))        await run(db, `ALTER TABLE leads ADD COLUMN isLost INTEGER DEFAULT 0`)

  // Migrar leads com status='Perdido' (modelo antigo) para isLost=1 + restaurar lastActiveStatus como status
  const oldLostLeads = await all(db, `SELECT * FROM leads WHERE status = 'Perdido'`)
  for (const lead of oldLostLeads) {
    const restoreStatus = lead.lastActiveStatus || 'Qualificação'
    await run(db, `UPDATE leads SET status=?, isLost=1 WHERE id=?`, [restoreStatus, lead.id])
  }

  // Tabela de operações
  await run(db, `
    CREATE TABLE IF NOT EXISTS operations (
      id                TEXT PRIMARY KEY,
      lead_id           TEXT NOT NULL UNIQUE,
      status            TEXT DEFAULT 'Documentação',
      isLost            INTEGER DEFAULT 0,
      lossReason        TEXT DEFAULT '',
      lastActiveStatus  TEXT DEFAULT '',
      responsible       TEXT,
      notes             TEXT,
      distributionNotes TEXT,
      embeddedValue     REAL DEFAULT 0,
      feePercent        INTEGER DEFAULT 50,
      repaymentValue    REAL DEFAULT 0,
      createdAt         TEXT NOT NULL,
      updatedAt         TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    )
  `)
  // Migração: adicionar colunas novas em operations se já existia
  const opCols = await all(db, `PRAGMA table_info(operations)`)
  const opColNames = opCols.map(c => c.name)
  if (!opColNames.includes('isLost'))           await run(db, `ALTER TABLE operations ADD COLUMN isLost INTEGER DEFAULT 0`)
  if (!opColNames.includes('lossReason'))       await run(db, `ALTER TABLE operations ADD COLUMN lossReason TEXT DEFAULT ''`)
  if (!opColNames.includes('lastActiveStatus')) await run(db, `ALTER TABLE operations ADD COLUMN lastActiveStatus TEXT DEFAULT ''`)

  // Migração de status antigos para novos no funil comercial
  for (const [oldStatus, newStatus] of Object.entries(STATUS_MIGRATION_MAP)) {
    await run(db, `UPDATE leads SET status = ? WHERE status = ?`, [newStatus, oldStatus])
  }

  // Migração de status antigos para novos no funil operacional
  for (const [oldStatus, newStatus] of Object.entries(OPERATION_STATUS_MAP)) {
    await run(db, `UPDATE operations SET status = ? WHERE status = ?`, [newStatus, oldStatus])
  }

  // Migrar 'Cancelado' → 'Perdido' (caso tenha restado algum)
  await run(db, `UPDATE leads SET status = 'Perdido' WHERE status = 'Cancelado'`)

  // Criar operações retroativas para leads em 'Contrato Assinado' que não têm operação
  const leadsWithContract = await all(db, `SELECT * FROM leads WHERE status = 'Contrato Assinado'`)
  const now = new Date().toISOString()
  for (const lead of leadsWithContract) {
    const existing = await get(db, `SELECT id FROM operations WHERE lead_id = ?`, [lead.id])
    if (!existing) {
      await run(db, `
        INSERT INTO operations (id, lead_id, status, responsible, embeddedValue, feePercent, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [genId(), lead.id, 'Documentação', lead.responsible || '', parseFloat(lead.embeddedValue) || 0, lead.feePercent || 50, now, now])
    }
  }

  // Tabela de contratos bancários do cliente
  await run(db, `
    CREATE TABLE IF NOT EXISTS contracts (
      id             TEXT PRIMARY KEY,
      lead_id        TEXT NOT NULL,
      bank           TEXT DEFAULT '',
      type           TEXT DEFAULT '',
      status         TEXT DEFAULT 'Aguardando envio',
      embeddedValue  REAL DEFAULT 0,
      productsCount  INTEGER DEFAULT 0,
      notes          TEXT DEFAULT '',
      pdfFile        TEXT,
      pdfName        TEXT DEFAULT '',
      createdAt      TEXT NOT NULL,
      updatedAt      TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    )
  `)

  await run(db, `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)

  const defaultSettings = {
    companyName:      'Leme Financeira',
    companyLegalName: '(razão social a preencher)',
    companyCnpj:      '66.149.967/0001-48',
    companyAddress:   '(endereço completo a preencher)',
    pixKey:           '66.149.967/0001-48',
    forumCity:        'Jundiaí/SP',
    banks:            JSON.stringify([
      'Bradesco','Itaú','Santander','Caixa Econômica','Banco do Brasil',
      'Nubank','Sicredi','Sicoob','BMG','BV','Pan Americano','Safra',
      'Inter','C6 Bank','C6 Consignado','Daycoval','Facta','Agibank','Mercantil','Outro'
    ]),
    responsibles:  JSON.stringify(['Daniel', 'Riquelme']),
    lossReasons:   JSON.stringify(['Desqualificado', 'Sem Valores', 'Sem Contato', 'Desistiu']),
  }
  for (const [k, v] of Object.entries(defaultSettings)) {
    await run(db, 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [k, v])
  }
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))

// ─── Leads ────────────────────────────────────────────────────────────────────
app.get('/api/leads', async (req, res) => {
  try { res.json(await all(db, 'SELECT * FROM leads ORDER BY createdAt DESC')) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/leads/:id', async (req, res) => {
  try {
    const row = await get(db, 'SELECT * FROM leads WHERE id = ?', [req.params.id])
    if (!row) return res.status(404).json({ error: 'Lead não encontrado' })
    res.json(row)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/leads', async (req, res) => {
  try {
    const l = req.body
    const now = new Date().toISOString()
    const id = l.id || genId()
    await run(db, `
      INSERT INTO leads (
        id, name, cpf, rg, birthDate, email, phone, address, responsible,
        source, adCampaign, adSet, adName, status,
        feePercent, embeddedValue, productsCount, notes,
        lossReason, lastActiveStatus,
        createdAt, updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      id, l.name||'', l.cpf||'', l.rg||'', l.birthDate||'', l.email||'',
      l.phone||'', l.address||'', l.responsible||'',
      l.source||'', l.adCampaign||'', l.adSet||'', l.adName||'',
      l.status||'Novo Lead', l.feePercent??50,
      parseFloat(l.embeddedValue)||0, parseInt(l.productsCount)||0,
      l.notes||'',
      l.lossReason||'', l.lastActiveStatus||'',
      l.createdAt||now, now,
    ])
    res.status(201).json(await get(db, 'SELECT * FROM leads WHERE id = ?', [id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/leads/:id', async (req, res) => {
  try {
    const l = req.body
    const now = new Date().toISOString()
    const ex = await get(db, 'SELECT * FROM leads WHERE id = ?', [req.params.id])
    if (!ex) return res.status(404).json({ error: 'Lead não encontrado' })

    // Lógica de perda VERTICAL: o lead permanece no status atual, isLost=1 o inativa nele
    // isLost pode vir no body como true/false/1/0, ou permanecer como está
    const requestingLoss   = l.isLost === true  || l.isLost === 1
    const requestingRevive = l.isLost === false || l.isLost === 0
    let newIsLost = ex.isLost
    let lossReason = l.lossReason ?? ex.lossReason
    let lastActiveStatus = ex.lastActiveStatus

    if (requestingLoss && !ex.isLost) {
      newIsLost = 1
      lastActiveStatus = ex.status  // memoriza em qual status perdeu
    } else if (requestingRevive && ex.isLost) {
      newIsLost = 0
      lossReason = ''
    }

    // status só muda se não estiver sendo marcado como perdido
    // e não pode marcar perda no status 'Contrato Assinado' pelo funil comercial
    const newStatus = l.status ?? ex.status
    const newEmbedded   = parseFloat(l.embeddedValue ?? ex.embeddedValue) || 0
    const newFeePercent = l.feePercent ?? ex.feePercent

    await run(db, `
      UPDATE leads SET
        name=?,cpf=?,rg=?,birthDate=?,email=?,phone=?,address=?,responsible=?,
        source=?,adCampaign=?,adSet=?,adName=?,
        status=?,isLost=?,feePercent=?,embeddedValue=?,productsCount=?,notes=?,
        lossReason=?,lastActiveStatus=?,
        updatedAt=?
      WHERE id=?
    `, [
      l.name??ex.name, l.cpf??ex.cpf, l.rg??ex.rg, l.birthDate??ex.birthDate,
      l.email??ex.email, l.phone??ex.phone, l.address??ex.address, l.responsible??ex.responsible,
      l.source??ex.source,
      l.adCampaign??ex.adCampaign, l.adSet??ex.adSet, l.adName??ex.adName,
      newStatus, newIsLost, newFeePercent,
      newEmbedded,
      parseInt(l.productsCount??ex.productsCount)||0,
      l.notes??ex.notes,
      lossReason, lastActiveStatus,
      now, req.params.id,
    ])

    // Sincronizar embeddedValue e feePercent na operação vinculada (dados financeiros são do lead)
    await run(db, `
      UPDATE operations SET embeddedValue=?, feePercent=?, updatedAt=? WHERE lead_id=?
    `, [newEmbedded, newFeePercent, now, req.params.id])

    // Trigger: se chegou em 'Contrato Assinado', criar operação se não existir
    if (newStatus === 'Contrato Assinado') {
      const existingOp = await get(db, `SELECT id FROM operations WHERE lead_id = ?`, [req.params.id])
      if (!existingOp) {
        const updatedLead = await get(db, 'SELECT * FROM leads WHERE id = ?', [req.params.id])
        await run(db, `
          INSERT INTO operations (id, lead_id, status, responsible, embeddedValue, feePercent, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          genId(), req.params.id, 'Documentação',
          updatedLead.responsible || '', parseFloat(updatedLead.embeddedValue) || 0,
          updatedLead.feePercent || 50, now, now,
        ])
      }
    }

    // Trigger: se saiu de 'Contrato Assinado' para status anterior (movimento de volta),
    // deletar a operação vinculada — ela não deve mais existir
    if (ex.status === 'Contrato Assinado' && newStatus !== 'Contrato Assinado' && !newIsLost) {
      await run(db, `DELETE FROM operations WHERE lead_id = ?`, [req.params.id])
    }

    res.json(await get(db, 'SELECT * FROM leads WHERE id = ?', [req.params.id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/leads/:id', async (req, res) => {
  try { await run(db, 'DELETE FROM leads WHERE id = ?', [req.params.id]); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Operations ───────────────────────────────────────────────────────────────

// IMPORTANTE: rota específica antes da rota com :id
app.get('/api/operations/by-lead/:lead_id', async (req, res) => {
  try {
    const op = await get(db, `
      SELECT o.*, l.name as lead_name, l.phone as lead_phone,
             l.source as lead_source,
             l.adCampaign as lead_adCampaign, l.adSet as lead_adSet, l.adName as lead_adName,
             l.cpf as lead_cpf, l.responsible as lead_responsible,
             l.embeddedValue as lead_embeddedValue, l.feePercent as lead_feePercent
      FROM operations o
      JOIN leads l ON l.id = o.lead_id
      WHERE o.lead_id = ?
    `, [req.params.lead_id])
    if (!op) return res.status(404).json({ error: 'Operação não encontrada' })
    res.json(op)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/operations', async (req, res) => {
  try {
    const rows = await all(db, `
      SELECT o.*, l.name as lead_name, l.phone as lead_phone,
             l.source as lead_source,
             l.adCampaign as lead_adCampaign, l.adSet as lead_adSet, l.adName as lead_adName,
             l.cpf as lead_cpf, l.responsible as lead_responsible,
             l.embeddedValue as lead_embeddedValue, l.feePercent as lead_feePercent
      FROM operations o
      JOIN leads l ON l.id = o.lead_id
      ORDER BY o.createdAt DESC
    `)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/operations/:id', async (req, res) => {
  try {
    const op = await get(db, `
      SELECT o.*, l.name as lead_name, l.phone as lead_phone,
             l.source as lead_source,
             l.adCampaign as lead_adCampaign, l.adSet as lead_adSet, l.adName as lead_adName,
             l.cpf as lead_cpf, l.responsible as lead_responsible,
             l.embeddedValue as lead_embeddedValue, l.feePercent as lead_feePercent
      FROM operations o
      JOIN leads l ON l.id = o.lead_id
      WHERE o.id = ?
    `, [req.params.id])
    if (!op) return res.status(404).json({ error: 'Operação não encontrada' })
    res.json(op)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/operations/:id', async (req, res) => {
  try {
    const d = req.body
    const now = new Date().toISOString()
    const ex = await get(db, 'SELECT * FROM operations WHERE id = ?', [req.params.id])
    if (!ex) return res.status(404).json({ error: 'Operação não encontrada' })

    // Mesma lógica de perda vertical do funil comercial
    const requestingLoss   = d.isLost === true  || d.isLost === 1
    const requestingRevive = d.isLost === false || d.isLost === 0
    let newIsLost = ex.isLost
    let opLossReason = d.lossReason ?? ex.lossReason
    let opLastActive = ex.lastActiveStatus

    if (requestingLoss && !ex.isLost) {
      newIsLost = 1
      opLastActive = ex.status
    } else if (requestingRevive && ex.isLost) {
      newIsLost = 0
      opLossReason = ''
    }

    const newStatus = d.status ?? ex.status

    await run(db, `
      UPDATE operations SET
        status=?, isLost=?, lossReason=?, lastActiveStatus=?,
        responsible=?, notes=?, distributionNotes=?,
        repaymentValue=?, updatedAt=?
      WHERE id=?
    `, [
      newStatus, newIsLost, opLossReason, opLastActive,
      d.responsible ?? ex.responsible,
      d.notes ?? ex.notes,
      d.distributionNotes ?? ex.distributionNotes,
      parseFloat(d.repaymentValue ?? ex.repaymentValue) || 0,
      now, req.params.id,
    ])

    // Propagação de perda operacional → comercial
    // Quando a operação é marcada como perdida, o lead comercial também perde.
    // lastActiveStatus do lead recebe o status da operação (ex: "7. Solicitação de Estorno")
    if (requestingLoss && !ex.isLost) {
      await run(db, `
        UPDATE leads SET isLost=1, lossReason=?, lastActiveStatus=?, updatedAt=?
        WHERE id=?
      `, [opLossReason, ex.status, now, ex.lead_id])
    }

    // Quando a operação é reativada, reativa também o lead comercial
    if (requestingRevive && ex.isLost) {
      await run(db, `
        UPDATE leads SET isLost=0, lossReason='', updatedAt=?
        WHERE id=?
      `, [now, ex.lead_id])
    }

    res.json(await get(db, `
      SELECT o.*, l.name as lead_name, l.phone as lead_phone,
             l.source as lead_source,
             l.adCampaign as lead_adCampaign, l.adSet as lead_adSet, l.adName as lead_adName,
             l.cpf as lead_cpf, l.responsible as lead_responsible,
             l.embeddedValue as lead_embeddedValue, l.feePercent as lead_feePercent
      FROM operations o JOIN leads l ON l.id = o.lead_id
      WHERE o.id = ?
    `, [req.params.id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Contracts (contratos bancários do cliente) ───────────────────────────────

app.get('/api/leads/:lead_id/contracts', async (req, res) => {
  try {
    res.json(await all(db, `SELECT * FROM contracts WHERE lead_id = ? ORDER BY createdAt ASC`, [req.params.lead_id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/leads/:lead_id/contracts', async (req, res) => {
  try {
    const c = req.body
    const now = new Date().toISOString()
    const id = genId()
    await run(db, `
      INSERT INTO contracts (id, lead_id, bank, type, status, embeddedValue, productsCount, notes, pdfFile, pdfName, createdAt, updatedAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      id, req.params.lead_id,
      c.bank||'', c.type||'', c.status||'Aguardando envio',
      parseFloat(c.embeddedValue)||0, parseInt(c.productsCount)||0,
      c.notes||'', c.pdfFile||null, c.pdfName||'', now, now,
    ])
    // Recalcular embeddedValue do lead como soma dos contratos
    await syncLeadEmbedded(req.params.lead_id, now)
    res.status(201).json(await get(db, `SELECT * FROM contracts WHERE id = ?`, [id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/leads/:lead_id/contracts/:id', async (req, res) => {
  try {
    const c = req.body
    const now = new Date().toISOString()
    const ex = await get(db, `SELECT * FROM contracts WHERE id = ? AND lead_id = ?`, [req.params.id, req.params.lead_id])
    if (!ex) return res.status(404).json({ error: 'Contrato não encontrado' })
    await run(db, `
      UPDATE contracts SET bank=?,type=?,status=?,embeddedValue=?,productsCount=?,notes=?,pdfFile=?,pdfName=?,updatedAt=?
      WHERE id=?
    `, [
      c.bank??ex.bank, c.type??ex.type, c.status??ex.status,
      parseFloat(c.embeddedValue??ex.embeddedValue)||0,
      parseInt(c.productsCount??ex.productsCount)||0,
      c.notes??ex.notes,
      c.pdfFile!==undefined ? c.pdfFile : ex.pdfFile,
      c.pdfName??ex.pdfName,
      now, req.params.id,
    ])
    await syncLeadEmbedded(req.params.lead_id, now)
    await autoAdvanceLeadStatus(req.params.lead_id, c.status, now)
    res.json(await get(db, `SELECT * FROM contracts WHERE id = ?`, [req.params.id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/leads/:lead_id/contracts/:id', async (req, res) => {
  try {
    await run(db, `DELETE FROM contracts WHERE id = ? AND lead_id = ?`, [req.params.id, req.params.lead_id])
    const now = new Date().toISOString()
    await syncLeadEmbedded(req.params.lead_id, now)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Se contrato vai para "Revisar contrato" e lead está em Qualificação ou Qualificado → avança para Revisão
async function autoAdvanceLeadStatus(leadId, contractStatus, now) {
  const lead = await get(db, `SELECT status FROM leads WHERE id=?`, [leadId])
  if (!lead) return
  const cur = lead.status
  if (contractStatus === 'Revisar contrato') {
    if (cur === 'Qualificação' || cur === 'Qualificado') {
      await run(db, `UPDATE leads SET status='Revisão', updatedAt=? WHERE id=?`, [now, leadId])
    }
  }
}

async function syncLeadEmbedded(leadId, now) {
  const result = await get(db, `SELECT COALESCE(SUM(embeddedValue),0) as total FROM contracts WHERE lead_id=?`, [leadId])
  const total = result?.total || 0
  await run(db, `UPDATE leads SET embeddedValue=?, updatedAt=? WHERE id=?`, [total, now, leadId])
  await run(db, `UPDATE operations SET embeddedValue=?, updatedAt=? WHERE lead_id=?`, [total, now, leadId])
}

// ─── Settings ─────────────────────────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await all(db, 'SELECT key, value FROM settings')
    const obj = {}
    rows.forEach(r => { obj[r.key] = r.value })
    res.json(obj)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/settings', async (req, res) => {
  try {
    for (const [k, v] of Object.entries(req.body)) {
      await run(db, `INSERT INTO settings (key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, [k, v])
    }
    res.json(req.body)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/backup', (req, res) => {
  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="leme-crm-backup-${Date.now()}.db"`)
  fs.createReadStream(DB_PATH).pipe(res)
})

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('╔════════════════════════════════════════════════╗')
    console.log('║  Leme Financeira — CRM Server                  ║')
    console.log(`║  Rodando em http://0.0.0.0:${PORT}                 ║`)
    console.log('╚════════════════════════════════════════════════╝')
  })
}).catch(err => { console.error('Falha ao inicializar banco:', err); process.exit(1) })
