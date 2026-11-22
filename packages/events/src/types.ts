/** Severity level for market news and scheduled macro/corporate events. */
export type EventImpact = 'low' | 'medium' | 'high';

/** High-level category for macro and corporate calendar events. */
export type MacroEventCategory =
  | 'central-bank'
  | 'inflation'
  | 'employment'
  | 'gdp'
  | 'earnings'
  | 'dividend'
  | 'split'
  | 'exchange-halt'
  | 'geopolitical'
  | 'other';

/** Structured news item consumed by NewsExplorer and chart news panels. */
export interface NewsItem {
  readonly id: string;
  readonly headline: string;
  readonly summary?: string;
  readonly source: string;
  /** UTC timestamp in seconds. */
  readonly time: number;
  readonly url?: string;
  readonly symbols: readonly string[];
  readonly impact: EventImpact;
  readonly category?: string;
  /** Optional normalized sentiment in [-1, 1]. */
  readonly sentiment?: number;
}

/** Query filter for searching the NewsExplorer store. */
export interface NewsFilter {
  readonly symbol?: string;
  readonly minImpact?: EventImpact;
  readonly category?: string;
  readonly query?: string;
  /** Inclusive UTC seconds lower bound. */
  readonly from?: number;
  /** Inclusive UTC seconds upper bound. */
  readonly to?: number;
  readonly limit?: number;
}

/** Scheduled macro or corporate event (e.g., FOMC meeting, CPI release, earnings call). */
export interface MacroEvent {
  readonly id: string;
  readonly title: string;
  readonly category: MacroEventCategory;
  readonly impact: EventImpact;
  /** Scheduled UTC timestamp in seconds. */
  readonly time: number;
  /** Currency, country, or exchange scope (e.g., 'USD', 'PKR', 'KRW', 'GLOBAL'). */
  readonly region: string;
  /** Specific affected symbols; empty means broad/macro event for the region. */
  readonly symbols?: readonly string[];
  readonly forecast?: string;
  readonly previous?: string;
  readonly actual?: string;
  /** Minutes before the event to begin trading blackout / wake-up countdown. */
  readonly blackoutBeforeMinutes?: number;
  /** Minutes after the event to keep trading blackout active. */
  readonly blackoutAfterMinutes?: number;
}

/** Result of evaluating whether a symbol is inside a macro-event blackout window. */
export interface BlackoutStatus {
  readonly active: boolean;
  readonly event: MacroEvent | null;
  /** Seconds until the blackout window ends (0 when inactive). */
  readonly remainingSec: number;
}

/** Chart-ready timeline marker shape compatible with RicoChart event markers. */
export interface ChartEventMarker {
  readonly id: string;
  readonly time: number;
  readonly title: string;
  readonly category: MacroEventCategory;
  readonly impact: EventImpact;
  readonly region: string;
  readonly summary: string;
}

const IMPACT_RANK: Record<EventImpact, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function impactRank(impact: EventImpact): number {
  return IMPACT_RANK[impact];
}
