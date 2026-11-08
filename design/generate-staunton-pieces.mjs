import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname.replace(/^\/(.:)/, '$1');
const dir = `${root}/public/assets/chess/pieces`;
mkdirSync(dir, { recursive: true });

const palette = {
  w: { hi: '#FFF9E8', mid: '#E7C687', lo: '#9A693D', edge: '#26352C', felt: '#2E6B52' },
  b: { hi: '#C68B52', mid: '#54301C', lo: '#140D09', edge: '#FFF1D6', felt: '#477D62' }
};

const base = (id, narrow = false) => {
  const rx = narrow ? 22 : 27;
  const top = narrow ? 29 : 34;
  return `<ellipse cx="50" cy="91" rx="${rx + 2}" ry="3" fill="#142018" opacity=".28"/>
  <path class="felt" d="M${50-rx} 87c2-5 7-7 ${rx*2} 0v3H${50-rx}z"/>
  <path class="wood edge" d="M${50-rx} 88c1-5 6-8 ${rx} -9h0c${rx} 1 ${rx-1} 4 ${rx} 9H${50-rx}z"/>
  <path class="wood edge" d="M${50-top/2} 80c2-4 5-6 ${top/2} -6h0c${top/2} 0 ${top/2-2} 2 ${top/2} 6H${50-top/2}z"/>
  <path d="M${50-rx+6} 85c12-3 27 4 ${rx*2-10} -1M${50-top/2+4} 78c8-2 16 2 ${top-8} -1" class="grain"/>`;
};

const forms = {
  k: (id) => `<path class="wood edge" d="M35 74c2-9 5-20 9-29h12c4 9 7 20 9 29H35z"/><path class="wood edge" d="M41 46c1-6 2-11 4-15h10c2 4 3 9 4 15H41z"/><path d="M50 8v18m-8-9h16" class="edge cross"/><path d="M39 69c5-10 4-20 9-31m7 31c-5-10-4-20-9-31" class="grain"/>${base(id)}`,
  q: (id) => `<path class="wood edge" d="M34 74c2-13 4-23 6-31h20c2 8 4 18 6 31H34z"/><path class="wood edge" d="M38 43 34 25l9 7 7-16 7 16 9-7-4 18H38z"/><circle class="head edge" cx="34" cy="23" r="3"/><circle class="head edge" cx="43" cy="30" r="3"/><circle class="head edge" cx="50" cy="14" r="3"/><circle class="head edge" cx="57" cy="30" r="3"/><circle class="head edge" cx="66" cy="23" r="3"/><path d="M40 59c7-3 14-3 20 0M39 68c7-3 15-3 22 0" class="grain"/>${base(id)}`,
  b: (id) => `<path class="wood edge" d="M36 74c1-12 4-23 14-32 10 9 13 20 14 32H36z"/><path class="head edge" d="M39 30c0-9 5-15 11-15s11 6 11 15c0 6-4 10-11 14-7-4-11-8-11-14z"/><path d="m42 22 16 17" class="edge cut"/><path d="M40 61c6-4 14-4 20 0M42 69c6-3 12-3 16 0" class="grain"/>${base(id)}`,
  n: (id) => `<path class="wood edge" d="M36 75c-1-9 0-20 4-29l5-22 7-11 6 12 10 5-4 12 3 8c1 11-4 20-12 25H36z"/><path class="head edge" d="m46 24 3-13 7 12m-4 5 11 5-3 7m-15-2c5 4 11 5 16 3m-16 9 10 4"/><path d="M57 24c8 10 8 22 4 32M42 63c6-5 11-7 16-7" class="grain"/>${base(id)}`,
  r: (id) => `<path class="wood edge" d="M35 75 38 42h24l3 33H35z"/><path class="wood edge" d="M36 43V27h7v8h5v-8h5v8h5v-8h7v16H36z"/><path d="M42 47v22m8-23v23m8-22v22" class="grain"/>${base(id)}`,
  p: (id) => `<path class="wood edge" d="M38 76c1-11 4-17 12-20 8 3 11 9 12 20H38z"/><circle class="head edge" cx="50" cy="42" r="12"/><path class="wood edge" d="M40 57c3-5 6-7 10-7s7 2 10 7v5H40z"/><path d="M43 70c5-3 10-3 15 0" class="grain"/>${base(id, true)}`
};

function svg(side, type) {
  const id = `${side}${type}`, p = palette[side];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${side === 'w' ? 'blanca' : 'negra'} ${type}"><defs>
  <linearGradient id="${id}-wood" x1="17" y1="0" x2="83" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="${p.hi}"/><stop offset=".25" stop-color="${p.mid}"/><stop offset=".62" stop-color="${p.lo}"/><stop offset=".86" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.hi}"/></linearGradient>
  <radialGradient id="${id}-head" cx="30%" cy="20%" r="75%"><stop stop-color="${p.hi}"/><stop offset=".55" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.lo}"/></radialGradient>
  <style>.wood{fill:url(#${id}-wood)}.head{fill:url(#${id}-head)}.edge{stroke:${p.edge};stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}.grain{fill:none;stroke:${p.hi};stroke-width:1.3;stroke-linecap:round;opacity:.42}.felt{fill:${p.felt};stroke:${p.edge};stroke-width:1.5}.cross{stroke:${p.edge};stroke-width:4}.cut{stroke:${p.edge};stroke-width:3}</style></defs>${forms[type](id)}</svg>`;
}

for (const side of ['w', 'b']) for (const type of ['k', 'q', 'r', 'b', 'n', 'p']) writeFileSync(`${dir}/${side}${type}.svg`, svg(side, type));

const manifestPath = `${root}/design/asset-manifest.json`;
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entries = ['wk','wq','wr','wb','wn','wp','bk','bq','br','bb','bn','bp'].map((id) => ({
  id: `staunton-piece-${id}`, path: `public/assets/chess/pieces/${id}.svg`, purpose: `Pieza Staunton volumétrica ${id}`, tool: 'Node.js 24; SVG procedimental escrito por Codex', prompt: null, date: '2026-11-08', dimensions: '100x100; transparente; base y≈92', bytes: statSync(`${dir}/${id}.svg`).size
}));
const retired = new Set([...entries.map(({ id }) => id), ...['wk','wq','wr','wb','wn','wp','bk','bq','br','bb','bn','bp'].map((id) => `taller-piece-${id}`)]);
manifest.assets = [...manifest.assets.filter(({ id }) => !retired.has(id)), ...entries];
manifest.generatedAt = '2026-11-08';
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
