export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop';
export type OrderStatus = 'working' | 'filled' | 'cancelled' | 'rejected';

/** OHLC bar snapshot consumed by the pure-code fill engine. */
export interface ExecutionBar {
  readonly symbol: string;
  /** UTC timestamp in seconds. */
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume?: number;
}

/** Order submitted to the pure-code ExecutionEngine. */
export interface OrderRequest {
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: number;
  /** Required for `limit` orders. */
  readonly limitPrice?: number;
  /** Required for `stop` orders. */
  readonly stopPrice?: number;
  /** Optional protective stop-loss attached automatically on fill (OCO with takeProfit). */
  readonly stopLoss?: number;
  /** Optional take-profit target attached automatically on fill (OCO with stopLoss). */
  readonly takeProfit?: number;
  /** Reduce-only flag (closing/protective exits bypass new-position risk caps). */
  readonly reduceOnly?: boolean;
  /** Optional client tag or strategy label. */
  readonly tag?: string;
}

export interface Order {
  readonly id: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: number;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly stopLoss?: number;
  readonly takeProfit?: number;
  readonly reduceOnly: boolean;
  readonly ocoGroupId?: string;
  readonly tag?: string;
  readonly createdAt: number;
  status: OrderStatus;
  rejectReason?: string;
}

export interface Fill {
  readonly id: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly quantity: number;
  readonly price: number;
  readonly fee: number;
  readonly time: number;
  readonly realizedPnl: number;
  readonly tag?: string;
}

export interface Position {
  readonly symbol: string;
  /** Signed quantity: > 0 for long, < 0 for short. */
  quantity: number;
  avgEntryPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  lastPrice: number;
}

export interface RiskConfig {
  /** Max open distinct symbol positions allowed simultaneously. Default Infinity. */
  readonly maxOpenPositions?: number;
  /** Max percent drawdown from peak equity before kill-switch blocks new entries (e.g., 10 = 10%). */
  readonly maxDrawdownPct?: number;
  /** Optional external blackout check (e.g., macro event blackout window). */
  readonly isBlackout?: (symbol: string, timeSec: number) => boolean;
}

export interface ExecutionConfig {
  readonly initialCash: number;
  /** Commission rate in basis points (10 = 0.10%). Default 0. */
  readonly feeBps?: number;
  /** Slippage in basis points applied adversarially on market/stop fills. Default 0. */
  readonly slippageBps?: number;
  readonly risk?: RiskConfig;
}

export interface AccountSnapshot {
  readonly cash: number;
  readonly equity: number;
  readonly peakEquity: number;
  readonly drawdownPct: number;
  readonly realizedPnl: number;
  readonly unrealizedPnl: number;
  readonly totalFees: number;
  readonly killSwitchActive: boolean;
  readonly openPositions: readonly Position[];
  readonly workingOrders: readonly Order[];
}
