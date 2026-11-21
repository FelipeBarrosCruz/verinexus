# Identidade: níveis, step-up e OIDC simulado

## Níveis de garantia
| Nível | O que comprova | Como é obtido |
|---|---|---|
| `bronze` | E-mail/telefone | Cadastro simples |
| `prata` | Documento válido | Upload e validação do documento (simulada) |
| `ouro` | Documento + liveness | Selfie com liveness passivo/ativo (simulado), mesa humana se ambíguo |

## Regras de step-up (liveness como desafio)
O liveness **não** é pedido a cada uso. Uso diário: passkey ou biometria local do aparelho. O desafio é exigido quando:
1. o aparelho é novo ou o passkey não existe;
2. a ação é sensível (recuperar conta, trocar dados, valor acima de um limite configurável);
3. há sinal anômalo (muitas tentativas, local incomum, na POC um flag de teste);
4. o site de terceiros exige nível maior que o do usuário (`acr_values` na requisição OIDC).

Ordem do desafio: passivo → ativo → mesa humana (`05-mesa-educacao-painel.md`).

## OIDC simulado (papel do gov.br/pi.gov.br)
- Implementar um provedor OIDC de teste com discovery, `authorize` (code + PKCE), `token`, `userinfo` e JWKS.
- Claims: `sub`, `name`, `acr` (`bronze|prata|ouro`), `amr` (`pwd`, `passkey`, `face`), dados sintéticos.
- Um **site de terceiros de exemplo** (ex.: "Portal de Editais Fictício") se integra como cliente e pede `acr_values=ouro`, disparando o desafio.
- Todos os usuários, documentos e rostos são fictícios.

## Endpoints próprios
- `POST /v1/identity/challenge` → `{ "challenge_id": string, "type": "passive"|"active" }`; resultado `{ "passed": bool, "ambiguous": bool }`.
- `POST /v1/identity/desk-case` abre caso na mesa quando `ambiguous: true`.

## Segurança
- PKCE e `state` obrigatórios; tokens de curta duração; nenhum dado biométrico armazenado na POC (apenas o resultado do desafio).
