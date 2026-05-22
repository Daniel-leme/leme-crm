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
      status          TEXT DEFAULT '0. Qualificação',
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
    responsibles: JSON.stringify(['Daniel', 'Riquelme']),
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
    const id = l.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7))
    await run(db, `
      INSERT INTO leads (
        id, name, cpf, rg, birthDate, email, phone, address, responsible,
        bank, contractType, contractNumber, source, status,
        feePercent, embeddedValue, productsCount, notes,
        contractFile, contractName, nextContact, createdAt, updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      id, l.name||'', l.cpf||'', l.rg||'', l.birthDate||'', l.email||'',
      l.phone||'', l.address||'', l.responsible||'',
      l.bank||'', l.contractType||'', l.contractNumber||'', l.source||'',
      l.status||'0. Qualificação', l.feePercent??50,
      parseFloat(l.embeddedValue)||0, parseInt(l.productsCount)||0,
      l.notes||'', l.contractFile||null, l.contractName||'', l.nextContact||'',
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
    await run(db, `
      UPDATE leads SET
        name=?,cpf=?,rg=?,birthDate=?,email=?,phone=?,address=?,responsible=?,
        bank=?,contractType=?,contractNumber=?,source=?,status=?,
        feePercent=?,embeddedValue=?,productsCount=?,notes=?,
        contractFile=?,contractName=?,nextContact=?,updatedAt=?
      WHERE id=?
    `, [
      l.name??ex.name, l.cpf??ex.cpf, l.rg??ex.rg, l.birthDate??ex.birthDate,
      l.email??ex.email, l.phone??ex.phone, l.address??ex.address, l.responsible??ex.responsible,
      l.bank??ex.bank, l.contractType??ex.contractType, l.contractNumber??ex.contractNumber,
      l.source??ex.source, l.status??ex.status, l.feePercent??ex.feePercent,
      parseFloat(l.embeddedValue??ex.embeddedValue)||0,
      parseInt(l.productsCount??ex.productsCount)||0,
      l.notes??ex.notes, l.contractFile??ex.contractFile, l.contractName??ex.contractName, (l.nextContact??ex.nextContact)||'',
      now, req.params.id,
    ])
    res.json(await get(db, 'SELECT * FROM leads WHERE id = ?', [req.params.id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/leads/:id', async (req, res) => {
  try { await run(db, 'DELETE FROM leads WHERE id = ?', [req.params.id]); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

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
