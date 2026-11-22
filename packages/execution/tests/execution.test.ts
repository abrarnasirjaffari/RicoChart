import { describe, expect, it } from 'vitest';
import { ExecutionEngine, calculatePositionSize } from '../src/index';

describe('ExecutionEngine (pure-code, zero AI)', () => {
  it('fills a bracket order and automatically cancels OCO sibling on take-profit hit', () => {
    const engine = new ExecutionEngine({ initialCash: 10_000, feeBps: 10 });
    const qty = calculatePositionSize(10_000, 1, 100, 95); // $100 risk / $5 stop = 20 units
    expect(qty).toBe(20);

    const entry = engine.submitOrder({
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'market',
      quantity: qty,
      stopLoss: 95,
      takeProfit: 110,
      tag: 'breakout',
    }, 1000);
    expect(entry.status).toBe('working');

    // Next bar opens at 100 -> entry fills, SL (95) and TP (110) OCO children spawn
    const fills1 = engine.processBar({ symbol: 'BTCUSDT', time: 1300, open: 100, high: 104, low: 98, close: 103 });
    expect(fills1).toHaveLength(1);
    expect(fills1[0]!.price).toBe(100);
    expect(engine.snapshot().workingOrders).toHaveLength(2);

    // Following bar hits 112 -> TP fills at 110, SL sibling automatically cancelled
    const fills2 = engine.processBar({ symbol: 'BTCUSDT', time: 1600, open: 103, high: 112, low: 102, close: 111 });
    expect(fills2).toHaveLength(1);
    expect(fills2[0]!.price).toBe(110);
    expect(fills2[0]!.realizedPnl).toBeCloseTo(200, 6);

    const snap = engine.snapshot();
    expect(snap.openPositions).toHaveLength(0);
    expect(snap.workingOrders).toHaveLength(0);
    expect(snap.realizedPnl).toBeCloseTo(200, 6);
    expect(snap.totalFees).toBeGreaterThan(0);
  });

  it('blocks new entries during a macro blackout window while still allowing reduce-only exits', () => {
    const engine = new ExecutionEngine({
      initialCash: 10_000,
      risk: {
        isBlackout: (_sym, t) => t >= 2000 && t <= 2600,
      },
    });

    const blocked = engine.submitOrder({ symbol: 'BTCUSDT', side: 'buy', type: 'market', quantity: 1 }, 2100);
    expect(blocked.status).toBe('rejected');
    expect(blocked.rejectReason).toContain('blackout');

    const exitAllowed = engine.submitOrder({ symbol: 'BTCUSDT', side: 'sell', type: 'market', quantity: 1, reduceOnly: true }, 2100);
    expect(exitAllowed.status).toBe('working');
  });
});
