// Core API simulada (contratos de specs/01-api.md). As telas só chamam estas funções; nenhuma decisão fica no canal.
// shortcut: roda no navegador, sem HTTP nem X-Client-Key; trocar cada função por fetch('/v1/...') quando houver backend.
// Nada aqui guarda texto, áudio ou transcrição: só contagens anônimas (stats).

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.body = { error: { code, message } };
  }
}
const bad = (message) => { throw new ApiError(400, 'invalid_input', message); };
const unauthorized = (message) => { throw new ApiError(401, 'unauthorized', message); };
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const rid = (p) => `${p}_${crypto.getRandomValues(new Uint32Array(2)).join('')}`;

// ---------- Métricas (gerador sintético + contagens da sessão) ----------
const BASE = { scams_prevented: 48000, sites_flagged: 6000, people_trained: 2000, desk_operators: 120 }; // mesmos valores ilustrativos do slide do pitch
let stats;

// ---------- Reputação de sites (listas fictícias, specs/06) ----------
export const OFFICIAL_HOSTS = ['gov.br', 'pi.gov.br', 'sia.pi.gov.br', 'verinexus.pi.gov.br'];
export const MALICIOUS_HOSTS = ['gov-br-regulariza.com', 'pix-premiado.net', 'cpf-irregular.online', 'pi-gov-br.site'];
const RISKY_TLDS = ['.site', '.online', '.xyz', '.top', '.click', '.shop'];
const CHANNELS = ['extension', 'landing', 'whatsapp', 'app', 'partner'];

const URL_ADVICE = {
  verified: ['Este é um serviço oficial cadastrado.', 'Confira se o endereço está escrito igual ao que você conhece.'],
  safe_signals: ['Não encontramos sinais de risco. Isso não garante que o site é seguro.', 'Antes de enviar documentos, confira o endereço com calma.'],
  suspicious: ['Não envie documentos nem senhas antes de confirmar.', 'Digite o endereço oficial você mesmo, sem clicar no link.'],
  dangerous: ['Não digite CPF, senhas ou dados de cartão aqui.', 'Feche a página.', 'Se já enviou dados, troque suas senhas e avise seu banco.'],
};

export function verifyUrl({ url, channel } = {}) {
  if (!CHANNELS.includes(channel)) bad('channel inválido');
  if (typeof url !== 'string' || !url.trim()) bad('url obrigatória');
  const raw = url.trim();
  let u;
  try { u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { bad('url inválida'); }
  if (!['http:', 'https:'].includes(u.protocol)) bad('só http e https');
  const host = u.hostname.replace(/^www\./, '');

  if (OFFICIAL_HOSTS.includes(host)) {
    return { verdict: 'safe_signals', badge: 'verified', reasons: [{ code: 'official_service', text: 'Serviço oficial cadastrado.' }], advice: URL_ADVICE.verified };
  }
  const reasons = [];
  if (MALICIOUS_HOSTS.includes(host)) reasons.push({ code: 'reported_malicious', text: 'Endereço denunciado como golpe.' });
  if (/gov/.test(host)) reasons.push({ code: 'impersonation', text: 'O endereço imita um site do governo, mas não é oficial.' });
  if (/pix|premi|cpf|bonus|regulariza/.test(host)) reasons.push({ code: 'bait_keyword', text: 'O endereço usa palavras comuns em golpes (Pix, CPF, prêmio).' });
  if (RISKY_TLDS.some((t) => host.endsWith(t))) reasons.push({ code: 'risky_tld', text: 'Terminação de endereço muito usada em golpes.' });
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) reasons.push({ code: 'ip_address', text: 'O site usa números no lugar de um nome.' });
  if (host.includes('xn--')) reasons.push({ code: 'lookalike', text: 'O endereço usa letras parecidas para enganar.' });
  if (u.protocol === 'http:') reasons.push({ code: 'no_https', text: 'A conexão não é protegida (sem https).' });

  const verdict = reasons.some((r) => r.code === 'reported_malicious') || reasons.length >= 3 ? 'dangerous'
    : reasons.length ? 'suspicious' : 'safe_signals';
  if (verdict !== 'safe_signals') stats.sites_flagged++;
  return { verdict, badge: null, reasons, advice: URL_ADVICE[verdict] };
}

// ---------- Análise de conteúdo (specs/03) ----------
const TACTICS = [
  ['urgency', /\b(agora|urgente|rapido|depressa|antes das \d+ ?h?|nao tenho tempo|hoje ainda)\b/],
  ['secrecy', /(nao conta (pra|para) ninguem|e segredo|nao fala com \w+|so entre nos)/],
  ['money_request', /\b(pix|transferencia|transfere|deposito|paga pra mim|chave pix|r\$ ?\d[\d.,]*|\d+ reais)\b/],
  ['new_number', /(troquei de numero|numero novo|perdi (meu|o) celular|mudei de numero)/],
  ['credential_request', /\b(codigo|senha|token|foto do documento)\b/],
  ['emotional_pressure', /\b(apuros|preso|presa|acidente|hospital|sequestr\w*)\b/],
];
const PRESSURE = ['urgency', 'secrecy', 'emotional_pressure', 'new_number'];
// Palavras frequentes do português; ausência sugere outro idioma (golden 5).
const PT_WORDS = /\b(oi|ola|de|que|nao|voce|vc|eu|um|uma|pra|para|com|vamos|sou|meu|minha|seu|ta|to|vo|vou|mae|pai|filho|neto|esta|tem)\b/;

const ACTIONS = [
  'Pare. Não faça Pix nem passe códigos.',
  'Ligue em vídeo para o número que você já tinha salvo.',
  'Confirme com outro parente.',
  'Use a palavra-chave da família.',
  'Se já pagou, acione o MED do Pix e a SaferNet.',
];
export const LOW_ADVICE = 'Não achamos sinais, mas confirme antes de pagar.';
const DISCLAIMER = 'Esta análise aponta sinais de golpe na conversa. Ela não diz se a voz é verdadeira ou falsa, e a ausência de sinais não é garantia.';

export function verifyMessage({ text, source = 'whatsapp_text', locale = 'pt-BR' } = {}) {
  if (typeof text !== 'string' || !text.trim()) bad('text obrigatório');
  if (!['whatsapp_audio_transcript', 'whatsapp_text'].includes(source)) bad('source inválido');
  const t = norm(text);
  const tactics = [];
  for (const [code, re] of TACTICS) {
    const m = t.match(re);
    if (m) tactics.push({ code, evidence: m[0] });
  }
  const codes = tactics.map((x) => x.code);
  const critical = codes.includes('money_request') || codes.includes('credential_request');
  const alert = codes.length >= 2 && critical ? 'high'
    : codes.some((c) => PRESSURE.includes(c)) || critical ? 'medium' : 'low';

  let advice;
  if (alert === 'high') advice = [...ACTIONS];
  else if (alert === 'medium') advice = ACTIONS.slice(0, 3);
  else advice = [LOW_ADVICE];
  if (alert !== 'low' && codes.includes('money_request')) advice.push('Confirme antes de pagar.');

  let disclaimer = DISCLAIMER;
  if (!PT_WORDS.test(t)) disclaimer += ' A mensagem parece estar em outro idioma; a análise funciona melhor em português.';
  if (alert === 'high') stats.scams_prevented++;
  return { alert, tactics, advice: advice.slice(0, 5), disclaimer, locale };
}

export function verifyAudioMeta({ metadata } = {}) {
  if (!metadata || typeof metadata !== 'object') bad('metadata obrigatório');
  const values = norm(Object.values(metadata).join(' '));
  if (!values.trim()) return { signal: 'unverifiable' };
  if (/audacity|adobe|audition|elevenlabs|voicemod|reaper/.test(values)) return { signal: 'edit_signals' };
  return { signal: 'no_edit_signals' };
}

// ---------- Vazamentos (k-anonymity: só o prefixo do hash chega aqui) ----------
const LEAKED = ['maria.ficticia@exemplo.com', 'joao.teste@exemplo.com', '12345678909'];
let leakedHashes;
export async function sha1hex(s) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export async function breachCheck({ hash_prefix } = {}) {
  if (!/^[0-9a-f]{5}$/i.test(hash_prefix ?? '')) bad('hash_prefix deve ter 5 caracteres hexadecimais');
  leakedHashes ??= await Promise.all(LEAKED.map(sha1hex));
  const p = hash_prefix.toLowerCase();
  return { matches: leakedHashes.filter((h) => h.startsWith(p)).map((h) => h.slice(5)) };
}

// ---------- Identidade (specs/04) ----------
const ACR = ['bronze', 'prata', 'ouro'];
const rank = (acr) => ACR.indexOf(acr);
let USERS, codes, tokens, cases;

export const OIDC_DISCOVERY = {
  issuer: 'https://idp.simulado.pi.gov.br',
  authorization_endpoint: '/oidc/authorize',
  token_endpoint: '/oidc/token',
  userinfo_endpoint: '/oidc/userinfo',
  jwks_uri: '/oidc/jwks',
  response_types_supported: ['code'],
  code_challenge_methods_supported: ['S256'],
  acr_values_supported: ACR,
};
const CLIENTS = { 'portal-editais': { redirect_uri: '#/portal' } };

// Pessoas só da fila da mesa (queue_only) não aparecem na escolha de login do portal.
export const users = () => Object.values(USERS).filter((u) => !u.queue_only);

export function authorize({ client_id, redirect_uri, response_type, state, code_challenge, code_challenge_method, acr_values = 'bronze' } = {}, sub) {
  const client = CLIENTS[client_id];
  if (!client || client.redirect_uri !== redirect_uri) bad('cliente ou redirect_uri inválido');
  if (response_type !== 'code') bad('response_type deve ser code');
  if (!state) bad('state obrigatório');
  if (!code_challenge || code_challenge_method !== 'S256') bad('PKCE S256 obrigatório');
  if (!ACR.includes(acr_values)) bad('acr_values inválido');
  const user = USERS[sub];
  if (!user) unauthorized('usuário desconhecido');
  if (rank(user.acr) < rank(acr_values)) return { step_up: { required: acr_values, current: user.acr } };
  const code = rid('code');
  codes.set(code, { client_id, sub, code_challenge, exp: Date.now() + 60_000 });
  return { code, state };
}

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function s256(verifier) {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
}

export async function token({ grant_type, code, code_verifier, client_id } = {}) {
  if (grant_type !== 'authorization_code') bad('grant_type inválido');
  const entry = codes.get(code);
  codes.delete(code); // uso único
  if (!entry || entry.exp < Date.now() || entry.client_id !== client_id) unauthorized('code inválido ou expirado');
  if ((await s256(code_verifier ?? '')) !== entry.code_challenge) unauthorized('PKCE não confere');
  const access_token = rid('at');
  tokens.set(access_token, { sub: entry.sub, exp: Date.now() + 300_000 });
  const u = USERS[entry.sub];
  // shortcut: id_token sem assinatura (alg none) e sem JWKS real; assinar com chave de teste quando houver backend.
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const id_token = `${enc({ alg: 'none' })}.${enc({ iss: OIDC_DISCOVERY.issuer, aud: client_id, sub: u.sub, acr: u.acr, amr: u.amr })}.`;
  return { access_token, id_token, token_type: 'Bearer', expires_in: 300 };
}

export function userinfo(access_token) {
  const t = tokens.get(access_token);
  if (!t || t.exp < Date.now()) unauthorized('token inválido ou expirado');
  const { sub, name, acr, amr } = USERS[t.sub];
  return { sub, name, acr, amr: [...amr] };
}

function upgrade(user, acr) {
  if (rank(acr) > rank(user.acr)) user.acr = acr;
  if (!user.amr.includes('face')) user.amr.push('face');
}

// test_flag faz o papel do provedor de liveness: 'pass' | 'ambiguous' | 'fail'.
export function identityChallenge({ sub, type, test_flag = 'pass' } = {}) {
  const user = USERS[sub];
  if (!user) bad('sub inválido');
  if (!['passive', 'active'].includes(type)) bad('type inválido');
  const passed = test_flag === 'pass';
  const ambiguous = test_flag === 'ambiguous';
  // Ouro = documento (prata) + liveness. Nada biométrico é guardado, só o resultado.
  if (passed && user.acr === 'prata') upgrade(user, 'ouro');
  return { challenge_id: rid('ch'), type, passed, ambiguous };
}

export const OPERATORS = [
  { id: 'op-carla', name: 'Carla (Pimenteiras)' },
  { id: 'op-davi', name: 'Davi (Picos)' },
  { id: 'op-iara', name: 'Iara (Oeiras)' },
];

export function deskCase({ sub, level, reason, assigned = OPERATORS[0].id } = {}) {
  const user = USERS[sub];
  if (!user) bad('sub inválido');
  if (!['prata', 'ouro'].includes(level)) bad('level inválido');
  const c = { id: rid('case').slice(0, 13), sub, name: user.name, level, reason, assigned, state: 'open', created: Date.now(), sla_minutes: 30, approvals: [], log: [] };
  cases.push(c);
  return c;
}
export const deskCases = () => cases;

export function deskDecide({ case_id, operator, decision, justification } = {}) {
  const c = cases.find((x) => x.id === case_id);
  if (!c) bad('caso não encontrado');
  if (!OPERATORS.some((o) => o.id === operator)) unauthorized('operador não habilitado');
  if (!['approved', 'rejected', 'needs_more_info'].includes(decision)) bad('decisão inválida');
  if (!justification?.trim()) bad('justificativa obrigatória');
  if (!['open', 'in_review'].includes(c.state)) bad('caso já encerrado');
  if (c.approvals.includes(operator)) bad('este operador já aprovou; falta outro operador');
  c.log.push({ operator, decision, justification: justification.trim(), at: Date.now() });
  if (decision !== 'approved') { c.state = decision; return c; }
  c.approvals.push(operator);
  const needed = c.level === 'ouro' ? 2 : 1;
  if (c.approvals.length >= needed) {
    c.state = 'approved';
    upgrade(USERS[c.sub], c.level);
  } else {
    // Falta outro operador: o caso vai para a fila do próximo que ainda não aprovou.
    c.state = 'in_review';
    c.assigned = OPERATORS.find((o) => !c.approvals.includes(o.id) && o.id !== c.assigned)?.id ?? c.assigned;
  }
  return c;
}

export function metricsSummary() {
  return { ...stats };
}
// Fora do contrato 01-api: a área educativa avisa quando alguém conclui a primeira trilha.
export function reportTrainingCompleted() { stats.people_trained++; }

export function resetState() {
  stats = { ...BASE };
  USERS = {
    'u-maria': { sub: 'u-maria', name: 'Maria das Dores (fictícia)', acr: 'prata', amr: ['pwd', 'passkey'] },
    'u-joao': { sub: 'u-joao', name: 'João Batista (fictício)', acr: 'ouro', amr: ['passkey', 'face'] },
    'u-ana': { sub: 'u-ana', name: 'Ana Clara (fictícia)', acr: 'bronze', amr: ['pwd'] },
    'u-pedro': { sub: 'u-pedro', name: 'Pedro Henrique (fictício)', acr: 'bronze', amr: ['pwd'], queue_only: true },
    'u-luzia': { sub: 'u-luzia', name: 'Luzia Ferreira (fictícia)', acr: 'prata', amr: ['pwd'], queue_only: true },
    'u-raimundo': { sub: 'u-raimundo', name: 'Raimundo Nonato (fictício)', acr: 'prata', amr: ['pwd'], queue_only: true },
    'u-tereza': { sub: 'u-tereza', name: 'Tereza Cristina (fictícia)', acr: 'bronze', amr: ['pwd'], queue_only: true },
    'u-francisco': { sub: 'u-francisco', name: 'Francisco Lima (fictício)', acr: 'prata', amr: ['pwd'], queue_only: true },
    'u-marcos': { sub: 'u-marcos', name: 'Marcos Vinícius (fictício)', acr: 'bronze', amr: ['pwd'], queue_only: true },
    'u-joana': { sub: 'u-joana', name: 'Joana Sousa (fictícia)', acr: 'bronze', amr: ['pwd'], queue_only: true },
    'u-antonio': { sub: 'u-antonio', name: 'Antônio Carlos (fictício)', acr: 'prata', amr: ['pwd'], queue_only: true },
  };
  codes = new Map();
  tokens = new Map();
  cases = [];
  // Fila de demonstração: cada operador tem a sua, com pessoas diferentes (fictícias). Casos Ouro precisam de dois operadores:
  // depois da primeira aprovação o caso passa para a fila de outro.
  const seed = (assigned, sub, level, reason, minutesAgo) => { const c = deskCase({ sub, level, reason, assigned }); c.created = Date.now() - minutesAgo * 60000; return c; };
  seed('op-carla', 'u-ana', 'prata', 'Foto do documento com reflexo', 4);
  seed('op-carla', 'u-pedro', 'prata', 'Nome no documento diferente do cadastro (sobrenome abreviado)', 12);
  seed('op-carla', 'u-tereza', 'prata', 'Documento com validade vencida', 41);
  seed('op-davi', 'u-raimundo', 'ouro', 'Rosto parcialmente coberto por boné', 26);
  seed('op-davi', 'u-marcos', 'prata', 'Documento borrado, número ilegível', 9);
  seed('op-iara', 'u-francisco', 'ouro', 'Rosto não parece bater com a foto do documento', 7);
  seed('op-iara', 'u-joana', 'prata', 'CPF do documento diverge do cadastro', 15);
  seed('op-iara', 'u-antonio', 'ouro', 'Selfie parece foto de uma tela', 22);
  const luzia = seed('op-carla', 'u-luzia', 'ouro', 'Verificação do rosto inconclusiva: pouca luz', 18);
  deskDecide({ case_id: luzia.id, operator: 'op-carla', decision: 'approved', justification: 'Rosto confere com o documento apesar da pouca luz.' });
}
resetState();
