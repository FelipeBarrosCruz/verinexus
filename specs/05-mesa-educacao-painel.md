# Mesa humana, área educativa e painel

## Mesa de validação humana
- Fila de casos abertos por `desk-case`. Estados: `open` → `in_review` → `approved` | `rejected` | `needs_more_info`.
- Tela do operador: dados sintéticos do caso, imagem de exemplo do documento e da selfie, botões de decisão e campo de justificativa.
- Regras: dois operadores concordam em casos de nível `ouro`; um operador em `prata`. SLA exibido na fila.
- O operador só vê o mínimo necessário; nenhum dado real na POC.
- Quem pode operar: concluiu a trilha "Operador de Mesa" (abaixo) e, para menores de 18 anos, não há acesso a casos com documentos de terceiros.

## Área educativa gamificada (acesso livre)
- Trilhas: **Iniciante** (reconhecer golpes), **Defensor da Família** (orientar parentes, palavra-chave, confirmação por outro canal), **Analista** (avaliar casos simulados), **Operador de Mesa** (prova prática na fila simulada).
- Mecânica: pontos, níveis, medalhas, desafios curtos com cenário (áudio/mensagem/link) e feedback imediato.
- Conteúdo de apoio com fonte: CERT.br, SaferNet, MED do Pix, Guardiões da Infância (PF).
- Dados do aluno: apenas apelido e progresso; nada de dados pessoais obrigatórios.

## Painel (para a SIA)
- Usa `GET /v1/metrics/summary`. Quatro contadores: golpes evitados, sites sinalizados, pessoas formadas, operadores ativos.
- Na POC os valores vêm de um gerador sintético; a tela mostra rótulo "dados de demonstração".
