import { mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname.replace(/^\/(.:)/, '$1');
const out = (path) => mkdirSync(`${root}/${path}`.replaceAll('\\', '/'), { recursive: true });
const pieceDir = 'public/assets/chess/pieces';
const palette = {
  w: { body: '#FFF3D6', edge: '#203129', shade: '#CDA86A', grain: '#A97842' },
  b: { body: '#4B2D1D', edge: '#FFF3D6', shade: '#1E160F', grain: '#B77A43' }
};
const base = `<path d="M17 91c1-7 7-11 15-12h36c8 1 14 5 15 12H17Z"/><path d="M24 79c1-5 5-8 11-9h30c6 1 10 4 11 9H24Z"/><path d="M29 72c1-4 4-7 9-8h24c5 1 8 4 9 8H29Z"/>`;
const grain = `<path d="M35 83c10-5 20 3 31-2M39 75c8-4 15 2 23-2" fill="none" class="grain"/>`;
const shapes = {
  k: `<path d="M36 65c1-13 5-23 9-30h10c4 7 8 17 9 30H36Z"/><path d="M43 35V19m-7 8h14" fill="none" class="edge"/><path d="M38 64c3-9 2-17 7-24m10 24c-3-9-2-17-7-24" fill="none" class="grain"/>`,
  q: `<path d="M34 65c2-15 4-25 5-32l11 9 11-9c1 7 3 17 5 32H34Z"/><path d="m39 33 4-13 7 12 7-12 4 13" fill="none" class="edge"/><path d="M42 45c5 3 11 3 16 0M40 55c6 3 14 3 20 0" fill="none" class="grain"/>`,
  r: `<path d="M35 65 38 35h24l3 30H35Z"/><path d="M36 35v-13h7v7h5v-7h7v7h5v-7h7v13H36Z"/><path d="M42 41v20m16-20v20" fill="none" class="grain"/>`,
  b: `<path d="M37 65c1-14 4-23 13-31 9 8 12 17 13 31H37Z"/><path d="M42 29a8 8 0 0 1 16 0c0 4-3 7-8 10-5-3-8-6-8-10Z"/><path d="m44 24 13 14" class="edge"/><path d="M42 56c5-3 11-3 16 0" fill="none" class="grain"/>`,
  n: `<path d="M36 66c-1-13 0-26 5-36l7-12 8 6 9 3-4 11 4 10c1 8-2 14-7 18H36Z"/><path d="m46 22 3-10 6 11M55 31l5 2M42 39c5 4 10 5 15 4M47 47l-8 11" fill="none" class="edge"/><path d="M53 23c6 8 8 18 5 26" fill="none" class="grain"/>`,
  p: `<path d="M38 66c1-12 4-19 12-22 8 3 11 10 12 22H38Z"/><circle cx="50" cy="30" r="13"/><path d="M41 58c6-3 12-3 18 0" fill="none" class="grain"/>`
};
function piece(side, type) {
  const p = palette[side], id = `${side}${type}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${side === 'w' ? 'pieza clara' : 'pieza oscura'} de ajedrez"><defs><linearGradient id="${id}-wood" x1="18" y1="15" x2="78" y2="92" gradientUnits="userSpaceOnUse"><stop stop-color="${p.body}"/><stop offset=".58" stop-color="${p.body}"/><stop offset="1" stop-color="${p.shade}"/></linearGradient><style>.body{fill:url(#${id}-wood);stroke:${p.edge};stroke-width:3.3;stroke-linejoin:round;stroke-linecap:round}.edge{stroke:${p.edge};stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.grain{stroke:${p.grain};stroke-width:1.5;opacity:.58;stroke-linecap:round}</style></defs><g class="body">${base}${shapes[type]}${grain}</g></svg>`;
}
out(pieceDir);
for (const side of ['w', 'b']) for (const type of ['k','q','r','b','n','p']) writeFileSync(`${root}/${pieceDir}/${side}${type}.svg`, piece(side, type));

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Juegoteca"><path fill="#2E6B52" d="M14 30Q14 16 28 16h44q14 0 14 14v42q0 14-14 14H28q-14 0-14-14V30Z"/><path fill="#E9D9BB" d="M24 28h52v44H24z"/><path fill="#B9473B" d="M30 34h12v12H30zm28 0h12v12H58zM30 54h12v12H30zm28 0h12v12H58z"/><path fill="none" stroke="#1F2A22" stroke-width="5" stroke-linecap="round" d="M50 35v25m-9-13h18"/></svg>`;
out('public/assets/brand'); writeFileSync(`${root}/public/assets/brand/logo-mark.svg`, mark);
const word = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 100" role="img" aria-label="Juegoteca"><g transform="translate(4 4)">${mark.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Juegoteca">','').replace('</svg>','')}</g><path fill="#1F2A22" d="M125 28h10v35c0 10-6 16-16 16-7 0-12-3-15-8l8-6c2 4 4 5 7 5 4 0 6-3 6-8V28Zm20 0h10v29c0 9 3 13 10 13s10-4 10-13V28h10v30c0 15-8 22-20 22s-20-7-20-22V28Zm50 0h31v9h-21v12h18v9h-18v12h22v9h-32V28Zm40 0h10v42h21v9h-31V28Zm41 0h31v9h-21v12h18v9h-18v12h22v9h-32V28Zm42 0h34v9h-12v42h-10V37h-12v-9Zm42 0h10v21h18V28h10v51h-10V58h-18v21h-10V28Z"/></svg>`;
writeFileSync(`${root}/public/assets/brand/logo.svg`, word);

const game = (kind, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" role="img" aria-label="${kind}"><defs><linearGradient id="wood" x1="8" y1="7" x2="48" y2="50" gradientUnits="userSpaceOnUse"><stop stop-color="#FFF3D6"/><stop offset="1" stop-color="#C1874B"/></linearGradient></defs><circle cx="28" cy="28" r="25" fill="#2E6B52"/><path d="M13 45c2-12 5-25 15-31 11 6 14 19 15 31H13Z" fill="url(#wood)" stroke="#1F2A22" stroke-width="2" stroke-linejoin="round"/>${inner}</svg>`;
out('public/assets/games');
writeFileSync(`${root}/public/assets/games/chess.svg`, game('Ajedrez', '<path d="M28 12v13m-6-7h12M20 40h16" fill="none" stroke="#1F2A22" stroke-width="3" stroke-linecap="round"/>'));
writeFileSync(`${root}/public/assets/games/checkers.svg`, game('Damas', '<circle cx="28" cy="29" r="11" fill="#B9473B" stroke="#1F2A22" stroke-width="2"/><path d="M20 29h16M28 21v16" stroke="#FFF3D6" stroke-width="2"/>'));
writeFileSync(`${root}/public/assets/games/backgammon.svg`, game('Backgammon', '<path d="M18 41V20l10 15 10-15v21" fill="#B9473B" stroke="#1F2A22" stroke-width="2"/><circle cx="28" cy="38" r="4" fill="#FFF3D6"/>'));
writeFileSync(`${root}/public/assets/games/sudoku.svg`, game('Sudoku', '<path d="M17 18h22v22H17zM24 18v22m8-22v22M17 25h22m-22 8h22" fill="none" stroke="#1F2A22" stroke-width="2"/><path d="M20 22h3m9 0h3m-15 8h3m9 0h3m-15 7h3m9 0h3" stroke="#FFF3D6" stroke-width="2"/>'));
writeFileSync(`${root}/public/icons/favicon.svg`, mark);

const manifestPath = `${root}/design/asset-manifest.json`;
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const add = (id, path, purpose, tool, dimensions, prompt = null) => ({ id, path, purpose, tool, prompt, date: '2026-11-08', dimensions, bytes: statSync(`${root}/${path}`).size });
const entries = [
  ...['wk','wq','wr','wb','wn','wp','bk','bq','br','bb','bn','bp'].map(id => add(`taller-piece-${id}`, `public/assets/chess/pieces/${id}.svg`, `Pieza de ajedrez torneada ${id}`, 'SVG escrito por Codex', '100x100; transparente; base y≈92')),
  add('taller-logo-mark', 'public/assets/brand/logo-mark.svg', 'Marca de Juegoteca', 'SVG escrito por Codex', '100x100'),
  add('taller-logo', 'public/assets/brand/logo.svg', 'Logotipo en trazos de Juegoteca', 'SVG escrito por Codex', '390x100'),
  ...['chess','checkers','backgammon','sudoku'].map(id => add(`taller-game-${id}`, `public/assets/games/${id}.svg`, `Icono de juego ${id}`, 'SVG escrito por Codex', '56x56')),
  add('taller-favicon', 'public/icons/favicon.svg', 'Favicon de Juegoteca', 'SVG escrito por Codex', '100x100'),
  ...[['icon-192.png','192x192'],['icon-512.png','512x512'],['icon-maskable-512.png','512x512; contenido dentro del 72% central'],['apple-touch-icon.png','180x180; RGB sin transparencia']].map(([file, dimensions]) => add(`taller-${file.replace('.png','')}`, `public/icons/${file}`, 'Icono instalable PWA', 'PowerShell 7 + System.Drawing', dimensions)),
  add('taller-mood', 'design/direcciones/D1-taller-de-fieltro/mood.webp', 'Referencia de atmósfera del Taller de fieltro', 'image_gen + Pillow 3.14', '960x960', 'Original premium handcrafted tabletop-game workshop, seen from directly above: warm walnut tabletop, a forest-green felt game board, a simple open wooden game box, original turned wooden chess pieces in ivory maple and dark walnut; no text, logos, brands, watermark or people.'),
  add('taller-fraunces-font', 'public/fonts/fraunces-latin.woff2', 'Fraunces 600 estática, subconjunto latino', 'fontTools varLib.instancer + subset', 'WOFF2; U+0000-00FF, U+0131, U+0152-0153, U+0178, U+20AC'),
  add('taller-atkinson-font', 'public/fonts/atkinson-hyperlegible-next-latin.woff2', 'Atkinson Hyperlegible Next variable, subconjunto latino', 'fontTools subset', 'WOFF2; U+0000-00FF, U+0131, U+0152-0153, U+0178, U+20AC'),
  add('taller-fraunces-license', 'public/fonts/fraunces-OFL.txt', 'Licencia OFL de Fraunces', 'Descarga desde fuente oficial', 'texto'),
  add('taller-atkinson-license', 'public/fonts/atkinson-hyperlegible-next-OFL.txt', 'Licencia OFL de Atkinson Hyperlegible Next', 'Descarga desde fuente oficial', 'texto')
];
const ids = new Set(entries.map(({ id }) => id));
manifest.assets = [...manifest.assets.filter(({ id }) => !ids.has(id)), ...entries];
manifest.generatedAt = '2026-11-08';
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
