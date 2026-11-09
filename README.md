# Juegoteca

Juegos de mesa para el celular y la tablet: ajedrez, damas, backgammon y sudoku. Funciona sin internet, guarda todo en el dispositivo y permite jugar contra la computadora o contra otra persona:

- **Pasa y juega:** dos personas en el mismo dispositivo.
- **En línea:** uno crea una sala, el otro escribe el código de 4 letras. La partida va directo entre los dos dispositivos.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173 (y en la red local, para probar en el celular)
npm test
npm run build    # genera dist/
```

## Publicar

Cada push a `main` publica en GitHub Pages con `.github/workflows/deploy.yml`. Una sola vez: en GitHub → Settings → Pages → Source: **GitHub Actions**. Si el repositorio no se llama `juegoteca`, cambia `REPO_BASE` en `vite.config.ts`.

## Licencia

Juegoteca es software libre bajo la **GPL-3.0-or-later** (ver [`LICENSE`](LICENSE)), porque incluye el motor [Stockfish](https://github.com/nmrugg/stockfish.js) (GPL-3). El motor no se guarda en git: `scripts/copy-engine.mjs` lo copia de `node_modules/stockfish` en cada `dev`/`build`.

## Cómo se trabaja

Claude Code programa; Codex diseña la identidad y los activos. Se coordinan con tickets: ver [`AGENTS.md`](AGENTS.md), [`coordinacion/PROTOCOLO.md`](coordinacion/PROTOCOLO.md) y [`ESTADO.md`](ESTADO.md).
