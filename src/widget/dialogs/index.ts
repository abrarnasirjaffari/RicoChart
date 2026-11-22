/**
 * The widget's overlay surfaces: every dialog, popover and menu the shell can
 * open. Each is generated from a schema the engine already ships (the chart
 * settings tabs, an indicator descriptor's inputs, a drawing tool's settings
 * fields) or from a fact the chart reports (`priceAxisState`, a context-menu
 * target), so a control appears here only where the engine has something
 * behind it.
 *
 * Every mount function takes the widget context and an optional anchor, and
 * returns a handle with `close()`. Importing this module registers the mounts
 * with the shell's dialog registry; `DIALOG_CSS` is the stylesheet they need,
 * appended to the widget's one `<style>`.
 */
import { registerWidgetDialogs, type DialogMount } from '../context';
import { mountContextMenu } from './context-menu';
import { mountDrawingProperties } from './drawing-properties';
import { mountIndicatorPicker } from './indicator-picker';
import { mountIndicatorSettings } from './indicator-settings';
import { mountLevelEditor } from './level-editor';
import { mountSettingsDialog } from './settings';
import { mountTextEditor } from './text-editor';
import { mountAlertEditor, mountAlertsPanel } from './alerts';
import { token as v } from '../tokens';
export { mountAlertEditor, mountAlertsPanel, type AlertEditorOptions, type AlertsPanelOptions } from './alerts';

// The door for the shell and the tier entry: the mounts and their options.
// Each dialog's own helpers stay in its module.
export { mountSettingsDialog, type SettingsDialogOptions } from './settings';
export { mountIndicatorPicker, type IndicatorPickerOptions } from './indicator-picker';
export { mountIndicatorSettings, type IndicatorSettingsOptions, type IndicatorSettingsTab } from './indicator-settings';
export { mountDrawingProperties, type DrawingPropertiesOptions } from './drawing-properties';
export { mountDrawingCoordinates, DRAWING_COORDINATES_CSS, type DrawingCoordinatesHandle } from './drawing-coordinates';
export { mountLevelEditor, type LevelEditorOptions } from './level-editor';
export { mountTextEditor, type TextEditorOptions, type TextEditorHandle } from './text-editor';
export {
  mountContextMenu, attachContextMenu, contextMenuEntries,
  type ContextMenuHooks, type ContextMenuOptions, type MenuEntry, type MenuItem,
} from './context-menu';
export type { PanelHandle } from '../form';

/** The mounts under the names the shell's registry knows them by. */
export const WIDGET_DIALOGS = {
  settings: mountSettingsDialog,
  indicatorPicker: mountIndicatorPicker,
  indicatorSettings: mountIndicatorSettings,
  drawingProperties: mountDrawingProperties,
  contextMenu: mountContextMenu,
  levelEditor: mountLevelEditor,
  textEditor: mountTextEditor,
  alertEditor: mountAlertEditor,
  alerts: mountAlertsPanel,
} satisfies Record<string, DialogMount>;

registerWidgetDialogs(WIDGET_DIALOGS);

/**
 * The rules the dialogs add to the widget stylesheet. Scoped under
 * `.rico-widget` and coloured only through tokens, like the shell's own; the
 * generic furniture (`.rico-dialog__*`, `.rico-btn`, the form controls) is the
 * shell's and is not restated here.
 */
export const DIALOG_CSS = `
.rico-widget .rico-alert-editor { width: 480px; }
.rico-widget .rico-alerts { width: 560px; }
.rico-widget .rico-alerts__row { padding: 10px 0; border-bottom: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-alerts__summary { white-space: pre-line; overflow-wrap: anywhere; line-height: 1.5; }
.rico-widget .rico-alerts__status { color: ${v('mut')}; font-size: 11px; line-height: 1.5; margin: 4px 0 8px; overflow-wrap: anywhere; }
.rico-widget .rico-alerts__actions { display: flex; flex-wrap: wrap; gap: 6px; }
.rico-widget .rico-alert-context { margin: 0 0 8px; color: ${v('mut')}; overflow-wrap: anywhere; }
.rico-widget .rico-alert-help { color: ${v('mut')}; font-size: 11px; line-height: 1.5; margin: 10px 0 0; }
.rico-widget .rico-alert-error { color: ${v('danger')}; font-size: 12px; margin: 6px 0 0; overflow-wrap: anywhere; }
.rico-widget .rico-alert-editor input[type=datetime-local] { width: 100%; min-width: 0; color-scheme: inherit;
  height: ${v('ctl-h')}; padding: 0 8px; border: 1px solid ${v('bd')}; border-radius: ${v('radius')};
  background: ${v('elev')}; color: ${v('tx')}; font: inherit; }
/* Panels: the card a dialog or a popover is built on. */
.rico-widget .rico-panel { display: flex; flex-direction: column; min-width: 0; max-width: calc(100% - 24px);
  max-height: calc(100% - 24px); background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 12px;
  box-shadow: ${v('shadow')}; outline: none; }
.rico-widget .rico-dialog__lead, .rico-widget .rico-dialog__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; max-width: 100%; }
.rico-widget .rico-dialog__actions .rico-btn:not(.rico-btn--primary) { border-color: ${v('bd-soft')}; }
.rico-widget .rico-empty { padding: 10px 6px; color: ${v('faint')}; }

/* Generated forms: switch column, label, control column. */
.rico-widget .rico-form { min-width: 0; display: grid; gap: 1px; align-content: start; }
.rico-widget .rico-form > .rico-head { padding: 10px 0 3px; }
.rico-widget .rico-form > .rico-head:first-child { padding-top: 2px; }
.rico-widget .rico-form .rico-row { gap: 8px; min-height: 30px; padding: 1px 0; }
.rico-widget .rico-row__sw { width: 15px; flex: none; }
.rico-widget .rico-row__label { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; color: ${v('mut')}; cursor: pointer; }
/* Every row's control occupies the same column, and the column is one width.
   It was not: a select filled it, a lone number sat at 72px against its right
   edge, and one row widened the column for itself. Reading down the form, the
   left edge of the controls stepped in and out by ninety pixels, which is the
   kind of wrongness a reader feels before they can name it. The column is wide
   enough for a date and time, which is the widest control any of these forms
   puts in it. */
.rico-widget .rico-row__ctl { display: flex; align-items: center; justify-content: flex-end; gap: 6px; width: min(232px, 58%); min-width: 0; flex: none; }
/* A number that is the only thing in its column fills it like every other
   control, keeping its digits right aligned. One paired with a slider keeps
   its own width, because there the narrow box is the point. */
.rico-widget .rico-row__ctl input[type=number] { width: 72px; max-width: 100%; min-width: 0; text-align: right; font-variant-numeric: tabular-nums; }
.rico-widget .rico-row__ctl > input[type=number]:only-child { width: 100%; }
.rico-widget .rico-row__ctl input[type=text] { width: 100%; min-width: 0; }
.rico-widget .rico-row__ctl .rico-select, .rico-widget .rico-row__ctl select { width: 100%; min-width: 0; max-width: 100%; }
.rico-widget .rico-opacity { min-width: 0; max-width: 100%; display: inline-flex; align-items: center; gap: 6px; }
.rico-widget .rico-opacity input[type=range] { width: 110px; min-width: 0; }
.rico-widget .rico-out { min-width: 36px; text-align: right; color: ${v('mut')}; font-variant-numeric: tabular-nums; }
.rico-widget .rico-row--block { flex-direction: column; align-items: stretch; gap: 4px; }
.rico-widget .rico-row--block > .rico-row__ctl { width: 100%; }
.rico-widget .rico-row--block > .rico-row__label { padding-top: 4px; }
.rico-widget .rico-row--block textarea { width: 100%; min-height: 56px; resize: vertical; }
.rico-widget .rico-row--off > .rico-row__label { color: ${v('faint')}; cursor: not-allowed; }
.rico-widget .rico-row input:disabled, .rico-widget .rico-row select:disabled { opacity: .45; pointer-events: none; }
/* Inline rows: the lead label, then each member's own label and control. The
   control column takes what the label leaves and wraps inside itself, so a
   narrow panel stacks the members rather than scrolling sideways. */
.rico-widget .rico-row--inline { flex-wrap: wrap; row-gap: 4px; }
.rico-widget .rico-row--inline > .rico-row__label { flex: 0 1 auto; }
.rico-widget .rico-row--inline > .rico-row__ctl { width: auto; flex: 1 1 0; min-width: min(100%, 150px); flex-wrap: wrap; row-gap: 4px; }
.rico-widget .rico-inline__item { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.rico-widget .rico-inline__label { color: ${v('mut')}; white-space: nowrap; cursor: pointer; }
.rico-widget .rico-inline__item--off > .rico-inline__label { color: ${v('faint')}; cursor: not-allowed; }
.rico-widget .rico-row--inline .rico-select, .rico-widget .rico-row--inline select { width: auto; }
.rico-widget .rico-row--inline input[type=text] { width: 96px; }

/* Tab lists: a rail down the left of a settings dialog, or a row above a form. */
.rico-widget .rico-tabs { min-width: 0; display: flex; gap: 2px; }
.rico-widget .rico-tabs--rail { flex-direction: column; min-width: 138px; padding: 2px 10px 2px 0; border-right: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-tabs--row { overflow-x: auto; flex: none; padding: 0 0 6px; margin-bottom: 6px; border-bottom: 1px solid ${v('bd-soft')}; }
.rico-widget .rico-tab { flex: none; display: flex; align-items: center; gap: 9px; height: 30px; padding: 0 10px; background: transparent;
  border: 1px solid transparent; border-radius: 7px; color: ${v('mut')}; text-align: left; white-space: nowrap; }
.rico-widget .rico-tab:hover { background: ${v('elev')}; color: ${v('tx')}; }
.rico-widget .rico-tab[aria-selected="true"] { background: ${v('on-bg')}; border-color: ${v('on-bd')}; color: ${v('acc-2')}; }
.rico-widget .rico-tabs--row .rico-tab { height: 28px; border-radius: 6px; }

/* Chart settings and indicator settings */
.rico-widget .rico-settings { width: 600px; }
.rico-widget .rico-settings__main { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0 12px; min-height: 0; }
.rico-widget .rico-settings__pane { min-width: 0; min-height: 0; padding: 2px 4px 4px 0; }
.rico-widget .rico-indset { width: 440px; }
.rico-widget .rico-indset__pane { min-width: 0; padding-right: 4px; }

/* Indicator picker */
.rico-widget .rico-pick { width: 380px; }
.rico-widget .rico-pick__findwrap { padding: 2px 0 8px; }
.rico-widget .rico-pick__find { width: 100%; }
.rico-widget .rico-pick__list { min-height: 0; display: grid; gap: 1px; align-content: start; }
.rico-widget .rico-pick__list > .rico-head { padding: 8px 8px 3px; }
.rico-widget .rico-pick__row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; background: transparent;
  border: 0; border-radius: 6px; color: ${v('tx')}; text-align: left; }
.rico-widget .rico-pick__row:hover, .rico-widget .rico-pick__row.is-active { background: ${v('elev-2')}; }
.rico-widget .rico-pick__name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rico-widget .rico-pick__count { color: ${v('acc-2')}; font-size: 11px; }

/* Level editor */
.rico-widget .rico-levels { width: 340px; min-width: 0; padding: 10px 12px 12px; gap: 6px; }
.rico-widget .rico-levels__head { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.rico-widget .rico-levels__title { flex: 1 1 auto; font-weight: 650; color: ${v('tx-strong')}; }
.rico-widget .rico-levels__labels { display: inline-flex; align-items: center; gap: 6px; color: ${v('mut')}; cursor: pointer; }
.rico-widget .rico-levels__rows { min-height: 0; overflow-y: auto; display: grid; gap: 3px; }
.rico-widget .rico-levels__row { display: grid; grid-template-columns: 15px minmax(48px, 74px) 26px minmax(0, 1fr) 24px; align-items: center; gap: 6px; min-height: 28px; }
.rico-widget .rico-levels__row input[type=number], .rico-widget .rico-levels__row input[type=text] { width: 100%; height: 26px; }
.rico-widget .rico-levels__row.is-off input:not([type=checkbox]) { opacity: .45; }
.rico-widget .rico-levels__x { width: 24px; height: 24px; display: grid; place-items: center; padding: 0; background: transparent;
  border: 0; border-radius: 5px; color: ${v('faint')}; }
.rico-widget .rico-levels__x:hover { background: ${v('elev-2')}; color: ${v('danger')}; }
/* A row's remove cross stays a size under the panel's close, so the two do not read as one control. */
.rico-widget .rico-levels__x > .rico-glyph > svg { width: 12px; height: 12px; }
.rico-widget .rico-levels__foot { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 4px; }
.rico-widget .rico-levels__foot .rico-spacer { flex: 1 1 auto; }

/* Inline text editor, laid over the painted text. */
.rico-widget .rico-textedit { position: absolute; z-index: 70; box-sizing: border-box; margin: 0; outline: none; padding: 4px;
  border: 1px solid ${v('acc')}; border-radius: 4px; background: color-mix(in srgb, ${v('bg')} 58%, transparent);
  box-shadow: 0 0 0 3px ${v('ring-soft')}; caret-color: ${v('acc-2')}; cursor: text; overflow: hidden; }

/* Drawing properties */
.rico-widget .rico-props { width: 340px; }
.rico-widget .rico-props__tools { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 0 10px 6px; }
.rico-widget .rico-props__tools .rico-sep { margin: 0 4px; }
.rico-widget .rico-props__pane { min-width: 0; padding-right: 4px; }
.rico-widget .rico-props__inline { display: inline-flex; align-items: center; gap: 6px; }

/* Context menu */
.rico-widget .rico-ctx { min-width: 220px; max-width: 320px; padding: 5px; }
.rico-widget .rico-ctx > .rico-head { padding: 6px 10px 2px; }
.rico-widget .rico-ctx__row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 5px 8px; background: transparent;
  border: 0; border-radius: 6px; color: ${v('tx')}; text-align: left; white-space: nowrap; }
.rico-widget .rico-ctx__row:hover, .rico-widget .rico-ctx__row:focus-visible { background: ${v('elev-2')}; outline: none; }
.rico-widget .rico-ctx__row:is(:hover, :focus-visible) :is(.rico-ctx__note, .rico-ctx__key) { color: ${v('mut')}; }
.rico-widget .rico-ctx__row[aria-disabled="true"] { color: ${v('faint')}; cursor: default; background: transparent; }
.rico-widget .rico-ctx__row.is-danger:not([aria-disabled="true"]):hover { color: ${v('danger')}; }
.rico-widget .rico-ctx__row[aria-checked="true"] { color: ${v('acc-2')}; }
.rico-widget .rico-ctx__mark { width: 16px; height: 16px; display: inline-grid; place-items: center; flex: none; color: ${v('mut')}; }
.rico-widget .rico-ctx__row[aria-checked="true"] .rico-ctx__mark { color: ${v('acc-2')}; }
.rico-widget .rico-ctx__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.rico-widget .rico-ctx__label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.rico-widget .rico-ctx__note { color: ${v('faint')}; font-size: 11px; }
.rico-widget .rico-ctx__key { margin-left: 8px; color: ${v('faint')}; }
.rico-widget .rico-ctx__hr { height: 1px; background: ${v('bd-soft')}; margin: 4px 6px; }

@container rico-widget (max-width: 720px) {
  .rico-widget .rico-settings__main { grid-template-columns: 1fr; }
  .rico-widget .rico-tabs--rail { flex-direction: row; overflow-x: auto; min-width: 0; padding: 0 0 6px; border-right: 0;
    border-bottom: 1px solid ${v('bd-soft')}; }
  .rico-widget .rico-dialog__foot { gap: 6px; }
  .rico-widget .rico-dialog__foot > .rico-spacer { display: none; }
  .rico-widget .rico-dialog__actions { margin-left: auto; }
}
`;
