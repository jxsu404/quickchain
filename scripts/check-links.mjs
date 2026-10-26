#!/usr/bin/env node
// Verifica el grafo de docs: links relativos válidos y cada .md con ≥1 entrante y ≥1 saliente.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const files = execSync("git ls-files --cached --others --exclude-standard '*.md'", { encoding: 'utf8' })
  .split('\n').filter(Boolean).filter((f) => !f.includes('node_modules/'));
const set = new Set(files);
const inbound = Object.fromEntries(files.map((f) => [f, 0]));
const outbound = Object.fromEntries(files.map((f) => [f, 0]));
const errors = [];
let links = 0;
for (const f of files) {
  const text = readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^[a-z]+:/i.test(href) || href.startsWith('#')) continue;
    const target = normalize(join(dirname(f), decodeURIComponent(href.split('#')[0])));
    links++;
    if (!existsSync(target)) { errors.push(`${f}: link roto -> ${href}`); continue; }
    if (set.has(target) && target !== f) { outbound[f]++; inbound[target]++; }
  }
}
for (const f of files) {
  if (!inbound[f]) errors.push(`${f}: sin enlaces entrantes`);
  if (!outbound[f]) errors.push(`${f}: sin enlaces salientes`);
}
console.log(`${files.length} nodos, ${links} links relativos`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('OK: sin links rotos; todo nodo tiene entrantes y salientes');
