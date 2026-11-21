// VeriNexus · Componentes base em JS (sem framework). Visual em components.css; valores em tokens.css.

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Ícones de contorno 24×24, traço 2 (desenhados para este projeto).
const PATHS = {
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
  alert: '<path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.4A8.5 8.5 0 1 1 21 11.5Z"/>',
  puzzle: '<path d="M9 4.5a2.5 2.5 0 0 1 5 0V6h4v4h-1.5a2.5 2.5 0 0 0 0 5H18v4h-4v-1.5a2.5 2.5 0 0 0-5 0V19H5v-4h1.5a2.5 2.5 0 0 0 0-5H5V6h4V4.5Z"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M5.8 16c.6-1.3 1.8-2 3.2-2s2.6.7 3.2 2M15 10h3M15 13.5h3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.8 3.1 2.6 3.5 5.2"/>',
  school: '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
  chart: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  text: '<path d="M3 7V5h11v2M8.5 5v14M6.5 19h4M14 13v-1.5h7V13M17.5 11.5V19M16 19h3"/>',
  send: '<path d="m4 12 16-8-4 16-4-6-8-2Z"/><path d="m12 14 8-10"/>',
  play: '<path d="M7 5v14l12-7L7 5Z"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  inbox: '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5.5 5h13l2.5 8v6H3v-6l2.5-8Z"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  face: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 15a5 5 0 0 0 7 0"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  file: '<path d="M14 3H6v18h12V7l-4-4Z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
};
export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;

// Cada tom tem ícone próprio: a cor nunca é a única pista.
export const TONE_ICON = { success: 'check-circle', error: 'x-circle', warning: 'alert', info: 'info' };

/** Status: ícone + título + corpo (HTML já escapado). */
export const status = ({ tone, title, body = '', live = true }) =>
  `<div class="status tone-${tone}" ${live ? 'role="status"' : ''}>${icon(TONE_ICON[tone])}<div class="status-body"><p class="status-title">${esc(title)}</p>${body}</div></div>`;

export const badge = (text, tone, iconName) =>
  `<span class="badge ${tone ? `tone-${tone}` : ''}">${iconName ? icon(iconName) : ''}${esc(text)}</span>`;

export const list = (items, ordered = false) => {
  const t = ordered ? 'ol' : 'ul';
  return `<${t}>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</${t}>`;
};

export const skeleton = (lines = 3) =>
  `<div aria-hidden="true">${Array.from({ length: lines }, () => '<span class="skeleton"></span>').join('')}</div><p class="sr-only" role="status">Carregando…</p>`;

export const emptyState = ({ iconName = 'inbox', title, text = '', action = '' }) =>
  `<div class="empty">${icon(iconName)}<p class="empty-title">${esc(title)}</p>${text ? `<p>${esc(text)}</p>` : ''}${action}</div>`;

export const field = ({ id, label, hint = '', control }) =>
  `<div class="field"><label class="label" for="${id}">${esc(label)}</label>${control}${hint ? `<p class="hint" id="${id}-hint">${esc(hint)}</p>` : ''}<p class="field-error" id="${id}-error" hidden></p></div>`;

/** Erro de campo inline (mensagem humana). null limpa. */
export function setFieldError(input, message) {
  const box = document.getElementById(`${input.id}-error`);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  const hint = document.getElementById(`${input.id}-hint`) ? `${input.id}-hint` : '';
  input.setAttribute('aria-describedby', [message ? `${input.id}-error` : '', hint].filter(Boolean).join(' '));
  if (!box) return;
  box.hidden = !message;
  box.innerHTML = message ? `${icon('x-circle')}<span>${esc(message)}</span>` : '';
}

/** Botão em carregamento: bloqueia clique duplo e avisa leitores de tela. */
export function setBusy(btn, busy, busyLabel = 'Aguarde…') {
  if (busy) {
    btn.dataset.label = btn.innerHTML;
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${esc(busyLabel)}`;
  } else if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  btn.disabled = busy;
  btn.setAttribute('aria-busy', String(busy));
}

/** Toast: some sozinho em 6 s; erro usa role="alert". */
export function toast({ tone = 'success', title, text = '' }) {
  const region = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast tone-${tone}`;
  if (tone === 'error') el.setAttribute('role', 'alert');
  el.innerHTML = `${icon(TONE_ICON[tone])}<div class="toast-body"><p class="toast-title">${esc(title)}</p>${text ? `<p class="toast-text">${esc(text)}</p>` : ''}</div>
    <button type="button" class="toast-close" aria-label="Fechar aviso">${icon('x')}</button>`;
  const close = () => {
    if (el.classList.contains('leaving')) return;
    el.classList.add('leaving');
    afterAnimation(el, () => el.remove());
  };
  el.querySelector('.toast-close').onclick = close;
  region.append(el);
  setTimeout(close, 6000);
}

// Roda fn quando a animação de saída termina (ou logo, se não houver animação).
function afterAnimation(el, fn) {
  let done = false;
  const run = () => { if (!done) { done = true; fn(); } };
  el.addEventListener('animationend', run, { once: true });
  setTimeout(run, 400);
}

/**
 * Modal sobre <dialog>: foco preso, Esc fecha, foco volta ao botão que abriu.
 * actions: [{ label, value, variant }]; a primeira recebe o foco (deixe a ação segura primeiro).
 */
export function modal({ tone = 'info', title, body, actions }) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = `modal tone-${tone}`;
    d.setAttribute('aria-labelledby', 'modal-title');
    d.innerHTML = `<div class="modal-inner">
      <div class="modal-icon">${icon(TONE_ICON[tone])}</div>
      <h2 id="modal-title">${esc(title)}</h2>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">${actions.map((a, i) => `<button type="button" class="btn ${a.variant ?? 'btn-ghost'}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>
    </div>`;
    const opener = document.activeElement;
    const finish = (value) => {
      if (d.classList.contains('closing')) return;
      d.classList.add('closing');
      afterAnimation(d, () => { d.close(); d.remove(); opener?.focus?.(); resolve(value); });
    };
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) finish(actions[b.dataset.i].value);
      else if (e.target === d) finish(null); // clique no fundo escurecido
    });
    d.addEventListener('cancel', (e) => { e.preventDefault(); finish(null); });
    document.body.append(d);
    d.showModal();
    d.querySelector('[data-i="0"]').focus();
  });
}

/** Tabs acessíveis: clique, setas, Home e End. onChange(id) ao trocar. */
export function tabs(root, onChange) {
  const list = root.querySelector('[role="tablist"]');
  const all = () => [...list.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    for (const t of all()) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    }
    if (focus) tab.focus();
    onChange?.(tab.id);
  };
  list.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) select(t); });
  list.addEventListener('keydown', (e) => {
    const ts = all();
    const i = ts.indexOf(document.activeElement);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ts.length - 1 }[e.key];
    if (next === undefined || i < 0) return;
    e.preventDefault();
    select(ts[(next + ts.length) % ts.length], true);
  });
}

// ---------- Preferências da pessoa: tema e tamanho da letra ----------
const PREF_KEY = 'verinexus-prefs';
const readPrefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) ?? {}; } catch { return {}; } };
const writePrefs = (p) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* sem armazenamento: vale só nesta visita */ } };

export const prefs = readPrefs();
export const isDark = () => prefs.theme ? prefs.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;

export function applyPrefs() {
  const root = document.documentElement;
  if (prefs.theme) root.dataset.theme = prefs.theme; else delete root.dataset.theme;
  if (prefs.text === 'lg') root.dataset.text = 'lg'; else delete root.dataset.text;
}
export function togglePref(key) {
  if (key === 'theme') prefs.theme = isDark() ? 'light' : 'dark';
  if (key === 'text') prefs.text = prefs.text === 'lg' ? 'base' : 'lg';
  writePrefs(prefs);
  applyPrefs();
}
