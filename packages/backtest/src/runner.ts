import {
  ExecutionEngine,
  type AccountSnapshot,
  type ExecutionBar,
  type ExecutionConfig,
  type Fill,
  type Order,
  type OrderRequest,
} from '@rico-chart/execution';
import { SimulatedClock, type ReadonlyClock } from './clock';
import { PointInTimeFeed, type PointInTimeView } from './feed';
import { computeMetrics, type BacktestMetrics, type EquityPoint } from './metrics';

export interface StrategyContext {
  readonly clock: ReadonlyClock;
  readonly data: PointInTimeView;
  readonly account: () => AccountSnapshot;
  readonly submitOrder: (req: OrderRequest) => Order;
  readonly cancelOrder: (orderId: string) => boolean;
  readonly cancelAll: (symbol?: string) => number;
}

export interface BacktestStrategy {
  readonly name: string;
  /** Called strictly AFTER bar `i` closes. Any order submitted here can only fill on bar `i + 1` or later. */
  onBarClose(bar: ExecutionBar, ctx: StrategyContext): void;
}

export interface BacktestResult {
  readonly strategy: string;
  readonly barsProcessed: number;
  readonly fills: readonly Fill[];
  readonly equityCurve: readonly EquityPoint[];
  readonly finalAccount: AccountSnapshot;
  readonly metrics: BacktestMetrics;
}

/**
 * Strictly No-Look-Ahead Causal Backtest Runner.
 * Bar lifecycle on each bar `i`:
 *   1. Advance `SimulatedClock` to `bar.time` and expose bar `i` via `PointInTimeFeed`.
 *   2. Process previously submitted working orders against bar `i` (fills occur via `@rico-chart/execution`).
 *   3. Record mark-to-market equity point.
 *   4. Invoke `strategy.onBarClose(bar, ctx)` — orders submitted now sit working until bar `i + 1`!
 */
export function runBacktest(
  bars: readonly ExecutionBar[],
  strategy: BacktestStrategy,
  executionConfig: ExecutionConfig,
): BacktestResult {
  const feed = new PointInTimeFeed(bars);
  const clock = new SimulatedClock(bars[0]?.time ?? 0);
  const engine = new ExecutionEngine(executionConfig);
  const equityCurve: EquityPoint[] = [];

  const ctx: StrategyContext = {
    clock,
    data: feed,
    account: () => engine.snapshot(),
    submitOrder: (req) => engine.submitOrder(req, clock.now()),
    cancelOrder: (id) => engine.cancelOrder(id),
    cancelAll: (symbol) => engine.cancelAll(symbol),
  };

  for (let i = 0; i < feed.totalBars(); i++) {
    const bar = feed.advanceToIndex(i);
    clock.advanceTo(bar.time);

    // Step 1: Execute any orders submitted on earlier bars against this bar
    engine.processBar(bar);

    // Step 2: Record causal equity point
    const snap = engine.snapshot();
    equityCurve.push({
      time: bar.time,
      equity: snap.equity,
      drawdownPct: snap.drawdownPct,
    });

    // Step 3: Strategy observes closed bar `i` ONLY — new orders wait for bar `i + 1`
    strategy.onBarClose(bar, ctx);
  }

  const finalAccount = engine.snapshot();
  const fills = engine.fills();

  return {
    strategy: strategy.name,
    barsProcessed: feed.totalBars(),
    fills,
    equityCurve,
    finalAccount,
    metrics: computeMetrics(executionConfig.initialCash, equityCurve, fills),
  };
}
