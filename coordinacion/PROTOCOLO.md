# Protocolo de colaboración — Daniel · Claude Code · Codex

Versión 1 · 2026-11-07. Basado en el protocolo de AI School, simplificado.

## 1. Roles

| Quién | Hace | Decide |
| --- | --- | --- |
| **Daniel** | Pasa los tickets entre agentes, prueba en su celular y tablet, juega | Identidad elegida, alcance, qué se publica y cuándo |
| **Claude Code** | Código de la app, red (salas en línea), reglas de los juegos, animaciones, integración de activos, QA técnico, `ESTADO.md` | Decisiones rutinarias de implementación |
| **Codex** | Identidad y temática, sistema visual (tokens), piezas, tableros, iconos, imágenes PNG/WebP, guía de movimiento, revisión visual de la app | Decisiones rutinarias dentro de su ticket |

**Revisión cruzada:** lo visual de Codex lo revisa Claude en la app real (legibilidad, peso, tamaño a 360 px); la interfaz que implementa Claude la revisa Codex contra la identidad. Daniel decide el gusto.

## 2. Tickets

Los agentes no se hablan directamente: se comunican con archivos en `coordinacion/tickets/` y Daniel los pasa.

- Un ticket = `T-NNN-<para>-<tema>.md` (ej. `T-001-codex-identidad-y-tematica.md`). Numeración consecutiva.
- Lo crea quien pide; quien recibe llena **Entrega**; quien pidió llena **Revisión**.
- Plantilla: [`tickets/_plantilla.md`](tickets/_plantilla.md).
- Estados: `abierto → en curso → entregado → revisado → cerrado`, o `bloqueado` (con motivo).
- Solo Claude escribe `ESTADO.md`.
- El commit de cada entrega (`[codex] Entrega T-NNN: …`) es el punto de traspaso.

### Lo que Daniel pega

En **Codex**:

```
Lee AGENTS.md y coordinacion/PROTOCOLO.md. Atiende coordinacion/tickets/T-NNN-....md.
Al terminar: llena la sección "Entrega", cambia el estado del ticket a
"entregado" y haz commit con prefijo [codex]. No edites ESTADO.md ni src/.
```

En **Claude Code**:

```
Codex entregó T-NNN. Revísalo e intégralo.
```

## 3. Quién edita qué

| Zona | Dueño | Los demás |
| --- | --- | --- |
| `ESTADO.md` | Claude | Codex lo lee |
| `coordinacion/tickets/` | Quien abre el ticket | El receptor escribe solo en Entrega y Estado |
| `design/`, `docs/identity.md`, `public/assets/`, `public/icons/` | Codex | Claude revisa y comenta en el ticket |
| `src/`, `index.html`, `vite.config.ts`, `package.json` | Claude | Codex revisa por ticket: comenta, no edita |

## 4. Flujo de imágenes

1. **Brief** corto por activo o familia de activos en `design/briefs/`.
2. **Variantes** en `design/raw/` (fuera de git).
3. **Master** elegido en `design/masters/` (en git) y registrado en `design/asset-manifest.json`: id, propósito, herramienta, prompt, fecha, dimensiones, peso.
4. **Versión web** optimizada en `public/assets/` según el contrato de `AGENTS.md`.
5. **Revisión** en la app real, celular y escritorio, antes de cerrar.

## 5. Git

- Rama `main`. Commits pequeños con prefijo `[claude]`, `[codex]` o `[daniel]`.
- Dos agentes nunca trabajan a la vez sobre los mismos archivos.
- Nadie depende de la memoria del chat: si no está en el repo, no existe.
