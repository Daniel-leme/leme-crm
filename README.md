# Leme Financeira — CRM

CRM local para revisão contratual (financiamentos / empréstimos com seguros embutidos), com:

- Cadastro de leads com dados completos (nome, CPF, RG, e-mail, endereço, etc.)
- Geração automática do **contrato de assessoria** em PDF, pronto para envio pelo Autentique
- Percentual de honorários **editável por lead** (20% a 50%, padrão 50%)
- **Banco de dados compartilhado** (SQLite local) — você e seu sócio veem os mesmos leads via Hamachi / LAN
- Anexo de contratos bancários (PDF/imagem)

## Estrutura

```
leme-crm/
├── server/   # Node.js + Express + SQLite — API e banco de dados
└── client/   # React + Vite — interface web
```

## Instalação (uma vez só)

Pré-requisitos: **Node.js 20+** ([nodejs.org](https://nodejs.org))

### 1. Backend (servidor)

Abra um terminal na pasta `server/`:

```bash
cd server
npm install
npm start
```

Você verá:

```
╔════════════════════════════════════════════════╗
║  Leme Financeira — CRM Server                  ║
║  Rodando em http://0.0.0.0:4000                ║
╚════════════════════════════════════════════════╝
```

O arquivo do banco fica em `server/leme-crm.db`. **Faça backup desse arquivo periodicamente** (é todo o seu CRM).

### 2. Frontend (interface)

Em **outro terminal**, na pasta `client/`:

```bash
cd client
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador. Pronto.

---

## Acesso do sócio (via Hamachi / Radmin / Tailscale)

1. Você (host) precisa ter o **servidor** (porta 4000) e o **frontend** (porta 5173) rodando.
2. Descubra seu IP da rede virtual (no Hamachi, é algo como `25.x.x.x`).
3. O sócio abre no navegador: `http://SEU_IP:5173`
4. No navegador dele, abra o **Console** (F12 → aba Console) e cole:
   ```js
   localStorage.setItem("LEME_API_BASE", "http://SEU_IP:4000"); location.reload();
   ```
   (Substitua `SEU_IP` pelo IP real.)
5. A partir daí ele acessa o mesmo banco de dados que você.

> **Firewall:** se ele não conseguir abrir, libere as portas 4000 e 5173 no firewall do Windows ou no antivírus.

---

## Build para produção (opcional)

Quer rodar em modo "production" mais leve?

```bash
cd client
npm run build
# Os arquivos vão para client/dist/
```

Depois você pode servir `client/dist` por qualquer servidor estático (ou copiar os arquivos para `server/` e servi-los pelo Express — me peça se quiser que eu faça essa integração).

---

## Backup do banco

Visite `http://localhost:4000/api/backup` para baixar uma cópia do arquivo `.db`.
Salve essa cópia em algum drive seguro (Google Drive, pen drive, etc.) toda semana, ou sempre que quiser.

---

## Dúvidas comuns

**O contrato gerado é juridicamente válido?**
Sim, é um contrato civil de prestação de serviços. Para garantir robustez, sempre envie pelo Autentique (assinatura digital com validade jurídica — Lei nº 14.063/2020 e MP 2.200-2/2001). Para casos delicados ou de alto valor, sempre consulte um advogado.

**E se eu quiser que a IA leia o PDF do contrato bancário e preencha os dados sozinha?**
Hoje o sistema está preparado para preenchimento manual. A integração com IA (Claude/OpenAI) pode ser plugada depois — basta me avisar.

**E se eu quiser hospedar online?**
O backend é Node + SQLite, então roda em qualquer VPS (DigitalOcean, Hetzner, Oracle Cloud Free, etc.). Me avise quando quiser dar esse passo.
