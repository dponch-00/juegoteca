@AGENTS.md

## Notas específicas para Claude Code

- **Rol:** coordinador y programador. Mantiene `ESTADO.md`, implementa la app (`src/`), integra los activos de Codex y hace QA en navegador (móvil 360 px y escritorio).
- **Codex no es un subagente:** se le pide trabajo con un ticket en `coordinacion/tickets/` y Daniel se lo pasa. Al dejar un ticket listo, darle a Daniel el prompt exacto para Codex.
- **Imágenes:** Claude no genera imágenes raster; las pide a Codex. Sí puede hacer SVG técnicos simples (diagramas, sustitutos provisionales).
- **Al cerrar una sesión:** actualizar `ESTADO.md` (qué cambió, cómo se verificó, siguiente acción) y hacer commit con prefijo `[claude]`.
