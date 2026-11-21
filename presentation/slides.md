# VeriNexus — Conteúdo dos slides

Cada slide: mensagem, conteúdo, visual sugerido e notas. Slides com números inventados levam no rodapé:
**"Números ilustrativos, não confiáveis."** Dados do caderno (`docs/referencias-ideathon.pdf`) trazem a fonte.

---

## Slide 1 · Capa
- **Mensagem:** VeriNexus, a camada de confiança do Piauí.
- **Conteúdo:** nome, frase "Pare. Confirme. Só depois aja.", Ideathon Piauí 2026, equipe.
- **Visual:** logotipo simples com um escudo e um nó de conexão; paleta de confiança (azul e verde).

## Slide 2 · O problema
- **Mensagem:** a confiança construída fora da internet é explorada dentro dela.
- **Conteúdo:**
  - Cena: a avó de Piripiri recebe um áudio "do neto" pedindo Pix. (Perfil ilustrativo do caderno, não é caso real.)
  - 2,26 milhões de estelionatos registrados em 2025, alta de 429,8% desde 2018 (Anuário Brasileiro de Segurança Pública 2026, via Metrópoles).
  - Cerca de 24 milhões de vítimas de golpes com Pix ou boletos entre jul/2024 e jun/2025 (FBSP, via Rádio Senado). Base diferente da anterior: não somar nem comparar.
  - Só 63,7 mil boletins viraram processo penal, com 4,8 mil prisões (A Tarde, sobre o Anuário).
  - Todos os dados são nacionais, não do Piauí. Não há base municipal validada de golpes no Piauí: falta medir, e o VeriNexus passa a medir.
  - Golpes imitam voz, imagem e marca. Aparência de autenticidade não basta como sinal.
  - Cuidado: nas pesquisas, idosos não são o grupo mais atingido em geral (jovens de 16 a 29 anos são), mas são alvo frequente de boletos falsos. A avó é perfil ilustrativo.
  - Contexto opcional (notas do orador): 92% dos jovens de 9 a 17 anos usam internet e 65% já usaram IA generativa (TIC Kids Online Brasil 2025).
- **Visual:** conversa de WhatsApp com o áudio suspeito e quatro cartões de número (2,26 mi, +430%, 24 mi, 63,7 mil).
- **Rodapé:** fontes e "dados nacionais, não do Piauí".

## Slide 3 · A solução
- **Mensagem:** um motor de verificação, vários canais.
- **Conteúdo:** extensão do navegador, página web, WhatsApp, aplicativo e API para sites de terceiros, todos ligados à mesma API do VeriNexus.
- **Visual:** diagrama de um núcleo central com cinco canais ao redor.
- **Notas:** o WhatsApp é o canal para quem tem pouca facilidade com sites (idosos).

## Slide 4 · Jornada do cidadão
- **Mensagem:** de "encaminhei o áudio" a "sei o que fazer" em segundos.
- **Conteúdo:**
  - WhatsApp: o áudio é transcrito e analisado por táticas de manipulação (urgência, segredo, Pix, número novo, pedido de códigos).
  - Resposta curta com ações: parar, ligar em vídeo no número salvo, confirmar com outro parente, palavra-chave da família, MED do Pix e SaferNet em caso de perda.
  - Metadados do arquivo: sinal secundário ("sem sinais de edição detectados" ou "não foi possível verificar"), nunca "autêntico".
  - Sites: cole o link ou use a extensão e veja se é confiável antes de enviar documentos.
  - Alerta de vazamento e notificações para o usuário voltar.
- **Visual:** três telas lado a lado (WhatsApp, extensão, landing).
- **Rodapé:** "Números ilustrativos, não confiáveis." (se houver exemplos numéricos)

## Slide 5 · Identidade com desafio só quando preciso
- **Mensagem:** segurança forte sem atrito diário.
- **Conteúdo:**
  - Cadastro único: documento e liveness, com níveis de garantia (bronze, prata, ouro), ligados ao aparelho por passkey.
  - Uso diário com a biometria do próprio celular.
  - Desafio (liveness) apenas em aparelho novo, ação sensível, sinal anômalo ou quando o site exige nível maior.
  - Casos ambíguos vão para a mesa de validação humana.
  - API oferecida pelo gov.br/pi.gov.br a sites de terceiros, em OAuth 2.0 / OpenID Connect.
- **Visual:** escada de três níveis com setas de "step-up".

## Slide 6 · Jovens do interior
- **Mensagem:** quem aprende a proteger vira profissional.
- **Conteúdo:**
  - Área educativa aberta e gamificada com dois objetivos: não cair em golpes e se qualificar para a mesa.
  - Trilha: Iniciante, Defensor da Família, Analista, Operador de Mesa.
  - Oportunidade remota em IA e segurança digital para quem mora fora da capital.
  - Contexto: disciplina de IA com mais de 130 mil estudantes (Seduc-PI, 2026).
  - Cuidados: dados mínimos e consentimento dos responsáveis para menores (LGPD, ECA Digital).
  - Ilustração: meta de 2.000 jovens formados no 1º ano.
- **Rodapé:** "Números ilustrativos, não confiáveis."
- **Visual:** mapa do Piauí com pontos em Pimenteiras e Cocal dos Alves.

## Slide 7 · Valor para o governo (SIA)
- **Mensagem:** um programa com resultado que o cidadão enxerga.
- **Conteúdo:** painel da SIA com contadores (valores de exemplo): 48 mil golpes evitados, 6 mil sites sinalizados, 2 mil jovens formados, 120 operadores ativos.
  - Referência de comunicação: o Meu Celular de Volta, da SSP-PI, divulga mais de 17 mil aparelhos recuperados e queda de roubos em Teresina.
  - Dados anônimos de tipos de golpe ajudam a preencher a falta de dados municipais.
- **Rodapé:** "Números ilustrativos, não confiáveis."
- **Visual:** painel com quatro contadores grandes.

## Slide 8 · Modelo de negócio e futuro
- **Mensagem:** o governo contrata uma plataforma, e o Piauí ganha uma marca de confiança.
- **Conteúdo:**
  - Venda ao governo: licença da plataforma e operação (exemplo: R$ 1,2 mi por ano).
  - Barreira de entrada: parcerias institucionais, base local de golpes e a mesa humana formada pela própria rede.
  - Futuro: detecção de voz sintética, novos canais e integração com serviços do Piauí Mais Digital.
  - Conformidade: finalidade clara, minimização, descarte do áudio e da transcrição.
- **Rodapé:** "Números ilustrativos, não confiáveis."

## Slide 9 · Fechamento
- **Mensagem:** Pare. Confirme. Só depois aja.
- **Conteúdo:** nome, contato da equipe, QR para a demonstração.
- **Visual:** retorno à cena da avó, agora protegida.
