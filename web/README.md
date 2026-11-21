# VeriNexus: site da POC

O site usa HTML, CSS e JavaScript sem framework. A API de verificação descrita em `specs/01-api.md` está simulada em `api.js`, e as telas só chamam essas funções. Para usar um backend de verdade, troque cada função de `api.js` por um `fetch('/v1/...')` com o mesmo contrato.

```sh
python3 -m http.server 8000   # depois abra http://localhost:8000
node --test                   # testes da API e do design system
node tokens.test.js --print   # tabela de contraste de todas as cores
```

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `tokens.css` | Todos os valores de design: cores dos temas claro e escuro, fonte, espaçamento, raios, sombras, camadas e tempos de animação. |
| `components.css` | Botões, campos, cartões, abas, avisos, modal, toast, skeleton e estado vazio. Só usa os valores de `tokens.css`. |
| `ui.js` | Ícones e o comportamento do modal, do toast, das abas e das preferências de tema e tamanho de letra. |
| `style.css` | Layout de cada tela. |
| `app.js` | As sete telas e a navegação. |
| `api.js` | API simulada. |
| `fonts/` | Atkinson Hyperlegible Next (licença OFL), servida localmente para a demo funcionar sem internet. |

O `tokens.test.js` falha se aparecer cor ou medida escrita direto no CSS das telas, ou se algum par de cores ficar abaixo do contraste AA.

## Roteiro da demonstração

Segue o roteiro de `specs/06-simulacao-e-aceite.md`:

1. Em WhatsApp, toque em "Áudio do neto".
2. Em Verificar, teste o link malicioso e depois `www.pi.gov.br`.
3. Em Mais, abra a Extensão e tente enviar um CPF na página falsa.
4. Em Mais, abra o Portal, entre como Maria (nível Prata) e escolha "Inconclusivo" nas duas etapas.
5. Na Mesa, aprove o caso com dois operadores diferentes. Volte ao Portal e toque em "Ver se já foi aprovado".
6. Em Aprender, conclua uma trilha.
7. Em Mais, abra o Painel.
