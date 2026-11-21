# Pendências do frontend da POC

O que as specs pedem e o `web/` ainda não faz, ou faz só de forma simulada. Cada item aponta para a spec de origem.

## Backend e API (`specs/01-api.md`)
- [ ] **Sem servidor HTTP.** A Core API roda no navegador (`web/api.js`). Para ligar um backend real, troque cada função por `fetch('/v1/...')` mantendo o mesmo contrato.
- [ ] **Sem `X-Client-Key`.** Os canais não se autenticam.
- [ ] **Sem limite de requisições (429).** Só os erros 400 e 401 estão implementados.
- [ ] **`POST /v1/identity/challenge` foi simplificado.** Devolve `challenge_id` e o resultado (`passed`/`ambiguous`) numa só chamada, em vez de duas etapas.
- [ ] **Endpoint extra fora do contrato.** `reportTrainingCompleted()` soma pessoas formadas no painel; é preciso defini-lo na API.

## Identidade e OIDC (`specs/04-identidade.md`)
- [ ] **`id_token` sem assinatura** (`alg: none`) **e sem JWKS real.** O endpoint `jwks_uri` aparece no discovery, mas não existe. Marcado com `shortcut:` no código.
- [ ] **Discovery, authorize, token e userinfo são funções, não rotas HTTP.**
- [ ] **Step-up só pelo motivo 4** (site exige nível maior). Faltam: aparelho novo ou sem passkey, ação sensível (recuperar conta, trocar dados, valor acima do limite) e sinal anômalo.
- [ ] **Sem passkey nem biometria local de verdade.** O botão "Continuar com passkey" só simula.
- [ ] **Sem upload de documento.** Usuário bronze vê apenas um aviso; não há caminho bronze → prata.
- [ ] **Liveness por flag de teste** (`pass`/`ambiguous`/`fail`), sem câmera.

## Canais (`specs/02-canais.md`)
- [ ] **A extensão é simulada dentro da página.** Falta uma extensão real (Manifest V3) que chame a API ao abrir cada aba.
- [ ] **WhatsApp sem webhook real.** O simulador não emula o formato de payload da API do WhatsApp Business.
- [ ] **Sem envio de arquivo de áudio próprio.** Só os áudios de exemplo, com transcrição pronta.
- [ ] **Aplicativo e notificações de vazamento não foram feitos.**
- [ ] **Canal `partner` não tem tela.** A API aceita esse canal, mas nenhuma interface o usa.

## Análise de conteúdo (`specs/03-analise-de-conteudo.md`)
- [ ] **Regra "em dúvida, subir o nível" não implementada** para transcrições com erro (sotaque, ruído).
- [ ] **Análise só por palavras-chave.** Frases fora dos padrões passam sem alerta. Falta a troca por um modelo de linguagem atrás da mesma interface.
- [ ] **Outro idioma detectado por uma lista de palavras comuns do português.** É uma heurística frágil (espanhol, por exemplo, pode passar como português).
- [ ] **Metadados de áudio checados por lista de nomes de editores.** É só um sinal fraco, como a spec prevê, mas a lista é mínima.

## Mesa, educação e painel (`specs/05-mesa-educacao-painel.md`)
- [ ] **Casos da mesa só na memória.** Recarregar a página zera a fila e o estado do portal.
- [ ] **Operadores fixos e fictícios.** Quem conclui a trilha "Operador de Mesa" não vira operador.
- [ ] **Sem regra para menores de 18 anos** (não ver casos com documentos de terceiros).
- [ ] **Sem estado explícito "assumir caso".** O caso só passa para `in_review` na primeira aprovação.
- [ ] **SLA fixo de 30 minutos**, sem alerta de atraso.
- [ ] **Conteúdo das trilhas é inicial.** São 3 desafios por trilha; falta calibração com a equipe e links das fontes (CERT.br, SaferNet, MED do Pix, Guardiões da Infância).
- [ ] **Sem desafios com áudio tocável.** O cenário de áudio é só texto.
- [ ] **Painel sem atualização automática.** Os valores mudam só ao abrir a tela.

## Aceite e testes (`specs/06-simulacao-e-aceite.md`)
- [ ] **"Nenhum endpoint persiste áudio, transcrição ou texto"** está garantido por construção (`api.js` não guarda nada), mas falta a verificação por inspeção de armazenamento quando houver backend.
- [ ] **O teste ponta a ponta no navegador não está no repositório.** Foi rodado uma vez com Chrome headless; os testes do repositório (`node --test`) cobrem só a API.
- [ ] **Identidade visual provisória.** A spec deixa a marca do VeriNexus para a equipe.
