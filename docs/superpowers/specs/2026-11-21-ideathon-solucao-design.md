# Ideathon Piauí 2026 — Design da solução e dos documentos de entrega

Status: **aprovado para escrita** · Nome da solução: **VeriNexus**

## 1. Intenção e porquê

Competir no Ideathon Piauí (CPW Piauí) unindo os dois enunciados do caderno `docs/referencias-ideathon.pdf`:

- **Cidadania digital:** proteção comunitária contra golpes, deepfakes e desinformação, com cuidado com crianças e adolescentes.
- **Jovens do interior:** oportunidades em IA com mentoria segura e compartilhamento responsável de dados.

A ponte entre os dois é a **mesa de validação humana**: formar pessoas contra golpes e transformar jovens do interior em operadores remotos dessa mesa (renda e oportunidade em IA/confiança e segurança).

Premissas dadas pela equipe (`docs/brainstorm.png` e conversa):
- Público: o **público geral** (persona central: idosos, como a avó de Piripiri do caderno).
- Proposta para o **setor público do Piauí**. A **SIA** (Secretaria de Inteligência Artificial, Economia Digital, Ciência, Tecnologia e Inovação) é a **banca avaliadora** do Ideathon e, no discurso, a futura contratante/dona do programa: o pitch fala diretamente a ela.
- Modelo de negócio: **venda ao governo**. O governo colhe o marketing, no padrão do programa Meu Celular de Volta (SSP-PI): um número grande, uma queda mensurável e um órgão dono.
- Critérios que a equipe quer atender: criatividade, aplicabilidade, modelo de negócio, barreira de entrada, elemento de futuro.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Convencer os jurados em **3 minutos** de que a solução é nova, viável e vendável ao governo do Piauí.
- Entregar documentação suficiente para um time construir uma **POC/MVP** que simule o ecossistema, sem acesso aos serviços oficiais.

**Não-objetivos**
- Integrar de verdade com gov.br, pi.gov.br, Meta/WhatsApp ou serviços de liveness.
- Detectar deepfake de voz ou vídeo por modelo de IA.
- Competir com o gov.br em identidade.

**Anti-objetivos (seria fracasso mesmo "funcionando")**
- Apresentar estatísticas não verificadas. O caderno marca "42,5% das fraudes usam IA" e "deepfakes cresceram 830%" como não confiáveis; não usar.
- Prometer "isso é deepfake" ou "áudio autêntico".
- Criar um banco central de CPF, e-mail e documentos de cidadãos, ou tratar dados de menores sem base legal clara (LGPD, ECA Digital).
- Um pitch que divide a atenção igualmente entre os três pilares.

## 3. Abordagens consideradas

1. **Verificador como protagonista (escolhida).** Fácil de demonstrar e de entender; os contadores de impacto lembram o Meu Celular de Volta.
2. Identidade como protagonista: mais forte tecnicamente, mas abstrata para 3 minutos.
3. Educação e emprego como protagonistas: mais próxima do enunciado dos jovens, mas a menos nova e a mais parecida com o que já existe (CERT.br, EducaMídia, SaferNet).

## 4. A solução

Um **motor de verificação único (API)** com vários canais finos. Canais: extensão de navegador, landing page, WhatsApp, aplicativo e sites de terceiros.

1. **Verificação de sites e links.** O usuário cola a URL na landing ou a extensão consulta a API antes de ele enviar documentos. A resposta combina reputação (listas públicas e contexto local), sinais do domínio e selo "Verificado" para serviços oficiais cadastrados.
2. **Canal WhatsApp.** O usuário encaminha áudio, texto ou link para o número oficial.
   - **Decisão da equipe:** o áudio é transcrito e o conteúdo é analisado por táticas de manipulação (urgência, segredo, pedido de dinheiro ou Pix, "troquei de número", pedido de códigos).
   - A resposta é curta, em linguagem simples (opcionalmente em áudio), com nível de alerta e ações: pare, ligue em vídeo no número já salvo, confirme com outro parente, use palavra-chave da família, e em caso de perda acione o MED do Pix e a SaferNet.
   - Metadados do arquivo são um **sinal secundário e fraco**: o WhatsApp recodifica e remove quase tudo. A resposta é "sem sinais de edição detectados" ou "não foi possível verificar", nunca "autêntico".
   - Ausência de alerta nunca é tratada como segurança, principalmente em pedidos de dinheiro.
3. **Alerta de vazamento (gancho de retenção, "plus").** Consulta sem armazenar o dado em claro (hash ou k-anonymity) e notificação para o usuário voltar a usar.
4. **API de identidade para terceiros (oferecida pelo gov.br/pi.gov.br).** Cadastro único forte (documento e liveness, como níveis bronze/prata/ouro) atrelado ao aparelho (passkey). **Liveness só como desafio (step-up):** aparelho novo, ação sensível ou sinal anômalo, ou quando o site de terceiros exige nível maior de garantia. Liveness passivo primeiro, ativo depois, mesa humana só no caso ambíguo. Fluxos de autenticação em OAuth 2.0 / OpenID Connect.
5. **Mesa de validação humana.** Operadores revisam casos ambíguos de documento e liveness.
6. **Área educativa gamificada, de acesso livre,** com dois objetivos: (i) não cair em golpes; (ii) qualificar pessoas para operar a mesa. É o elo com os jovens do interior.
7. **Painel da SIA.** Contadores de golpes evitados, sites bloqueados, pessoas formadas e operadores ativos.

**Decisão da equipe sobre números:** os slides podem usar números inventados (ilustrativos), com aviso obrigatório no rodapé de cada slide que os traz: "Números ilustrativos, não confiáveis". Os dados do caderno continuam citados com fonte. "42,5%" e "830%" não são usados.

## 5. Restrições

- Sem acesso aos serviços oficiais: tudo isso é simulado na POC (item 7).
- LGPD e ECA Digital: finalidade clara, minimização, descarte do áudio e da transcrição após o processamento, atenção a menores (inclusive como operadores e alunos da área educativa).
- WhatsApp Business exige aprovação de número e tem custo. Citar como ponto de viabilidade.
- Prazo do pitch: 3 minutos.

## 6. Entregáveis (dois conjuntos de documentos)

Local: `presentation/` e `specs/` na raiz do projeto.

### 6.1 `presentation/` (para jurados e para montar o slide)
- `slides.md`: conteúdo completo por slide (título, mensagem, texto, dados, sugestão visual, notas). **Pode ser mais denso** que o roteiro.
- `roteiro-3min.md`: texto falado, direto, com marcação de tempo por cena e do slide correspondente.
- Estrutura narrativa de partida (a refinar): 0:00–0:30 avó de Piripiri recebe áudio "do neto" pedindo Pix; 0:30–1:15 ela encaminha ao WhatsApp da SIA e/ou verifica o site, recebe o alerta; 1:15–1:50 site de edital com selo "Verificado" e API de identidade com desafio só quando preciso; 1:50–2:30 jovem de Pimenteiras treina e vira operador da mesa; 2:30–3:00 painel da SIA, modelo de venda ao governo e bordão ("Pare. Confirme. Só depois aja.").
- Itens a cobrir nos slides: problema com dados verificáveis do caderno, solução e canais, jornada do cidadão, identidade e step-up, mesa humana e jovens do interior, modelo de negócio, marketing para o governo (referência Meu Celular de Volta), barreira de entrada e futuro, conformidade (LGPD/ECA Digital).

### 6.2 `specs/` (contexto para construir a POC/MVP)
- Visão geral e escopo do MVP; arquitetura e contratos da API única de verificação.
- Especificação por canal: extensão, landing, WhatsApp (simulador de conversa).
- Motor de análise de conteúdo (táticas de manipulação) com exemplos de entrada e saída.
- Identidade: níveis de garantia, regras de step-up, fluxo OAuth/OIDC.
- Mesa humana: fila, estados e telas.
- Área educativa: trilhas, gamificação, caminho até operador.
- Painel de métricas.
- **Estratégia de simulação:** provedor OIDC falso fazendo papel do gov.br; simulador de WhatsApp; liveness e documento simulados; base de vazamento sintética; reputação de sites com lista fictícia; dados 100% sintéticos.
- Privacidade e conformidade; critérios de aceite do MVP e roteiro de demonstração.

## 7. O que fica para quem executa

- Identidade visual do VeriNexus.
- Escolha de stack para a POC (preferir o mais simples que simule bem).
- Calibração dos textos de resposta do WhatsApp e das trilhas de educação.
- Escolha das metas ilustrativas do painel, sempre rotuladas como metas.

## 8. Perguntas em aberto para a equipe

- Quem apresenta e se haverá demonstração ao vivo ou vídeo gravado. Esta versão assume que os documentos servem às duas opções.
- Ajustar o tom do discurso à SIA como banca.
