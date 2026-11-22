/**
 * The chart grid's rules. Kept apart from grid.ts so the shared component
 * sheet can carry them without importing the grid, which imports the shell.
 * Every colour is a widget token, written on the grid root by the grid, apart
 * from the link group hues, which have one value per theme here. The bar's
 * menus bring their own rules when they load (grid-menus.ts).
 */

/** Link group hues, by letter: eight, repeated for groups I to P. The letter always says which group. */
const HUES_DARK = ['#5b9cf6', '#f0a445', '#4cc38a', '#d673d1', '#3fc1c9', '#d9c34a', '#ef6a6a', '#9d85f2'];
const HUES_LIGHT = ['#1f63c9', '#b8660b', '#17864f', '#a23c9e', '#0e7f86', '#8a7300', '#c0392b', '#6247c4'];
const hues = (theme: 'dark' | 'light', list: readonly string[]): string => [...'ABCDEFGHIJKLMNOP']
  .map((letter, i) => `.rico-grid[data-theme="${theme}"] [data-group="${letter}"] { --rico-group: ${list[i % list.length]}; }`).join('\n');

export const CHART_GRID_CSS = `
.rico-grid { position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 0; min-height: 0;
  background: var(--rico-bg); color: var(--rico-tx); font: var(--rico-fs)/1.35 var(--rico-font); }
.rico-grid [hidden] { display: none !important; }
.rico-grid__tabs { display: flex; gap: 2px; padding: 4px; overflow-x: auto; flex: none; background: var(--rico-panel);
  border-bottom: 1px solid var(--rico-bd-soft); scrollbar-width: thin; scrollbar-color: var(--rico-sb-thumb) transparent; }
.rico-grid__tabs::-webkit-scrollbar { height: 6px; }
.rico-grid__tabs::-webkit-scrollbar-thumb { background: var(--rico-sb-thumb); border-radius: 999px; }
.rico-grid__tab { flex: none; height: 26px; padding: 0 10px; border: 1px solid transparent; border-radius: var(--rico-radius);
  background: transparent; color: var(--rico-mut); font: inherit; cursor: pointer; white-space: nowrap; }
.rico-grid__tab:hover { color: var(--rico-tx); background: var(--rico-elev); }
.rico-grid__tab[aria-selected="true"] { color: var(--rico-tx-strong); background: var(--rico-on-bg); border-color: var(--rico-on-bd); }
.rico-grid__tab:focus-visible, .rico-grid__split:focus-visible { outline: 2px solid var(--rico-ring); outline-offset: -2px; }
.rico-grid__cells { position: relative; flex: 1; display: grid; min-height: 0; background: var(--rico-bd-soft); }
.rico-grid__cell { position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.rico-grid__cell::after { content: ''; position: absolute; inset: 0; border: 1px solid transparent; pointer-events: none; z-index: 30; }
.rico-grid[data-single="false"][data-compact="false"]:not([data-maximized="true"]) .rico-grid__cell[data-active="true"]::after { border-color: var(--rico-acc); }
.rico-grid__split { position: relative; z-index: 31; touch-action: none; transition: background .12s; }
.rico-grid__split::before { content: ''; position: absolute; inset: 0 -3px; }
.rico-grid__split[data-axis="row"]::before { inset: -3px 0; }
.rico-grid__split[data-axis="column"] { cursor: col-resize; }
.rico-grid__split[data-axis="row"] { cursor: row-resize; }
.rico-grid__split:hover, .rico-grid__split.is-drag { background: var(--rico-acc); }
.rico-grid:is([data-compact="true"], [data-maximized="true"]) .rico-grid__cells { grid-template: minmax(0,1fr) / minmax(0,1fr) !important; }
.rico-grid:is([data-compact="true"], [data-maximized="true"]) .rico-grid__cell { grid-area: 1 / 1 / 2 / 2 !important; }

/* Dragging a chart by its bar onto another's place. */
.rico-grid[data-single="false"][data-compact="false"]:not([data-maximized="true"]) .rico-grid__cell .rico-topbar { cursor: grab; }
.rico-grid[data-single="false"][data-compact="false"]:not([data-maximized="true"]) .rico-grid__cell .rico-topbar input { cursor: text; }
.rico-grid[data-dragging="true"], .rico-grid[data-dragging="true"] * { cursor: grabbing !important; user-select: none; }
.rico-grid__cell[data-dragging="true"] { opacity: .55; }
.rico-grid__cell[data-drop="true"]::after { border: 2px dashed var(--rico-acc); background: var(--rico-on-bg); }

/* Dense cells: a chart a few hundred pixels across keeps its plot and the
   controls a chart needs every minute; the rest waits for maximize. */
/* One row that scrolls sideways rather than a bar wrapped over a third of the plot. */
.rico-grid__cell[data-dense="true"] :is(.rico-rail, .rico-rail-tab) { display: none; }
.rico-grid__cell[data-dense="true"] .rico-topbar { gap: 2px; padding: 3px 5px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden;
  scrollbar-width: none; -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent);
  mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent); }
.rico-grid__cell[data-dense="true"] .rico-topbar::-webkit-scrollbar { display: none; }
.rico-grid__cell[data-dense="true"] .rico-topbar > * { flex-shrink: 0; }
.rico-grid__cell[data-dense="true"] .rico-sym > input { width: 96px; }
.rico-grid__cell[data-dense="true"] .rico-sym__ex { display: none; }
.rico-grid__cell[data-dense="true"] :is(.rico-topbar__goto, .rico-topbar__objects, .rico-topbar__data, .rico-topbar__watchlist,
  .rico-topbar__news, .rico-topbar__alerts, .rico-topbar__theme, .rico-topbar__branding-slot, .rico-topbar__spacer + .rico-sep) { display: none; }
/* A label goes where its glyph shows: a host's chart type with none keeps its name. */
.rico-grid__cell[data-dense="true"] .rico-topbar > .rico-btn > span:not(.rico-glyph):not(.rico-chev):not([hidden] + span) { display: none; }

/* The grid's own chrome takes the widget's controls; these rules only place it. The bar's strip
   holds its height (a control and its padding) before the bar loads into it (grid-bar.ts). */
.rico-widget.rico-grid__bar { position: relative; display: flex; align-items: center; gap: 4px; flex: none; height: auto;
  min-height: calc(var(--rico-ctl-h) + 9px); padding: 4px 6px; background: var(--rico-panel); border-bottom: 1px solid var(--rico-bd-soft);
  overflow: visible; container: rico-grid-bar / inline-size; }
/* One bar under the charts: the widget's own strip, acting on the active chart. */
.rico-widget.rico-grid__foot { display: block; flex: none; height: auto; min-height: 0; }
.rico-widget.rico-grid__overlay { position: absolute; inset: 0; display: block; background: transparent; pointer-events: none;
  z-index: 80; overflow: visible; }
/* A link group mark: the letter on a panel, the group's hue as a stripe. */
.rico-grid__chip { display: inline-flex; align-items: center; justify-content: center; min-width: 17px; height: 17px;
  padding: 0 4px 0 6px; border-radius: 4px; background: var(--rico-elev-2); color: var(--rico-tx-strong);
  box-shadow: inset 3px 0 0 var(--rico-group, var(--rico-faint)); font: 700 10.5px/1 var(--rico-font); flex: none; }
.rico-grid__chip[data-group="none"] { padding: 0 3px; box-shadow: none; background: transparent; color: var(--rico-faint); }
.rico-grid__chip[data-group="none"] > svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round; }
.rico-grid__mark { display: inline-flex; align-items: center; justify-content: center; height: 24px; min-width: 24px; padding: 0 3px;
  margin-right: 2px; border: 1px solid transparent; border-radius: 6px; background: transparent; cursor: pointer; flex: none; }
.rico-grid__mark:hover { background: var(--rico-elev); border-color: var(--rico-bd-soft); }
.rico-grid__mark:focus-visible { outline: 2px solid var(--rico-ring); outline-offset: -1px; }
.rico-grid__mark--float { position: absolute; top: 6px; left: 6px; z-index: 32; background: var(--rico-panel); border-color: var(--rico-bd-soft); }
${hues('dark', HUES_DARK)}
${hues('light', HUES_LIGHT)}
@media (prefers-reduced-motion: reduce) {
  .rico-grid__split { transition: none; }
}
`;
