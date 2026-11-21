# Análise de conteúdo (táticas de manipulação)

Entrada: texto (ou transcrição). Saída: `alert` e lista de `tactics` (`01-api.md`). Na POC, regras por palavras-chave e padrões em português, com possibilidade de trocar por um modelo de linguagem atrás da mesma interface.

## Táticas
| Código | Sinais (exemplos) |
|---|---|
| `urgency` | "agora", "urgente", "rápido", "antes das 18h", "não tenho tempo" |
| `secrecy` | "não conta pra ninguém", "é segredo", "não fala com mamãe" |
| `money_request` | "pix", "transferência", "depósito", "paga pra mim", valor em reais, chave pix |
| `new_number` | "troquei de número", "esse é meu número novo", "perdi meu celular" |
| `credential_request` | "me manda o código", "senha", "token", "CPF e foto do documento" |
| `emotional_pressure` | "tô em apuros", "preso", "acidente", "hospital", "sequestro" |

## Nível de alerta
- `high`: duas ou mais táticas, e entre elas `money_request` ou `credential_request`.
- `medium`: uma tática de pressão (`urgency`, `secrecy`, `emotional_pressure`, `new_number`) ou `money_request` isolado.
- `low`: nenhuma tática. Resposta inclui o aviso de que ausência de sinais não é garantia.

## Conselhos por nível
- `high`: parar; ligar em vídeo para o número salvo; confirmar com outro parente; palavra-chave da família; MED do Pix e SaferNet se já pagou.
- `medium`: mesma lista, mais curta.
- `low`: "Não achamos sinais, mas confirme antes de pagar."

## Casos de teste (golden)
1. "Vó, sou eu, troquei de número. Faz um pix de 800 agora e não conta pra ninguém." → `high`; táticas: `new_number`, `money_request`, `urgency`, `secrecy`.
2. "Oi, vamos almoçar domingo?" → `low`.
3. "Me manda o código que chegou no seu celular." → `medium` ou superior (`credential_request`).
4. Texto vazio → erro 400.
5. Texto em outro idioma → `low` com aviso de limitação.

## Limites
Transcrição pode errar (sotaque, ruído): em dúvida, subir o nível. Nenhuma saída diz que o áudio é falso ou autêntico.
