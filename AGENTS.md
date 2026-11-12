# AGENTS.md

Project-specific guidance for AI coding agents.

> **CRITICAL CONTEXT**: Always read `PROJECT_CONTEXT.md` at the workspace root before starting work. It contains the complete architectural map, git setup, credentials guide, and recent milestone status.

## UI: the "Signal" design system

CleverCut's UI is React with inline style objects plus a small set of shared classes. There is no component library and no CSS framework. All visual decisions come from tokens in `src/index.css`.

### Tokens (use these; never hard-code hex values)
- Surfaces: `--cc-bg` (canvas), `--cc-surface` (sidebar, panels, modals), `--cc-raised` (fields, tiles, cards), `--cc-hover`, `--cc-active`.
- Lines: `--cc-line-1` (dividers), `--cc-line-2` (default hairline), `--cc-line-3` (strong / hover).
- Text: `--cc-text-1` / `--cc-text-2` / `--cc-text-3` / `--cc-text-4`.
- Signal green `--cc-action` (#C5EF34) with `--cc-on-action` text. **At most one primary (green) action per view.** Green is also the focus ring (`--cc-focus`) and the current-stage marker. It is never used for borders, badges, icons or decoration.
- Selection is neutral: `--cc-selected-line` ring plus a small green check where useful.
- Semantic: `--cc-success` (mint), `--cc-warning` (amber), `--cc-danger` (coral), `--cc-info` (sky). Always pair with an icon or text label.
- Materials: `.cc-glass` / `--cc-glass` only for floating controls (top bar, production bar, menus, toasts, player controls). Never on cards or content.
- Shape: `--cc-radius-xs/sm/md/lg/xl/pill` = 6/10/14/20/28/999. Buttons are pills.
- Type: `--cc-font-display` (Inter Tight, headings), `--cc-font-text` (Inter), `--cc-font-mono` (JetBrains Mono, timecodes and slates). Weights 400/500/600 only; 12px minimum; sentence case (no uppercase labels).
- Motion: `--cc-dur-1..4` (120/200/320/480ms), `--cc-ease`, `--cc-ease-out`. `prefers-reduced-motion` is handled globally.

Legacy names (`--bg-*`, `--text-*`, `--border-*`, `--accent-*`, `--success`…) are aliases kept for existing code. Prefer `--cc-*` in new code.

### Shared classes
`.cc-btn` with `--primary | --secondary | --ghost | --danger` and `--sm | --lg`; `.cc-panel`; `.cc-glass`; `.cc-production-bar` (sticky glass bar holding Back and the stage's primary action); `.cc-sticky-action`; `.cc-ghost-hover`; `.cc-hoverable`; `.cc-enter`; `.cc-keylight`. The brand mark is `src/components/v2/BrandMark.jsx`.

### Rules
- Purple, indigo, violet and the old Director gold are retired. Do not reintroduce them.
- Don't add per-section rainbow colors or emoji icons. Use Lucide icons in `--cc-text-2` / `--cc-text-3`.
- Shadows only on floating layers (menus, toasts, modals).
- Visual changes must not alter handlers, props, state or copy that tests pin. Run `npm test` and `npm run build` before handing work back.
