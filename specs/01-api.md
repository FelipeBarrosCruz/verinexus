# API de verificação (Core API)

Base: `/v1`. JSON. Autenticação dos canais por chave de cliente (`X-Client-Key`); a API de identidade usa OIDC (`04-identidade.md`).

## Contratos

### POST `/v1/verify/url`
Entrada: `{ "url": string, "channel": "extension"|"landing"|"whatsapp"|"app"|"partner" }`
Saída: `{ "verdict": "safe_signals"|"suspicious"|"dangerous"|"unknown", "badge": "verified"|null, "reasons": [{ "code": string, "text": string }], "advice": string[] }`
- `badge: "verified"` só para domínios da lista de serviços oficiais cadastrados.
- `safe_signals` significa "não encontramos sinais de risco", nunca "seguro".

### POST `/v1/verify/message`
Entrada: `{ "text": string, "source": "whatsapp_audio_transcript"|"whatsapp_text", "locale": "pt-BR" }`
Saída: `{ "alert": "low"|"medium"|"high", "tactics": [{ "code": "urgency"|"secrecy"|"money_request"|"new_number"|"credential_request"|"emotional_pressure", "evidence": string }], "advice": string[], "disclaimer": string }`
- Regras e exemplos em `03-analise-de-conteudo.md`.

### POST `/v1/verify/audio-meta`
Entrada: `{ "metadata": object }`. Saída: `{ "signal": "no_edit_signals"|"edit_signals"|"unverifiable" }`. Sinal secundário; jamais determina sozinho o alerta.

### POST `/v1/breach/check`
Entrada: `{ "hash_prefix": string }` (prefixo do hash do e-mail/CPF; k-anonymity). Saída: `{ "matches": string[] }`. O servidor não recebe o dado em claro.

### Identidade
`GET /oidc/.well-known/openid-configuration`, `/oidc/authorize`, `/oidc/token`, `/oidc/userinfo` (ver `04-identidade.md`), e `POST /v1/identity/challenge` e `POST /v1/identity/desk-case` para step-up e mesa.

### Métricas
`GET /v1/metrics/summary` → `{ "scams_prevented": int, "sites_flagged": int, "people_trained": int, "desk_operators": int }`. Só contagens anônimas.

## Erros
`{ "error": { "code": string, "message": string } }`, com 400 (entrada inválida), 401 (chave ou token), 429 (limite).

## Regras comuns
- Nenhum endpoint persiste conteúdo de mensagens, áudio ou transcrições.
- Todo `advice` é em português simples, frases curtas.
