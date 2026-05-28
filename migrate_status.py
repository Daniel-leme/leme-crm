# -*- coding: utf-8 -*-
import sqlite3

conn = sqlite3.connect('server/leme-crm.db')

lead_fixes = [
    ('Novo Lead',          '0. Novo Lead'),
    ('Qualificação',       '1. Qualificação'),
    ('Qualificado',        '2. Qualificado'),
    ('Revisão',            '3. Revisão'),
    ('Negociação',         '4. Negociação'),
    ('Contrato Assinado',  '5. Contrato Assinado'),
]

op_fixes = [
    ('Documentação',              '6. Documentação'),
    ('Solicitação de Estorno',    '7. Solicitação de Estorno'),
    ('Aguardando Estorno',        '8. Aguardando Estorno'),
    ('Cobrança',                  '9. Cobrança'),
    ('Transferência de Repasses', '10. Transferência de Repasses'),
    ('Concluído',                 '11. Concluído'),
]

for new, old in lead_fixes:
    n = conn.execute('UPDATE leads SET status=? WHERE status=?', (new, old)).rowcount
    if n:
        print(f'leads: {n} -> {new}')

for new, old in op_fixes:
    n = conn.execute('UPDATE operations SET status=? WHERE status=?', (new, old)).rowcount
    if n:
        print(f'ops: {n} -> {new}')

conn.commit()

print('\nStatus finais leads:')
for r in conn.execute('SELECT status, COUNT(*) FROM leads GROUP BY status').fetchall():
    print(' ', r[1], 'x', r[0])

conn.close()
print('Migração concluída.')
