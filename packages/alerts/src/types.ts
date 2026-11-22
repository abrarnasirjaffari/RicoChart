import type { EventImpact, MacroEvent } from '@rico-chart/events';

export type WakePriority = 'low' | 'normal' | 'high' | 'critical';

/** Minimal market bar snapshot evaluated by the pure-code watchdog. */
export interface WatchBar {
  readonly symbol: string;
  readonly interval: string;
  /** UTC seconds. */
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume?: number;
}

export type WatchRuleCondition =
  | { readonly kind: 'price-cross-above'; readonly level: number }
  | { readonly kind: 'price-cross-below'; readonly level: number }
  | { readonly kind: 'zone-enter'; readonly low: number; readonly high: number }
  | { readonly kind: 'percent-move'; readonly thresholdPct: number }
  | { readonly kind: 'macro-event-countdown'; readonly leadSec: number; readonly minImpact: EventImpact; readonly region?: string };

export interface WatchRule {
  readonly id: string;
  readonly symbol: string;
  readonly label: string;
  readonly priority: WakePriority;
  readonly condition: WatchRuleCondition;
  /** Minimum seconds before the same rule can wake the consumer again. Default 300. */
  readonly cooldownSec?: number;
  /** Automatically disarm after firing once. Default false. */
  readonly once?: boolean;
  readonly enabled?: boolean;
}

/** Compact, structured event emitted when a rule fires — passed to wake AI or trigger alerts. */
export interface WakeUpEvent {
  readonly ruleId: string;
  readonly symbol: string;
  readonly label: string;
  readonly priority: WakePriority;
  readonly time: number;
  readonly reason: string;
  readonly price?: number;
  readonly macroEvent?: MacroEvent;
}
