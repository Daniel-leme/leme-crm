/**
 * Gerador do CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADMINISTRATIVOS
 * (Verificação Extrajudicial de Seguros em Contrato de Financiamento)
 *
 * Estrutura inspirada no modelo Justo Já, adaptada para a Leme Financeira.
 * Usa jsPDF para gerar um PDF A4 que será enviado ao Autentique para assinatura.
 */
import { jsPDF } from 'jspdf'
import { fmtDate } from '../constants'

const PAGE_W   = 210  // mm (A4)
const MARGIN_X = 22
const TEXT_W   = PAGE_W - MARGIN_X * 2
const MARGIN_TOP = 22
const BOTTOM_LIMIT = 277 // antes do rodapé

const FONT_BODY = 11
const LINE_H    = 5.2

function nowBR() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

/**
 * Helper: escreve um parágrafo justificado, quebrando página se necessário.
 * Mantém um cursor `state.y`.
 */
function writeParagraph(doc, text, state, opts = {}) {
  const { bold = false, align = 'justify', spaceAfter = 3, indent = 0 } = opts
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(FONT_BODY)

  const lines = doc.splitTextToSize(text, TEXT_W - indent)
  for (const ln of lines) {
    if (state.y > BOTTOM_LIMIT) {
      doc.addPage()
      state.y = MARGIN_TOP
      drawPageHeader(doc, state)
    }
    doc.text(ln, MARGIN_X + indent, state.y, { align: align === 'center' ? 'center' : 'left', maxWidth: TEXT_W - indent })
    state.y += LINE_H
  }
  state.y += spaceAfter
}

function writeCenter(doc, text, state, opts = {}) {
  const { bold = false, size = FONT_BODY, spaceAfter = 4 } = opts
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  if (state.y > BOTTOM_LIMIT) {
    doc.addPage()
    state.y = MARGIN_TOP
    drawPageHeader(doc, state)
  }
  doc.text(text, PAGE_W / 2, state.y, { align: 'center' })
  state.y += size * 0.5 + spaceAfter
}

function clauseHeader(doc, label, state) {
  if (state.y > BOTTOM_LIMIT - 10) {
    doc.addPage()
    state.y = MARGIN_TOP
    drawPageHeader(doc, state)
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FONT_BODY)
  doc.text(label, MARGIN_X, state.y)
  state.y += LINE_H + 1
}

function drawPageHeader(doc, state) {
  // pequeno cabeçalho no topo das páginas continuadas
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('Leme Financeira — Contrato de Prestação de Serviços Administrativos',
    PAGE_W / 2, 12, { align: 'center' })
  doc.setTextColor(0)
  state.y = MARGIN_TOP
}

function drawFooter(doc) {
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140)
    doc.text(`Página ${i} de ${pages}`, PAGE_W / 2, 287, { align: 'center' })
    doc.setTextColor(0)
  }
}

/**
 * Gera o PDF do contrato e retorna o objeto jsPDF.
 * @param {object} lead - dados do lead/contratante
 * @param {object} settings - dados da empresa (Leme)
 */
export function generateContractPDF(lead, settings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const state = { y: MARGIN_TOP }

  // ── Título ────────────────────────────────────────────────────────────────
  writeCenter(doc, 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADMINISTRATIVOS',
    state, { bold: true, size: 12, spaceAfter: 1 })
  writeCenter(doc, '(Verificação Extrajudicial de Seguros em Contrato de Financiamento)',
    state, { bold: false, size: 10, spaceAfter: 6 })

  // ── Qualificação das partes ───────────────────────────────────────────────
  const contratanteLine =
    `${(lead.name || '____________').toUpperCase()}, brasileiro(a), ` +
    `${lead.rg ? `portador(a) do RG nº ${lead.rg}, ` : ''}` +
    `inscrito(a) no CPF sob o nº ${lead.cpf || '___.___.___-__'}, ` +
    `${lead.birthDate ? `nascido(a) em ${fmtDate(lead.birthDate)}, ` : ''}` +
    `${lead.email ? `e-mail ${lead.email}, ` : ''}` +
    `residente e domiciliado(a) ${lead.address || '_______________________________'}, ` +
    `neste ato denominado(a) Contratante.`
  writeParagraph(doc, contratanteLine, state, { spaceAfter: 4 })

  const contratadaLine =
    `De outro lado, denominado Contratado, ${settings.companyLegalName || settings.companyName}` +
    ` (nome fantasia: ${settings.companyName}), pessoa jurídica de direito privado, ` +
    `inscrita no CNPJ sob o nº ${settings.companyCnpj}, com sede em ${settings.companyAddress}.`
  writeParagraph(doc, contratadaLine, state, { spaceAfter: 4 })

  writeParagraph(doc,
    'Têm entre as mesmas, de maneira justa e acordada, o presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADMINISTRATIVOS, ficando desde já aceito, pelas cláusulas abaixo descritas:',
    state, { spaceAfter: 5 }
  )

  // ── Cláusula 1 — Objeto ───────────────────────────────────────────────────
  clauseHeader(doc, 'Do Objeto do Contrato', state)
  writeParagraph(doc,
    'Cláusula Primeira. O presente contrato tem por objeto a prestação de serviços administrativos e de verificação extrajudicial relacionados a contratos de financiamento dos Contratantes, consistindo em:',
    state, { spaceAfter: 1 }
  )
  ;[
    'a) conferência dos documentos fornecidos;',
    'b) identificação de cobranças de seguros vinculados ao financiamento;',
    'c) levantamento de valores e periodicidades, caso haja;',
    'd) auxílio para solicitar esclarecimentos ao banco, bem como devolução de valores pertinentes;',
    'e) organização das informações coletadas.',
  ].forEach(t => writeParagraph(doc, t, state, { indent: 4, spaceAfter: 0 }))
  state.y += 2

  const contratoTexto = lead.contractNumber
    ? `${lead.contractType || 'Contrato'} nº ${lead.contractNumber} – ${lead.bank || 'Instituição financeira'}`
    : `${lead.contractType || 'Contrato de financiamento'} – ${lead.bank || 'Instituição financeira a verificar'}`

  writeParagraph(doc,
    `Parágrafo Primeiro. Será verificado o seguinte contrato: ${contratoTexto}.`,
    state, { spaceAfter: 2 }
  )
  writeParagraph(doc,
    'Parágrafo Segundo. O serviço é estritamente administrativo, sem análise jurídica, parecer ou declaração de abusividade.',
    state, { spaceAfter: 5 }
  )

  // ── Cláusula 2 — Limitações ───────────────────────────────────────────────
  clauseHeader(doc, 'Das Limitações dos Serviços', state)
  writeParagraph(doc,
    'Cláusula Segunda. O Contratado não presta serviços jurídicos, não revisa cláusulas, não declara abusividade e não pratica atos privativos da advocacia, contudo, caso julgue necessário e pertinente, a contratação de outros profissionais, entre advogados e peritos, no decurso do processo, o Contratado indicará escritório de seu conhecimento, sendo facultado aos Contratantes aceitá-lo ou não. Aceitando, ficará sob a responsabilidade, única e exclusivamente, dos Contratantes no que concerne aos honorários e às atividades a serem exercidas.',
    state, { spaceAfter: 5 }
  )

  // ── Cláusula 3 — Obrigações do Contratado ─────────────────────────────────
  clauseHeader(doc, 'Das Obrigações do(a) Contratado(a)', state)
  writeParagraph(doc, 'Cláusula Terceira. Constitui obrigação do Contratado:', state, { spaceAfter: 1 })
  ;[
    'a) realizar a verificação administrativa com zelo e sigilo;',
    'b) apresentar relatório administrativo;',
    'c) auxiliar o CONTRATANTE a solicitar esclarecimentos ao banco.',
  ].forEach(t => writeParagraph(doc, t, state, { indent: 4, spaceAfter: 0 }))
  state.y += 4

  // ── Cláusula 4 — Obrigações do Contratante ────────────────────────────────
  clauseHeader(doc, 'Das Obrigações do Contratante', state)
  writeParagraph(doc, 'Cláusula Quarta. Constitui obrigação do(s) Contratante(s):', state, { spaceAfter: 1 })
  ;[
    'a) fornecer documentos e informações;',
    'b) pagar os valores acordados;',
    'c) compreender que o serviço não é jurídico.',
  ].forEach(t => writeParagraph(doc, t, state, { indent: 4, spaceAfter: 0 }))
  state.y += 4

  // ── Cláusula 5 — Autorização para contato com o banco ─────────────────────
  clauseHeader(doc, 'Da Autorização para Contato com o Banco', state)
  writeParagraph(doc,
    'Cláusula Quinta. O(s) Contratante(s) autoriza(m) expressamente o Contratado a realizar contatos administrativos com a instituição financeira responsável pelo contrato de financiamento, exclusivamente para:',
    state, { spaceAfter: 1 }
  )
  ;[
    'a) solicitar segunda via de documentos, extratos ou informações administrativas;',
    'b) solicitar esclarecimentos sobre valores cobrados, seguros vinculados e serviços agregados;',
    'c) acompanhar pedidos administrativos abertos pelo(s) Contratante(s);',
    'd) solicitar o levantamento de valores que o(a) Contratante(s) tiver(em) direito em detrimento do objeto do presente contrato.',
  ].forEach(t => writeParagraph(doc, t, state, { indent: 4, spaceAfter: 0 }))
  state.y += 2
  writeParagraph(doc,
    'Parágrafo Primeiro. A presente autorização não permite que o Contratado realize pedidos jurídicos ou contestação de cláusulas.',
    state, { spaceAfter: 5 }
  )

  // ── Cláusula 6 — Remuneração (com % editável) ─────────────────────────────
  clauseHeader(doc, 'Da Remuneração', state)
  const fee = lead.feePercent ?? 50
  const feeWritten = numberToWritten(fee)
  writeParagraph(doc,
    `Cláusula Sexta. Fica acordado entre as Partes que os valores pagos ao Contratado a título de honorários pelos serviços prestados será de ${fee}% (${feeWritten} por cento), sobre os proventos financeiros que os Contratantes vierem a ter em detrimento do presente contrato.`,
    state, { spaceAfter: 2 }
  )
  writeParagraph(doc,
    'Parágrafo Primeiro. As partes estabelecem que, havendo atraso no pagamento dos honorários, o valor será corrigido pelo IGP-M, acrescido de juros de mora capitalizados na proporção de 1% (um por cento) ao mês, e multa de 2% (dois por cento), desde a data do pagamento.',
    state, { spaceAfter: 2 }
  )
  writeParagraph(doc,
    'Parágrafo Segundo. Fica acordado que, havendo desistência ou rescisão contratual, haverá o pagamento de 30% sobre o valor total que o Contratado projetou de provento econômico aos Contratantes.',
    state, { spaceAfter: 5 }
  )

  // ── Cláusula 7 — Prazo ────────────────────────────────────────────────────
  clauseHeader(doc, 'Do Prazo', state)
  writeParagraph(doc,
    'Cláusula Sétima. O presente contrato tem prazo de duração de 30 (trinta) dias corridos.',
    state, { spaceAfter: 5 }
  )

  // ── Cláusula 8 — Foro ─────────────────────────────────────────────────────
  clauseHeader(doc, 'Do Foro', state)
  writeParagraph(doc,
    `Cláusula Oitava. O presente contrato passa a vigorar entre as partes a partir da assinatura do mesmo, elegendo-se o foro da cidade de ${settings.forumCity || 'Jundiaí/SP'}, para dirimir quaisquer dúvidas provenientes de sua execução e cumprimento.`,
    state, { spaceAfter: 6 }
  )

  // ── Data ──────────────────────────────────────────────────────────────────
  writeParagraph(doc, `${(settings.forumCity || 'Jundiaí/SP').split('/')[0]}, ${nowBR()}.`, state, { spaceAfter: 14 })

  // ── Assinaturas ───────────────────────────────────────────────────────────
  if (state.y > BOTTOM_LIMIT - 50) {
    doc.addPage()
    state.y = MARGIN_TOP
    drawPageHeader(doc, state)
  }

  const signY1 = state.y + 6
  doc.setLineWidth(0.3)
  doc.line(MARGIN_X + 20, signY1, MARGIN_X + TEXT_W - 20, signY1)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text((lead.name || 'CONTRATANTE').toUpperCase(), PAGE_W / 2, signY1 + 5, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`CPF: ${lead.cpf || '___.___.___-__'}`, PAGE_W / 2, signY1 + 10, { align: 'center' })
  doc.setTextColor(0)
  state.y = signY1 + 22

  const signY2 = state.y + 6
  doc.line(MARGIN_X + 20, signY2, MARGIN_X + TEXT_W - 20, signY2)
  doc.setFontSize(10)
  doc.text((settings.companyLegalName || settings.companyName).toUpperCase(), PAGE_W / 2, signY2 + 5, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`CNPJ: ${settings.companyCnpj}`, PAGE_W / 2, signY2 + 10, { align: 'center' })
  doc.setTextColor(0)

  drawFooter(doc)
  return doc
}

// ─── util: escreve por extenso (0-100) ────────────────────────────────────────
function numberToWritten(n) {
  const map = {
    0:'zero',1:'um',2:'dois',3:'três',4:'quatro',5:'cinco',6:'seis',7:'sete',8:'oito',9:'nove',
    10:'dez',11:'onze',12:'doze',13:'treze',14:'quatorze',15:'quinze',16:'dezesseis',17:'dezessete',18:'dezoito',19:'dezenove',
    20:'vinte',30:'trinta',40:'quarenta',50:'cinquenta',60:'sessenta',70:'setenta',80:'oitenta',90:'noventa',100:'cem',
  }
  if (map[n]) return map[n]
  const dezena = Math.floor(n/10)*10
  const unidade = n%10
  if (map[dezena] && map[unidade]) return `${map[dezena]} e ${map[unidade]}`
  return String(n)
}
