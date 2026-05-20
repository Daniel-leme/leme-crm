/**
 * Leme Financeira — CRM Server
 *
 * Servidor local Node.js + SQLite que serve a API REST do CRM.
 * Roda na máquina principal; o sócio acessa via rede local (LAN) ou
 * via VPN como Hamachi/Radmin/Tailscale, apontando para o IP do host.
 *
 * Para subir:   npm install  &&  npm start
 * Porta padrão: 4000
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()

const PORT = process.env.PORT || 4000
const DB_PATH = path.join(__dirname, 'leme-crm.db')

// ─── Promisified helpers ──────────────────────────────────────────────────────
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

// ─── DB init ──────────────────────────────────────────────────────────────────
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
      bank            TEXT,
      contractType    TEXT,
      contractNumber  TEXT,
      source          TEXT,
      status          TEXT DEFAULT 'Novo',
      feePercent      INTEGER DEFAULT 50,
      notes           TEXT,
      contractFile    TEXT,
      contractName    TEXT,
      createdAt       TEXT NOT NULL,
      updatedAt       TEXT NOT NULL
    )
  `)
  await run(db, `
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // Seed default settings if missing
  const defaultSettings = {
    companyName:     'Leme Financeira',
    companyLegalName:'(razão social a preencher)',
    companyCnpj:     '66.149.967/0001-48',
    companyAddress:  '(endereço completo a preencher)',
    pixKey:          '66.149.967/0001-48',
    forumCity:       'Jundiaí/SP',
  }
  for (const [k, v] of Object.entries(defaultSettings)) {
    await run(db, 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [k, v])
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' })) // PDFs em base64 podem ser grandes

// Health-check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// ─── Leads ────────────────────────────────────────────────────────────────────
app.get('/api/leads', async (req, res) => {
  try {
    const rows = await all(db, 'SELECT * FROM leads ORDER BY createdAt DESC')
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
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
        id, name, cpf, rg, birthDate, email, phone, address,
        bank, contractType, contractNumber, source, status,
        feePercent, notes, contractFile, contractName, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      l.name || '',
      l.cpf || '',
      l.rg || '',
      l.birthDate || '',
      l.email || '',
      l.phone || '',
      l.address || '',
      l.bank || '',
      l.contractType || '',
      l.contractNumber || '',
      l.source || '',
      l.status || 'Novo',
      l.feePercent ?? 50,
      l.notes || '',
      l.contractFile || null,
      l.contractName || '',
      l.createdAt || now,
      now,
    ])

    const created = await get(db, 'SELECT * FROM leads WHERE id = ?', [id])
    res.status(201).json(created)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/leads/:id', async (req, res) => {
  try {
    const l = req.body
    const now = new Date().toISOString()
    const existing = await get(db, 'SELECT * FROM leads WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Lead não encontrado' })

    await run(db, `
      UPDATE leads SET
        name=?, cpf=?, rg=?, birthDate=?, email=?,
        phone=?, address=?, bank=?, contractType=?,
        contractNumber=?, source=?, status=?,
        feePercent=?, notes=?, contractFile=?,
        contractName=?, updatedAt=?
      WHERE id=?
    `, [
      l.name ?? existing.name,
      l.cpf ?? existing.cpf,
      l.rg ?? existing.rg,
      l.birthDate ?? existing.birthDate,
      l.email ?? existing.email,
      l.phone ?? existing.phone,
      l.address ?? existing.address,
      l.bank ?? existing.bank,
      l.contractType ?? existing.contractType,
      l.contractNumber ?? existing.contractNumber,
      l.source ?? existing.source,
      l.status ?? existing.status,
      l.feePercent ?? existing.feePercent,
      l.notes ?? existing.notes,
      l.contractFile ?? existing.contractFile,
      l.contractName ?? existing.contractName,
      now,
      req.params.id,
    ])

    const updated = await get(db, 'SELECT * FROM leads WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/leads/:id', async (req, res) => {
  try {
    await run(db, 'DELETE FROM leads WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
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
      await run(db,
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [k, v]
      )
    }
    res.json(req.body)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Backup ───────────────────────────────────────────────────────────────────
app.get('/api/backup', (req, res) => {
  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="leme-crm-backup-${Date.now()}.db"`)
  fs.createReadStream(DB_PATH).pipe(res)
})

// ─── Start ────────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('╔════════════════════════════════════════════════╗')
    console.log('║  Leme Financeira — CRM Server                  ║')
    console.log(`║  Rodando em http://0.0.0.0:${PORT}                 ║`)
    console.log(`║  Banco: ${DB_PATH}`)
    console.log('╚════════════════════════════════════════════════╝')
    console.log(`Para acesso via Hamachi/LAN, use o IP da maquina + porta ${PORT}.`)
  })
}).catch(err => {
  console.error('Falha ao inicializar banco:', err)
  process.exit(1)
})
