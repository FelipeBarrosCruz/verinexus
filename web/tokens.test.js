// Valida o design system: contraste WCAG AA nos dois temas e ausência de valores soltos fora de tokens.css.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const block = (re) => Object.fromEntries([...css.match(re)[1].matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)].map((m) => [m[1], m[2]]));
const light = block(/:root\s*{([^}]*)}/);
const darkMedia = block(/:root:not\(\[data-theme="light"\]\)\s*{([^}]*)}/);
const dark = block(/:root\[data-theme="dark"\]\s*{([^}]*)}/);

const lum = (hex) => {
  const c = hex.slice(1).match(/../g).map((h) => { const v = parseInt(h, 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// [frente, fundo, mínimo]: 4.5 texto; 3 bordas de campo, foco e ícones grandes.
export const PAIRS = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-2', 4.5], ['text', 'chat-bg', 4.5], ['text', 'bubble-out', 4.5],
  ['muted', 'bg', 4.5], ['muted', 'surface', 4.5], ['muted', 'surface-2', 4.5], ['muted', 'chat-bg', 4.5],
  ['primary', 'surface', 4.5], ['primary', 'bg', 4.5], ['primary', 'primary-subtle', 4.5],
  ['on-primary', 'primary', 4.5], ['on-primary', 'primary-hover', 4.5],
  ['on-secondary', 'secondary', 4.5], ['on-secondary', 'secondary-hover', 4.5],
  ['on-error', 'error', 4.5],
  ['on-cta', 'cta', 4.5], ['on-cta', 'cta-hover', 4.5],
  ['success', 'success-bg', 4.5], ['error', 'error-bg', 4.5], ['warning', 'warning-bg', 4.5], ['info', 'info-bg', 4.5],
  ['success', 'surface', 4.5], ['error', 'surface', 4.5], ['warning', 'surface', 4.5], ['info', 'surface', 4.5],
  ['success', 'primary-subtle', 4.5], ['error', 'primary-subtle', 4.5], ['warning', 'primary-subtle', 4.5], ['muted', 'primary-subtle', 4.5],
  ['text', 'success-bg', 4.5], ['text', 'error-bg', 4.5], ['text', 'warning-bg', 4.5], ['text', 'info-bg', 4.5],
  ['border-strong', 'surface', 3], ['border-strong', 'bg', 3], ['focus', 'bg', 3], ['focus', 'surface', 3],
];

export const report = () => ['light', 'dark'].flatMap((mode) => {
  const t = mode === 'light' ? light : dark;
  return PAIRS.map(([f, b, min]) => ({ mode, pair: `${f} / ${b}`, ratio: +ratio(t[f], t[b]).toFixed(2), min }));
});

test('contraste WCAG AA em todos os pares, claro e escuro', () => {
  const fails = report().filter((r) => !(r.ratio >= r.min));
  assert.deepEqual(fails, []);
});

test('os dois blocos do tema escuro são idênticos', () => {
  assert.deepEqual(darkMedia, dark);
  assert.deepEqual(Object.keys(dark).sort(), Object.keys(light).sort().filter((k) => k in dark));
});

// Arquivos já migrados para os tokens; cada etapa da migração entra aqui.
const GUARDED = ['components.css', 'style.css', 'ui.js', 'app.js'];

test('sem cor nem medida solta fora de tokens.css', () => {
  for (const f of GUARDED.filter((x) => x.endsWith('.css'))) {
    const url = new URL(`./${f}`, import.meta.url);
    if (!existsSync(url)) continue;
    // Comentários e media queries (que não aceitam var()) ficam de fora.
    const src = readFileSync(url, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*/g, '');
    assert.doesNotMatch(src, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\((?!var)/i, `${f}: cor solta`);
    const units = src.match(/(?<![\w-])\d*\.?\d+(px|rem|em|ms|s)\b/g) ?? [];
    assert.deepEqual(units, [], `${f}: medidas soltas`);
  }
  for (const f of GUARDED.filter((x) => x.endsWith('.js'))) {
    const src = readFileSync(new URL(`./${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /style="(?!--)/, `${f}: style inline (só variáveis CSS são permitidas)`);
  }
});

if (process.argv.includes('--print')) console.table(report());
