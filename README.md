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

## Como publicar na Railway

O `Dockerfile` na raiz monta um container com o servidor Caddy servindo a pasta `web/` na porta que a Railway define. Antes de começar, confira se o `Dockerfile` e o `.dockerignore` estão na branch `main` do GitHub.

A Railway não tem plano gratuito permanente: a conta nova ganha um crédito de teste e depois passa para um plano pago. Confira os valores em https://railway.com/pricing antes de publicar.

1. Entre em https://railway.com e faça login com o GitHub.
2. Clique em "New Project" e escolha "Deploy from GitHub repo".
3. Selecione o repositório `verinexus`. Se ele não aparecer, clique em "Configure GitHub App" e libere o acesso. Como o repositório é da conta `FelipeBarrosCruz`, talvez o dono precise aprovar.
4. A Railway encontra o `Dockerfile` e começa o build sozinha. Espere o deploy aparecer como concluído.
5. Abra o serviço, vá em "Settings", depois em "Networking", e clique em "Generate Domain". Se pedir uma porta, use `8080`.
6. Abra o endereço gerado, que termina em `.up.railway.app`.

Depois disso, cada push na `main` gera um deploy novo.

Se o endereço não responder, vá em "Variables" no serviço, crie a variável `PORT` com o valor `8080` e confira se o domínio aponta para a mesma porta.

Para publicar pela linha de comando, na raiz do projeto:

```sh
npx @railway/cli login
npx @railway/cli init
npx @railway/cli up
npx @railway/cli domain
```

Para testar o container no seu computador antes de publicar:

```sh
docker build -t verinexus-web .
docker run --rm -p 8080:8080 verinexus-web
```

Depois abra http://localhost:8080.

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
