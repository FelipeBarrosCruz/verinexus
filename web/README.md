# VeriNexus — frontend da POC

HTML, CSS e JS puros, sem build. A Core API (`specs/01-api.md`) está simulada em `api.js`; as telas só chamam essas funções.

```sh
cd web
python3 -m http.server 8000   # abrir http://localhost:8000
node --test                   # casos golden e critérios de aceite (specs/03 e 06)
```

Roteiro da demo (specs/06): **WhatsApp** → áudio "do neto" · **Verificar** → link malicioso e pi.gov.br · **Extensão** → enviar CPF na página falsa · **Portal** → Maria (prata), resultado "ambíguo" duas vezes → **Mesa** → aprovar com dois operadores → Portal "Verificar status" · **Aprender** → uma trilha · **Painel**.

Para trocar pelo backend real, substitua cada função de `api.js` por um `fetch('/v1/...')` com o mesmo contrato.
