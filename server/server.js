require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')
const { Pool } = require('pg')

const PORT = process.env.PORT || 4000

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const query = (sql, params = []) => pool.query(sql, params)
const all   = async (sql, params = []) => (await pool.query(sql, params)).rows
const get   = async (sql, params = []) => (await pool.query(sql, params)).rows[0] || null
const run   = (sql, params = []) => pool.query(sql, params)

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS leads (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL DEFAULT '',
      cpf              TEXT DEFAULT '',
      rg               TEXT DEFAULT '',
      "birthDate"      TEXT DEFAULT '',
      email            TEXT DEFAULT '',
      phone            TEXT DEFAULT '',
      address          TEXT DEFAULT '',
      responsible      TEXT DEFAULT '',
      bank             TEXT DEFAULT '',
      "contractType"   TEXT DEFAULT '',
      "contractNumber" TEXT DEFAULT '',
      source           TEXT DEFAULT '',
      status           TEXT DEFAULT 'Novo Lead',
      "feePercent"     INTEGER DEFAULT 50,
      "embeddedValue"  REAL DEFAULT 0,
      "productsCount"  INTEGER DEFAULT 0,
      notes            TEXT DEFAULT '',
      "contractFile"   TEXT DEFAULT '',
      "contractName"   TEXT DEFAULT '',
      "nextContact"    TEXT DEFAULT '',
      "lossReason"     TEXT DEFAULT '',
      "lastActiveStatus" TEXT DEFAULT '',
      "adCampaign"     TEXT DEFAULT '',
      "adSet"          TEXT DEFAULT '',
      "adName"         TEXT DEFAULT '',
      "isLost"         INTEGER DEFAULT 0,
      "createdAt"      TEXT NOT NULL DEFAULT '',
      "updatedAt"      TEXT NOT NULL DEFAULT ''
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS operations (
      id                 TEXT PRIMARY KEY,
      lead_id            TEXT NOT NULL UNIQUE,
      status             TEXT DEFAULT 'Documentação',
      "isLost"           INTEGER DEFAULT 0,
      "lossReason"       TEXT DEFAULT '',
      "lastActiveStatus" TEXT DEFAULT '',
      responsible        TEXT DEFAULT '',
      notes              TEXT DEFAULT '',
      "distributionNotes" TEXT DEFAULT '',
      "embeddedValue"    REAL DEFAULT 0,
      "feePercent"       INTEGER DEFAULT 50,
      "repaymentValue"   REAL DEFAULT 0,
      "createdAt"        TEXT NOT NULL DEFAULT '',
      "updatedAt"        TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS contracts (
      id             TEXT PRIMARY KEY,
      lead_id        TEXT NOT NULL,
      bank           TEXT DEFAULT '',
      type           TEXT DEFAULT '',
      status         TEXT DEFAULT 'Aguardando envio',
      "embeddedValue" REAL DEFAULT 0,
      "productsCount" INTEGER DEFAULT 0,
      notes          TEXT DEFAULT '',
      "pdfFile"      TEXT DEFAULT '',
      "pdfName"      TEXT DEFAULT '',
      "createdAt"    TEXT NOT NULL DEFAULT '',
      "updatedAt"    TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY,
      lead_id      TEXT NOT NULL,
      contract_id  TEXT DEFAULT '',
      type         TEXT DEFAULT 'Ligação',
      description  TEXT DEFAULT '',
      "assignedTo" TEXT DEFAULT '',
      "dueDate"    TEXT DEFAULT '',
      "dueTime"    TEXT DEFAULT '',
      status       TEXT DEFAULT 'pending',
      "isAuto"     INTEGER DEFAULT 0,
      "createdAt"  TEXT NOT NULL DEFAULT '',
      "updatedAt"  TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    )
  `)

  await run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)

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
    responsibles: JSON.stringify(['Riquelme', 'Daniel']),
    lossReasons:   JSON.stringify(['Desqualificado', 'Sem Valores', 'Sem Contato', 'Desistiu']),
    opLossReasons: JSON.stringify(['Banco recusou', 'Documentação incompleta', 'Cliente desistiu após assinar', 'Sem Contato']),
    taskTypes:    JSON.stringify(['Ligação', 'WhatsApp / Follow-up', 'Reunião', 'Envio de documento', 'Outro']),
    leadSources:  JSON.stringify(['Instagram', 'Facebook', 'Indicação', 'Google', 'WhatsApp', 'Outro']),
  }
  for (const [k, v] of Object.entries(defaultSettings)) {
    await run(`INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`, [k, v])
  }
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))

// ─── Leads ────────────────────────────────────────────────────────────────────

app.get('/api/leads', async (req, res) => {
  try { res.json(await all(`SELECT * FROM leads ORDER BY "createdAt" DESC`)) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/leads/:id', async (req, res) => {
  try {
    const row = await get(`SELECT * FROM leads WHERE id = $1`, [req.params.id])
    if (!row) return res.status(404).json({ error: 'Lead não encontrado' })
    res.json(row)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/leads', async (req, res) => {
  try {
    const l = req.body
    const now = new Date().toISOString()
    const id = l.id || genId()
    await run(`
      INSERT INTO leads (
        id, name, cpf, rg, "birthDate", email, phone, address, responsible,
        source, "adCampaign", "adSet", "adName", status,
        "feePercent", "embeddedValue", "productsCount", notes,
        "lossReason", "lastActiveStatus", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
    `, [
      id, l.name||'', l.cpf||'', l.rg||'', l.birthDate||'', l.email||'',
      l.phone||'', l.address||'', l.responsible||'',
      l.source||'', l.adCampaign||'', l.adSet||'', l.adName||'',
      l.status||'Novo Lead', l.feePercent??50,
      parseFloat(l.embeddedValue)||0, parseInt(l.productsCount)||0,
      l.notes||'', l.lossReason||'', l.lastActiveStatus||'',
      l.createdAt||now, now,
    ])
    res.status(201).json(await get(`SELECT * FROM leads WHERE id = $1`, [id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/leads/:id', async (req, res) => {
  try {
    const l = req.body
    const now = new Date().toISOString()
    const ex = await get(`SELECT * FROM leads WHERE id = $1`, [req.params.id])
    if (!ex) return res.status(404).json({ error: 'Lead não encontrado' })

    const requestingLoss   = l.isLost === true  || l.isLost === 1
    const requestingRevive = l.isLost === false  || l.isLost === 0
    let newIsLost = ex.isLost
    let lossReason = l.lossReason ?? ex.lossReason
    let lastActiveStatus = ex.lastActiveStatus

    if (requestingLoss && !ex.isLost) {
      newIsLost = 1
      lastActiveStatus = ex.status
    } else if (requestingRevive && ex.isLost) {
      newIsLost = 0
      lossReason = ''
    }

    const newStatus     = l.status      ?? ex.status
    const newEmbedded   = parseFloat(l.embeddedValue ?? ex.embeddedValue) || 0
    const newFeePercent = l.feePercent  ?? ex.feePercent

    await run(`
      UPDATE leads SET
        name=$1, cpf=$2, rg=$3, "birthDate"=$4, email=$5, phone=$6, address=$7, responsible=$8,
        source=$9, "adCampaign"=$10, "adSet"=$11, "adName"=$12,
        status=$13, "isLost"=$14, "feePercent"=$15, "embeddedValue"=$16, "productsCount"=$17, notes=$18,
        "lossReason"=$19, "lastActiveStatus"=$20, "updatedAt"=$21
      WHERE id=$22
    `, [
      l.name??ex.name, l.cpf??ex.cpf, l.rg??ex.rg, l.birthDate??ex.birthDate,
      l.email??ex.email, l.phone??ex.phone, l.address??ex.address, l.responsible??ex.responsible,
      l.source??ex.source, l.adCampaign??ex.adCampaign, l.adSet??ex.adSet, l.adName??ex.adName,
      newStatus, newIsLost, newFeePercent, newEmbedded,
      parseInt(l.productsCount??ex.productsCount)||0,
      l.notes??ex.notes, lossReason, lastActiveStatus,
      now, req.params.id,
    ])

    await run(`UPDATE operations SET "embeddedValue"=$1, "feePercent"=$2, "updatedAt"=$3 WHERE lead_id=$4`,
      [newEmbedded, newFeePercent, now, req.params.id])

    if (newStatus === 'Contrato Assinado') {
      const existingOp = await get(`SELECT id FROM operations WHERE lead_id = $1`, [req.params.id])
      if (!existingOp) {
        const updatedLead = await get(`SELECT * FROM leads WHERE id = $1`, [req.params.id])
        await run(`
          INSERT INTO operations (id, lead_id, status, responsible, "embeddedValue", "feePercent", "createdAt", "updatedAt")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [genId(), req.params.id, 'Documentação', updatedLead.responsible||'',
            parseFloat(updatedLead.embeddedValue)||0, updatedLead.feePercent||50, now, now])
      }
    }

    if (ex.status === 'Contrato Assinado' && newStatus !== 'Contrato Assinado' && !newIsLost) {
      await run(`DELETE FROM operations WHERE lead_id = $1`, [req.params.id])
    }

    res.json(await get(`SELECT * FROM leads WHERE id = $1`, [req.params.id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/leads/:id', async (req, res) => {
  try { await run(`DELETE FROM leads WHERE id = $1`, [req.params.id]); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Operations ───────────────────────────────────────────────────────────────

const OP_JOIN = `
  SELECT o.*, l.name as lead_name, l.phone as lead_phone,
         l.source as lead_source,
         l."adCampaign" as lead_adCampaign, l."adSet" as lead_adSet, l."adName" as lead_adName,
         l.cpf as lead_cpf, l.responsible as lead_responsible,
         l."embeddedValue" as lead_embeddedValue, l."feePercent" as lead_feePercent
  FROM operations o
  JOIN leads l ON l.id = o.lead_id
`

app.get('/api/operations/by-lead/:lead_id', async (req, res) => {
  try {
    const op = await get(OP_JOIN + ` WHERE o.lead_id = $1`, [req.params.lead_id])
    if (!op) return res.status(404).json({ error: 'Operação não encontrada' })
    res.json(op)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/operations', async (req, res) => {
  try { res.json(await all(OP_JOIN + ` ORDER BY o."createdAt" DESC`)) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/operations/:id', async (req, res) => {
  try {
    const op = await get(OP_JOIN + ` WHERE o.id = $1`, [req.params.id])
    if (!op) return res.status(404).json({ error: 'Operação não encontrada' })
    res.json(op)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/operations/:id', async (req, res) => {
  try {
    const d = req.body
    const now = new Date().toISOString()
    const ex = await get(`SELECT * FROM operations WHERE id = $1`, [req.params.id])
    if (!ex) return res.status(404).json({ error: 'Operação não encontrada' })

    const requestingLoss   = d.isLost === true  || d.isLost === 1
    const requestingRevive = d.isLost === false  || d.isLost === 0
    let newIsLost    = ex.isLost
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

    await run(`
      UPDATE operations SET status=$1, "isLost"=$2, "lossReason"=$3, "lastActiveStatus"=$4, "updatedAt"=$5
      WHERE id=$6
    `, [newStatus, newIsLost, opLossReason, opLastActive, now, req.params.id])

    if (requestingLoss && !ex.isLost) {
      await run(`UPDATE leads SET "isLost"=1, "lossReason"=$1, "lastActiveStatus"=$2, "updatedAt"=$3 WHERE id=$4`,
        [opLossReason, ex.status, now, ex.lead_id])
    }
    if (requestingRevive && ex.isLost) {
      await run(`UPDATE leads SET "isLost"=0, "lossReason"='', "updatedAt"=$1 WHERE id=$2`, [now, ex.lead_id])
    }

    res.json(await get(OP_JOIN + ` WHERE o.id = $1`, [req.params.id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Contracts ────────────────────────────────────────────────────────────────

app.get('/api/leads/:lead_id/contracts', async (req, res) => {
  try { res.json(await all(`SELECT * FROM contracts WHERE lead_id = $1 ORDER BY "createdAt" ASC`, [req.params.lead_id])) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/leads/:lead_id/contracts', async (req, res) => {
  try {
    const c = req.body
    const now = new Date().toISOString()
    const id = genId()
    await run(`
      INSERT INTO contracts (id, lead_id, bank, type, status, "embeddedValue", "productsCount", notes, "pdfFile", "pdfName", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [
      id, req.params.lead_id,
      c.bank||'', c.type||'', c.status||'Aguardando envio',
      parseFloat(c.embeddedValue)||0, parseInt(c.productsCount)||0,
      c.notes||'', c.pdfFile||'', c.pdfName||'', now, now,
    ])
    await syncLeadEmbedded(req.params.lead_id, now)
    res.status(201).json(await get(`SELECT * FROM contracts WHERE id = $1`, [id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/leads/:lead_id/contracts/:id', async (req, res) => {
  try {
    const c = req.body
    const now = new Date().toISOString()
    const ex = await get(`SELECT * FROM contracts WHERE id = $1 AND lead_id = $2`, [req.params.id, req.params.lead_id])
    if (!ex) return res.status(404).json({ error: 'Contrato não encontrado' })
    await run(`
      UPDATE contracts SET bank=$1, type=$2, status=$3, "embeddedValue"=$4, "productsCount"=$5,
        notes=$6, "pdfFile"=$7, "pdfName"=$8, "updatedAt"=$9
      WHERE id=$10
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
    res.json(await get(`SELECT * FROM contracts WHERE id = $1`, [req.params.id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/leads/:lead_id/contracts/:id', async (req, res) => {
  try {
    await run(`DELETE FROM tasks WHERE contract_id = $1`, [req.params.id])
    await run(`DELETE FROM contracts WHERE id = $1 AND lead_id = $2`, [req.params.id, req.params.lead_id])
    await syncLeadEmbedded(req.params.lead_id, new Date().toISOString())
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

async function autoAdvanceLeadStatus(leadId, contractStatus, now) {
  const lead = await get(`SELECT status FROM leads WHERE id=$1`, [leadId])
  if (!lead) return
  if (contractStatus === 'Revisar contrato') {
    if (lead.status === 'Qualificação' || lead.status === 'Qualificado') {
      await run(`UPDATE leads SET status='Revisão', "updatedAt"=$1 WHERE id=$2`, [now, leadId])
    }
  }
}

async function syncLeadEmbedded(leadId, now) {
  const result = await get(`SELECT COALESCE(SUM("embeddedValue"),0) as total FROM contracts WHERE lead_id=$1`, [leadId])
  const total = parseFloat(result?.total) || 0
  await run(`UPDATE leads SET "embeddedValue"=$1, "updatedAt"=$2 WHERE id=$3`, [total, now, leadId])
  await run(`UPDATE operations SET "embeddedValue"=$1, "updatedAt"=$2 WHERE lead_id=$3`, [total, now, leadId])
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

app.get('/api/tasks', async (req, res) => {
  try {
    res.json(await all(`
      SELECT t.*,
        l.name as lead_name, l.phone as lead_phone, l.status as lead_status, l."isLost" as lead_isLost,
        c.bank as contract_bank, c.type as contract_type
      FROM tasks t
      JOIN leads l ON l.id = t.lead_id
      LEFT JOIN contracts c ON c.id = t.contract_id
      ORDER BY t."dueDate" ASC, t."dueTime" ASC, t."createdAt" ASC
    `))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/leads/:lead_id/tasks', async (req, res) => {
  try {
    res.json(await all(`
      SELECT t.*, c.bank as contract_bank, c.type as contract_type
      FROM tasks t
      LEFT JOIN contracts c ON c.id = t.contract_id
      WHERE t.lead_id = $1
      ORDER BY t."dueDate" ASC, t."dueTime" ASC, t."createdAt" ASC
    `, [req.params.lead_id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/contracts/:contract_id/tasks', async (req, res) => {
  try {
    res.json(await all(`SELECT * FROM tasks WHERE contract_id = $1 AND status = 'pending' ORDER BY "createdAt" ASC`, [req.params.contract_id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/tasks', async (req, res) => {
  try {
    const t = req.body
    const now = new Date().toISOString()
    const id = genId()
    if (t.isAuto && t.contract_id) {
      await run(`DELETE FROM tasks WHERE contract_id = $1 AND "isAuto" = 1 AND status = 'pending'`, [t.contract_id])
    }
    await run(`
      INSERT INTO tasks (id, lead_id, contract_id, type, description, "assignedTo", "dueDate", "dueTime", status, "isAuto", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [
      id, t.lead_id, t.contract_id||'', t.type||'Ligação',
      t.description||'', t.assignedTo||'', t.dueDate||'', t.dueTime||'',
      t.status||'pending', t.isAuto?1:0, now, now,
    ])
    res.status(201).json(await get(`SELECT * FROM tasks WHERE id = $1`, [id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const t = req.body
    const now = new Date().toISOString()
    const ex = await get(`SELECT * FROM tasks WHERE id = $1`, [req.params.id])
    if (!ex) return res.status(404).json({ error: 'Tarefa não encontrada' })
    await run(`
      UPDATE tasks SET type=$1, description=$2, "assignedTo"=$3, "dueDate"=$4, "dueTime"=$5, status=$6, "updatedAt"=$7
      WHERE id=$8
    `, [
      t.type??ex.type, t.description??ex.description,
      t.assignedTo??ex.assignedTo, t.dueDate??ex.dueDate,
      t.dueTime??ex.dueTime, t.status??ex.status,
      now, req.params.id,
    ])
    res.json(await get(`SELECT * FROM tasks WHERE id = $1`, [req.params.id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try { await run(`DELETE FROM tasks WHERE id = $1`, [req.params.id]); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Settings ─────────────────────────────────────────────────────────────────

app.get('/api/settings', async (req, res) => {
  try {
    const rows = await all(`SELECT key, value FROM settings`)
    const obj = {}
    rows.forEach(r => { obj[r.key] = r.value })
    res.json(obj)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/settings', async (req, res) => {
  try {
    for (const [k, v] of Object.entries(req.body)) {
      await run(`INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [k, v])
    }
    res.json(req.body)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Backup ───────────────────────────────────────────────────────────────────

app.get('/api/backup', async (req, res) => {
  try {
    const [leads, operations, contracts, tasks, settings] = await Promise.all([
      all(`SELECT * FROM leads ORDER BY "createdAt" ASC`),
      all(`SELECT * FROM operations ORDER BY "createdAt" ASC`),
      all(`SELECT * FROM contracts ORDER BY "createdAt" ASC`),
      all(`SELECT * FROM tasks ORDER BY "createdAt" ASC`),
      all(`SELECT key, value FROM settings`),
    ])
    const backup = { exportedAt: new Date().toISOString(), leads, operations, contracts, tasks, settings }
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="leme-crm-backup-${Date.now()}.json"`)
    res.json(backup)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Frontend (produção) ──────────────────────────────────────────────────────
// Em produção (NODE_ENV=production), serve o build do React.
// Em desenvolvimento local, o Vite roda separado — essas linhas não fazem nada.

const DIST = path.join(__dirname, '../client/dist')
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST))
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')))
}

// ─── Init ─────────────────────────────────────────────────────────────────────

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('╔════════════════════════════════════════════════╗')
    console.log('║  Leme Financeira — CRM Server                  ║')
    console.log(`║  Rodando em http://0.0.0.0:${PORT}                 ║`)
    console.log('║  Banco: PostgreSQL                             ║')
    console.log('╚════════════════════════════════════════════════╝')
  })
}).catch(err => { console.error('Falha ao inicializar banco:', err); process.exit(1) })
