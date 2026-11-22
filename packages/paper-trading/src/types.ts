import type { AccountSnapshot, ExecutionConfig, Fill, Order } from '@rico-chart/execution';

export interface PaperTradingConfig extends ExecutionConfig {
  readonly accountName?: string;
}

export interface PaperJournalEntry {
  readonly fill: Fill;
  readonly equityAfter: number;
  readonly note?: string;
}

/** Price-line overlay descriptor ready to render onto RicoChart. */
export interface ChartOrderOverlay {
  readonly id: string;
  readonly symbol: string;
  readonly kind: 'position' | 'limit-order' | 'stop-order';
  readonly price: number;
  readonly label: string;
  readonly color: string;
}

export type PaperEventListener = (event: {
  readonly fills: readonly Fill[];
  readonly account: AccountSnapshot;
  readonly overlays: readonly ChartOrderOverlay[];
}) => void;

export interface PaperOrderView {
  readonly order: Order;
}
