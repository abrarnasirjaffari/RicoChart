import { describe, it, expect } from 'vitest';
import { Chart } from '../src/core/chart';
import { RecordingContext } from './helpers/fake-ctx';

// Minimal DOM good enough to construct a Chart headlessly.
function recordingDoc(): Document {
  const make = (tag: string): Record<string, unknown> => {
    const el: Record<string, unknown> = {
      tagName: tag.toUpperCase(), style: {}, children: [],
      appendChild(c: unknown) { (el.children as unknown[]).push(c); return c; },
      remove() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      addEventListener() {}, removeEventListener() {},
      setAttribute() {}, getAttribute: () => null, hasAttribute: () => false,
    };
    if (tag === 'canvas') {
      el.width = 0; el.height = 0;
      const rec = new RecordingContext();
      el.__rec = rec;
      el.getContext = () => rec as unknown as CanvasRenderingContext2D;
    }
    return el;
  };
  return { createElement: (t: string) => make(t) } as unknown as Document;
}

function makeChart(): Chart {
  const doc = recordingDoc();
  const container = doc.createElement('div') as unknown as Record<string, unknown>;
  container.clientWidth = 800; container.clientHeight = 600;
  return new Chart(container as unknown as HTMLElement, {
    document: doc, pixelRatio: () => 1, raf: { schedule: () => 0, cancel: () => {} },
  });
}

describe('unified event bus', () => {
  it('on() delivers emitted payloads and returns an unsubscribe', () => {
    const chart = makeChart();
    const seen: unknown[] = [];
    const off = chart.on('custom', (p) => seen.push(p));
    chart.emit('custom', { a: 1 });
    chart.emit('custom', { a: 2 });
    off();
    chart.emit('custom', { a: 3 });
    expect(seen).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('once() fires exactly one time', () => {
    const chart = makeChart();
    let count = 0;
    chart.once('tick', () => { count += 1; });
    chart.emit('tick', null);
    chart.emit('tick', null);
    expect(count).toBe(1);
  });

  it('off(event) drops every listener for that event', () => {
    const chart = makeChart();
    let hits = 0;
    chart.on('x', () => { hits += 1; });
    chart.on('x', () => { hits += 1; });
    chart.off('x');
    chart.emit('x', null);
    expect(hits).toBe(0);
  });

  it('a throwing listener does not stop the others', () => {
    const chart = makeChart();
    let reached = false;
    chart.on('boom', () => { throw new Error('nope'); });
    chart.on('boom', () => { reached = true; });
    expect(() => chart.emit('boom', null)).not.toThrow();
    expect(reached).toBe(true);
  });

  it('emits resize when the chart is resized', () => {
    const chart = makeChart();
    const sizes: Array<{ width: number; height: number }> = [];
    chart.on('resize', (p) => sizes.push(p as { width: number; height: number }));
    chart.applySize(1024, 600);
    chart.applySize(1024, 600); // no-op: same size, must not re-emit
    expect(sizes).toEqual([{ width: 1024, height: 600 }]);
  });

  it('emits ready on a microtask after construction', async () => {
    const chart = makeChart();
    let ready = false;
    chart.on('ready', () => { ready = true; });
    expect(ready).toBe(false);       // not synchronous
    await Promise.resolve();          // flush the microtask queue
    expect(ready).toBe(true);
  });
});
