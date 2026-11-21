# VeriNexus

Protótipo do VeriNexus para o Ideathon Piauí 2026. O site fica na pasta `web/` e é feito só de HTML, CSS e JavaScript, então não precisa instalar dependências nem gerar build.

Tudo no site é simulado e os dados são fictícios.

## Como rodar o site

Você precisa do Python 3, que já vem instalado na maioria dos sistemas Linux e macOS.

1. Abra um terminal na pasta do projeto.
2. Entre na pasta do site e inicie um servidor local:

   ```sh
   cd web
   python3 -m http.server 8000
   ```

3. Abra http://localhost:8000 no navegador.

Para parar o servidor, aperte `Ctrl+C` no terminal.

Abrir o `index.html` com dois cliques não funciona, porque o navegador bloqueia módulos JavaScript carregados direto do disco. Use sempre o servidor.

Se preferir Node.js no lugar do Python, rode `npx http-server web -p 8000` na pasta do projeto.

## Como rodar os testes

Com Node.js 18 ou mais novo:

```sh
cd web
node --test
```

## O que tem em cada pasta

- `web/`: o site. O `web/README.md` explica os arquivos e o design system.
- `specs/`: especificações da POC.
- `presentation/`: slides e roteiro do pitch.
- `docs/`: material de referência do Ideathon.
