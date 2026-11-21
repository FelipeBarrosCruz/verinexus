import * as api from './api.js';

const view = document.getElementById('view');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const errMsg = (e) => e?.body?.error?.message ?? e.message;
const list = (items, tag = 'ul') => `<${tag}>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</${tag}>`;

// ---------- Rotas ----------
const routes = { '': landing, whatsapp, extensao, portal, mesa, educacao, painel };
function render() {
  const r = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  view.onclick = view.onsubmit = view.onchange = view.oninput = null;
  (routes[r] ?? landing)();
  document.querySelectorAll('nav a').forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === `#/${r}`));
  document.querySelectorAll('nav a[aria-current]').forEach((a) => a.setAttribute('aria-current', 'page'));
}
addEventListener('hashchange', () => { render(); view.focus(); });
render();

// ---------- Resultado de URL (usado por landing e extensão) ----------
const VERDICT = {
  safe_signals: ['ok', 'Não encontramos sinais de risco'],
  suspicious: ['warn', 'Suspeito'],
  dangerous: ['bad', 'Perigoso'],
  unknown: ['warn', 'Sem informação suficiente'],
};
const toneOf = (r) => (r.badge ? 'ok' : VERDICT[r.verdict][0]);
function urlResult(r) {
  const label = r.badge ? '✔ Verificado: serviço oficial' : VERDICT[r.verdict][1];
  return `<div class="result ${toneOf(r)}"><strong>${label}</strong>
    ${r.reasons.length && !r.badge ? `<p class="small" style="margin:.5rem 0 0">Motivos:</p>${list(r.reasons.map((x) => x.text))}` : ''}
    <p class="small" style="margin:.5rem 0 0">O que fazer:</p>${list(r.advice)}</div>`;
}

// ---------- Landing ----------
function landing() {
  const examples = ['gov-br-regulariza.com/cpf', 'www.pi.gov.br', 'loja-exemplo.com.br', 'http://pix-premiado.net'];
  view.innerHTML = `
  <section class="hero">
    <p class="motto">Pare. Confirme. Só depois aja.</p>
    <h1>Cheque um link antes de enviar documentos</h1>
    <p class="lead">Cole o endereço do site. O VeriNexus mostra os sinais de risco e o que fazer, em poucas palavras.</p>
  </section>
  <section class="card">
    <form id="url-form" class="row">
      <label class="sr" for="url">Endereço do site</label>
      <input id="url" placeholder="ex.: www.pi.gov.br" autocomplete="off" required>
      <button>Verificar</button>
    </form>
    <div class="row small" style="margin-top:.6rem"><span class="muted">Exemplos fictícios:</span>
      ${examples.map((u) => `<button type="button" class="chip" data-url="${u}">${u}</button>`).join('')}</div>
    <div id="url-out" aria-live="polite"></div>
  </section>
  <div class="grid">
    <section class="card">
      <h2>Meus dados vazaram?</h2>
      <p class="small muted">Seu e-mail ou CPF vira um código (hash) aqui no seu navegador. Só os 5 primeiros caracteres desse código são enviados.</p>
      <form id="breach-form" class="row">
        <label class="sr" for="breach">E-mail ou CPF</label>
        <input id="breach" placeholder="e-mail ou CPF" autocomplete="off" required>
        <button>Consultar</button>
      </form>
      <p class="small muted" style="margin-top:.5rem">Teste com: maria.ficticia@exemplo.com ou 123.456.789-09</p>
      <div id="breach-out" aria-live="polite"></div>
    </section>
    <section class="card">
      <h2>Recebeu um áudio estranho?</h2>
      <p>Encaminhe para o WhatsApp do VeriNexus. A resposta diz o nível de alerta e o que fazer.</p>
      <a class="btn" href="#/whatsapp">Abrir o simulador</a>
    </section>
    <section class="card">
      <h2>Aprenda a se proteger</h2>
      <p>Trilhas curtas e gratuitas. Quem conclui todas pode virar operador da mesa de validação.</p>
      <a class="btn" href="#/educacao">Começar a aprender</a>
    </section>
  </div>`;

  const check = (url) => {
    const out = view.querySelector('#url-out');
    try { out.innerHTML = urlResult(api.verifyUrl({ url, channel: 'landing' })); } catch (e) { out.innerHTML = `<p class="error">${esc(errMsg(e))}</p>`; }
  };
  view.onclick = (e) => {
    const u = e.target.dataset?.url;
    if (u) { view.querySelector('#url').value = u; check(u); }
  };
  view.onsubmit = async (e) => {
    e.preventDefault();
    if (e.target.id === 'url-form') return check(view.querySelector('#url').value);
    const out = view.querySelector('#breach-out');
    const v = view.querySelector('#breach').value.trim().toLowerCase();
    const digits = v.replace(/[.\-\s]/g, '');
    const normalized = /^\d{11}$/.test(digits) ? digits : v;
    try {
      const h = await api.sha1hex(normalized);
      const { matches } = await api.breachCheck({ hash_prefix: h.slice(0, 5) });
      const found = matches.includes(h.slice(5));
      out.innerHTML = `<div class="result ${found ? 'bad' : 'ok'}">
        <strong>${found ? 'Encontramos este dado em um vazamento' : 'Não encontramos este dado nas bases consultadas'}</strong>
        ${found ? list(['Troque a senha dos serviços que usam este e-mail.', 'Ative a verificação em duas etapas.', 'Desconfie de mensagens que citam seus dados.']) : '<p class="small">Isso não garante que o dado nunca vazou.</p>'}
        <p class="small muted">Enviado ao servidor: <code>${h.slice(0, 5)}</code>. O resto ficou no seu navegador.</p></div>`;
    } catch (err) { out.innerHTML = `<p class="error">${esc(errMsg(err))}</p>`; }
  };
}

// ---------- WhatsApp (simulador) ----------
const ALERT_LINE = { high: '🔴 Alerta ALTO: isso tem cara de golpe.', medium: '🟡 Alerta MÉDIO: tenha cuidado.', low: '🟢 Alerta BAIXO: não achamos sinais.' };
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
  { label: '🎤 Áudio "do neto"', audio: true, dur: '0:09', meta: {}, text: 'Vó, sou eu, troquei de número. Faz um pix de 800 agora e não conta pra ninguém.' },
  { label: '🎤 Áudio do almoço', audio: true, dur: '0:04', meta: { codec: 'opus', encoder: 'WhatsApp' }, text: 'Oi vó, vamos almoçar domingo? Levo a sobremesa.' },
  { label: '🔗 Link do CPF', text: 'Seu CPF será bloqueado. Regularize em gov-br-regulariza.com/cpf' },
  { label: '💬 Pedido de código', text: 'Me manda o código que chegou no seu celular.' },
];
// Só na memória da página: o servidor (api.js) não guarda nada.
const chat = [{ from: 'bot', text: 'Olá! Sou o VeriNexus, da SIA. Encaminhe aqui um áudio, mensagem ou link que pareça estranho. Eu digo o que fazer.' }];
const URL_RE = /\b(?:https?:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?/gi;

function replyForMessage(r, metaSignal) {
  const why = [...r.tactics].sort((a, b) => TACTIC_ORDER.indexOf(a.code) - TACTIC_ORDER.indexOf(b.code)).slice(0, 3);
  return [
    ALERT_LINE[r.alert],
    why.length ? `\nPor quê:\n${why.map((t) => `• ${TACTIC_TEXT[t.code]}`).join('\n')}` : '',
    `\nO que fazer:\n${r.advice.slice(0, 5).map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
    metaSignal ? `\nÁudio: ${META_LINE[metaSignal]}` : '',
    `\nℹ️ ${r.disclaimer}`,
  ].join('\n');
}
function replyForUrl(url, r) {
  const head = r.badge ? `🟢 ${url}: site oficial verificado.` : `${{ ok: '🟢', warn: '🟡', bad: '🔴' }[toneOf(r)]} ${url}: ${VERDICT[r.verdict][1].toLowerCase()}.`;
  const why = r.badge ? [] : r.reasons.slice(0, 3).map((x) => `• ${x.text}`);
  return [head, why.length ? `\nPor quê:\n${why.join('\n')}` : '', `\nO que fazer:\n${r.advice.map((a, i) => `${i + 1}. ${a}`).join('\n')}`].join('\n');
}
function process({ text, audio, meta }) {
  const replies = [];
  try {
    const urls = (text.match(URL_RE) ?? []).slice(0, 2);
    const rest = urls.reduce((t, u) => t.replace(u, ''), text).trim();
    const metaSignal = audio ? api.verifyAudioMeta({ metadata: meta }).signal : null;
    if (rest) {
      const r = api.verifyMessage({ text: rest, source: audio ? 'whatsapp_audio_transcript' : 'whatsapp_text' });
      if (r.alert !== 'low' || !urls.length) replies.push(replyForMessage(r, metaSignal));
    }
    for (const u of urls) replies.push(replyForUrl(u, api.verifyUrl({ url: u, channel: 'whatsapp' })));
  } catch (e) { replies.push(`Não consegui analisar: ${errMsg(e)}`); }
  return replies;
}

function whatsapp() {
  view.innerHTML = `
  <h1>WhatsApp do VeriNexus <span class="tag demo">simulador</span></h1>
  <p class="lead">Emula o webhook do WhatsApp Business. O áudio de exemplo já vem com a transcrição pronta. Nada da conversa é guardado.</p>
  <div class="phone">
    <header>VeriNexus · SIA Piauí<small>conta oficial (simulada)</small></header>
    <div class="msgs" id="msgs" aria-live="polite"></div>
    <div class="samples">${SAMPLES.map((s, i) => `<button class="chip" data-sample="${i}">${s.label}</button>`).join('')}</div>
    <form class="compose" id="compose">
      <label class="sr" for="msg">Mensagem</label>
      <input id="msg" placeholder="Cole uma mensagem ou link" autocomplete="off">
      <button aria-label="Enviar">➤</button>
    </form>
  </div>`;
  const draw = () => {
    const box = view.querySelector('#msgs');
    box.innerHTML = chat.map((m, i) => m.from === 'user'
      ? `<div class="bubble out">${m.audio ? `▶︎ Áudio encaminhado · ${m.dur}<span class="meta">Transcrição simulada: “${esc(m.text)}”</span>` : esc(m.text)}</div>`
      : `<div class="bubble">${esc(m.text)}${'speechSynthesis' in window ? `<span class="meta"><button class="chip" data-speak="${i}">🔊 Ouvir</button></span>` : ''}</div>`).join('');
    box.scrollTop = box.scrollHeight;
  };
  const send = (msg) => {
    chat.push({ from: 'user', ...msg });
    for (const text of process(msg)) chat.push({ from: 'bot', text });
    draw();
  };
  view.onclick = (e) => {
    const { sample, speak } = e.target.dataset ?? {};
    if (sample) send(SAMPLES[sample]);
    if (speak) {
      const u = new SpeechSynthesisUtterance(chat[speak].text.replace(/[🔴🟡🟢ℹ️•]/gu, ''));
      u.lang = 'pt-BR';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  };
  view.onsubmit = (e) => {
    e.preventDefault();
    const input = view.querySelector('#msg');
    if (!input.value.trim()) return;
    send({ text: input.value });
    input.value = '';
  };
  draw();
}

// ---------- Extensão (simulada dentro da página) ----------
const PAGES = {
  'https://gov-br-regulariza.com/consulta-cpf': { title: 'Regularize seu CPF', body: 'Seu CPF está pendente. Regularize hoje para evitar bloqueio.' },
  'https://www.pi.gov.br/servicos': { title: 'Serviços do Governo do Piauí', body: 'Acesse serviços com sua conta gov.br.' },
  'https://loja-exemplo.com.br/cadastro': { title: 'Loja Exemplo: cadastro', body: 'Crie sua conta para acompanhar pedidos.' },
};
const ext = { url: Object.keys(PAGES)[0], result: null, sent: false };

function extensao() {
  let r;
  try { r = ext.result = api.verifyUrl({ url: ext.url, channel: 'extension' }); } catch (e) { r = null; }
  const tone = r ? toneOf(r) : 'warn';
  const page = PAGES[ext.url] ?? { title: 'Página fictícia', body: 'Conteúdo de exemplo.' };
  view.innerHTML = `
  <h1>Extensão do navegador <span class="tag demo">simulação</span></h1>
  <p class="lead">Ao abrir uma página, a extensão envia só o endereço para a API. Se a página for suspeita e pedir documento, ela avisa antes do envio.</p>
  <div class="row small" style="margin-bottom:.75rem"><span class="muted">Abrir:</span>
    ${Object.keys(PAGES).map((u) => `<button class="chip" data-open="${u}">${new URL(u).hostname}</button>`).join('')}</div>
  <div class="ext-layout">
    <div class="browser">
      <form class="bar" id="addr">
        <label class="sr" for="addr-in">Endereço</label>
        <input id="addr-in" value="${esc(ext.url)}" autocomplete="off">
        <span class="ext ${tone}" title="Selo VeriNexus" role="img" aria-label="Selo VeriNexus: ${r ? (r.badge ? 'verificado' : VERDICT[r.verdict][1]) : 'endereço inválido'}">${{ ok: '✔', warn: '!', bad: '✖' }[tone]}</span>
      </form>
      <div class="page">
        <h2>${esc(page.title)}</h2><p>${esc(page.body)}</p>
        <form id="doc-form" class="row" style="max-width:420px">
          <label class="sr" for="cpf">CPF</label><input id="cpf" name="cpf" placeholder="CPF (fictício)" required>
          <label class="sr" for="pwd">Senha</label><input id="pwd" type="password" name="senha" placeholder="Senha">
          <button>Enviar</button>
        </form>
        ${ext.sent ? '<p class="small muted" style="margin-top:.75rem">Formulário enviado (simulação; nada saiu daqui).</p>' : ''}
      </div>
    </div>
    <aside class="card" style="margin:0"><h3>Painel da extensão</h3>${r ? urlResult(r) : '<p class="error">Endereço inválido.</p>'}</aside>
  </div>`;

  const go = (url) => { ext.url = url; ext.sent = false; extensao(); };
  view.onclick = (e) => {
    const d = e.target.dataset ?? {};
    if (d.open) go(d.open);
    if (d.modal === 'back') view.querySelector('.modal-bg')?.remove();
    if (d.modal === 'send') { ext.sent = true; extensao(); }
  };
  view.onsubmit = (e) => {
    e.preventDefault();
    if (e.target.id === 'addr') return go(view.querySelector('#addr-in').value.trim());
    const hasDocField = e.target.querySelector('input[name*=cpf], input[name*=rg], input[type=password]');
    const risky = !ext.result || (!ext.result.badge && ext.result.verdict !== 'safe_signals');
    if (hasDocField && risky) {
      view.insertAdjacentHTML('beforeend', `<div class="modal-bg"><div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="mt">
        <h2 id="mt">Pare antes de enviar seu CPF</h2>
        <p>O VeriNexus achou sinais de golpe nesta página. Enviar documento ou senha aqui pode causar prejuízo.</p>
        <div class="row"><button class="ok" data-modal="back">Não enviar</button><button class="ghost" data-modal="send">Enviar mesmo assim</button></div></div></div>`);
      view.querySelector('[data-modal=back]').focus();
    } else { ext.sent = true; extensao(); }
  };
}

// ---------- Portal de Editais Fictício (cliente OIDC) ----------
const CLIENT = { client_id: 'portal-editais', redirect_uri: '#/portal' };
const ps = { step: 'start' };
const rnd = () => [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');

async function doAuthorize() {
  try {
    const res = api.authorize({ ...CLIENT, response_type: 'code', state: ps.state, code_challenge: ps.challenge, code_challenge_method: 'S256', acr_values: 'ouro' }, ps.sub);
    if (res.step_up) Object.assign(ps, { step: 'challenge', stepUp: res.step_up, stage: 'passive', msg: '' });
    else {
      if (res.state !== ps.state) throw new Error('state não confere');
      const t = await api.token({ grant_type: 'authorization_code', code: res.code, code_verifier: ps.verifier, client_id: CLIENT.client_id });
      Object.assign(ps, { step: 'done', info: api.userinfo(t.access_token) });
    }
  } catch (e) { Object.assign(ps, { step: 'fail', msg: errMsg(e) }); }
  portal();
}

function portal() {
  const users = api.users();
  const stepView = {
    start: () => `<p>Para se inscrever no <strong>Edital Jovem Inovador 2026</strong>, entre com sua conta. Este portal exige <strong>nível ouro</strong>.</p>
      <button data-act="login">Entrar com gov.br (simulado)</button>`,
    idp: () => `<div class="card" style="border-color:var(--brand)">
      <p class="small muted">Provedor de identidade simulado · papel do gov.br/pi.gov.br · OIDC com code + PKCE</p>
      <fieldset style="border:0;padding:0;margin:0 0 .75rem"><legend>Entrar como (pessoas fictícias):</legend>
        ${users.map((u, i) => `<label style="display:block;margin:.3rem 0"><input type="radio" name="sub" value="${u.sub}" ${i === 0 ? 'checked' : ''}> ${esc(u.name)} <span class="tag">${u.acr}</span></label>`).join('')}
      </fieldset><button data-act="authorize">Continuar com passkey</button></div>`,
    challenge: () => ps.stepUp.current === 'bronze'
      ? `<div class="result warn"><strong>Falta validar seu documento</strong><p>O nível ouro precisa de documento (prata) e desafio de rosto. Envie seu documento primeiro.</p></div><button class="ghost" data-act="reset">Voltar</button>`
      : `<div class="result warn"><strong>Este portal exige nível ouro. Seu nível: ${ps.stepUp.current}.</strong>
        <p>Vamos fazer um desafio rápido de rosto. Só pedimos isso quando é preciso.</p></div>
        <p><label>Resultado simulado do teste:
          <select id="flag"><option value="pass">Aprovado</option><option value="ambiguous" selected>Ambíguo (vai para a mesa)</option><option value="fail">Reprovado</option></select></label></p>
        <p>${ps.stage === 'passive' ? 'Etapa 1 de 2 · Desafio passivo: olhe para a câmera.' : 'Etapa 2 de 2 · Desafio ativo: vire o rosto devagar para a esquerda.'}</p>
        <button data-act="challenge">${ps.stage === 'passive' ? 'Fazer desafio passivo' : 'Fazer desafio ativo'}</button>
        ${ps.msg ? `<p class="muted" style="margin-top:.5rem">${esc(ps.msg)}</p>` : ''}`,
    desk: () => `<div class="result warn"><strong>Seu caso foi para a mesa humana</strong>
        <p>Caso <code>${ps.caseId}</code>. No nível ouro, dois operadores precisam concordar. ${esc(ps.msg ?? '')}</p></div>
        <div class="row"><a class="btn" href="#/mesa">Abrir a mesa</a><button class="ghost" data-act="status">Verificar status</button></div>`,
    done: () => `<div class="result ok"><strong>Olá, ${esc(ps.info.name)}. Inscrição liberada.</strong>
        <p>Nível de garantia: <strong>${ps.info.acr}</strong> · métodos: ${ps.info.amr.join(', ')}</p></div>
        <details><summary class="small">Claims recebidas (userinfo)</summary><pre class="small">${esc(JSON.stringify(ps.info, null, 2))}</pre></details>
        <button class="ghost" data-act="reset">Sair</button>`,
    fail: () => `<div class="result bad"><strong>Não foi possível confirmar sua identidade</strong><p>${esc(ps.msg || 'Tente de novo ou procure um posto de atendimento.')}</p></div>
        <button class="ghost" data-act="reset">Tentar de novo</button>`,
  };
  view.innerHTML = `
  <p class="small muted">Site de terceiros de exemplo · cliente OIDC pedindo <code>acr_values=ouro</code></p>
  <h1>Portal de Editais Fictício</h1>
  <section class="card">${stepView[ps.step]()}</section>`;

  view.onclick = async (e) => {
    const act = e.target.dataset?.act;
    if (act === 'login') {
      ps.verifier = rnd(); ps.state = rnd();
      ps.challenge = await api.s256(ps.verifier);
      ps.step = 'idp'; portal();
    } else if (act === 'authorize') {
      ps.sub = view.querySelector('input[name=sub]:checked').value;
      doAuthorize();
    } else if (act === 'challenge') {
      const r = api.identityChallenge({ sub: ps.sub, type: ps.stage, test_flag: view.querySelector('#flag').value });
      if (r.passed) return doAuthorize();
      if (!r.ambiguous) Object.assign(ps, { step: 'fail', msg: '' });
      else if (ps.stage === 'passive') Object.assign(ps, { stage: 'active', msg: 'O desafio passivo ficou inconclusivo. Vamos para o ativo.' });
      else Object.assign(ps, { step: 'desk', caseId: api.deskCase({ sub: ps.sub, level: 'ouro', reason: 'Desafio de rosto ambíguo' }).id, msg: '' });
      portal();
    } else if (act === 'status') {
      const c = api.deskCases().find((x) => x.id === ps.caseId);
      if (c.state === 'approved') return doAuthorize();
      if (c.state === 'rejected') Object.assign(ps, { step: 'fail', msg: 'A mesa não aprovou o caso.' });
      else ps.msg = c.state === 'needs_more_info' ? 'A mesa pediu mais informações.' : `Ainda em análise (${c.approvals.length} de 2 aprovações).`;
      portal();
    } else if (act === 'reset') { Object.keys(ps).forEach((k) => delete ps[k]); ps.step = 'start'; portal(); }
  };
}

// ---------- Mesa humana ----------
const STATE_PT = { open: 'Aberto', in_review: 'Em análise', approved: 'Aprovado', rejected: 'Rejeitado', needs_more_info: 'Pedir mais informações' };
const ms = { operator: api.OPERATORS[0].id, selected: null, msg: '' };
const DOC_SVG = `<svg viewBox="0 0 160 100" aria-hidden="true"><rect width="160" height="100" fill="#dfe9f1"/><rect x="10" y="18" width="40" height="52" fill="#b5c6d3"/><g fill="#8aa1b3"><rect x="60" y="20" width="85" height="7"/><rect x="60" y="35" width="70" height="6"/><rect x="60" y="48" width="80" height="6"/><rect x="60" y="61" width="50" height="6"/></g><text x="80" y="90" font-size="9" text-anchor="middle" fill="#4b6274">DOCUMENTO FICTÍCIO</text></svg>`;
const SELFIE_SVG = `<svg viewBox="0 0 160 100" aria-hidden="true"><rect width="160" height="100" fill="#e8e1d6"/><circle cx="80" cy="40" r="18" fill="#b9a78f" opacity=".7"/><path d="M48 100c4-22 18-32 32-32s28 10 32 32" fill="#b9a78f" opacity=".7"/><text x="80" y="94" font-size="9" text-anchor="middle" fill="#6b5b45">SELFIE FICTÍCIA</text></svg>`;

function mesa() {
  const cases = api.deskCases();
  const c = cases.find((x) => x.id === ms.selected);
  const sla = (x) => {
    const left = x.sla_minutes - Math.floor((Date.now() - x.created) / 60000);
    return ['approved', 'rejected'].includes(x.state) ? '—' : left > 0 ? `${left} min` : 'atrasado';
  };
  view.innerHTML = `
  <h1>Mesa de validação humana</h1>
  <p class="lead">Casos ambíguos de documento e rosto. O operador vê só o mínimo necessário. Nível ouro precisa de dois operadores; prata, de um.</p>
  <div class="card row">
    <label>Operador:
      <select id="op">${api.OPERATORS.map((o) => `<option value="${o.id}" ${o.id === ms.operator ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>
    <span class="small muted">Operadores certificados pela trilha “Operador de Mesa” (fictícios).</span>
  </div>
  <section class="card table-wrap">
    <h2>Fila</h2>
    ${cases.length ? `<table><thead><tr><th>Caso</th><th>Pessoa</th><th>Nível</th><th>Estado</th><th>Aprovações</th><th>SLA</th><th></th></tr></thead><tbody>
      ${cases.map((x) => `<tr class="${x.id === ms.selected ? 'sel' : ''}"><td><code>${x.id}</code></td><td>${esc(x.name)}</td><td>${x.level}</td>
        <td class="st-${x.state}">${STATE_PT[x.state]}</td><td>${x.approvals.length}/${x.level === 'ouro' ? 2 : 1}</td><td>${sla(x)}</td>
        <td><button class="ghost" data-case="${x.id}">Abrir</button></td></tr>`).join('')}</tbody></table>`
      : '<p class="muted">Nenhum caso. Gere um pelo Portal de Editais.</p>'}
  </section>
  ${c ? `<section class="card">
    <h2>Caso <code>${c.id}</code> · ${esc(c.name)}</h2>
    <p>Nível pedido: <strong>${c.level}</strong> · Motivo: ${esc(c.reason)} · Estado: <span class="st-${c.state}">${STATE_PT[c.state]}</span></p>
    <div class="evidence"><figure>${DOC_SVG}<figcaption>Documento</figcaption></figure><figure>${SELFIE_SVG}<figcaption>Selfie do desafio</figcaption></figure></div>
    ${c.log.length ? `<p class="small muted">Histórico:</p>${list(c.log.map((l) => `${api.OPERATORS.find((o) => o.id === l.operator).name}: ${STATE_PT[l.decision]} — ${l.justification}`))}` : ''}
    ${['open', 'in_review'].includes(c.state) ? `<form id="decide">
      <label for="just">Justificativa (obrigatória)</label><textarea id="just" required></textarea>
      <div class="row" style="margin-top:.5rem">
        <button class="ok" data-dec="approved">Aprovar</button><button class="bad" data-dec="rejected">Rejeitar</button><button class="warn" data-dec="needs_more_info">Pedir mais informações</button>
      </div></form>` : ''}
    ${ms.msg ? `<p class="error" role="alert">${esc(ms.msg)}</p>` : ''}
  </section>` : ''}`;

  view.onchange = (e) => { if (e.target.id === 'op') { ms.operator = e.target.value; ms.msg = ''; } };
  view.onclick = (e) => {
    const d = e.target.dataset ?? {};
    if (d.case) { ms.selected = d.case; ms.msg = ''; mesa(); }
    if (d.dec) {
      e.preventDefault();
      try {
        api.deskDecide({ case_id: ms.selected, operator: ms.operator, decision: d.dec, justification: view.querySelector('#just').value });
        ms.msg = '';
      } catch (err) { ms.msg = errMsg(err); }
      mesa();
    }
  };
  view.onsubmit = (e) => e.preventDefault();
}

// ---------- Área educativa ----------
const TRAILS = [
  { id: 'iniciante', name: 'Iniciante', goal: 'Reconhecer golpes', qs: [
    { kind: 'Mensagem', scene: '“Seu CPF será cancelado hoje. Regularize em gov-br-regulariza.com”', q: 'O que você faz?',
      opts: ['Clico e regularizo logo', 'Ignoro o link e entro no site oficial digitando o endereço', 'Respondo com meu CPF'], a: 1,
      why: 'Pressa e um endereço que imita o governo são sinais de golpe. Digite o endereço oficial você mesmo.', src: 'CERT.br' },
    { kind: 'Áudio', scene: '“Mãe, troquei de número. Me faz um Pix rapidinho?”', q: 'Qual o primeiro passo?',
      opts: ['Fazer o Pix, é meu filho', 'Ligar em vídeo para o número antigo que já estava salvo', 'Pedir uma foto dele'], a: 1,
      why: 'Número novo com pedido de dinheiro é o golpe mais comum. Confirme pelo número que você já tinha.', src: 'CERT.br' },
    { kind: 'Link', scene: '“Parabéns! Você ganhou R$ 500. Resgate em pix-premiado.net”', q: 'Isso é:',
      opts: ['Um prêmio de verdade', 'Provável golpe'], a: 1,
      why: 'Prêmio que você não pediu, com Pix no endereço, é isca para roubar dados.', src: 'CERT.br' },
  ] },
  { id: 'familia', name: 'Defensor da Família', goal: 'Orientar parentes', qs: [
    { kind: 'Conversa', scene: 'Sua família vai combinar uma palavra-chave.', q: 'Para que ela serve?',
      opts: ['Senha do Wi-Fi', 'Confirmar que é mesmo o parente quando ele pede ajuda', 'Entrar no banco'], a: 1,
      why: 'A palavra-chave só a família sabe. Quem pede dinheiro e não sabe a palavra não é quem diz ser.', src: 'SaferNet' },
    { kind: 'Situação', scene: 'Sua tia já fez um Pix para um golpista há 1 hora.', q: 'O que ela faz agora?',
      opts: ['Espera para ver se devolvem', 'Avisa o banco e pede o MED do Pix o quanto antes', 'Faz outro Pix para testar'], a: 1,
      why: 'O MED (Mecanismo Especial de Devolução) do Pix funciona melhor quanto antes for pedido.', src: 'MED do Pix (Banco Central)' },
    { kind: 'Mensagem', scene: 'Seu sobrinho de 12 anos recebeu pedido de fotos de um “amigo” de jogo.', q: 'Como ajudar?',
      opts: ['Mandar ele bloquear e esquecer', 'Conversar com calma, guardar as provas e denunciar', 'Responder ao “amigo”'], a: 1,
      why: 'Acolher a criança, guardar provas e denunciar à SaferNet ou à Polícia Federal protege outras crianças.', src: 'SaferNet e Guardiões da Infância (PF)' },
  ] },
  { id: 'analista', name: 'Analista', goal: 'Avaliar casos simulados', qs: [
    { kind: 'Mensagem', scene: '“Oi, vamos almoçar domingo?”', q: 'Qual o nível de alerta?',
      opts: ['Alto', 'Médio', 'Baixo, mas sem garantia'], a: 2,
      why: 'Não há tática de manipulação. Mesmo assim, ausência de sinais não é garantia.', src: 'VeriNexus' },
    { kind: 'Mensagem', scene: '“Me manda o código que chegou no seu celular.”', q: 'Qual tática aparece?',
      opts: ['Pedido de código ou senha', 'Pedido de segredo', 'Nenhuma'], a: 0,
      why: 'Código de confirmação abre sua conta para outra pessoa. Nunca passe códigos.', src: 'CERT.br' },
    { kind: 'Áudio', scene: 'O arquivo do áudio não mostra sinais de edição.', q: 'Isso prova que a voz é do neto?',
      opts: ['Sim', 'Não. É só um sinal fraco'], a: 1,
      why: 'O WhatsApp recodifica o áudio e apaga quase tudo. O que importa é o conteúdo e confirmar por outro canal.', src: 'VeriNexus' },
  ] },
  { id: 'operador', name: 'Operador de Mesa', goal: 'Prova prática na fila simulada', qs: [
    { kind: 'Caso', scene: 'Documento legível, mas a selfie está tremida e escura.', q: 'Sua decisão:',
      opts: ['Aprovar', 'Rejeitar', 'Pedir mais informações'], a: 2,
      why: 'Se a evidência não basta para decidir, peça mais informações em vez de adivinhar.', src: 'VeriNexus' },
    { kind: 'Caso', scene: 'Você aprovou um caso de nível ouro.', q: 'O que acontece?',
      opts: ['A pessoa já vira ouro', 'Falta outro operador concordar'], a: 1,
      why: 'No nível ouro, dois operadores precisam concordar.', src: 'VeriNexus' },
    { kind: 'Caso', scene: 'O sistema mostra nome, nível pedido, documento e selfie.', q: 'Você deve pedir mais dados pessoais da pessoa?',
      opts: ['Sim, quanto mais melhor', 'Não. Uso só o mínimo necessário'], a: 1,
      why: 'Minimização de dados é regra da LGPD e da mesa.', src: 'LGPD' },
  ] },
];
const EDU_KEY = 'verinexus-edu';
const loadEdu = () => { try { return JSON.parse(localStorage.getItem(EDU_KEY)) ?? null; } catch { return null; } };
const edu = loadEdu() ?? { nick: '', points: 0, done: {}, medals: [] };
const saveEdu = () => { try { localStorage.setItem(EDU_KEY, JSON.stringify(edu)); } catch { /* sem armazenamento: progresso só nesta visita */ } };
const es = { trail: null, q: 0, picked: null, missed: false };

function educacao() {
  const level = Math.floor(edu.points / 100) + 1;
  const t = TRAILS.find((x) => x.id === es.trail);
  const header = `<section class="card row" style="justify-content:space-between">
    <label>Apelido: <input id="nick" value="${esc(edu.nick)}" placeholder="como quer ser chamado" style="max-width:200px"></label>
    <div><strong>${edu.points}</strong> pontos · Nível <strong>${level}</strong>
      <div class="progress" style="width:180px"><span style="width:${edu.points % 100}%"></span></div></div>
    <div class="medals">${edu.medals.map((m) => `<span class="medal">🏅 ${esc(m)}</span>`).join('') || '<span class="small muted">Sem medalhas ainda</span>'}</div>
  </section>`;

  if (!t) {
    view.innerHTML = `<h1>Aprenda a se proteger</h1>
      <p class="lead">Acesso livre. Guardamos só seu apelido e seu progresso, neste aparelho.</p>${header}
      <div class="grid">${TRAILS.map((x) => {
        const n = (edu.done[x.id] ?? []).length;
        return `<section class="card"><h2>${x.name}</h2><p class="muted">${x.goal}</p>
          <div class="progress"><span style="width:${(n / x.qs.length) * 100}%"></span></div>
          <p class="small">${n} de ${x.qs.length} desafios</p>
          <button data-trail="${x.id}">${n === x.qs.length ? 'Refazer' : n ? 'Continuar' : 'Começar'}</button></section>`;
      }).join('')}</div>
      <p class="small muted">Conteúdo de apoio: CERT.br, SaferNet, MED do Pix (Banco Central), Guardiões da Infância (PF).</p>`;
  } else {
    const q = t.qs[es.q];
    const answered = es.picked === q.a;
    view.innerHTML = `<p><button class="ghost" data-act="back">← Trilhas</button></p>${header}
      <section class="card">
        <p class="small muted">${t.name} · desafio ${es.q + 1} de ${t.qs.length}</p>
        <p><span class="tag">${q.kind}</span></p>
        <p style="font-size:1.15rem">${esc(q.scene)}</p>
        <h2>${esc(q.q)}</h2>
        ${q.opts.map((o, i) => `<button class="option ${es.picked === i ? (i === q.a ? 'right' : 'wrong') : ''}" data-opt="${i}" ${answered ? 'disabled' : ''}>${esc(o)}</button>`).join('')}
        <div aria-live="polite">${es.picked !== null ? `<div class="result ${answered ? 'ok' : 'warn'}">
          <strong>${answered ? (es.missed ? 'Isso. Sem pontos desta vez.' : 'Certo! +10 pontos') : 'Ainda não. Tente outra opção.'}</strong>
          <p>${esc(q.why)}</p><p class="small muted">Fonte: ${esc(q.src)}</p></div>` : ''}</div>
        ${answered ? `<button data-act="next">${es.q + 1 < t.qs.length ? 'Próximo desafio' : 'Concluir trilha'}</button>` : ''}
      </section>`;
  }

  view.oninput = (e) => { if (e.target.id === 'nick') { edu.nick = e.target.value.slice(0, 30); saveEdu(); } };
  view.onclick = (e) => {
    const d = e.target.dataset ?? {};
    if (d.trail) Object.assign(es, { trail: d.trail, q: 0, picked: null, missed: false });
    else if (d.act === 'back') es.trail = null;
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
    } else if (d.act === 'next') {
      if (es.q + 1 < t.qs.length) Object.assign(es, { q: es.q + 1, picked: null, missed: false });
      else {
        if (!edu.medals.includes(t.name)) {
          if (!edu.medals.length) api.reportTrainingCompleted();
          edu.medals.push(t.name);
          edu.points += 30;
          saveEdu();
        }
        es.trail = null;
      }
    } else return;
    educacao();
  };
}

// ---------- Painel da SIA ----------
function painel() {
  const m = api.metricsSummary();
  const tiles = [
    ['scams_prevented', 'Golpes evitados'],
    ['sites_flagged', 'Sites sinalizados'],
    ['people_trained', 'Pessoas formadas'],
    ['desk_operators', 'Operadores ativos'],
  ];
  view.innerHTML = `
  <h1>Painel da SIA <span class="tag demo">dados de demonstração</span></h1>
  <p class="lead">Só contagens anônimas. Os números vêm de um gerador sintético e somam o que você fez nesta sessão.</p>
  <div class="grid">${tiles.map(([k, label]) => `<section class="card"><p class="muted">${label}</p><p class="kpi">${m[k].toLocaleString('pt-BR')}</p></section>`).join('')}</div>
  <p class="small muted">Números ilustrativos, não confiáveis.</p>`;
}
