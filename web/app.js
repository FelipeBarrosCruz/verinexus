import * as api from './api.js';
import {
  esc, icon, status, list, skeleton, emptyState, field, setFieldError, setBusy,
  toast, modal, tabs, closeDialog, prefs, isDark, applyPrefs, togglePref, TONE_ICON,
} from './ui.js';

const view = document.getElementById('view');
const errMsg = (e) => e?.body?.error?.message ?? e.message;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Navegação: 3 ações do cidadão + "Mais" (Hick) ----------
const PRIMARY = [
  { r: '', label: 'Verificar', icon: 'shield', title: 'Verificar link' },
  { r: 'whatsapp', label: 'WhatsApp', icon: 'chat', title: 'WhatsApp' },
  { r: 'educacao', label: 'Aprender', icon: 'school', title: 'Aprender' },
];
const DEMO = [
  { r: 'extensao', label: 'Extensão do navegador', icon: 'puzzle', text: 'Aviso antes de enviar documentos' },
  { r: 'portal', label: 'Portal de editais', icon: 'idcard', text: 'Login com verificação de rosto' },
  { r: 'mesa', label: 'Mesa humana', icon: 'users', text: 'Casos que precisam de uma pessoa' },
  { r: 'painel', label: 'Painel da SIA', icon: 'chart', text: 'Números da demonstração' },
];
const routes = { '': landing, whatsapp, extensao, portal, mesa, educacao, painel };
const route = () => location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];

function navHtml() {
  const r = route();
  const link = (n) => `<a class="nav-link" href="#/${n.r}" ${n.r === r ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${n.label}</span></a>`;
  const inDemo = DEMO.some((d) => d.r === r);
  return PRIMARY.map(link).join('')
    + `<button type="button" class="nav-link" data-more aria-haspopup="dialog" ${inDemo ? 'aria-current="page"' : ''}>${icon('more')}<span>Mais</span></button>`;
}

function openMore() {
  const d = document.createElement('dialog');
  d.className = 'modal';
  d.setAttribute('aria-labelledby', 'more-title');
  d.innerHTML = `<div class="modal-inner stack">
    <div class="sheet-head"><h2 id="more-title">Demonstração</h2>
      <button type="button" class="btn btn-quiet" data-close aria-label="Fechar menu">${icon('x')}</button></div>
    <p class="muted">Telas que mostram como o VeriNexus funciona por dentro.</p>
    <nav class="stack" aria-label="Demonstração">${DEMO.map((n) => `<a class="card card-link sheet-link" href="#/${n.r}">
      <span class="sheet-text"><strong>${n.label}</strong><span class="muted text-sm">${n.text}</span></span>${icon('arrow-right', 'icon-nudge')}</a>`).join('')}</nav>
  </div>`;
  const close = () => closeDialog(d);
  d.addEventListener('click', (e) => { if (e.target.closest('a, [data-close]') || e.target === d) close(); });
  d.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  document.body.append(d);
  d.showModal();
  d.querySelector('a').focus();
}

function renderPrefs() {
  const dark = isDark();
  document.querySelector('[data-pref="theme"]').innerHTML = `${icon(dark ? 'sun' : 'moon')}<span class="pref-label">${dark ? 'Tema claro' : 'Tema escuro'}</span>`;
  document.querySelector('[data-pref="text"]').innerHTML = `${icon('text')}<span class="pref-label">${prefs.text === 'lg' ? 'Letra normal' : 'Letra maior'}</span>`;
}

function render() {
  const r = route();
  view.onclick = view.onsubmit = view.onchange = view.oninput = null;
  (routes[r] ?? landing)();
  document.querySelectorAll('[data-nav]').forEach((n) => { n.innerHTML = navHtml(); });
  const t = [...PRIMARY, ...DEMO].find((n) => n.r === r);
  document.title = t && r ? `${t.title ?? t.label} · VeriNexus` : 'VeriNexus';
}

document.addEventListener('click', (e) => {
  const p = e.target.closest('[data-pref]');
  if (p) { togglePref(p.dataset.pref); renderPrefs(); }
  if (e.target.closest('[data-more]')) openMore();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderPrefs);
addEventListener('hashchange', () => { render(); scrollTo(0, 0); view.focus({ preventScroll: true }); });
applyPrefs();
renderPrefs();

const pageHead = (title, lead) =>
  `<header class="page-head"><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</header>`;

// ---------- Resultado de URL (Verificar, Extensão, WhatsApp) ----------
const URL_VIEW = {
  verified: ['success', 'Site oficial verificado', 'Oficial'],
  safe_signals: ['info', 'Não encontramos sinais de risco', 'Sem sinais'],
  suspicious: ['warning', 'Cuidado: site suspeito', 'Cuidado'],
  dangerous: ['error', 'Perigo: não envie seus dados', 'Perigo'],
  unknown: ['warning', 'Não conseguimos avaliar este site', 'Cuidado'],
};
const urlView = (r) => URL_VIEW[r.badge ? 'verified' : r.verdict];
const hostOf = (u) => { try { return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname; } catch { return u; } };
// Postel: aceita o link no meio de um texto colado.
const URL_IN_TEXT = /\b(?:https?:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:[/?#]\S*)?/gi;

function urlStatus(r, url) {
  const [tone, title] = urlView(r);
  const why = r.badge ? [] : r.reasons.slice(0, 3).map((x) => x.text);
  return status({
    tone, title,
    body: `<p class="text-sm">Endereço: <strong>${esc(hostOf(url))}</strong></p>
      ${why.length ? `<h4>Por quê</h4>${list(why)}` : ''}<h4>O que fazer</h4>${list(r.advice, true)}`,
  });
}

// ---------- Verificar (início) ----------
const onlyDigits = (s) => s.replace(/\D/g, '');
const maskCpf = (v) => {
  const d = onlyDigits(v).slice(0, 11);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join('.') + (d.length > 9 ? `-${d.slice(9)}` : '');
};
// Aceita e-mail ou CPF com ou sem pontos; devolve o valor normalizado ou uma mensagem humana.
function parseIdentity(v) {
  const t = v.trim().toLowerCase();
  if (!t) return { error: 'Digite seu e-mail ou CPF.' };
  if (t.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? { value: t } : { error: 'Esse e-mail parece incompleto. Ele deve ser como nome@site.com.' };
  if (/[a-z]/.test(t)) return { error: 'Digite um e-mail (com @) ou um CPF (só números).' };
  const d = onlyDigits(t);
  return d.length === 11 ? { value: d } : { error: `O CPF tem 11 números. Você digitou ${d.length}.` };
}

function landing() {
  const examples = ['gov-br-regulariza.com/cpf', 'www.pi.gov.br', 'loja-exemplo.com.br'];
  view.innerHTML = `
  <section class="hero">
    <h1>Este link é seguro para enviar seus documentos?</h1>
    <p class="lead">Cole o endereço do site. Em poucos segundos mostramos os sinais de risco e o que fazer.</p>
  </section>
  <section class="card narrow" id="check">
    <div class="tabs" role="tablist" aria-label="O que você quer verificar">
      <button class="tab" role="tab" id="tab-link" aria-controls="panel-link" aria-selected="true">${icon('link')}Link de site</button>
      <button class="tab" role="tab" id="tab-leak" aria-controls="panel-leak" aria-selected="false" tabindex="-1">${icon('lock')}Meus dados vazaram?</button>
    </div>
    <div class="tabpanel" role="tabpanel" id="panel-link" aria-labelledby="tab-link">
      <form id="url-form" class="stack" novalidate>
        ${field({ id: 'url', label: 'Endereço do site', hint: 'Pode colar do jeito que estiver, com ou sem "https://".',
          control: '<div class="input-row"><input class="input" id="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="ex.: www.pi.gov.br"></div>' })}
        <button class="btn btn-lg">${icon('shield')}Verificar link</button>
      </form>
      <div class="cluster examples"><span class="muted text-sm">Teste com exemplos fictícios:</span>
        ${examples.map((u) => `<button type="button" class="chip" data-url="${u}">${u}</button>`).join('')}</div>
      <div id="url-out" class="result" aria-live="polite"></div>
    </div>
    <div class="tabpanel" role="tabpanel" id="panel-leak" aria-labelledby="tab-leak" hidden>
      <form id="leak-form" class="stack" novalidate>
        ${field({ id: 'leak', label: 'E-mail ou CPF', hint: 'Teste com maria.ficticia@exemplo.com ou 123.456.789-09.',
          control: '<input class="input" id="leak" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="nome@site.com ou 000.000.000-00">' })}
        <button class="btn btn-lg">${icon('search')}Consultar meus dados</button>
      </form>
      <p class="privacy text-sm">${icon('lock')}<span>Seu dado vira um código no seu aparelho. Só os 5 primeiros caracteres desse código saem daqui.</span></p>
      <div id="leak-out" class="result" aria-live="polite"></div>
    </div>
  </section>
  <section class="section">
    <h2 class="section-title">Outras formas de se proteger</h2>
    <div class="grid-auto">
      <a class="card card-link" href="#/whatsapp">
        <strong class="text-lg">Recebeu um áudio estranho?</strong><span class="muted">Encaminhe para o WhatsApp do VeriNexus e veja o que fazer.</span>
        <span class="cluster">Abrir o WhatsApp ${icon('arrow-right', 'icon-nudge')}</span></a>
      <a class="card card-link" href="#/educacao">
        <strong class="text-lg">Aprenda a reconhecer golpes</strong><span class="muted">Quatro trilhas com situações comuns de golpe, de graça e sem cadastro.</span>
        <span class="cluster">Começar a aprender ${icon('arrow-right', 'icon-nudge')}</span></a>
    </div>
  </section>`;

  tabs(view.querySelector('#check'));
  const urlInput = view.querySelector('#url');
  const leakInput = view.querySelector('#leak');

  const checkUrl = (raw) => {
    const out = view.querySelector('#url-out');
    out.innerHTML = '';
    const found = raw.match(URL_IN_TEXT)?.[0];
    if (!raw.trim()) return setFieldError(urlInput, 'Cole o endereço de um site para verificar.');
    if (!found) return setFieldError(urlInput, 'Não encontramos um endereço aqui. Ele costuma ter um ponto, como em exemplo.com.br.');
    setFieldError(urlInput, null);
    try { out.innerHTML = urlStatus(api.verifyUrl({ url: found, channel: 'landing' }), found); } catch (e) {
      out.innerHTML = status({ tone: 'error', title: 'Não conseguimos verificar agora', body: `<p>${esc(cap(errMsg(e)))}. Tente de novo.</p>` });
    }
  };

  view.onclick = (e) => {
    const u = e.target.closest('[data-url]')?.dataset.url;
    if (u) { urlInput.value = u; checkUrl(u); }
  };
  view.oninput = (e) => {
    if (e.target === leakInput && /^[\d.\-\s]+$/.test(leakInput.value)) leakInput.value = maskCpf(leakInput.value);
    if (e.target.getAttribute('aria-invalid') === 'true') setFieldError(e.target, null);
  };
  view.onsubmit = async (e) => {
    e.preventDefault();
    if (e.target.id === 'url-form') return checkUrl(urlInput.value);
    const out = view.querySelector('#leak-out');
    const parsed = parseIdentity(leakInput.value);
    if (parsed.error) { out.innerHTML = ''; return setFieldError(leakInput, parsed.error); }
    setFieldError(leakInput, null);
    const btn = e.target.querySelector('.btn');
    setBusy(btn, true, 'Consultando…');
    out.innerHTML = skeleton(2);
    try {
      const h = await api.sha1hex(parsed.value);
      const { matches } = await api.breachCheck({ hash_prefix: h.slice(0, 5) });
      const found = matches.includes(h.slice(5));
      out.innerHTML = found
        ? status({ tone: 'error', title: 'Encontramos este dado em um vazamento',
          body: `<h4>O que fazer</h4>${list(['Troque a senha dos serviços que usam este e-mail.', 'Ative a verificação em duas etapas.', 'Desconfie de mensagens que citam seus dados.'], true)}<p class="text-sm">Enviado ao servidor: só <code>${h.slice(0, 5)}</code>.</p>` })
        : status({ tone: 'info', title: 'Não encontramos este dado nas bases consultadas',
          body: `<p>Isso não garante que ele nunca vazou.</p><p class="text-sm">Enviado ao servidor: só <code>${h.slice(0, 5)}</code>.</p>` });
    } catch (err) {
      out.innerHTML = status({ tone: 'error', title: 'Não conseguimos consultar agora', body: `<p>${esc(cap(errMsg(err)))}. Tente de novo.</p>` });
    } finally { setBusy(btn, false); }
  };
}

// ---------- WhatsApp (simulador) ----------
const ALERT_VIEW = { high: ['error', 'Alerta alto: tem cara de golpe'], medium: ['warning', 'Alerta médio: tenha cuidado'], low: ['info', 'Alerta baixo: não achamos sinais'] };
const TACTIC_TEXT = {
  money_request: 'Pede dinheiro ou Pix.',
  credential_request: 'Pede código, senha ou documento.',
  new_number: 'Diz que trocou de número.',
  secrecy: 'Pede segredo.',
  urgency: 'Pede pressa.',
  emotional_pressure: 'Fala de apuros, acidente ou hospital.',
};
const TACTIC_ORDER = Object.keys(TACTIC_TEXT);
const META_LINE = { no_edit_signals: 'Sem sinais de edição detectados.', edit_signals: 'O arquivo tem sinais de edição.', unverifiable: 'Não foi possível verificar o arquivo.' };
const SAMPLES = [
  { label: 'Áudio "do neto"', icon: 'mic', audio: true, dur: '0:09', meta: {}, text: 'Vó, sou eu, troquei de número. Faz um pix de 800 agora e não conta pra ninguém.' },
  { label: 'Áudio do almoço', icon: 'mic', audio: true, dur: '0:04', meta: { codec: 'opus', encoder: 'WhatsApp' }, text: 'Oi vó, vamos almoçar domingo? Levo a sobremesa.' },
  { label: 'Link do CPF', icon: 'link', text: 'Seu CPF será bloqueado. Regularize em gov-br-regulariza.com/cpf' },
  { label: 'Pedido de código', icon: 'chat', text: 'Me manda o código que chegou no seu celular.' },
];
const WAVE = [0.4, 0.8, 0.55, 1, 0.65, 0.9, 0.45, 0.75, 0.5, 0.85, 0.35, 0.6];
// Só na memória da página: o servidor (api.js) não guarda nada.
const chat = [{ from: 'bot', text: 'Olá, aqui é o VeriNexus, da SIA. Se recebeu um áudio, uma mensagem ou um link estranho, encaminhe para cá que eu respondo com o que fazer.' }];

function analyze({ text, audio, meta }) {
  const replies = [];
  try {
    const urls = (text.match(URL_IN_TEXT) ?? []).slice(0, 2);
    const rest = urls.reduce((t, u) => t.replace(u, ''), text).trim();
    const metaSignal = audio ? api.verifyAudioMeta({ metadata: meta }).signal : null;
    if (rest) {
      const r = api.verifyMessage({ text: rest, source: audio ? 'whatsapp_audio_transcript' : 'whatsapp_text' });
      const [tone, title] = ALERT_VIEW[r.alert];
      const why = [...r.tactics].sort((a, b) => TACTIC_ORDER.indexOf(a.code) - TACTIC_ORDER.indexOf(b.code)).slice(0, 3).map((t) => TACTIC_TEXT[t.code]);
      if (r.alert !== 'low' || !urls.length) {
        replies.push({ tone, title, why, actions: r.advice.slice(0, 5), extra: metaSignal ? `Áudio: ${META_LINE[metaSignal]}` : '', note: r.disclaimer });
      }
    }
    for (const u of urls) {
      const r = api.verifyUrl({ url: u, channel: 'whatsapp' });
      const [tone, title] = urlView(r);
      replies.push({ tone, title, sub: hostOf(u), why: r.badge ? [] : r.reasons.slice(0, 3).map((x) => x.text), actions: r.advice });
    }
  } catch (e) {
    replies.push({ tone: 'error', title: 'Não consegui analisar', why: [], actions: [], note: `${cap(errMsg(e))}.` });
  }
  return replies;
}

const speechOf = (m) => [m.title, m.sub, m.why.length ? `Por quê: ${m.why.join(' ')}` : '', m.actions.length ? `O que fazer: ${m.actions.join(' ')}` : '', m.extra, m.note].filter(Boolean).join('. ');

function bubble(m, i, isNew, delay = 0) {
  const cls = `bubble ${m.from === 'user' ? 'out' : 'in'}${isNew ? ' is-new' : ''}`;
  if (m.from === 'user' && m.audio) {
    return `<div class="${cls}"><div class="audio-msg">${icon('play')}<span class="wave" aria-hidden="true">${WAVE.map((h) => `<span style="--h:${h}"></span>`).join('')}</span><span>${m.dur}</span></div>
      <p class="transcript"><span class="sr-only">Áudio encaminhado. </span>Transcrição simulada: "${esc(m.text)}"</p></div>`;
  }
  if (m.from === 'user') return `<div class="${cls}">${esc(m.text)}</div>`;
  if (m.typing) return `<div class="${cls}" aria-label="VeriNexus está analisando"><span class="typing" aria-hidden="true"><span></span><span></span><span></span></span></div>`;
  if (!m.tone) return `<div class="${cls}"><p>${esc(m.text)}</p></div>`;
  return `<div class="${cls} tone-${m.tone}" style="--i:${delay}">
    <p class="bubble-alert">${icon(TONE_ICON[m.tone])}${esc(m.title)}</p>
    ${m.sub ? `<p class="text-sm">Endereço: <strong>${esc(m.sub)}</strong></p>` : ''}
    ${m.why.length ? `<h4>Por quê</h4>${list(m.why)}` : ''}
    ${m.actions.length ? `<h4>O que fazer</h4>${list(m.actions, true)}` : ''}
    ${m.extra ? `<p class="text-sm">${esc(m.extra)}</p>` : ''}
    ${m.note ? `<p class="disclaimer">${esc(m.note)}</p>` : ''}
    ${'speechSynthesis' in window ? `<button type="button" class="chip" data-speak="${i}">${icon('volume')}Ouvir resposta</button>` : ''}
  </div>`;
}

function whatsapp() {
  view.innerHTML = `
  ${pageHead('WhatsApp do VeriNexus', 'Encaminhe um áudio, uma mensagem ou um link e receba o nível de alerta com o que fazer. Nesta demonstração a conversa é simulada.')}
  <div class="chat-layout">
    <section class="stack">
      <div class="card stack">
        <h2>Experimente</h2>
        <p>Toque em um exemplo. Ele aparece na conversa como se você tivesse encaminhado.</p>
        <div class="try-list">${SAMPLES.map((s, i) => `<button type="button" class="choice" data-sample="${i}"><span class="cluster">${icon(s.icon)}${s.label}</span>${icon('send')}</button>`).join('')}</div>
      </div>
      <p class="privacy text-sm">${icon('lock')}<span>Nada da conversa é guardado. O áudio e a transcrição são descartados depois da análise.</span></p>
    </section>
    <section class="phone" aria-label="Conversa com o VeriNexus">
      <div class="phone-head"><span class="avatar">${icon('shield')}</span><div><p><strong>VeriNexus · SIA Piauí</strong></p><p class="text-sm muted">Conta oficial (simulada)</p></div></div>
      <div class="msgs" id="msgs" role="log" aria-live="polite" aria-label="Mensagens"></div>
      <div class="quick" aria-label="Exemplos rápidos">${SAMPLES.map((s, i) => `<button type="button" class="chip" data-sample="${i}">${icon(s.icon)}${s.label}</button>`).join('')}</div>
      <form class="composer" id="composer">
        <label class="sr-only" for="msg">Mensagem</label>
        <input class="input" id="msg" placeholder="Cole uma mensagem ou link" autocomplete="off">
        <button class="btn" aria-label="Enviar mensagem" disabled>${icon('send')}</button>
      </form>
    </section>
  </div>`;

  const box = view.querySelector('#msgs');
  const input = view.querySelector('#msg');
  const sendBtn = view.querySelector('#composer .btn');
  const scroll = () => { box.scrollTop = box.scrollHeight; };
  box.innerHTML = chat.map((m, i) => bubble(m, i, false)).join('');
  scroll();

  let busy = false;
  const send = async (msg) => {
    if (busy) return;
    busy = true;
    chat.push({ from: 'user', ...msg });
    box.insertAdjacentHTML('beforeend', bubble(chat.at(-1), chat.length - 1, true));
    box.insertAdjacentHTML('beforeend', bubble({ from: 'bot', typing: true }, -1, true));
    scroll();
    const replies = analyze(msg);
    await wait(350); // Doherty: resposta antes de 400 ms, com sinal de "analisando"
    box.lastElementChild.remove();
    replies.forEach((r, k) => {
      chat.push({ from: 'bot', ...r });
      box.insertAdjacentHTML('beforeend', bubble(chat.at(-1), chat.length - 1, true, k));
    });
    scroll();
    busy = false;
  };

  view.onclick = (e) => {
    const s = e.target.closest('[data-sample]');
    if (s) send(SAMPLES[s.dataset.sample]);
    const sp = e.target.closest('[data-speak]');
    if (sp) {
      const u = new SpeechSynthesisUtterance(speechOf(chat[sp.dataset.speak]));
      u.lang = 'pt-BR';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  };
  view.oninput = (e) => { if (e.target === input) sendBtn.disabled = !input.value.trim(); };
  view.onsubmit = (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    send({ text: input.value });
    input.value = '';
    sendBtn.disabled = true;
  };
}

// ---------- Extensão (simulada dentro da página) ----------
const PAGES = {
  'https://gov-br-regulariza.com/consulta-cpf': { name: 'Regulariza CPF', title: 'Regularize seu CPF hoje', body: 'Seu CPF está pendente. Regularize agora para evitar bloqueio.' },
  'https://www.pi.gov.br/servicos': { name: 'Governo do Piauí', title: 'Serviços do Governo do Piauí', body: 'Acesse serviços com sua conta gov.br.' },
  'https://loja-exemplo.com.br/cadastro': { name: 'Loja Exemplo', title: 'Crie sua conta', body: 'Cadastre-se para acompanhar seus pedidos.' },
};
const ext = { url: Object.keys(PAGES)[0], result: null };

function extensao() {
  let r = null;
  try { r = api.verifyUrl({ url: ext.url, channel: 'extension' }); } catch { /* endereço inválido: tratado abaixo */ }
  ext.result = r;
  const [tone, , short] = r ? urlView(r) : ['warning', '', 'Inválido'];
  const page = PAGES[ext.url] ?? { name: hostOf(ext.url), title: 'Página de exemplo', body: 'Conteúdo fictício.' };
  view.innerHTML = `
  ${pageHead('Extensão do navegador', 'A cada página aberta, a extensão manda só o endereço para o VeriNexus. Se a página for suspeita e pedir documento, ela avisa antes do envio. Aqui a extensão é simulada dentro do site.')}
  <div class="cluster examples"><span class="muted text-sm">Abrir uma página de exemplo:</span>
    ${Object.keys(PAGES).map((u) => `<button type="button" class="chip" data-open="${u}">${hostOf(u)}</button>`).join('')}</div>
  <div class="ext-layout section">
    <div class="browser">
      <form class="browser-bar" id="addr">
        <label class="sr-only" for="addr-in">Endereço da página</label>
        <input class="input" id="addr-in" value="${esc(ext.url)}" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false">
        <button class="btn btn-ghost">Abrir</button>
        <span class="ext-badge tone-${tone}" role="img" aria-label="Selo VeriNexus: ${short}">${icon(TONE_ICON[tone])}${short}</span>
      </form>
      <div class="site">
        <p class="site-name">${icon('file')}${esc(page.name)} · site fictício</p>
        <h2>${esc(page.title)}</h2>
        <p>${esc(page.body)}</p>
        <form id="doc-form" novalidate>
          ${field({ id: 'cpf', label: 'CPF', control: '<input class="input" id="cpf" name="cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00">' })}
          ${field({ id: 'pwd', label: 'Senha', control: '<input class="input" id="pwd" type="password" name="senha" autocomplete="off">' })}
          <button class="btn">Enviar dados</button>
        </form>
      </div>
    </div>
    <aside class="card stack" aria-label="Painel da extensão">
      <h2 class="card-title">${icon('shield')}VeriNexus</h2>
      ${r ? urlStatus(r, ext.url) : status({ tone: 'warning', title: 'Endereço inválido', body: '<p>Confira o endereço digitado.</p>' })}
    </aside>
  </div>`;

  const go = (url) => { ext.url = url; extensao(); };
  view.onclick = (e) => { const u = e.target.closest('[data-open]')?.dataset.open; if (u) go(u); };
  view.oninput = (e) => { if (e.target.id === 'cpf') e.target.value = maskCpf(e.target.value); };
  view.onsubmit = async (e) => {
    e.preventDefault();
    if (e.target.id === 'addr') return go(view.querySelector('#addr-in').value.trim());
    const hasDocField = e.target.querySelector('input[name*="cpf"], input[name*="rg"], input[type="password"]');
    const risky = !ext.result || (!ext.result.badge && ext.result.verdict !== 'safe_signals');
    if (hasDocField && risky) {
      const send = await modal({
        tone: 'error', title: 'Pare antes de enviar seu CPF',
        body: '<p>O VeriNexus achou sinais de golpe nesta página. Enviar documento ou senha aqui pode causar prejuízo.</p>',
        actions: [{ label: 'Não enviar', value: false, variant: 'btn-secondary' }, { label: 'Enviar mesmo assim', value: true, variant: 'btn-ghost' }],
      });
      if (send) toast({ tone: 'warning', title: 'Dados enviados', text: 'Simulação: nada saiu daqui.' });
      else toast({ tone: 'success', title: 'Envio cancelado', text: 'Seus dados não saíram desta página.' });
    } else toast({ tone: 'success', title: 'Formulário enviado', text: 'Simulação: nada saiu daqui.' });
  };
}

// ---------- Portal de Editais Fictício (cliente OIDC) ----------
const CLIENT = { client_id: 'portal-editais', redirect_uri: '#/portal' };
const ps = { step: 'start' };
const rnd = () => [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
const LEVEL = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro' };
const PORTAL_STEP = { start: 0, idp: 0, challenge: 1, desk: 1, fail: 1, done: 2 };

async function doAuthorize() {
  try {
    const res = api.authorize({ ...CLIENT, response_type: 'code', state: ps.state, code_challenge: ps.challenge, code_challenge_method: 'S256', acr_values: 'ouro' }, ps.sub);
    if (res.step_up) Object.assign(ps, { step: 'challenge', stepUp: res.step_up, stage: 'passive', msg: '' });
    else {
      if (res.state !== ps.state) throw new Error('state não confere');
      const t = await api.token({ grant_type: 'authorization_code', code: res.code, code_verifier: ps.verifier, client_id: CLIENT.client_id });
      Object.assign(ps, { step: 'done', info: api.userinfo(t.access_token) });
    }
  } catch (e) { Object.assign(ps, { step: 'fail', msg: cap(errMsg(e)) }); }
  portal();
}

function portal() {
  const steps = ['Entrar', 'Confirmar identidade', 'Pronto'];
  const at = PORTAL_STEP[ps.step];
  const views = {
    start: () => `
      <h2>Edital Jovem Inovador 2026</h2>
      <p class="muted text-sm">Inscrições até 15/12 (data fictícia)</p>
      <p>Para se inscrever você precisa de conta nível Ouro, que confirma o documento e o rosto. Contas Bronze (só e-mail ou telefone) e Prata (com documento) passam por uma verificação extra.</p>
      <button type="button" class="btn btn-lg btn-block" data-act="login">${icon('idcard')}Entrar com gov.br</button>
      <p class="hint">Na demonstração, o gov.br é simulado.</p>`,
    idp: () => `
      <p class="muted text-sm">Login simulado, no lugar do gov.br</p>
      <h2>Quem está entrando?</h2>
      <fieldset class="choices"><legend>Escolha uma pessoa fictícia</legend>
        ${api.users().map((u, i) => `<label class="choice"><input type="radio" name="sub" value="${u.sub}" ${i === 0 ? 'checked' : ''}><span class="choice-body">${esc(u.name)}</span><span class="muted text-sm">nível ${LEVEL[u.acr]}</span></label>`).join('')}
      </fieldset>
      <button type="button" class="btn btn-lg btn-block" data-act="authorize">Continuar com passkey ${icon('arrow-right', 'icon-nudge')}</button>`,
    challenge: () => ps.stepUp.current === 'bronze'
      ? `${status({ tone: 'warning', title: 'Falta validar seu documento', body: '<p>O nível Ouro precisa de documento (Prata) e da confirmação do rosto. Envie seu documento primeiro.</p>' })}
         <button type="button" class="btn btn-ghost" data-act="reset">${icon('arrow-left')}Voltar</button>`
      : `${status({ tone: 'info', title: `Este portal pede nível Ouro. O seu é ${LEVEL[ps.stepUp.current]}.`, body: '<p>Para entrar, confirme que é você com uma verificação rápida do rosto. Ela só aparece quando um site pede um nível acima do seu.</p>' })}
         <div class="face">${icon('face')}</div>
         <p class="text-lg"><strong>Etapa ${ps.stage === 'passive' ? 1 : 2} de 2.</strong> ${ps.stage === 'passive' ? 'Olhe para a câmera, sem óculos escuros.' : 'Vire o rosto devagar para a esquerda.'}</p>
         ${ps.msg ? `<p class="muted">${esc(ps.msg)}</p>` : ''}
         ${field({ id: 'flag', label: 'Resultado do teste (só na demonstração)', control: `<div class="select-wrap"><select class="select" id="flag">
            <option value="pass">Aprovado</option><option value="ambiguous" selected>Inconclusivo (vai para a mesa)</option><option value="fail">Reprovado</option></select>${icon('chevron', 'icon-sm')}</div>` })}
         <button type="button" class="btn btn-lg btn-block" data-act="challenge">${icon('face')}${ps.stage === 'passive' ? 'Começar verificação' : 'Fazer a segunda etapa'}</button>`,
    desk: () => `${status({ tone: 'info', title: 'Seu caso foi para a mesa humana', body: `<p>Uma pessoa treinada vai conferir. No nível Ouro, duas pessoas precisam concordar.</p><p class="text-sm">Caso <code>${ps.caseId}</code>. ${esc(ps.msg ?? '')}</p>` })}
         <div class="cluster"><button type="button" class="btn" data-act="status">${icon('refresh')}Ver se já foi aprovado</button><a class="btn btn-ghost" href="#/mesa">Abrir a mesa (demonstração)</a></div>`,
    done: () => `${status({ tone: 'success', title: `Pronto, ${esc(ps.info.name.split(' ')[0])}! Sua inscrição foi liberada.`, body: `<p>Nível ${LEVEL[ps.info.acr]}, confirmado por: ${ps.info.amr.join(', ')}.</p>` })}
         <details><summary>Ver dados recebidos pelo portal</summary><pre>${esc(JSON.stringify(ps.info, null, 2))}</pre></details>
         <button type="button" class="btn btn-ghost" data-act="reset">${icon('logout')}Sair</button>`,
    fail: () => `${status({ tone: 'error', title: 'Não foi possível confirmar sua identidade', body: `<p>${esc(ps.msg || 'Tente de novo com boa luz, ou procure um posto de atendimento.')}</p>` })}
         <button type="button" class="btn" data-act="reset">${icon('refresh')}Tentar de novo</button>`,
  };
  view.innerHTML = `
  ${pageHead('Portal de Editais', 'Site fictício de um parceiro que usa o login do gov.br e exige nível Ouro.')}
  <ol class="steps narrow" aria-label="Etapas">${steps.map((s, i) => `<li class="${i < at ? 'done' : ''}" ${i === at ? 'aria-current="step"' : ''}>${i < at ? '✓ ' : ''}${s}</li>`).join('')}</ol>
  <section class="card stack portal-card ${ps.step === 'idp' ? 'idp' : ''}">${views[ps.step]()}</section>`;

  view.onclick = async (e) => {
    const btn = e.target.closest('[data-act]');
    const act = btn?.dataset.act;
    if (act === 'login') {
      ps.verifier = rnd(); ps.state = rnd();
      ps.challenge = await api.s256(ps.verifier);
      ps.step = 'idp'; portal();
    } else if (act === 'authorize') {
      ps.sub = view.querySelector('input[name="sub"]:checked').value;
      setBusy(btn, true, 'Entrando…');
      doAuthorize();
    } else if (act === 'challenge') {
      setBusy(btn, true, 'Analisando…');
      await wait(400); // simula a captura do rosto
      const r = api.identityChallenge({ sub: ps.sub, type: ps.stage, test_flag: view.querySelector('#flag').value });
      if (r.passed) return doAuthorize();
      if (!r.ambiguous) Object.assign(ps, { step: 'fail', msg: '' });
      else if (ps.stage === 'passive') Object.assign(ps, { stage: 'active', msg: 'A primeira etapa ficou inconclusiva. Falta só mais uma.' });
      else Object.assign(ps, { step: 'desk', caseId: api.deskCase({ sub: ps.sub, level: 'ouro', reason: 'Verificação do rosto inconclusiva' }).id, msg: '' });
      portal();
    } else if (act === 'status') {
      const c = api.deskCases().find((x) => x.id === ps.caseId);
      if (c.state === 'approved') return doAuthorize();
      if (c.state === 'rejected') Object.assign(ps, { step: 'fail', msg: 'A mesa não aprovou o caso.' });
      else {
        ps.msg = c.state === 'needs_more_info' ? 'A mesa pediu mais informações.' : `Ainda em análise: ${c.approvals.length} de 2 aprovações.`;
        toast({ tone: 'info', title: 'Ainda não foi aprovado', text: ps.msg });
      }
      portal();
    } else if (act === 'reset') { Object.keys(ps).forEach((k) => delete ps[k]); ps.step = 'start'; portal(); }
  };
}

// ---------- Mesa humana ----------
const STATE_VIEW = {
  open: ['Aberto', 'info', 'clock'],
  in_review: ['Em análise', 'warning', 'users'],
  approved: ['Aprovado', 'success', 'check-circle'],
  rejected: ['Rejeitado', 'error', 'x-circle'],
  needs_more_info: ['Pediu mais informações', 'warning', 'alert'],
};
const stateText = (s) => `<span class="state tone-${STATE_VIEW[s][1]}">${icon(STATE_VIEW[s][2], 'icon-sm')}${STATE_VIEW[s][0]}</span>`;
const ms = { operator: api.OPERATORS[0].id, selected: null };
const DOC_SVG = `<svg viewBox="0 0 160 100" aria-hidden="true"><rect class="ev-bg" width="160" height="100"/><rect class="ev-shape" x="12" y="18" width="40" height="52" rx="4"/>
  <rect class="ev-line" x="62" y="20" width="84" height="7" rx="3"/><rect class="ev-line" x="62" y="35" width="70" height="6" rx="3"/><rect class="ev-line" x="62" y="48" width="80" height="6" rx="3"/><rect class="ev-line" x="62" y="61" width="50" height="6" rx="3"/></svg>`;
const SELFIE_SVG = `<svg viewBox="0 0 160 100" aria-hidden="true"><rect class="ev-bg" width="160" height="100"/><circle class="ev-shape" cx="80" cy="40" r="18"/><path class="ev-shape" d="M48 100c4-22 18-32 32-32s28 10 32 32"/></svg>`;

function mesa() {
  const cases = api.deskCases();
  const c = cases.find((x) => x.id === ms.selected);
  const openCount = cases.filter((x) => ['open', 'in_review'].includes(x.state)).length;
  const opName = (id) => api.OPERATORS.find((o) => o.id === id).name;
  const sla = (x) => {
    if (['approved', 'rejected'].includes(x.state)) return '';
    const left = x.sla_minutes - Math.floor((Date.now() - x.created) / 60000);
    return `<span class="cluster">${icon('clock', 'icon-sm')}${left > 0 ? `faltam ${left} min` : 'prazo vencido'}</span>`;
  };
  const detail = !c
    ? `<div class="card">${emptyState({ iconName: 'inbox', title: cases.length ? 'Escolha um caso na fila' : 'Nenhum caso na fila', text: cases.length ? 'Os detalhes aparecem aqui.' : 'Os casos aparecem quando a verificação do rosto fica inconclusiva no Portal.', action: cases.length ? '' : '<a class="btn btn-ghost" href="#/portal">Abrir o Portal</a>' })}</div>`
    : `<section class="card stack" aria-labelledby="case-title">
      <h2 id="case-title" tabindex="-1">${esc(c.name)}</h2>
      <p class="case-meta">${stateText(c.state)}<span>Pede nível ${LEVEL[c.level]}</span></p>
      <p>Motivo: ${esc(c.reason)}. ${c.level === 'ouro' ? `Aprovações: <strong>${c.approvals.length} de 2</strong>.` : 'Basta uma aprovação.'}</p>
      <div class="evidence"><figure>${DOC_SVG}<figcaption>Documento (fictício)</figcaption></figure><figure>${SELFIE_SVG}<figcaption>Rosto (fictício)</figcaption></figure></div>
      ${c.log.length ? `<div><h3>Histórico</h3><ul class="log">${c.log.map((l) => `<li>${icon(STATE_VIEW[l.decision][2], 'icon-sm')}<span><strong>${esc(opName(l.operator))}</strong>: ${STATE_VIEW[l.decision][0].toLowerCase()}. "${esc(l.justification)}"</span></li>`).join('')}</ul></div>` : ''}
      ${['open', 'in_review'].includes(c.state) ? `<form class="decision" id="decide" novalidate>
        ${field({ id: 'just', label: 'Por que você decidiu assim?', hint: 'Obrigatório. Escreva em uma frase.', control: '<textarea class="textarea" id="just"></textarea>' })}
        <div class="cluster">
          <button class="btn btn-secondary" data-dec="approved">${icon('check')}Aprovar</button>
          <button class="btn btn-ghost" data-dec="needs_more_info">${icon('alert')}Pedir mais informações</button>
          <button class="btn btn-danger" data-dec="rejected">${icon('x')}Rejeitar</button>
        </div></form>` : ''}
    </section>`;

  view.innerHTML = `
  ${pageHead('Mesa de validação humana', 'Aqui chegam os casos em que a verificação automática não conseguiu decidir. O operador vê só o necessário para decidir, e todos os dados são fictícios.')}
  <div class="desk">
    <aside class="stack">
      ${field({ id: 'op', label: 'Você está como', hint: 'Operadores certificados pela trilha "Operador de Mesa".',
        control: `<div class="select-wrap"><select class="select" id="op">${api.OPERATORS.map((o) => `<option value="${o.id}" ${o.id === ms.operator ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select>${icon('chevron', 'icon-sm')}</div>` })}
      <h2 class="section-title">Fila: ${openCount} ${openCount === 1 ? 'caso aberto' : 'casos abertos'}</h2>
      ${cases.length ? `<ul class="case-list">${cases.map((x) => `<li><button type="button" class="case-btn" data-case="${x.id}" ${x.id === ms.selected ? 'aria-current="true"' : ''}>
        <strong>${esc(x.name)}</strong><span class="case-meta">${stateText(x.state)}<span>${LEVEL[x.level]}</span></span><span class="case-meta muted">${sla(x)}</span></button></li>`).join('')}</ul>`
        : emptyState({ title: 'Fila vazia', text: 'Nenhum caso esperando.' })}
    </aside>
    ${detail}
  </div>`;

  view.onchange = (e) => { if (e.target.id === 'op') ms.operator = e.target.value; };
  view.oninput = (e) => { if (e.target.id === 'just') setFieldError(e.target, null); };
  view.onsubmit = (e) => e.preventDefault();
  view.onclick = (e) => {
    const pick = e.target.closest('[data-case]');
    if (pick) { ms.selected = pick.dataset.case; mesa(); view.querySelector('#case-title')?.focus?.(); return; }
    const dec = e.target.closest('[data-dec]')?.dataset.dec;
    if (!dec) return;
    e.preventDefault();
    const just = view.querySelector('#just');
    if (!just.value.trim()) { setFieldError(just, 'Escreva por que você tomou essa decisão.'); just.focus(); return; }
    try {
      const after = api.deskDecide({ case_id: ms.selected, operator: ms.operator, decision: dec, justification: just.value });
      const msg = after.state === 'in_review' && dec === 'approved' ? 'Falta outro operador concordar.' : `Caso ${STATE_VIEW[after.state][0].toLowerCase()}.`;
      toast({ tone: dec === 'rejected' ? 'warning' : 'success', title: 'Decisão registrada', text: msg });
      mesa();
    } catch (err) {
      toast({ tone: 'error', title: 'Não deu para registrar', text: `${cap(errMsg(err))}.` });
    }
  };
}

// ---------- Aprender ----------
const TRAILS = [
  { id: 'iniciante', name: 'Iniciante', icon: 'shield', goal: 'Reconhecer golpes', qs: [
    { kind: 'Mensagem', scene: '"Seu CPF será cancelado hoje. Regularize em gov-br-regulariza.com"', q: 'O que você faz?',
      opts: ['Clico e regularizo logo', 'Ignoro o link e entro no site oficial digitando o endereço', 'Respondo com meu CPF'], a: 1,
      why: 'Pressa e um endereço que imita o governo são sinais de golpe. Digite o endereço oficial você mesmo.', src: 'CERT.br' },
    { kind: 'Áudio', scene: '"Mãe, troquei de número. Me faz um Pix rapidinho?"', q: 'Qual o primeiro passo?',
      opts: ['Fazer o Pix, é meu filho', 'Ligar em vídeo para o número antigo que já estava salvo', 'Pedir uma foto dele'], a: 1,
      why: 'Número novo com pedido de dinheiro é o golpe mais comum. Confirme pelo número que você já tinha.', src: 'CERT.br' },
    { kind: 'Link', scene: '"Parabéns! Você ganhou R$ 500. Resgate em pix-premiado.net"', q: 'Isso é:',
      opts: ['Um prêmio de verdade', 'Provável golpe'], a: 1,
      why: 'Prêmio que você não pediu, com Pix no endereço, é isca para roubar dados.', src: 'CERT.br' },
  ] },
  { id: 'familia', name: 'Defensor da Família', icon: 'users', goal: 'Orientar parentes', qs: [
    { kind: 'Conversa', scene: 'Sua família vai combinar uma palavra-chave.', q: 'Para que ela serve?',
      opts: ['Senha do Wi-Fi', 'Confirmar que é mesmo o parente quando ele pede ajuda', 'Entrar no banco'], a: 1,
      why: 'A palavra-chave só a família sabe. Quem pede dinheiro e não sabe a palavra não é quem diz ser.', src: 'SaferNet' },
    { kind: 'Situação', scene: 'Sua tia já fez um Pix para um golpista há 1 hora.', q: 'O que ela faz agora?',
      opts: ['Espera para ver se devolvem', 'Avisa o banco e pede o MED do Pix o quanto antes', 'Faz outro Pix para testar'], a: 1,
      why: 'O MED (Mecanismo Especial de Devolução) do Pix funciona melhor quanto antes for pedido.', src: 'MED do Pix (Banco Central)' },
    { kind: 'Mensagem', scene: 'Seu sobrinho de 12 anos recebeu pedido de fotos de um "amigo" de jogo.', q: 'Como ajudar?',
      opts: ['Mandar ele bloquear e esquecer', 'Conversar com calma, guardar as provas e denunciar', 'Responder ao "amigo"'], a: 1,
      why: 'Acolher a criança, guardar provas e denunciar à SaferNet ou à Polícia Federal protege outras crianças.', src: 'SaferNet e Guardiões da Infância (PF)' },
  ] },
  { id: 'analista', name: 'Analista', icon: 'search', goal: 'Avaliar casos simulados', qs: [
    { kind: 'Mensagem', scene: '"Oi, vamos almoçar domingo?"', q: 'Qual o nível de alerta?',
      opts: ['Alto', 'Médio', 'Baixo, mas sem garantia'], a: 2,
      why: 'Não há tática de manipulação. Mesmo assim, ausência de sinais não é garantia.', src: 'VeriNexus' },
    { kind: 'Mensagem', scene: '"Me manda o código que chegou no seu celular."', q: 'Qual tática aparece?',
      opts: ['Pedido de código ou senha', 'Pedido de segredo', 'Nenhuma'], a: 0,
      why: 'Código de confirmação abre sua conta para outra pessoa. Nunca passe códigos.', src: 'CERT.br' },
    { kind: 'Áudio', scene: 'O arquivo do áudio não mostra sinais de edição.', q: 'Isso prova que a voz é do neto?',
      opts: ['Sim', 'Não. É só um sinal fraco'], a: 1,
      why: 'O WhatsApp recodifica o áudio e apaga quase tudo. O que importa é o conteúdo e confirmar por outro canal.', src: 'VeriNexus' },
  ] },
  { id: 'operador', name: 'Operador de Mesa', icon: 'idcard', goal: 'Prova prática na fila simulada', qs: [
    { kind: 'Caso', scene: 'Documento legível, mas a foto do rosto está tremida e escura.', q: 'Sua decisão:',
      opts: ['Aprovar', 'Rejeitar', 'Pedir mais informações'], a: 2,
      why: 'Se a evidência não basta para decidir, peça mais informações em vez de adivinhar.', src: 'VeriNexus' },
    { kind: 'Caso', scene: 'Você aprovou um caso de nível Ouro.', q: 'O que acontece?',
      opts: ['A pessoa já vira Ouro', 'Falta outro operador concordar'], a: 1,
      why: 'No nível Ouro, dois operadores precisam concordar.', src: 'VeriNexus' },
    { kind: 'Caso', scene: 'O sistema mostra nome, nível pedido, documento e foto do rosto.', q: 'Você deve pedir mais dados pessoais da pessoa?',
      opts: ['Sim, quanto mais melhor', 'Não. Uso só o mínimo necessário'], a: 1,
      why: 'Minimização de dados é regra da LGPD e da mesa.', src: 'LGPD' },
  ] },
];
const EDU_KEY = 'verinexus-edu';
const loadEdu = () => { try { return JSON.parse(localStorage.getItem(EDU_KEY)) ?? null; } catch { return null; } };
const edu = loadEdu() ?? { nick: '', points: 0, done: {}, medals: [] };
const saveEdu = () => { try { localStorage.setItem(EDU_KEY, JSON.stringify(edu)); } catch { /* sem armazenamento: progresso só nesta visita */ } };
const es = { trail: null, q: 0, picked: null, missed: false, finished: null };

function educacao() {
  const level = Math.floor(edu.points / 100) + 1;
  const t = TRAILS.find((x) => x.id === es.trail);
  const doneCount = (x) => (edu.done[x.id] ?? []).length;
  const next = TRAILS.find((x) => doneCount(x) < x.qs.length);

  if (es.finished) {
    const f = TRAILS.find((x) => x.id === es.finished);
    view.innerHTML = `<section class="card celebrate narrow">${emptyState({ iconName: 'award', title: `Medalha conquistada: ${f.name}!`,
      text: `Você ganhou 30 pontos de bônus. Agora tem ${edu.points} pontos.`,
      action: `<div class="cluster">${next ? `<button type="button" class="btn" data-trail="${next.id}">Próxima trilha: ${next.name} ${icon('arrow-right', 'icon-nudge')}</button>` : ''}<button type="button" class="btn btn-ghost" data-act="back">Ver todas as trilhas</button></div>` })}</section>`;
  } else if (!t) {
    view.innerHTML = `
    ${pageHead('Aprenda a se proteger', 'Desafios curtos, sem cadastro. Quem conclui as quatro trilhas pode trabalhar como operador da mesa.')}
    <section class="card profile">
      ${field({ id: 'nick', label: 'Seu apelido (opcional)', hint: 'Guardamos só o apelido e o progresso, neste aparelho.', control: `<input class="input" id="nick" value="${esc(edu.nick)}" maxlength="30" autocomplete="off" placeholder="como quer ser chamado">` })}
      <div class="stack">
        <p class="points">${edu.points} pontos · Nível ${level}</p>
        <div class="progress" role="progressbar" aria-label="Progresso até o próximo nível" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${edu.points % 100}"><span style="--p:${(edu.points % 100) / 100}"></span></div>
        <p class="hint">Faltam ${100 - (edu.points % 100)} pontos para o nível ${level + 1}.</p>
      </div>
      <p class="medals">${edu.medals.length ? `${icon('award')}<span>Medalhas: ${edu.medals.map(esc).join(', ')}</span>` : '<span class="muted text-sm">Conclua uma trilha para ganhar sua primeira medalha.</span>'}</p>
    </section>
    <section class="section">
      <h2 class="section-title">Trilhas</h2>
      <div class="grid-auto trails">${TRAILS.map((x) => {
        const n = doneCount(x);
        const complete = n === x.qs.length;
        return `<section class="card trail">
          <h3>${x.name}</h3><p class="muted">${x.goal}</p>
          <div class="progress" aria-hidden="true"><span style="--p:${n / x.qs.length}"></span></div>
          <p class="text-sm">${n} de ${x.qs.length} desafios</p>
          <button type="button" class="btn ${x === next ? '' : 'btn-ghost'}" data-trail="${x.id}">${complete ? 'Refazer' : n ? 'Continuar' : 'Começar'}<span class="sr-only"> a trilha ${x.name}</span></button>
        </section>`;
      }).join('')}</div>
      <p class="hint section">Conteúdo de apoio: CERT.br, SaferNet, MED do Pix (Banco Central) e Guardiões da Infância (PF).</p>
    </section>`;
  } else {
    const q = t.qs[es.q];
    const right = es.picked === q.a;
    view.innerHTML = `
    <section class="quiz narrow">
      <button type="button" class="btn btn-quiet" data-act="back">${icon('arrow-left')}Voltar às trilhas</button>
      <div class="stack section">
        <p class="muted">${t.name}, desafio ${es.q + 1} de ${t.qs.length}</p>
        <div class="progress" aria-hidden="true"><span style="--p:${es.q / t.qs.length}"></span></div>
      </div>
      <div class="card section">
        <p class="muted text-sm">${q.kind}</p>
        <p class="scenario">${esc(q.scene)}</p>
        <h2 id="q-title">${esc(q.q)}</h2>
        <div class="choices" role="group" aria-labelledby="q-title">${q.opts.map((o, i) => {
          const state = es.picked === i ? (i === q.a ? 'is-right' : 'is-wrong') : '';
          return `<button type="button" class="choice ${state}" data-opt="${i}" ${right ? 'disabled' : ''}>
            ${state ? icon(state === 'is-right' ? 'check-circle' : 'x-circle') : ''}<span class="choice-body">${esc(o)}</span>${state ? `<span class="sr-only">${state === 'is-right' ? '(resposta certa)' : '(resposta errada)'}</span>` : ''}</button>`;
        }).join('')}</div>
        <div id="feedback" aria-live="polite">${es.picked !== null ? status({ tone: right ? 'success' : 'warning', live: false,
          title: right ? (es.missed ? 'Isso! Sem pontos desta vez.' : 'Certo! +10 pontos') : 'Ainda não. Tente outra opção.',
          body: `<p>${esc(q.why)}</p><p class="text-sm">Fonte: ${esc(q.src)}</p>` }) : ''}</div>
        ${right ? `<button type="button" class="btn btn-lg btn-block section" data-act="next">${es.q + 1 < t.qs.length ? 'Próximo desafio' : 'Concluir trilha'} ${icon('arrow-right', 'icon-nudge')}</button>` : ''}
      </div>
    </section>`;
  }

  view.oninput = (e) => { if (e.target.id === 'nick') { edu.nick = e.target.value.slice(0, 30); saveEdu(); } };
  view.onclick = (e) => {
    const el = e.target.closest('[data-trail], [data-act], [data-opt]');
    if (!el) return;
    const d = el.dataset;
    if (d.trail) Object.assign(es, { trail: d.trail, q: 0, picked: null, missed: false, finished: null });
    else if (d.act === 'back') Object.assign(es, { trail: null, finished: null });
    else if (d.opt !== undefined) {
      const q = t.qs[es.q];
      es.picked = +d.opt;
      if (es.picked !== q.a) es.missed = true;
      else {
        const done = (edu.done[t.id] ??= []);
        if (!es.missed && !done.includes(es.q)) edu.points += 10;
        if (!done.includes(es.q)) done.push(es.q);
        saveEdu();
      }
      educacao();
      view.querySelector(es.picked === q.a ? '[data-act="next"]' : '#feedback')?.focus?.();
      return;
    } else if (d.act === 'next') {
      if (es.q + 1 < t.qs.length) Object.assign(es, { q: es.q + 1, picked: null, missed: false });
      else {
        if (!edu.medals.includes(t.name)) {
          if (!edu.medals.length) api.reportTrainingCompleted();
          edu.medals.push(t.name);
          edu.points += 30;
          saveEdu();
          es.finished = t.id;
          toast({ tone: 'success', title: `Medalha: ${t.name}`, text: '+30 pontos de bônus.' });
        }
        es.trail = null;
      }
    }
    educacao();
    scrollTo(0, 0);
  };
}

// ---------- Painel da SIA ----------
const KPIS = [
  ['scams_prevented', 'Golpes evitados', 'shield', 'Alertas altos respondidos no WhatsApp'],
  ['sites_flagged', 'Sites sinalizados', 'alert', 'Endereços suspeitos ou perigosos'],
  ['people_trained', 'Pessoas formadas', 'school', 'Concluíram ao menos uma trilha'],
  ['desk_operators', 'Operadores ativos', 'users', 'Pessoas na mesa humana'],
];

function painel(loading = false) {
  const m = api.metricsSummary();
  view.innerHTML = `
  ${pageHead('Painel da SIA', 'Contagens anônimas geradas para a demonstração, somadas ao que você fez nesta sessão.')}
  <div class="grid-auto kpis">${KPIS.map(([k, label, , help], i) => `<section class="card kpi" style="--i:${i}">
    ${loading ? skeleton(1) : `<p class="kpi-value">${m[k].toLocaleString('pt-BR')}</p>`}
    <p class="kpi-label">${label}</p><p class="hint">${help}</p></section>`).join('')}</div>
  <div class="cluster section"><button type="button" class="btn btn-ghost" data-act="refresh">${icon('refresh')}Atualizar números</button>
    <span class="hint">Números ilustrativos, não confiáveis.</span></div>`;
  view.onclick = async (e) => {
    if (!e.target.closest('[data-act="refresh"]')) return;
    painel(true);
    await wait(300); // shortcut: latência simulada para mostrar o carregamento; remover quando houver backend real
    painel();
    toast({ tone: 'success', title: 'Números atualizados' });
  };
}

// Primeira renderização no fim do módulo: as telas usam estado (chat, ext, ps, ms, es, edu, KPIS, TRAILS)
// declarado com const mais abaixo; renderizar antes disso dava ReferenceError ao recarregar em #/whatsapp etc.
render();
