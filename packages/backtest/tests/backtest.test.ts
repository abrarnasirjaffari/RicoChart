import { describe, expect, it } from 'vitest';
import type { ExecutionBar } from '@rico-chart/execution';
import { runBacktest } from '../src/index';

describe('No-Look-Ahead Backtester', () => {
  it('physically restricts history to closed bars <= t and fills signals strictly on bar t+1 open', () => {
    const bars: ExecutionBar[] = [
      { symbol: 'BTCUSDT', time: 1000, open: 100, high: 102, low: 99, close: 101 },
      { symbol: 'BTCUSDT', time: 1300, open: 105, high: 109, low: 104, close: 108 },
      { symbol: 'BTCUSDT', time: 1600, open: 112, high: 115, low: 111, close: 114 },
    ];

    const seenLengths: number[] = [];
    let bought = false;

    const result = runBacktest(
      bars,
      {
        name: 'causal-check',
        onBarClose(bar, ctx) {
          seenLengths.push(ctx.data.length());
          // Cannot access negative offset (future bar)
          expect(ctx.data.bar(-1)).toBeUndefined();
          expect(ctx.data.bar(0)?.time).toBe(bar.time);

          if (!bought && ctx.data.length() === 1) {
            bought = true;
            // Signal generated on bar 0 close (101) -> MUST fill on bar 1 open (105), NEVER at 101!
            ctx.submitOrder({ symbol: bar.symbol, side: 'buy', type: 'market', quantity: 2 });
          } else if (ctx.data.length() === 2) {
            // Exit signal on bar 1 close (108) -> MUST fill on bar 2 open (112)
            ctx.submitOrder({ symbol: bar.symbol, side: 'sell', type: 'market', quantity: 2, reduceOnly: true });
          }
        },
      },
      { initialCash: 10_000 },
    );

    expect(seenLengths).toEqual([1, 2, 3]);
    expect(result.fills).toHaveLength(2);
    expect(result.fills[0]!.price).toBe(105);
    expect(result.fills[0]!.time).toBe(1300);
    expect(result.fills[1]!.price).toBe(112);
    expect(result.fills[1]!.time).toBe(1600);
    expect(result.metrics.closedTrades).toBe(1);
    expect(result.metrics.winRatePct).toBe(100);
    expect(result.finalAccount.realizedPnl).toBeCloseTo(14, 6);
  });
});
