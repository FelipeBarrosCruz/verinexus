# VeriNexus — Visão geral para a POC/MVP

Contexto: ideathon, sem acesso a serviços oficiais. A POC **simula** gov.br/pi.gov.br, WhatsApp, liveness e bases de vazamento, com dados 100% sintéticos. Decisões de produto em `docs/superpowers/specs/2026-11-21-ideathon-solucao-design.md`.

## Objetivo da POC
Demonstrar em 3 minutos, de ponta a ponta: (1) áudio encaminhado ao WhatsApp e resposta com orientações; (2) verificação de site pela extensão e pela landing; (3) login com step-up de identidade (OIDC simulado); (4) mesa humana resolvendo um caso; (5) trilha educativa; (6) painel de métricas.

## Componentes
| Componente | Responsabilidade | Doc |
|---|---|---|
| Core API | Motor único de verificação; todos os canais são clientes dela | `01-api.md` |
| Canais | Extensão, landing, simulador de WhatsApp | `02-canais.md` |
| Análise de conteúdo | Táticas de manipulação em texto/transcrição | `03-analise-de-conteudo.md` |
| Identidade | Níveis de garantia, step-up, OIDC simulado | `04-identidade.md` |
| Mesa, educação e painel | Fila humana, trilhas, métricas | `05-mesa-educacao-painel.md` |
| Simulação e aceite | Mocks, dados sintéticos, critérios | `06-simulacao-e-aceite.md` |

## Princípios
- Um núcleo, canais finos: nenhuma lógica de decisão dentro de um canal.
- Nunca afirmar "autêntico" ou "é deepfake". Respostas são sinais e orientações.
- Minimização: áudio e transcrição descartados após o processamento; só contagens anônimas permanecem.
- Dados de menores só com finalidade explícita; na POC, nenhum dado real.
- Stack livre; preferir o mais simples (um backend HTTP, um front web, um simulador de conversa).

## Fora do escopo da POC
Integração real com gov.br, Meta/WhatsApp, provedores de liveness, bases reais de vazamento; detecção de voz sintética por modelo.
