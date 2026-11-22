/**
 * The widget stylesheet: one `<style>` per document, every rule scoped under
 * `.rico-widget`, every colour a token from `tokens.ts`.
 *
 * Nothing here names a colour twice or reaches outside the widget root. A
 * host page keeps its own cascade, and two widgets on one page share the one
 * sheet while carrying their own token values inline, so one can be dark and
 * the other light.
 *
 * The rules follow RicoChart's UI craft standard: styled scrollbars on
 * every scrolling surface, no browser-default checkbox, select or colour
 * input, small square swatches, dense rows, muted uppercase section heads.
 * The dialog modules mount inside `.rico-widget`, so they inherit all of it.
 */

import { token as v } from './tokens';
import { ICON_SIZE, ICON_STROKE, CHROME_ICON_SIZE, CHROME_ICON_STROKE } from 'rico-chart/draw';

/** Id of the injected `<style>`; one per document. */
export const WIDGET_STYLE_ID = 'rico-widget-css';

export const WIDGET_CSS = `
.rico-widget { position: relative; display: grid; grid-template-rows: auto 1fr auto; width: 100%; height: 100%;
  min-height: 0; min-width: 0; background: ${v('bg')}; color: ${v('tx')}; font: ${v('fs')}/1.35 ${v('font')};
  -webkit-font-smoothing: antialiased; overflow: hidden; }
.rico-widget, .rico-widget * { box-sizing: border-box; }
.rico-widget.rico-alert-host { position: absolute; inset: 0; display: block; background: transparent; pointer-events: none; z-index: 40; }
.rico-widget[data-theme="dark"] { color-scheme: dark; }
.rico-widget[data-theme="light"] { color-scheme: light; }
.rico-widget button, .rico-widget input, .rico-widget select, .rico-widget textarea { font: inherit; color: inherit; }
.rico-widget button { cursor: pointer; }
.rico-widget kbd { font: 11px/1 ${v('mono')}; font-variant-numeric: tabular-nums; }
.rico-widget [hidden] { display: none !important; }
.rico-widget .rico-row:has(> .rico-input-error:not([hidden])) { flex-wrap: wrap; }
.rico-widget .rico-input-error { flex-basis: 100%; min-width: 0; color: ${v('danger')}; font-size: 11px; overflow-wrap: anywhere; }
.rico-widget .rico-row__ctl:has([data-input-action]) { flex-wrap: wrap; }
.rico-widget .rico-row__ctl [data-input-action] { font-size: 11px; padding: 3px 7px; }
.rico-widget [aria-invalid="true"] { border-color: ${v('danger')}; }
.rico-widget .rico-input-pick { position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px; max-width: calc(100% - 16px); padding: 8px;
  color: ${v('tx')}; background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 6px; pointer-events: auto; }

/* Scrollbars: a thumb one step lighter than its panel, and no visible track. */
.rico-widget * { scrollbar-width: thin; scrollbar-color: ${v('sb-thumb')} transparent; }
.rico-widget ::-webkit-scrollbar { width: 10px; height: 10px; }
.rico-widget ::-webkit-scrollbar-track { background: transparent; }
.rico-widget ::-webkit-scrollbar-thumb { background: ${v('sb-thumb')}; border: 2px solid transparent;
  background-clip: padding-box; border-radius: 999px; }
.rico-widget ::-webkit-scrollbar-thumb:hover { background: ${v('sb-thumb-hover')}; background-clip: padding-box; }
.rico-widget ::-webkit-scrollbar-corner { background: transparent; }

/* Focus: one ring, keyboard only. Text fields glow on the border instead. */
.rico-widget :focus-visible { outline: 2px solid ${v('ring')}; outline-offset: 2px; }
.rico-widget :focus:not(:focus-visible) { outline: none; }
.rico-widget input:not([type=checkbox]):not([type=color]):not([type=range]):focus-visible,
.rico-widget select:focus-visible, .rico-widget textarea:focus-visible {
  outline: none; border-color: ${v('acc')}; box-shadow: 0 0 0 3px ${v('ring-soft')}; }
.rico-widget .rico-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }

/* Form controls: nothing left to the browser on a themed panel. */
.rico-widget input[type=checkbox] { appearance: none; -webkit-appearance: none; flex: none; margin: 0;
  width: 15px; height: 15px; border: 1px solid ${v('bd')}; border-radius: 4px; background: ${v('elev')};
  cursor: pointer; display: inline-grid; place-content: center; transition: background .12s, border-color .12s; }
.rico-widget input[type=checkbox]:hover { border-color: ${v('bd-hover')}; }
.rico-widget input[type=checkbox]:checked { background: ${v('acc')}; border-color: ${v('acc')}; }
.rico-widget input[type=checkbox]:checked::after { content: ''; width: 4px; height: 8px; margin-top: -2px;
  border: solid ${v('bg')}; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.rico-widget input[type=checkbox]:disabled { opacity: .4; cursor: not-allowed; }
/* A radio is the checkbox's round sibling; the dot is an inset ring, which needs no pseudo-element. */
.rico-widget input[type=radio] { appearance: none; -webkit-appearance: none; flex: none; margin: 0; width: 15px; height: 15px;
  border: 1px solid ${v('bd')}; border-radius: 50%; background: ${v('elev')}; cursor: pointer; transition: background .12s, border-color .12s; }
.rico-widget input[type=radio]:hover { border-color: ${v('bd-hover')}; }
.rico-widget input[type=radio]:checked { border-color: ${v('acc')}; background: ${v('acc')}; box-shadow: inset 0 0 0 3px ${v('elev')}; }
.rico-widget select { appearance: none; -webkit-appearance: none; height: ${v('ctl-h')}; padding: 0 24px 0 8px;
  background: ${v('elev')}; border: 1px solid ${v('bd')}; border-radius: ${v('radius')}; cursor: pointer; }
.rico-widget .rico-select { position: relative; display: inline-flex; }
/* The chevron overlays the select rather than sitting beside it. selectBox
   wraps the glyph in an rico-chev span, and this rule used to name
   .rico-select > svg, which that markup has never had: the span stayed an
   ordinary flex item, so it took eleven pixels of the row and left the select
   eleven pixels short of every input beside it, with its arrow outside its own
   box. Sized here rather than left to .rico-chev, whose inline-grid is right
   where a chevron follows a word, as it does in the top bar. */
.rico-widget .rico-select > .rico-chev { position: absolute; right: 7px; top: 50%; width: 11px; height: 11px;
  transform: translateY(-50%); pointer-events: none; display: block; color: ${v('mut')}; }
.rico-widget select option, .rico-widget select optgroup { background: ${v('panel')}; color: ${v('tx')}; }
.rico-widget input[type=color] { width: 26px; height: 26px; padding: 0; flex: none; cursor: pointer; appearance: none;
  -webkit-appearance: none; background-color: ${v('elev')}; border: 1px solid ${v('bd')}; border-radius: ${v('radius')}; }
.rico-widget input[type=color]:hover { border-color: ${v('bd-hover')}; }
.rico-widget input[type=color]::-webkit-color-swatch-wrapper { padding: 3px; }
.rico-widget input[type=color]::-webkit-color-swatch { border: 1px solid rgba(0,0,0,.35); border-radius: 4px; }
.rico-widget input[type=color]::-moz-color-swatch { border: 1px solid rgba(0,0,0,.35); border-radius: 4px; }
.rico-widget .rico-swatch { width: 20px; height: 20px; border-radius: 5px; border: 1px solid rgba(0,0,0,.35); }
.rico-widget input[type=number] { -moz-appearance: textfield; appearance: textfield; }
.rico-widget input[type=number]::-webkit-inner-spin-button, .rico-widget input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none; margin: 0; }
.rico-widget input[type=text], .rico-widget input[type=number], .rico-widget input[type=search], .rico-widget textarea {
  height: ${v('ctl-h')}; padding: 0 8px; background: ${v('elev')}; border: 1px solid ${v('bd')}; border-radius: ${v('radius')};
  transition: border-color .15s, box-shadow .15s; }
.rico-widget textarea { height: auto; padding: 6px 8px; }
.rico-widget input::placeholder { color: ${v('faint')}; }
.rico-widget input:hover, .rico-widget select:hover { border-color: ${v('bd-hover')}; }
.rico-widget input[type=range] { appearance: none; -webkit-appearance: none; height: 22px; margin: 0;
  background: transparent; cursor: pointer; }
.rico-widget input[type=range]::-webkit-slider-runnable-track { height: 3px; border-radius: 2px; background: ${v('elev-3')}; }
.rico-widget input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px;
  margin-top: -4.5px; border-radius: 50%; background: ${v('acc')}; border: 0; }
.rico-widget input[type=range]::-moz-range-track { height: 3px; border-radius: 2px; background: ${v('elev-3')}; }
.rico-widget input[type=range]::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: ${v('acc')}; border: 0; }

/* Section heads and rows shared by every panel. */
.rico-widget .rico-head { padding: 8px 10px 4px; color: ${v('faint')}; font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .7px; }
.rico-widget .rico-row { display: flex; align-items: center; gap: 8px; min-height: 26px; padding: 2px 0; }
.rico-widget .rico-row > label { flex: 1 1 auto; min-width: 0; color: ${v('tx')}; }

/* Help mark: a 13px ring after a label, muted until pointed at. It must not
   grow the row, so it sits on the label's own line box and never wraps away
   from the words it belongs to. */
.rico-widget .rico-help { display: inline-flex; align-items: center; justify-content: center;
  width: 13px; height: 13px; margin-left: 5px; vertical-align: -2px; flex: none;
  border: 1px solid ${v('bd')}; border-radius: 50%; color: ${v('faint')};
  font-size: 9px; font-weight: 600; line-height: 1; cursor: help; user-select: none; }
.rico-widget .rico-help:hover { color: ${v('tx')}; border-color: ${v('bd-hover')}; }
/* A heading's rows as one named group, laid out as if the box were not there. */
.rico-widget .rico-form__group { display: contents; }

/* Buttons: flat, 28px tall, a tint when pressed or active. */
.rico-widget .rico-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: ${v('ctl-h')}; padding: 0 9px; background: transparent; border: 1px solid transparent;
  border-radius: ${v('radius')}; color: ${v('tx')}; white-space: nowrap; transition: background .1s, border-color .1s, color .1s; }
.rico-widget .rico-btn:hover { background: ${v('elev')}; border-color: ${v('bd-soft')}; }
.rico-widget .rico-btn.is-on, .rico-widget .rico-btn[aria-pressed="true"], .rico-widget .rico-btn[aria-expanded="true"] {
  background: ${v('on-bg')}; border-color: ${v('on-bd')}; color: ${v('acc-2')}; }
.rico-widget .rico-btn.is-off, .rico-widget .rico-btn[aria-disabled="true"], .rico-widget .rico-btn:disabled {
  color: ${v('faint')}; cursor: default; }
.rico-widget .rico-btn.is-off:hover, .rico-widget .rico-btn[aria-disabled="true"]:hover, .rico-widget .rico-btn:disabled:hover {
  background: transparent; border-color: transparent; }
.rico-widget .rico-btn--icon { width: ${v('ctl-h')}; padding: 0; }
.rico-widget .rico-btn--primary { background: ${v('acc')}; color: ${v('bg')}; border-color: transparent; font-weight: 600; }
.rico-widget .rico-btn--primary:hover { background: ${v('acc-2')}; border-color: transparent; }
.rico-widget .rico-btn--danger:not(.is-off):hover { color: ${v('danger')}; }
.rico-widget .rico-btn > b { font-weight: 700; letter-spacing: .3px; }
.rico-widget .rico-glyph { display: inline-grid; place-items: center; line-height: 0; flex: none; }
.rico-widget .rico-glyph > svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
.rico-widget .rico-glyph--tool > svg { width: ${ICON_SIZE}px; height: ${ICON_SIZE}px; stroke-width: ${ICON_STROKE}; }
.rico-widget .rico-glyph--chrome > svg { width: ${CHROME_ICON_SIZE}px; height: ${CHROME_ICON_SIZE}px; stroke-width: ${CHROME_ICON_STROKE}; }
.rico-widget .rico-glyph--text { display: inline-grid; place-items: center; width: ${ICON_SIZE}px; height: ${ICON_SIZE}px;
  font-size: 12px; font-weight: 600; }
.rico-widget .rico-chev { display: inline-grid; place-items: center; line-height: 0; color: ${v('mut')}; }
.rico-widget .rico-chev > svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round; }
.rico-widget .rico-sep { width: 1px; height: 20px; background: ${v('bd-soft')}; margin: 0 2px; flex: none; }

/* Top bar */
.rico-widget .rico-topbar { grid-row: 1; display: flex; align-items: center; gap: 4px; min-height: ${v('topbar-h')};
  padding: 5px 8px; background: ${v('panel')}; border-bottom: 1px solid ${v('bd-soft')}; flex-wrap: wrap; }
.rico-widget .rico-topbar__spacer { flex: 1 1 auto; }
.rico-widget .rico-topbar__branding-slot { display: inline-flex; align-items: center; }
.rico-widget .rico-topbar__branding { color: ${v('mut')}; font-size: 11px; text-decoration: none; white-space: nowrap; }
.rico-widget .rico-topbar__branding:hover { color: ${v('tx')}; text-decoration: underline; }
.rico-widget .rico-sym { position: relative; display: inline-flex; align-items: center; }
.rico-widget .rico-sym > input { width: 132px; height: ${v('ctl-h')}; padding: 0 8px 0 28px; font-weight: 600;
  letter-spacing: .3px; text-transform: uppercase; }
.rico-widget .rico-sym > .rico-glyph { position: absolute; left: 8px; color: ${v('mut')}; pointer-events: none; }
.rico-widget .rico-sym__ex { margin-left: 6px; color: ${v('faint')}; font-size: 11px; font-weight: 600; letter-spacing: .5px; }
.rico-widget .rico-pills { display: inline-flex; background: ${v('elev')}; border: 1px solid ${v('bd-soft')};
  border-radius: 7px; padding: 2px; }
.rico-widget .rico-pills > button { height: 22px; padding: 0 8px; background: transparent; border: 0; border-radius: 5px;
  color: ${v('mut')}; font-weight: 600; font-size: 11.5px; letter-spacing: .2px; }
.rico-widget .rico-pills > button:hover { color: ${v('tx')}; }
.rico-widget .rico-pills > button[aria-pressed="true"] { background: ${v('elev-2')}; color: ${v('acc-2')}; }
.rico-widget .rico-pills > button:focus-visible { outline-offset: -1px; }

/* Popup menu (chart types, screenshot, symbol results) */
.rico-widget .rico-menu { min-width: 190px; max-width: 320px; max-height: 60vh; overflow-y: auto; padding: 5px;
  background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 9px; box-shadow: ${v('shadow')}; outline: none; }
.rico-widget .rico-menu__find { padding: 3px 3px 6px; }
.rico-widget .rico-menu__find > input { width: 100%; }
.rico-widget .rico-menu__row { display: flex; align-items: center; gap: 9px; width: 100%; padding: 6px 8px;
  background: transparent; border: 0; border-radius: 6px; color: ${v('tx')}; text-align: left; white-space: nowrap; }
.rico-widget .rico-menu__row:hover, .rico-widget .rico-menu__row:focus-visible, .rico-widget .rico-menu__row.is-active {
  background: ${v('elev-2')}; outline: none; }
.rico-widget .rico-menu__row[aria-checked="true"] { color: ${v('acc-2')}; }
.rico-widget .rico-menu__row[aria-checked="true"]::before { content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: ${v('acc-2')}; margin: 0 2px 0 -2px; flex: none; }
.rico-widget .rico-menu__row[aria-checked="false"]::before { content: ''; width: 6px; height: 6px; margin: 0 2px 0 -2px; flex: none; }
.rico-widget .rico-menu__row[aria-disabled="true"] { color: ${v('faint')}; cursor: default; background: transparent; }
.rico-widget .rico-menu__row.is-danger:hover { color: ${v('danger')}; }
.rico-widget .rico-menu__label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.rico-widget .rico-menu__sub { color: ${v('faint')}; font-size: 11px; }
.rico-widget .rico-menu__key { margin-left: auto; color: ${v('faint')}; }
.rico-widget .rico-menu__empty { padding: 8px 10px; color: ${v('faint')}; }
/* A hovered row is elev-2, where faint text no longer reads: its hints brighten with it. */
.rico-widget .rico-menu__row:is(:hover, :focus-visible, .is-active) :is(.rico-menu__sub, .rico-menu__key),
.rico-widget .rico-fly__row:is(:hover, :focus-visible) .rico-fly__chord { color: ${v('mut')}; }

/* Stage: the rail on the left, the chart filling the rest. */
.rico-widget .rico-stage { grid-row: 2; position: relative; min-height: 0; min-width: 0; display: flex; }
.rico-widget .rico-chart { position: relative; flex: 1 1 auto; min-width: 0; min-height: 0;
  cursor: var(--rico-tool-cursor, crosshair); }
.rico-widget .rico-chart:focus-visible { outline-offset: -2px; }

/* Data state stays compact inside a chart, including narrow embedded widgets. */
.rico-widget .rico-data-status { position: absolute; top: 8px; right: 8px; z-index: 30;
  max-width: calc(100% - 16px); width: max-content; max-height: 45%; overflow-y: auto;
  display: flex; flex-direction: column; gap: 4px; pointer-events: none; font-size: 12px; }
.rico-widget .rico-data-status__row { display: flex; align-items: center; gap: 8px;
  max-width: 320px; padding: 4px 6px 4px 10px; background: ${v('panel')}; color: ${v('tx')};
  border: 1px solid ${v('bd')}; border-radius: 6px; pointer-events: auto; }
.rico-widget .rico-data-status__text { min-width: 0; overflow-wrap: anywhere; }
.rico-widget .rico-data-status__row > button { flex: none; color: ${v('acc-2')}; }

/* Rail */
.rico-widget .rico-rail { flex: none; width: ${v('rail-w')}; display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: 6px 0 0; background: ${v('panel-2')}; border-right: 1px solid ${v('bd-soft')};
  overflow-y: auto; overflow-x: hidden; scrollbar-width: none; container: rico-rail / size; }
.rico-widget .rico-rail::-webkit-scrollbar { width: 0; height: 0; }
.rico-widget .rico-rail__btn { position: relative; width: 32px; height: 30px; padding: 0; display: grid; place-items: center;
  flex: none; background: transparent; border: 1px solid transparent; border-radius: 6px; color: ${v('mut')};
  transition: background .09s, color .09s, border-color .09s; }
.rico-widget .rico-rail__btn:hover { background: ${v('elev')}; color: ${v('tx')}; }
.rico-widget .rico-rail__btn:focus-visible { outline: 2px solid ${v('acc-2')}; outline-offset: -2px; }
.rico-widget .rico-rail__btn.is-on { background: ${v('on-bg')}; border-color: ${v('on-bd')}; color: ${v('acc-2')}; }
.rico-widget .rico-rail__btn.is-weak { color: ${v('acc-2')}; }
.rico-widget .rico-rail__btn.is-off { color: ${v('faint')}; cursor: default; }
.rico-widget .rico-rail__btn.is-off:hover { background: transparent; color: ${v('faint')}; }
.rico-widget .rico-rail__btn--danger:not(.is-off):hover { color: ${v('danger')}; }
.rico-widget .rico-rail__chev { position: absolute; right: 0; bottom: 0; width: 13px; height: 13px; display: grid;
  place-items: center; border-radius: 5px 0 6px 0; color: ${v('mut')}; opacity: 0; transition: opacity .1s, background .1s; }
.rico-widget .rico-rail__chev > svg { width: 9px; height: 9px; fill: none; stroke: currentColor; stroke-width: 2.2;
  stroke-linecap: round; stroke-linejoin: round; }
.rico-widget .rico-rail__btn:hover .rico-rail__chev, .rico-widget .rico-rail__btn:focus-visible .rico-rail__chev,
.rico-widget .rico-rail__btn[aria-expanded="true"] .rico-rail__chev { opacity: 1; }
.rico-widget .rico-rail__chev:hover { background: ${v('elev-2')}; color: ${v('tx')}; }
/* A notch in the corner of a button that opens a flyout, so the rail says which
   buttons hold more before the pointer finds out. The caret shows only on hover,
   over the glyph's corner, and at rest it would sit on every glyph's anchor. */
.rico-widget .rico-rail__group::before { content: ''; position: absolute; right: 2px; bottom: 2px;
  border: 2.5px solid transparent; border-right-color: ${v('faint')}; border-bottom-color: ${v('faint')}; }
.rico-widget .rico-rail__group:hover::before, .rico-widget .rico-rail__group:focus-visible::before,
.rico-widget .rico-rail__group[aria-expanded="true"]::before { content: none; }
.rico-widget .rico-rail__btn.is-held::after, .rico-widget .rico-rail__btn[data-mode="weak"]::after,
.rico-widget .rico-rail__btn[data-mode="strong"]::after { content: ''; position: absolute; top: 3px; right: 3px;
  width: 5px; height: 5px; border-radius: 50%; }
.rico-widget .rico-rail__btn.is-held::after, .rico-widget .rico-rail__btn[data-mode="strong"]::after { background: ${v('acc-2')}; }
.rico-widget .rico-rail__btn[data-mode="weak"]::after { border: 1.5px solid ${v('acc-2')}; width: 4px; height: 4px; }
.rico-widget .rico-rail__sep { width: 22px; height: 1px; background: ${v('bd-soft')}; margin: 4px 0; flex: none; }
.rico-widget .rico-rail__favs { display: contents; }
.rico-widget .rico-rail__ctl { margin-top: auto; position: sticky; bottom: 0; display: flex; flex-direction: column;
  align-items: center; gap: 2px; width: 100%; padding: 4px 0 6px; background: ${v('panel-2')};
  border-top: 1px solid ${v('bd-soft')}; flex: none; }
/* Tools that scroll under the controls fade out instead of being cut through. */
.rico-widget .rico-rail__ctl::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: 14px;
  background: linear-gradient(to bottom, transparent, ${v('panel-2')}); pointer-events: none; }
.rico-widget .rico-rail__ctl .rico-rail__sep { margin: 3px 0; }
/* The controls are as tall as a short chart's whole rail: pinned to its foot in
   one cell of a two by two grid, they covered every tool, and the rail showed
   no way to draw. A rail that cannot show five tools above them lets them go
   and scrolls as one column, tools first. */
@container rico-rail (max-height: 450px) {
  .rico-widget .rico-rail__ctl { position: static; margin-top: 0; }
  .rico-widget .rico-rail__ctl::before { content: none; }
}
.rico-widget .rico-rail.is-collapsed { display: none; }
.rico-widget .rico-rail-tab { position: absolute; left: 0; bottom: 6px; z-index: 6; width: 16px; height: 26px; padding: 0;
  display: grid; place-items: center; background: ${v('panel-2')}; color: ${v('mut')};
  border: 1px solid ${v('bd-soft')}; border-left: 0; border-radius: 0 6px 6px 0;
  transition: background .09s, color .09s, width .09s; }
.rico-widget .rico-rail-tab:hover { width: 20px; background: ${v('elev')}; color: ${v('tx')}; }
.rico-widget .rico-rail-tab:focus-visible { outline: 2px solid ${v('acc-2')}; outline-offset: -2px; }
.rico-widget .rico-rail-tab > svg { width: 12px; height: 12px; }
.rico-widget .rico-rail-tab[hidden] { display: none; }

/* Rail flyout: a group's tools, with a pin star and the chord on each row. */
.rico-widget .rico-fly { min-width: 244px; max-width: 320px; max-height: calc(100% - 16px); overflow-y: auto; padding: 6px;
  background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 10px; box-shadow: ${v('shadow')}; outline: none; }
.rico-widget .rico-fly__row { display: flex; align-items: center; gap: 8px; padding: 4px 6px 4px 8px; border-radius: 7px;
  color: ${v('tx')}; font-size: 13px; cursor: pointer; outline: none; user-select: none; }
.rico-widget .rico-fly__row:hover, .rico-widget .rico-fly__row:focus-visible { background: ${v('elev-2')}; }
.rico-widget .rico-fly__row[aria-checked="true"] { background: ${v('on-bg')}; color: ${v('acc-2')}; }
.rico-widget .rico-fly__name { flex: 1 1 auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rico-widget .rico-fly__chord { min-width: 40px; text-align: right; color: ${v('faint')}; }
.rico-widget .rico-fly__star { width: 22px; height: 22px; display: grid; place-items: center; padding: 0; border: 0;
  border-radius: 5px; background: transparent; color: ${v('faint')}; opacity: 0; transition: opacity .1s, color .1s; }
.rico-widget .rico-fly__row:hover .rico-fly__star, .rico-widget .rico-fly__row:focus-within .rico-fly__star,
.rico-widget .rico-fly__star[aria-pressed="true"] { opacity: 1; }
.rico-widget .rico-fly__star:hover { background: ${v('elev')}; color: ${v('tx')}; }
.rico-widget .rico-fly__star:focus-visible { outline: 2px solid ${v('acc-2')}; outline-offset: -1px; opacity: 1; }
.rico-widget .rico-fly__star[aria-pressed="true"] { color: ${v('amber')}; }
.rico-widget .rico-fly__star > svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round; }
.rico-widget .rico-fly__star[aria-pressed="false"] > svg { fill: none; }

/* Tooltip */
.rico-widget .rico-tip-spot { position: absolute; width: 1px; height: 1px; pointer-events: none; }
.rico-widget .rico-tip { position: absolute; z-index: 200; left: 0; top: 0; max-width: 260px; pointer-events: none;
  padding: 5px 9px; border-radius: 6px; background: ${v('elev-2')}; color: ${v('tx')}; border: 1px solid ${v('bd')};
  box-shadow: ${v('shadow')}; font-size: 12px; line-height: 1.4; opacity: 0; transition: opacity .09s ease; }
.rico-widget .rico-tip.is-on { opacity: 1; }
.rico-widget .rico-tip__chord { margin-left: 10px; color: ${v('mut')}; }
/* The tip sits on elev-2, a step above the surfaces faint text is measured on. */
.rico-widget .rico-tip__sub { display: block; margin-top: 2px; color: ${v('mut')}; font-size: 11px; }

/* Status line */
.rico-widget .rico-statusline { grid-row: 3; display: flex; align-items: center; gap: 12px; height: ${v('status-h')}; padding: 0 10px;
  background: ${v('panel')}; border-top: 1px solid ${v('bd-soft')}; color: ${v('mut')}; font-size: 11.5px;
  font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; }
.rico-widget .rico-statusline__sym { color: ${v('tx-strong')}; font-weight: 600; letter-spacing: .3px; }
.rico-widget .rico-statusline__iv { color: ${v('faint')}; margin-left: 4px; font-weight: 600; }
.rico-widget .rico-statusline__field { display: inline-flex; align-items: center; gap: 4px; }
.rico-widget .rico-statusline__field > i { font-style: normal; color: ${v('faint')}; }
.rico-widget .rico-statusline__field > b { font-weight: 500; color: ${v('tx')}; }
.rico-widget .rico-statusline .is-up > b { color: ${v('up')}; }
.rico-widget .rico-statusline .is-down > b { color: ${v('down')}; }
.rico-widget .rico-statusline__msg { margin-left: auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: ${v('mut')}; }
.rico-widget .rico-statusline__msg.is-error { color: ${v('danger')}; }
.rico-widget .rico-statusline__tz { color: ${v('faint')}; }

/* Narrow widget chrome */
.rico-widget .rico-mobile { display: none; }
.rico-widget.is-mobile { grid-template-rows: auto minmax(0, 1fr) auto; }
.rico-widget.is-mobile > .rico-topbar, .rico-widget.is-mobile > .rico-statusline,
.rico-widget.is-mobile > .rico-stage > :is(.rico-rail, .rico-rail-tab) { display: none; }
.rico-widget.is-mobile > .rico-stage { grid-row: 2; }
.rico-widget.is-mobile > .rico-mobile { display: contents; }
.rico-widget .rico-mobile__header { grid-row: 1; z-index: 40; display: grid; grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px; min-height: 52px; padding: calc(4px + env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 4px
  max(8px, env(safe-area-inset-left)); background: ${v('panel')}; border-bottom: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-mobile__symbol { width: 100%; min-width: 0; height: 44px; text-transform: uppercase; font-weight: 600; }
.rico-widget .rico-mobile__footer { grid-row: 3; z-index: 40; min-width: 0; padding-bottom: env(safe-area-inset-bottom);
  background: ${v('panel')}; border-top: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-mobile__bar, .rico-widget .rico-mobile__selection { display: grid; grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr); min-width: 0; }
.rico-widget .rico-mobile__selection { border-bottom: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-mobile__action { min-width: 0; min-height: 44px; padding: 6px 10px; border: 0; border-radius: 0;
  background: transparent; color: ${v('tx')}; overflow-wrap: anywhere; touch-action: manipulation; }
.rico-widget .rico-mobile__action:hover, .rico-widget .rico-mobile__action:focus-visible { background: ${v('elev')}; }
.rico-widget .rico-mobile__action[aria-pressed="true"] { color: ${v('acc-2')}; background: ${v('on-bg')}; }
.rico-widget .rico-mobile__action[aria-disabled="true"] { color: ${v('faint')}; cursor: default; background: transparent; }
.rico-widget .rico-mobile__branding { display: flex; align-items: center; width: 100%; min-height: 44px; text-decoration: none; }
.rico-widget .rico-mobile-sheet.rico-dialog { left: 0; right: 0; top: auto; bottom: 0; transform: none; width: 100%;
  max-width: 100%; max-height: calc(100% - env(safe-area-inset-top) - 12px); border-radius: 14px 14px 0 0;
  padding-bottom: env(safe-area-inset-bottom); }
.rico-widget .rico-mobile-sheet__head { flex: none; display: flex; align-items: center; gap: 8px;
  min-height: 52px; padding: 4px 8px 4px 14px; border-bottom: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-mobile-sheet__title { flex: 1 1 auto; color: ${v('tx-strong')}; font-size: 14px; }
.rico-widget .rico-mobile-sheet__body { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain;
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; padding: 8px; }
.rico-widget .rico-mobile-sheet__body > .rico-head { grid-column: 1 / -1; }
.rico-widget .rico-mobile-sheet__controls { grid-column: 1 / -1; display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)); border-bottom: 1px solid ${v('bd-soft')}; margin-bottom: 6px; }
.rico-widget .rico-mobile-sheet__body small { display: block; color: ${v('faint')}; }
/* A sheet row with a glyph (a chart type): the glyph sits on the middle of its label, not the baseline. */
.rico-widget .rico-mobile-sheet .rico-mobile__action > .rico-glyph { vertical-align: middle; margin: -2px 8px 0 0; }
.rico-widget .rico-mobile-results { width: min(360px, calc(100% - 16px)); max-height: min(50%, 360px); overflow: hidden;
  display: flex; flex-direction: column; background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 10px; box-shadow: ${v('shadow')}; }
.rico-widget .rico-mobile-results__head { flex: none; display: flex; align-items: center; gap: 8px; min-height: 44px;
  padding-left: 12px; border-bottom: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-mobile-results__head > strong { flex: 1 1 auto; color: ${v('tx-strong')}; }
.rico-widget .rico-mobile-results__list { flex: 1 1 auto; min-height: 0; max-height: min(42vh, 300px);
  overflow-y: auto; overscroll-behavior: contain; }
.rico-widget .rico-mobile-results__list > .rico-mobile__action { display: block; width: 100%; text-align: left; }
.rico-widget .rico-mobile-results__list small { display: block; color: ${v('faint')}; }
.rico-widget .rico-mobile-results__status { min-height: 44px; padding: 13px 12px; color: ${v('mut')}; }
.rico-widget.is-mobile .rico-toasts { bottom: calc(54px + env(safe-area-inset-bottom)); }

/* Toasts */
.rico-widget .rico-toasts { position: absolute; right: 12px; bottom: calc(${v('status-h')} + 10px); z-index: 90; display: flex;
  flex-direction: column; gap: 8px; width: min(340px, calc(100% - 24px)); pointer-events: none; }
.rico-widget .rico-toast { display: flex; align-items: flex-start; gap: 8px; padding: 8px 6px 8px 12px; border-radius: 8px;
  background: ${v('panel')}; color: ${v('tx')}; border: 1px solid ${v('bd')}; border-left: 3px solid ${v('acc')};
  box-shadow: ${v('shadow')}; font-size: 12.5px; line-height: 1.45; pointer-events: auto; animation: rico-toast-in .16s ease-out; }
.rico-widget .rico-toast--success { border-left-color: ${v('buy')}; }
.rico-widget .rico-toast--error { border-left-color: ${v('sell')}; }
.rico-widget .rico-toast__msg { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; padding-top: 2px; }
.rico-widget .rico-toast__x { flex: none; width: 26px; height: 26px; border: 0; border-radius: 6px; background: transparent;
  color: ${v('faint')}; padding: 0; display: grid; place-items: center; }
.rico-widget .rico-toast__x:hover { background: ${v('elev-2')}; color: ${v('tx')}; }
.rico-widget .rico-toast__x > svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.5; }
.rico-widget .rico-toast.is-out { opacity: 0; transform: translateY(6px); transition: opacity .16s, transform .16s; }
@keyframes rico-toast-in { from { opacity: 0; transform: translateY(6px); } }
/* A menu, a flyout or a dialog arrives over a tenth of a second, where it used
   to cut in on the next frame. Opacity and nothing else: a dialog is centred by
   its transform and a menu is placed by measuring it the moment it opens. */
.rico-widget .rico-menu, .rico-widget .rico-fly, .rico-widget .rico-dialog { animation: rico-pop-in .1s ease-out; }
@keyframes rico-pop-in { from { opacity: 0; } }

/* Overlay layer: popovers anchored to a control, dialogs centred over a scrim. */
.rico-widget .rico-layer { container: rico-widget / inline-size; position: absolute; inset: 0; z-index: 60; pointer-events: none; }
/* Not the tooltip: it shows over controls (the rail's tab, the bar's buttons) and
   must never take the press meant for them. */
.rico-widget .rico-layer > :not(.rico-tip, .rico-tip-spot) { pointer-events: auto; }
.rico-widget .rico-scrim { position: absolute; inset: 0; background: ${v('scrim')}; }
.rico-widget .rico-pop { position: absolute; left: 0; top: 0; }
.rico-widget .rico-dialog { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  min-width: 0; max-width: calc(100% - 24px); max-height: calc(100% - 24px); display: flex; flex-direction: column;
  background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 12px; box-shadow: ${v('shadow')}; outline: none; }
.rico-widget .rico-dialog__head { flex: none; min-width: 0; display: flex; align-items: center; gap: 8px; padding: 12px 14px 8px; }
.rico-widget .rico-dialog__title { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; font-size: 14px; font-weight: 700; color: ${v('tx-strong')}; }
.rico-widget .rico-dialog__body { flex: 1 1 auto; min-height: 0; min-width: 0; overflow: auto; overscroll-behavior: contain; padding: 4px 14px 10px; }
.rico-widget .rico-dialog__foot { flex: none; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 14px 12px;
  border-top: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-dialog__foot > .rico-spacer { flex: 1 1 auto; }
.rico-widget .rico-csv { width: 490px; }
.rico-widget .rico-csv__ranges, .rico-widget .rico-csv .rico-dialog__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.rico-widget .rico-csv__hint { color: ${v('mut')}; line-height: 1.5; }
.rico-widget .rico-csv__error { color: ${v('danger')}; overflow-wrap: anywhere; }
.rico-widget .rico-csv__error:empty { display: none; }

/* Point and figure and Renko settings: a size, its unit and its method share one control column. */
.rico-widget .rico-ctset { width: 380px; }
.rico-widget .rico-ctset .rico-row__ctl { width: min(244px, 66%); }
.rico-widget .rico-ctset__presets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; width: 100%; padding: 2px 0; }
.rico-widget .rico-ctset__preset { height: 24px; padding: 0 4px; font-size: 11px; font-variant-numeric: tabular-nums;
  background: ${v('elev')}; border-color: ${v('bd-soft')}; }
.rico-widget .rico-ctset__size { display: flex; align-items: center; gap: 6px; width: 100%; min-width: 0; }
.rico-widget .rico-ctset .rico-row__ctl .rico-ctset__size > input { flex: 1 1 0; width: auto; min-width: 0; }
.rico-widget .rico-ctset .rico-input--num { text-align: right; font-variant-numeric: tabular-nums; }
.rico-widget .rico-ctset .rico-row__ctl .rico-ctset__size > .rico-select { flex: 0 0 100px; width: 100px; }
.rico-widget .rico-ctset__unit { flex: none; color: ${v('mut')}; font-size: 11px; white-space: nowrap; }
.rico-widget .rico-ctset__radios { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px 14px; }
.rico-widget .rico-ctset__radio { display: inline-flex; align-items: center; gap: 6px; color: ${v('tx')}; white-space: nowrap; cursor: pointer; }

/* Shortcuts panel */
.rico-widget .rico-keys { columns: 2; column-gap: 24px; min-width: 520px; }
.rico-widget .rico-keys__group { break-inside: avoid; margin-bottom: 8px; }
.rico-widget .rico-keys__row { display: flex; align-items: center; gap: 10px; padding: 3px 0; }
.rico-widget .rico-keys__row > span { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.rico-widget .rico-keys__row > kbd { flex: none; padding: 2px 6px; border-radius: 4px; background: ${v('elev')};
  border: 1px solid ${v('bd-soft')}; color: ${v('mut')}; }
.rico-widget .rico-keys__row.is-shadowed > span, .rico-widget .rico-keys__row.is-shadowed > kbd { color: ${v('faint')}; text-decoration: line-through; }
.rico-widget .rico-keys__note { color: ${v('faint')}; font-size: 11px; padding: 4px 0 0; }

@container rico-widget (max-width: 720px) {
  .rico-widget .rico-keys { columns: 1; min-width: 0; }
}
@media (max-width: 720px) {
  .rico-widget .rico-sym > input { width: 104px; }
}
/* Everything, not a list: the list named six selectors and missed the form
   controls, which went on easing their colours for a user who asked for none. */
@media (prefers-reduced-motion: reduce) {
  .rico-widget *, .rico-widget *::before, .rico-widget *::after { transition: none !important; animation: none !important; }
}
`;

/**
 * Put the stylesheet into `doc` once. Safe to call per widget: the second
 * call leaves a populated sheet untouched. An empty server-rendered sheet
 * is filled in place, preserving its nonce. `extra` is appended to the
 * shell's rules when filling the sheet; the dialog modules hand theirs in
 * here, so the page still carries one sheet. `nonce` authorizes the style
 * element under CSP; the host controls its style-attribute policy separately.
 */
export function injectWidgetStyles(doc: Document, extra = '', nonce?: string): HTMLStyleElement {
  const existing = doc.getElementById(WIDGET_STYLE_ID) as HTMLStyleElement | null;
  if (existing?.textContent?.trim()) return existing;
  const style = existing ?? doc.createElement('style');
  style.id = WIDGET_STYLE_ID;
  // CSP checks connected sheets when their text changes. Read the IDL
  // property because browsers hide a connected element's nonce attribute.
  if (!style.nonce && nonce !== undefined) style.nonce = nonce;
  style.textContent = WIDGET_CSS + extra;
  if (existing === null) (doc.head ?? doc.body ?? doc.documentElement).appendChild(style);
  return style;
}

/**
 * Add the rules of a part that loads on first use (lazy.ts) to the sheet,
 * once per document. Appended to the widget's own sheet they keep its CSP
 * nonce, and they come after every rule they refine, as they did when the
 * part was bundled in. A page with no sheet gets none here, as before.
 */
export function addWidgetStyles(doc: Document, css: string): void {
  const style = doc.getElementById(WIDGET_STYLE_ID);
  if (style !== null && !(style.textContent ?? '').includes(css)) style.appendChild(doc.createTextNode(css));
}
