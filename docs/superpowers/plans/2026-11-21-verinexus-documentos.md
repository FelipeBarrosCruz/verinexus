# VeriNexus: documentos de entrega — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Este plano produz documentos, não código; cada tarefa termina com uma verificação de conteúdo.

**Goal:** Produzir `presentation/` (slides + roteiro de 3 min) e `specs/` (contexto para POC/MVP) do VeriNexus.

**Architecture:** Um motor de verificação único (API) com canais finos; identidade com step-up; mesa humana; área educativa; painel. Tudo simulado na POC.

**Tech Stack:** Markdown. A POC (fora deste plano) usa stack livre.

**Spec:** `docs/superpowers/specs/2026-11-21-ideathon-solucao-design.md`

## Global Constraints
- Nome: VeriNexus. Idioma: português do Brasil.
- Roteiro: 3 minutos (~390 palavras faladas), mais direto que os slides.
- Slides com números inventados trazem no rodapé: "Números ilustrativos, não confiáveis". Dados do caderno trazem fonte.
- Proibido usar "42,5%" e "830%". Proibido prometer detecção de deepfake ou "áudio autêntico".
- Áudio e transcrição são descartados após o processamento.
- A SIA é a banca avaliadora e a futura contratante.

## Review Focus
- Roteiro maior que 3 minutos.
- Slide com número inventado sem aviso no rodapé.
- Spec que depende de serviço oficial real.
- Resposta do WhatsApp que tranquiliza demais em pedido de dinheiro.
- Dado pessoal guardado sem necessidade.

### Task 1: Apresentação
**Files:** Create `presentation/slides.md`, `presentation/roteiro-3min.md`
- [ ] Escrever `slides.md` (um bloco por slide: mensagem, conteúdo, visual, notas, rodapé).
- [ ] Escrever `roteiro-3min.md` com tempo por cena e slide correspondente.
- [ ] Verificar: `grep -c "Números ilustrativos" presentation/slides.md` e contagem de palavras do roteiro (`wc -w`) entre 350 e 430.

### Task 2: Specs
**Files:** Create `specs/00-visao-geral.md` a `specs/06-simulacao-e-aceite.md`
- [ ] Escrever os sete documentos (visão, API, canais, análise de conteúdo, identidade, mesa/educação/painel, simulação e aceite).
- [ ] Verificar: cada contrato de API citado em um canal existe em `specs/01-api.md`.
