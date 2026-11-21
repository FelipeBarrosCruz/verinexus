# Simulação, dados sintéticos e critérios de aceite

## O que é simulado
| Real | Simulação na POC |
|---|---|
| gov.br / pi.gov.br (OIDC) | Provedor OIDC de teste com discovery, code+PKCE, JWKS (`04-identidade.md`) |
| WhatsApp Business API | Simulador de chat com webhook falso e transcrição pré-pronta |
| Liveness e validação de documento | Serviço que devolve `passed`/`ambiguous` por regra ou flag de teste |
| Base de vazamentos | Arquivo sintético de hashes; consulta por prefixo (k-anonymity) |
| Reputação de sites | Lista fictícia de domínios maliciosos e de domínios oficiais |
| Painel | Gerador de contagens sintéticas, rotulado como demonstração |

## Dados sintéticos
Pessoas, CPFs, documentos, rostos, áudios e números de telefone são inventados. Nenhum dado pessoal real entra no repositório.

## Roteiro de demonstração (≈ 3 min)
1. Simulador de WhatsApp: enviar o áudio de exemplo (golden 1) → resposta `high` com ações.
2. Landing: colar uma URL da lista maliciosa → `dangerous`; colar a de um domínio oficial → `badge: verified`.
3. Extensão: abrir página fictícia com campo de CPF → aviso antes do envio.
4. Portal fictício pede `acr_values=ouro` → desafio de liveness → caso ambíguo → mesa aprova.
5. Trilha educativa: concluir um desafio e subir de nível.
6. Painel com os quatro contadores.

## Critérios de aceite
- Os cinco casos golden de `03-analise-de-conteudo.md` passam.
- `verify/url` devolve `badge: verified` apenas para domínios oficiais da lista.
- Nenhuma resposta usa as palavras "autêntico" ou "é deepfake".
- Resposta `low` para pedido de dinheiro termina com "confirme antes de pagar".
- Login `prata` em cliente que exige `ouro` dispara o desafio; login que já é `ouro` não dispara.
- Nenhum endpoint persiste áudio, transcrição ou texto; verificado por inspeção do armazenamento.
- O fluxo da demonstração roda de ponta a ponta sem acesso a serviços externos.
