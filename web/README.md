# VeriNexus — frontend da POC

HTML, CSS e JS puros, sem build. A Core API (`specs/01-api.md`) está simulada em `api.js`; as telas só chamam essas funções.

```sh
cd web
python3 -m http.server 8000   # abrir http://localhost:8000
node --test                   # API (casos golden) + design system (contraste AA e valores soltos)
node tokens.test.js --print   # tabela de contraste de todos os pares, claro e escuro
```

## Design system (direção "Guardião")

| Arquivo | O que tem |
|---|---|
| `tokens.css` | Único lugar com valores: cores claro/escuro, tipografia, espaço 4/8, raios, sombras, camadas, durações e curvas. |
| `components.css` | Button, Input, Select, Textarea, Choice, Card, Status, Badge, Chip, Tabs, Progress, Steps, Skeleton, EmptyState, Modal, Toast. Só usa tokens. |
| `ui.js` | Ícones e o comportamento de Modal, Toast, Tabs, carregamento, erro de campo e preferências (tema e letra maior). |
| `style.css` | Layout das telas. Só usa tokens. |
| `fonts/` | Atkinson Hyperlegible Next (OFL), servida localmente para a demo rodar sem internet. |

`tokens.test.js` falha se houver cor ou medida solta fora de `tokens.css`, ou se um par de cores cair abaixo do AA.

Roteiro da demo (specs/06): **WhatsApp** → áudio "do neto" · **Verificar** → link malicioso e pi.gov.br · **Mais › Extensão** → enviar CPF na página falsa · **Mais › Portal** → Maria (prata), "Inconclusivo" duas vezes → **Mais › Mesa** → aprovar com dois operadores → Portal "Ver se já foi aprovado" · **Aprender** → uma trilha · **Mais › Painel**.

Para trocar pelo backend real, substitua cada função de `api.js` por um `fetch('/v1/...')` com o mesmo contrato.
