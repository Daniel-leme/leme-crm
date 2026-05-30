-- ─── Seed Leme CRM ───────────────────────────────────────────────────────────
-- Limpa dados existentes (ordem respeitando FK)
DELETE FROM tasks;
DELETE FROM contracts;
DELETE FROM operations;
DELETE FROM leads;

-- ─── LEADS ───────────────────────────────────────────────────────────────────

INSERT INTO leads (id, name, cpf, rg, "birthDate", email, phone, address, responsible, bank, "contractType", "contractNumber", source, status, "feePercent", "embeddedValue", "productsCount", notes, "lossReason", "lastActiveStatus", "adCampaign", "adSet", "adName", "isLost", "createdAt", "updatedAt") VALUES

-- Funil: Novo Lead
('lead001', 'Carlos Eduardo Mendes', '321.654.987-00', '12.345.678-9', '1978-03-15', 'carlos.mendes@gmail.com', '(11) 98765-4321', 'Rua das Flores, 123 - Jundiaí/SP', 'Riquelme', '', '', '', 'Instagram', 'Novo Lead', 50, 0, 0, 'Interessado em refinanciamento', '', '', 'Camp_Instagram_Maio', 'Conjunto_Refinanciamento', 'Anuncio_Refin_01', 0, '2026-05-10T08:00:00.000Z', '2026-05-10T08:00:00.000Z'),

('lead002', 'Ana Paula Ferreira', '456.789.123-11', '23.456.789-0', '1985-07-22', 'ana.ferreira@hotmail.com', '(11) 91234-5678', 'Av. Brasil, 456 - Itupeva/SP', 'Daniel', '', '', '', 'Facebook', 'Novo Lead', 50, 0, 0, 'Quer simular portabilidade', '', '', 'Camp_Facebook_Maio', 'Conjunto_Port', 'Anuncio_Port_01', 0, '2026-05-12T09:30:00.000Z', '2026-05-12T09:30:00.000Z'),

('lead003', 'Roberto Silva Santos', '789.123.456-22', '34.567.890-1', '1965-11-08', 'roberto.santos@gmail.com', '(11) 97654-3210', 'Rua São Paulo, 789 - Várzea Paulista/SP', 'Riquelme', '', '', '', 'WhatsApp', 'Novo Lead', 50, 0, 0, '', '', '', '', '', '', 0, '2026-05-20T14:00:00.000Z', '2026-05-20T14:00:00.000Z'),

-- Funil: Qualificação
('lead004', 'Marcia Oliveira Lima', '147.258.369-33', '45.678.901-2', '1972-05-30', 'marcia.lima@yahoo.com', '(11) 96543-2109', 'Rua Independência, 321 - Jundiaí/SP', 'Daniel', 'Bradesco', 'Consignado', '', 'Indicação', 'Qualificação', 55, 0, 0, 'Aposentada INSS, quer crédito consignado', '', '', '', '', '', 0, '2026-05-05T10:00:00.000Z', '2026-05-22T10:00:00.000Z'),

('lead005', 'José Antonio Rodrigues', '258.369.147-44', '56.789.012-3', '1958-09-14', 'jose.rodrigues@gmail.com', '(11) 95432-1098', 'Av. das Nações, 654 - Jundiaí/SP', 'Riquelme', 'Itaú', 'Portabilidade', '', 'Google', 'Qualificação', 50, 0, 0, 'Servidor público municipal, quer portabilidade do Itaú', '', '', 'Camp_Google_Abr', 'Conjunto_Servidor', 'Anuncio_Serv_02', 0, '2026-05-08T11:00:00.000Z', '2026-05-21T11:00:00.000Z'),

-- Funil: Qualificado
('lead006', 'Fernanda Costa Alves', '369.147.258-55', '67.890.123-4', '1980-02-18', 'fernanda.alves@gmail.com', '(11) 94321-0987', 'Rua Progresso, 987 - Jundiaí/SP', 'Daniel', 'Caixa Econômica', 'Consignado', '', 'Instagram', 'Qualificado', 60, 18500, 2, 'Funcionária pública estadual, margem disponível boa', '', '', 'Camp_Instagram_Maio', 'Conjunto_Consig', 'Anuncio_Consig_03', 0, '2026-04-28T09:00:00.000Z', '2026-05-19T09:00:00.000Z'),

('lead007', 'Paulo Henrique Martins', '147.369.258-66', '78.901.234-5', '1970-12-03', 'paulo.martins@outlook.com', '(11) 93210-9876', 'Rua Liberdade, 159 - Itupeva/SP', 'Riquelme', 'BMG', 'Refinanciamento', '', 'Facebook', 'Qualificado', 50, 12000, 1, 'Tem contrato no BMG, quer refinar para reduzir parcela', '', '', 'Camp_Facebook_Abr', 'Conjunto_Refin', 'Anuncio_Refin_02', 0, '2026-04-25T14:00:00.000Z', '2026-05-18T14:00:00.000Z'),

-- Funil: Revisão
('lead008', 'Sandra Aparecida Souza', '258.147.369-77', '89.012.345-6', '1967-08-25', 'sandra.souza@gmail.com', '(11) 92109-8765', 'Av. Jundiaí, 753, Jundiaí/SP', 'Daniel', 'Santander', 'Portabilidade', 'PORT-2024-001', 'Indicação', 'Revisão', 55, 35000, 3, 'Portabilidade do Santander aprovada, aguardando revisão do contrato', '', '', '', '', '', 0, '2026-04-15T08:00:00.000Z', '2026-05-25T08:00:00.000Z'),

-- Funil: Contrato Assinado (gera operação)
('lead009', 'Marcos Vinícius Pereira', '369.258.147-88', '90.123.456-7', '1975-04-10', 'marcos.pereira@gmail.com', '(11) 91098-7654', 'Rua Dom Pedro, 852 - Jundiaí/SP', 'Riquelme', 'Banco do Brasil', 'Consignado', 'CONS-2026-0091', 'Google', 'Contrato Assinado', 50, 28000, 2, 'Contrato assinado, aguardando liberação', '', '', 'Camp_Google_Mai', 'Conjunto_Consig', 'Anuncio_Consig_05', 0, '2026-04-01T10:00:00.000Z', '2026-05-20T10:00:00.000Z'),

('lead010', 'Luciana Dias Carvalho', '741.852.963-99', '01.234.567-8', '1982-06-17', 'luciana.carvalho@hotmail.com', '(11) 90987-6543', 'Rua das Palmeiras, 246 - Jundiaí/SP', 'Daniel', 'Sicoob', 'Portabilidade', 'PORT-2026-0102', 'Instagram', 'Contrato Assinado', 60, 45000, 3, 'Portabilidade finalizada, contrato assinado', '', '', 'Camp_Instagram_Abr', 'Conjunto_Port', 'Anuncio_Port_03', 0, '2026-03-20T11:00:00.000Z', '2026-05-15T11:00:00.000Z'),

('lead011', 'Antônio Carlos Barbosa', '852.963.741-10', '12.345.678-0', '1960-01-25', 'antonio.barbosa@gmail.com', '(11) 99876-5432', 'Av. Campinas, 369 - Várzea Paulista/SP', 'Riquelme', 'Facta', 'Consignado', 'CONS-2026-0115', 'WhatsApp', 'Contrato Assinado', 55, 22000, 2, 'Aposentado INSS, contrato liberado pelo banco', '', '', '', '', '', 0, '2026-03-10T09:00:00.000Z', '2026-05-10T09:00:00.000Z'),

-- Leads perdidos
('lead012', 'Beatriz Helena Nunes', '963.741.852-21', '23.456.789-1', '1990-10-05', 'beatriz.nunes@gmail.com', '(11) 98765-1234', 'Rua Nova, 480 - Jundiaí/SP', 'Daniel', 'Nubank', 'Portabilidade', '', 'Facebook', 'Qualificado', 50, 0, 0, 'Não atendeu mais após proposta enviada', 'Sem Contato', 'Qualificado', '', '', '', 1, '2026-04-10T10:00:00.000Z', '2026-05-05T10:00:00.000Z'),

('lead013', 'Ricardo Ferreira Gomes', '111.222.333-44', '34.567.890-2', '1955-03-30', 'ricardo.gomes@yahoo.com', '(11) 97654-1234', 'Rua Central, 123 - Itupeva/SP', 'Riquelme', 'Pan Americano', 'Refinanciamento', '', 'Google', 'Qualificação', 50, 0, 0, 'Margem insuficiente para aprovação', 'Desqualificado', 'Qualificação', '', '', '', 1, '2026-04-20T14:00:00.000Z', '2026-05-08T14:00:00.000Z');

-- ─── OPERATIONS (apenas para leads com status Contrato Assinado) ──────────────

INSERT INTO operations (id, lead_id, status, "isLost", "lossReason", "lastActiveStatus", responsible, notes, "distributionNotes", "embeddedValue", "feePercent", "repaymentValue", "createdAt", "updatedAt") VALUES

('op001', 'lead009', 'Documentação', 0, '', '', 'Riquelme', 'Aguardando documentos do cliente', 'Comissão a ser paga em 30 dias', 28000, 50, 14000, '2026-05-20T10:00:00.000Z', '2026-05-25T10:00:00.000Z'),

('op002', 'lead010', 'Aguardando Estorno', 0, '', '', 'Daniel', 'Documentação completa, aguardando estorno no banco', 'Distribuição acordada com equipe', 45000, 60, 27000, '2026-05-15T11:00:00.000Z', '2026-05-28T11:00:00.000Z'),

('op003', 'lead011', 'Concluído', 0, '', '', 'Riquelme', 'Operação finalizada com sucesso', 'Comissão paga em 15/05/2026', 22000, 55, 12100, '2026-05-10T09:00:00.000Z', '2026-05-20T09:00:00.000Z');

-- ─── CONTRACTS ────────────────────────────────────────────────────────────────

INSERT INTO contracts (id, lead_id, bank, type, status, "embeddedValue", "productsCount", notes, "pdfFile", "pdfName", "createdAt", "updatedAt") VALUES

-- Contratos do lead006 (Qualificado)
('cont001', 'lead006', 'Caixa Econômica', 'Consignado', 'Revisar contrato', 18500, 2, 'Contrato gerado, aguardando revisão do cliente', '', '', '2026-05-15T09:00:00.000Z', '2026-05-19T09:00:00.000Z'),

-- Contratos do lead007 (Qualificado)
('cont002', 'lead007', 'BMG', 'Refinanciamento', 'Aguardando envio', 12000, 1, 'Proposta preparada para envio', '', '', '2026-05-18T14:00:00.000Z', '2026-05-18T14:00:00.000Z'),

-- Contratos do lead008 (Revisão)
('cont003', 'lead008', 'Santander', 'Portabilidade', 'Revisar contrato', 35000, 3, 'Banco aprovou a portabilidade, contrato enviado para revisão', '', '', '2026-05-20T08:00:00.000Z', '2026-05-25T08:00:00.000Z'),

-- Contratos do lead009 (Contrato Assinado)
('cont004', 'lead009', 'Banco do Brasil', 'Consignado', 'Contrato assinado', 28000, 2, 'Assinado digitalmente pelo cliente', '', '', '2026-05-10T10:00:00.000Z', '2026-05-20T10:00:00.000Z'),

-- Contratos do lead010 (Contrato Assinado)
('cont005', 'lead010', 'Sicoob', 'Portabilidade', 'Contrato assinado', 45000, 3, 'Portabilidade concluída, contrato assinado em cartório', '', '', '2026-05-01T11:00:00.000Z', '2026-05-15T11:00:00.000Z'),

-- Contratos do lead011 (Contrato Assinado)
('cont006', 'lead011', 'Facta', 'Consignado', 'Contrato assinado', 22000, 2, 'Contrato assinado e enviado ao banco', '', '', '2026-04-28T09:00:00.000Z', '2026-05-10T09:00:00.000Z');

-- ─── TASKS ───────────────────────────────────────────────────────────────────

INSERT INTO tasks (id, lead_id, contract_id, type, description, "assignedTo", "dueDate", "dueTime", status, "isAuto", "createdAt", "updatedAt") VALUES

-- Tarefas pendentes para novos leads
('task001', 'lead001', '', 'Ligação', 'Entrar em contato para apresentar proposta de refinanciamento', 'Riquelme', '2026-06-02', '10:00', 'pending', 0, '2026-05-10T08:00:00.000Z', '2026-05-10T08:00:00.000Z'),

('task002', 'lead002', '', 'WhatsApp / Follow-up', 'Enviar simulação de portabilidade via WhatsApp', 'Daniel', '2026-06-02', '14:00', 'pending', 0, '2026-05-12T09:30:00.000Z', '2026-05-12T09:30:00.000Z'),

('task003', 'lead003', '', 'Ligação', 'Primeira ligação de qualificação', 'Riquelme', '2026-06-01', '09:00', 'pending', 0, '2026-05-20T14:00:00.000Z', '2026-05-20T14:00:00.000Z'),

-- Tarefas para leads em qualificação
('task004', 'lead004', '', 'Ligação', 'Solicitar extrato INSS e documentos pessoais', 'Daniel', '2026-06-03', '10:00', 'pending', 0, '2026-05-22T10:00:00.000Z', '2026-05-22T10:00:00.000Z'),

('task005', 'lead005', '', 'Envio de documento', 'Enviar formulário de portabilidade para assinar', 'Riquelme', '2026-06-03', '15:00', 'pending', 0, '2026-05-21T11:00:00.000Z', '2026-05-21T11:00:00.000Z'),

-- Tarefas para leads qualificados
('task006', 'lead006', 'cont001', 'Ligação', 'Ligar para confirmar revisão do contrato Caixa', 'Daniel', '2026-06-01', '11:00', 'pending', 1, '2026-05-19T09:00:00.000Z', '2026-05-19T09:00:00.000Z'),

('task007', 'lead007', 'cont002', 'WhatsApp / Follow-up', 'Enviar proposta de refinanciamento BMG para aprovação', 'Riquelme', '2026-06-02', '16:00', 'pending', 0, '2026-05-18T14:00:00.000Z', '2026-05-18T14:00:00.000Z'),

-- Tarefa urgente de revisão
('task008', 'lead008', 'cont003', 'Ligação', 'Apresentar contrato de portabilidade para assinatura', 'Daniel', '2026-06-01', '14:00', 'pending', 1, '2026-05-25T08:00:00.000Z', '2026-05-25T08:00:00.000Z'),

-- Tarefas de acompanhamento de operações
('task009', 'lead009', 'cont004', 'Ligação', 'Confirmar recebimento da documentação pelo banco', 'Riquelme', '2026-06-04', '10:00', 'pending', 0, '2026-05-25T10:00:00.000Z', '2026-05-25T10:00:00.000Z'),

('task010', 'lead010', 'cont005', 'WhatsApp / Follow-up', 'Informar cliente sobre status da averbação no Sicoob', 'Daniel', '2026-06-04', '11:00', 'pending', 0, '2026-05-28T11:00:00.000Z', '2026-05-28T11:00:00.000Z'),

-- Tarefas concluídas (histórico)
('task011', 'lead009', '', 'Ligação', 'Qualificação inicial do cliente', 'Riquelme', '2026-04-05', '10:00', 'done', 0, '2026-04-01T10:00:00.000Z', '2026-04-05T10:00:00.000Z'),

('task012', 'lead010', '', 'Reunião', 'Reunião presencial para apresentação da proposta de portabilidade', 'Daniel', '2026-04-10', '14:00', 'done', 0, '2026-03-20T11:00:00.000Z', '2026-04-10T14:00:00.000Z'),

('task013', 'lead011', '', 'Envio de documento', 'Enviar proposta ao cliente via WhatsApp', 'Riquelme', '2026-04-15', '09:00', 'done', 0, '2026-03-10T09:00:00.000Z', '2026-04-15T09:00:00.000Z'),

('task014', 'lead006', '', 'Ligação', 'Primeiro contato e qualificação', 'Daniel', '2026-05-02', '10:00', 'done', 0, '2026-04-28T09:00:00.000Z', '2026-05-02T10:00:00.000Z'),

('task015', 'lead004', '', 'WhatsApp / Follow-up', 'Enviar lista de documentos necessários', 'Daniel', '2026-05-10', '09:00', 'done', 0, '2026-05-05T10:00:00.000Z', '2026-05-10T09:00:00.000Z');
