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

## Como publicar na Netlify

O `netlify.toml` na raiz já diz à Netlify para publicar a pasta `web/` sem build. Antes de começar, confira se esse arquivo está na branch `main` do GitHub.

1. Entre em https://app.netlify.com e crie a conta com o botão do GitHub.
2. No painel, clique em "Add new project" (em algumas versões aparece como "Add new site") e depois em "Import an existing project".
3. Escolha GitHub e autorize a Netlify a ler seus repositórios.
4. Selecione o repositório `verinexus`. Se ele não aparecer, clique em "Configure the Netlify app on GitHub" e libere o acesso a esse repositório. Como o repositório é da conta `FelipeBarrosCruz`, talvez o dono precise aprovar esse acesso.
5. Na tela de configuração, deixe a branch `main`. Os campos de build já vêm do `netlify.toml`: comando de build vazio e pasta de publicação `web`. Não precisa mudar nada.
6. Clique em "Deploy". Em menos de um minuto o site fica no ar num endereço como `nome-aleatorio.netlify.app`.
7. Para trocar o nome, vá em "Project configuration" (ou "Site configuration"), depois "Change project name", e escolha algo como `verinexus`. O endereço passa a ser `verinexus.netlify.app`, se o nome estiver livre.

Depois disso, cada push na `main` publica o site de novo sozinho, e cada pull request ganha um endereço de prévia.

Para publicar sem conectar o GitHub, há dois caminhos:

- Arraste a pasta `web/` para https://app.netlify.com/drop. Cada atualização exige arrastar de novo.
- Use a linha de comando, na raiz do projeto:

  ```sh
  npx netlify-cli login
  npx netlify-cli deploy --prod
  ```

  O comando lê o `netlify.toml`, então publica a pasta `web/` sem precisar de mais opções. Na primeira vez ele pergunta se deve criar um projeto novo.

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
