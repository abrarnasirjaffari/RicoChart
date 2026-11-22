import { describe, it, expect, beforeAll } from 'vitest';
import { Chart } from '../src/core/chart';
import type { CrosshairMoveEvent } from '../src/core/chart-types';
import { fakeDocument, pointer, type FakeElement } from './helpers/fake-dom';
import type { Bar } from '../src/model/bar';

beforeAll(() => {
  const g = globalThis as unknown as { window?: unknown };
  g.window ??= {};
});

function walk(n = 80): Bar[] {
  let seed = 7;
  const rand = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const out: Bar[] = [];
  let close = 1500;
  for (let i = 0; i < n; i++) {
    const open = close;
    close = Math.round((open + (rand() - 0.5) * 12) * 100) / 100;
    const high = Math.max(open, close) + rand() * 4, low = Math.min(open, close) - rand() * 4;
    out.push({ time: 1735699500 + i * 300, open, high, low, close, volume: 1000 + Math.round(rand() * 900) });
  }
  return out;
}

function makeChart(): { chart: Chart; el: FakeElement } {
  const el = fakeDocument().createElement('div') as unknown as FakeElement;
  const chart = new Chart(el, {
    document: fakeDocument(), pixelRatio: () => 1, shortcuts: false,
    raf: { schedule: (cb: () => void) => { cb(); return 1; }, cancel: () => {} },
  });
  chart.applySize(800, 600);
  chart.addSeries('candlestick').setData(walk());
  return { chart, el };
}

function click(el: FakeElement, at: { x: number; y: number }): void {
  el.dispatch('pointerdown', pointer('down', at.x, at.y));
  el.dispatch('pointerup', pointer('up', at.x, at.y));
}

function drag(el: FakeElement, at: { x: number; y: number }, dy: number): void {
  el.dispatch('pointerdown', pointer('down', at.x, at.y));
  el.dispatch('pointermove', pointer('move', at.x, at.y + dy / 2));
  el.dispatch('pointermove', pointer('move', at.x, at.y + dy));
  el.dispatch('pointerup', pointer('up', at.x, at.y + dy));
}

describe('host subscriptions', () => {
  it('two host click subscriptions both hear a click, and each unsubscribes alone', () => {
    const { chart, el } = makeChart();
    chart.addPriceLine({ price: 1490, color: '#4f8cff', lineWidth: 1, dashed: false, id: 'lvl' });
    const a: string[] = [], b: string[] = [];
    const offA = chart.subscribeClick((id) => a.push(id));
    chart.subscribeClick((id) => b.push(id));
    const at = { x: 60, y: chart.priceToCoordinate(1490) as number };

    click(el, at);
    offA();
    click(el, at);

    expect(a).toEqual(['lvl']);
    expect(b).toEqual(['lvl', 'lvl']);
  });

  it('an unsubscribed drag leaves a plain price line to pan the chart again', () => {
    const { chart, el } = makeChart();
    const offDrag = chart.subscribeDrag(() => {});
    const line = chart.addPriceLine({ price: 1480, color: '#4f8cff', lineWidth: 1, dashed: false, id: 'level', cursor: 'ns-resize' });
    expect(line).toBeDefined();
    const ends: string[] = [];
    chart.on('drag:end', (e) => ends.push(e.id));
    const at = { x: 60, y: chart.priceToCoordinate(1480) as number };

    drag(el, at, 20);
    offDrag();
    drag(el, at, 20);

    expect(ends).toEqual(['level']);
  });

  it('two crosshair subscriptions both follow the pointer, and each unsubscribes alone', () => {
    const { chart, el } = makeChart();
    const a: (number | null)[] = [], b: (number | null)[] = [];
    const offA = chart.subscribeCrosshairMove((e: CrosshairMoveEvent) => a.push(e.index));
    chart.subscribeCrosshairMove((e: CrosshairMoveEvent) => b.push(e.index));

    el.dispatch('pointermove', pointer('move', 300, 200, { buttons: 0 }));
    offA();
    el.dispatch('pointermove', pointer('move', 340, 200, { buttons: 0 }));

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(2);
    expect(b[0]).toBe(a[0]);
  });
});
