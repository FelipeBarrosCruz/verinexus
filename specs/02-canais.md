# Canais

Todos chamam a Core API (`01-api.md`). Nenhum canal decide por conta própria.

## Extensão de navegador
- Ao abrir uma página, chama `POST /v1/verify/url` com `channel: "extension"`.
- Exibe selo no ícone: verde (`badge: verified`), amarelo (`suspicious`/`unknown`), vermelho (`dangerous`).
- Ao detectar campo de documento (CPF, RG, senha) em página `suspicious`/`dangerous`, mostra aviso antes do envio.
- Não envia o conteúdo da página, apenas a URL.

## Landing page
- Campo para colar URL; resultado com veredito, motivos e conselhos.
- Seção "Cheque um link antes de enviar documentos", área de vazamento (campo que calcula o hash no navegador) e link para a área educativa.

## WhatsApp (simulado)
- A POC traz um **simulador de conversa** (tela estilo chat) que emula o webhook do WhatsApp Business: entrada de texto, áudio (arquivo de exemplo com transcrição pré-pronta) e link.
- Fluxo: mensagem → (áudio: transcrição simulada) → `POST /v1/verify/message` (e `/verify/url` para links) → resposta formatada.
- Formato da resposta: 1 linha de nível de alerta, até 3 motivos, até 5 ações, 1 aviso. Frases curtas. Opção de resposta em áudio (texto lido; na POC, o texto basta).
- Exemplo de ações: "Pare. Não faça Pix nem passe códigos." / "Ligue em vídeo para o número que você já tinha salvo." / "Confirme com outro parente." / "Use a palavra-chave da família." / "Se já pagou, acione o MED do Pix e a SaferNet."
- Em pedidos de dinheiro, mesmo com `alert: low`, a resposta termina com: "Não achamos sinais, mas confirme antes de pagar."
- Em produção: número aprovado na API oficial do WhatsApp Business, com conversas iniciadas pelo usuário.

## Aplicativo e parceiros
- App: mesma tela da landing, com notificações de vazamento.
- Parceiros: chamam a API de identidade e `verify/url` com `channel: "partner"`.
