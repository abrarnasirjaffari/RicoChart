import { describe, expect, it } from 'vitest';
import { PaperTradingEngine } from '../src/index';

describe('PaperTradingEngine', () => {
  it('streams live bars, logs fills in the journal, and emits chart overlays', () => {
    const paper = new PaperTradingEngine({ initialCash: 25_000, feeBps: 5 });
    const received: number[] = [];
    paper.subscribe((ev) => received.push(ev.overlays.length));

    paper.submitOrder({
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'market',
      quantity: 1,
      stopLoss: 90_000,
      takeProfit: 100_000,
    }, 1000, 'Live paper breakout test');

    const fills = paper.onLiveBar({ symbol: 'BTCUSDT', time: 1300, open: 94_000, high: 95_000, low: 93_500, close: 94_800 });
    expect(fills).toHaveLength(1);
    expect(paper.journal()).toHaveLength(1);
    expect(paper.journal()[0]!.note).toBe('Live paper breakout test');

    const overlays = paper.chartOverlays('BTCUSDT');
    // 1 open position + 1 SL stop order + 1 TP limit order
    expect(overlays).toHaveLength(3);
    expect(received).toEqual([3]);
  });
});
