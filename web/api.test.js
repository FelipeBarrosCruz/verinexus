// Critérios de aceite de specs/06 e casos golden de specs/03. Rodar: cd web && node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from './api.js';

const codes = (r) => r.tactics.map((t) => t.code).sort();

test('golden 1: avó, número novo, pix, urgência e segredo → high', () => {
  const r = api.verifyMessage({ text: 'Vó, sou eu, troquei de número. Faz um pix de 800 agora e não conta pra ninguém.', source: 'whatsapp_audio_transcript' });
  assert.equal(r.alert, 'high');
  assert.deepEqual(codes(r), ['money_request', 'new_number', 'secrecy', 'urgency']);
});

test('golden 2: conversa normal → low, termina com "confirme antes de pagar"', () => {
  const r = api.verifyMessage({ text: 'Oi, vamos almoçar domingo?' });
  assert.equal(r.alert, 'low');
  assert.match(r.advice.at(-1), /confirme antes de pagar\.$/);
});

test('golden 3: pedido de código → medium ou superior', () => {
  const r = api.verifyMessage({ text: 'Me manda o código que chegou no seu celular.' });
  assert.ok(['medium', 'high'].includes(r.alert));
  assert.ok(codes(r).includes('credential_request'));
});

test('golden 4: texto vazio → 400', () => {
  assert.throws(() => api.verifyMessage({ text: '   ' }), (e) => e.status === 400 && e.body.error.code === 'invalid_input');
});

test('golden 5: outro idioma → low com aviso de limitação', () => {
  const r = api.verifyMessage({ text: 'Hello, how are you doing today?' });
  assert.equal(r.alert, 'low');
  assert.match(r.disclaimer, /outro idioma/);
});

test('badge verified só para domínios oficiais da lista', () => {
  for (const host of api.OFFICIAL_HOSTS) assert.equal(api.verifyUrl({ url: host, channel: 'landing' }).badge, 'verified');
  assert.equal(api.verifyUrl({ url: 'https://www.pi.gov.br/servicos', channel: 'landing' }).badge, 'verified');
  for (const url of ['gov-br-regulariza.com', 'pi.gov.br.golpe.com', 'loja-exemplo.com.br', 'falso-pi.gov.br.xyz']) {
    assert.equal(api.verifyUrl({ url, channel: 'landing' }).badge, null, url);
  }
  assert.equal(api.verifyUrl({ url: 'gov-br-regulariza.com', channel: 'extension' }).verdict, 'dangerous');
  assert.throws(() => api.verifyUrl({ url: 'x', channel: 'tv' }), { status: 400 });
});

test('nenhuma resposta usa "autêntico" ou "é deepfake"', () => {
  const texts = ['Vó, troquei de número, pix agora', 'Oi tudo bem', 'Me manda a senha', 'hello'];
  const out = JSON.stringify([
    ...texts.map((text) => api.verifyMessage({ text })),
    ...['gov-br-regulariza.com', 'pi.gov.br', 'exemplo.com'].map((url) => api.verifyUrl({ url, channel: 'whatsapp' })),
  ]);
  assert.doesNotMatch(out, /aut[eê]ntic|[eé] deepfake/i);
});

test('vazamento: k-anonymity por prefixo', async () => {
  const h = await api.sha1hex('maria.ficticia@exemplo.com');
  const { matches } = await api.breachCheck({ hash_prefix: h.slice(0, 5) });
  assert.ok(matches.includes(h.slice(5)));
  await assert.rejects(api.breachCheck({ hash_prefix: 'maria' }), { status: 400 });
});

async function login(sub, acr_values) {
  const verifier = 'v'.repeat(50);
  const req = { client_id: 'portal-editais', redirect_uri: '#/portal', response_type: 'code', state: 's1', code_challenge: await api.s256(verifier), code_challenge_method: 'S256', acr_values };
  return { res: api.authorize(req, sub), verifier };
}

test('prata em cliente que exige ouro dispara desafio; ouro não dispara', async () => {
  api.resetState();
  assert.deepEqual((await login('u-maria', 'ouro')).res.step_up, { required: 'ouro', current: 'prata' });
  const { res, verifier } = await login('u-joao', 'ouro');
  assert.ok(res.code);
  const t = await api.token({ grant_type: 'authorization_code', code: res.code, code_verifier: verifier, client_id: 'portal-editais' });
  assert.equal(api.userinfo(t.access_token).acr, 'ouro');
  await assert.rejects(api.token({ grant_type: 'authorization_code', code: res.code, code_verifier: verifier, client_id: 'portal-editais' }), { status: 401 });
});

test('PKCE errado é recusado', async () => {
  const { res } = await login('u-joao', 'ouro');
  await assert.rejects(api.token({ grant_type: 'authorization_code', code: res.code, code_verifier: 'outro', client_id: 'portal-editais' }), { status: 401 });
});

test('caso ambíguo ouro precisa de dois operadores diferentes', async () => {
  api.resetState();
  const ch = api.identityChallenge({ sub: 'u-maria', type: 'active', test_flag: 'ambiguous' });
  assert.equal(ch.ambiguous, true);
  const c = api.deskCase({ sub: 'u-maria', level: 'ouro', reason: 'liveness ambíguo' });
  api.deskDecide({ case_id: c.id, operator: 'op-carla', decision: 'approved', justification: 'ok' });
  assert.equal(c.state, 'in_review');
  assert.throws(() => api.deskDecide({ case_id: c.id, operator: 'op-carla', decision: 'approved', justification: 'ok' }), { status: 400 });
  api.deskDecide({ case_id: c.id, operator: 'op-davi', decision: 'approved', justification: 'confere' });
  assert.equal(c.state, 'approved');
  assert.ok((await login('u-maria', 'ouro')).res.code);
});

test('fila de demonstração: cada operador tem pessoas diferentes e não polui o login', () => {
  api.resetState();
  const cs = api.deskCases();
  assert.equal(cs.length, 9);
  const names = (op) => cs.filter((c) => c.assigned === op).map((c) => c.name);
  const [carla, davi, iara] = ['op-carla', 'op-davi', 'op-iara'].map(names);
  assert.ok(carla.length >= 3 && davi.length >= 2 && iara.length >= 3);
  assert.equal(new Set([...carla, ...davi, ...iara]).size, cs.length, 'nenhum nome repetido entre filas');
  assert.ok(cs.some((c) => c.level === 'prata') && cs.some((c) => c.level === 'ouro'));
  assert.ok(cs.some((c) => Date.now() - c.created > 30 * 60000), 'um caso com prazo vencido');
  assert.deepEqual(api.users().map((u) => u.sub), ['u-maria', 'u-joao', 'u-ana']);
});

test('primeira aprovação de caso Ouro leva o caso para a fila de outro operador', () => {
  api.resetState();
  const luzia = api.deskCases().find((c) => c.sub === 'u-luzia');
  assert.equal(luzia.state, 'in_review');
  assert.equal(luzia.assigned, 'op-davi');
  api.deskDecide({ case_id: luzia.id, operator: 'op-davi', decision: 'approved', justification: 'confere' });
  assert.equal(luzia.state, 'approved');
});
