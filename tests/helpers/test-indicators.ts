/**
 * Minimal test-only indicator fixtures registered into the base registry.
 * The production library ships zero built-in indicators; these lightweight
 * descriptors exist strictly so core/widget/alerts/replay/export tests can
 * exercise study panes, serialization, alerts, and overlays.
 */
import {
  registerIndicator,
  sourceValues,
  type IndicatorDescriptor,
  type IndicatorSettings,
  type IndicatorSource,
  type IndicatorStudySource,
  type Bar,
} from '../../src/index';

const int = (s: IndicatorSettings, key: string, fallback: number): number => {
  const v = s[key];
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 ? Math.floor(v) : fallback;
};

const src = (s: IndicatorSettings): IndicatorSource | IndicatorStudySource =>
  (s.source as IndicatorSource | IndicatorStudySource | undefined) ?? 'close';

function rollingMean(values: readonly (number | null)[], length: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  let valid = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== null && v !== undefined && Number.isFinite(v)) {
      sum += v;
      valid++;
    } else {
      sum = 0;
      valid = 0;
      continue;
    }
    if (valid > length) {
      const old = values[i - length];
      if (old !== null && old !== undefined && Number.isFinite(old)) {
        sum -= old;
        valid--;
      }
    }
    if (valid === length) out[i] = sum / length;
  }
  return out;
}

function expMean(values: readonly (number | null)[], length: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  const k = 2 / (length + 1);
  let prev = NaN;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === undefined || !Number.isFinite(v)) {
      prev = NaN;
      continue;
    }
    prev = Number.isNaN(prev) ? v : v * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function simpleRsi(values: readonly (number | null)[], length: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let avgGain = 0;
  let avgLoss = 0;
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    const curr = values[i];
    const prev = values[i - 1];
    if (curr === null || curr === undefined || prev === null || prev === undefined || !Number.isFinite(curr) || !Number.isFinite(prev)) continue;
    const diff = curr - prev;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    count++;
    if (count < length) {
      avgGain += gain;
      avgLoss += loss;
    } else if (count === length) {
      avgGain = (avgGain + gain) / length;
      avgLoss = (avgLoss + loss) / length;
      out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    } else {
      avgGain = (avgGain * (length - 1) + gain) / length;
      avgLoss = (avgLoss * (length - 1) + loss) / length;
      out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
  }
  return out;
}

export const SMA: IndicatorDescriptor = {
  id: 'sma',
  name: 'SMA',
  category: 'Trend',
  placement: 'onchart',
  inputs: [
    { key: 'length', type: 'number', label: 'Length', default: 20, min: 1, max: 500, step: 1 },
    { key: 'source', type: 'source', label: 'Source', default: 'close', allowStudyOutputs: true },
    { key: 'timeframe', type: 'interval', label: 'Timeframe', default: '' },
    { key: 'color', type: 'color', label: 'Color', default: '#2962ff' },
  ],
  plots: [{ key: 'ma', type: 'line', title: 'SMA', colorKey: 'color', style: { lineWidth: 1.5 } }],
  calc: (bars, s, ctx) => ({
    ma: rollingMean(sourceValues(bars, src(s), ctx), int(s, 'length', 20)),
  }),
};

export const EMA: IndicatorDescriptor = {
  id: 'ema',
  name: 'EMA',
  category: 'Trend',
  placement: 'onchart',
  inputs: [
    { key: 'length', type: 'number', label: 'Length', default: 20, min: 1, max: 500, step: 1 },
    { key: 'source', type: 'source', label: 'Source', default: 'close', allowStudyOutputs: true },
    { key: 'timeframe', type: 'interval', label: 'Timeframe', default: '' },
    { key: 'color', type: 'color', label: 'Color', default: '#ff9800' },
  ],
  plots: [{ key: 'ma', type: 'line', title: 'EMA', colorKey: 'color', style: { lineWidth: 1.5 } }],
  calc: (bars, s, ctx) => ({
    ma: expMean(sourceValues(bars, src(s), ctx), int(s, 'length', 20)),
  }),
};

export const RSI: IndicatorDescriptor = {
  id: 'rsi',
  name: 'RSI',
  category: 'Momentum',
  placement: 'pane',
  inputs: [
    { key: 'length', type: 'number', label: 'Length', default: 14, min: 1, max: 200, step: 1 },
    { key: 'source', type: 'source', label: 'Source', default: 'close', allowStudyOutputs: true },
    { key: 'timeframe', type: 'interval', label: 'Timeframe', default: '' },
    { key: 'color', type: 'color', label: 'Color', default: '#7e57c2' },
  ],
  plots: [{ key: 'rsi', type: 'line', title: 'RSI', colorKey: 'color', style: { lineWidth: 1.5 } }],
  levels: () => [
    { price: 70, color: '#ef5350', title: 'OB', dashed: true },
    { price: 30, color: '#26a69a', title: 'OS', dashed: true },
  ],
  range: () => ({ min: 0, max: 100 }),
  calc: (bars, s, ctx) => ({
    rsi: simpleRsi(sourceValues(bars, src(s), ctx), int(s, 'length', 14)),
  }),
};

export const MACD: IndicatorDescriptor = {
  id: 'macd',
  name: 'MACD',
  category: 'Momentum',
  placement: 'pane',
  inputs: [
    { key: 'fastPeriod', type: 'number', label: 'Fast', default: 12, min: 1, max: 200, step: 1 },
    { key: 'slowPeriod', type: 'number', label: 'Slow', default: 26, min: 1, max: 200, step: 1 },
    { key: 'signalPeriod', type: 'number', label: 'Signal', default: 9, min: 1, max: 200, step: 1 },
    { key: 'source', type: 'source', label: 'Source', default: 'close', allowStudyOutputs: true },
  ],
  plots: [
    { key: 'histogram', type: 'histogram', title: 'Histogram', style: { color: '#26a69a' } },
    { key: 'macd', type: 'line', title: 'MACD', style: { color: '#2962ff', lineWidth: 1.5 } },
    { key: 'signal', type: 'line', title: 'Signal', style: { color: '#ff6d00', lineWidth: 1.5 } },
  ],
  levels: () => [{ price: 0, color: '#787b86', title: 'Zero', dashed: true }],
  calc: (bars, s, ctx) => {
    const vals = sourceValues(bars, src(s), ctx);
    const fast = expMean(vals, int(s, 'fastPeriod', 12));
    const slow = expMean(vals, int(s, 'slowPeriod', 26));
    const macd = vals.map((_, i) => (fast[i] !== null && slow[i] !== null ? fast[i]! - slow[i]! : null));
    const signal = expMean(macd.map((v) => v ?? NaN), int(s, 'signalPeriod', 9));
    const histogram = macd.map((v, i) => (v !== null && signal[i] !== null ? v - signal[i]! : null));
    return { macd, signal, histogram };
  },
};

export const CCI: IndicatorDescriptor = {
  id: 'cci',
  name: 'CCI',
  category: 'Momentum',
  placement: 'pane',
  inputs: [{ key: 'length', type: 'number', label: 'Length', default: 20, min: 1, max: 200, step: 1 }],
  plots: [{ key: 'cci', type: 'line', title: 'CCI', style: { color: '#2962ff', lineWidth: 1.5 } }],
  calc: (bars, s) => {
    const len = int(s, 'length', 20);
    const tp = bars.map((b) => (b.high + b.low + b.close) / 3);
    const mean = rollingMean(tp, len);
    return { cci: tp.map((v, i) => (mean[i] === null ? null : (v - mean[i]!) * 10)) };
  },
};

export const BOLLINGER: IndicatorDescriptor = {
  id: 'bollinger',
  name: 'Bollinger Bands',
  category: 'Volatility',
  placement: 'onchart',
  inputs: [
    { key: 'length', type: 'number', label: 'Length', default: 20, min: 1, max: 500, step: 1 },
    { key: 'stdDev', type: 'number', label: 'StdDev', default: 2, min: 0.1, max: 10, step: 0.1 },
  ],
  plots: [
    { key: 'upper', type: 'line', title: 'Upper', style: { color: '#2962ff', lineWidth: 1 } },
    { key: 'middle', type: 'line', title: 'Middle', style: { color: '#ff6d00', lineWidth: 1 } },
    { key: 'lower', type: 'line', title: 'Lower', style: { color: '#2962ff', lineWidth: 1 } },
  ],
  calc: (bars, s) => {
    const len = int(s, 'length', 20);
    const mult = typeof s.stdDev === 'number' ? s.stdDev : 2;
    const closes = bars.map((b) => b.close);
    const middle = rollingMean(closes, len);
    const upper: (number | null)[] = new Array(bars.length).fill(null);
    const lower: (number | null)[] = new Array(bars.length).fill(null);
    for (let i = len - 1; i < bars.length; i++) {
      const m = middle[i];
      if (m === null) continue;
      let variance = 0;
      for (let j = i - len + 1; j <= i; j++) variance += (closes[j]! - m) ** 2;
      const sd = Math.sqrt(variance / len);
      upper[i] = m + mult * sd;
      lower[i] = m - mult * sd;
    }
    return { upper, middle, lower };
  },
};

export const SUPERTREND: IndicatorDescriptor = {
  id: 'supertrend',
  name: 'Supertrend',
  category: 'Trend',
  placement: 'onchart',
  inputs: [{ key: 'period', type: 'number', label: 'Period', default: 10, min: 1, max: 200, step: 1 }],
  plots: [
    { key: 'up', type: 'line', title: 'Up', style: { color: '#26a69a', lineWidth: 1.5 } },
    { key: 'down', type: 'line', title: 'Down', style: { color: '#ef5350', lineWidth: 1.5 } },
  ],
  calc: (bars, s) => {
    const p = int(s, 'period', 10);
    const ma = rollingMean(bars.map((b) => b.close), p);
    return {
      up: bars.map((b, i) => (ma[i] !== null && b.close >= ma[i]! ? b.low : null)),
      down: bars.map((b, i) => (ma[i] !== null && b.close < ma[i]! ? b.high : null)),
    };
  },
};

export const DONCHIAN: IndicatorDescriptor = {
  id: 'donchian',
  name: 'Donchian Channels',
  category: 'Volatility',
  placement: 'onchart',
  inputs: [{ key: 'length', type: 'number', label: 'Length', default: 20, min: 1, max: 500, step: 1 }],
  plots: [
    { key: 'upper', type: 'line', title: 'Upper', style: { color: '#2962ff' } },
    { key: 'lower', type: 'line', title: 'Lower', style: { color: '#2962ff' } },
  ],
  calc: (bars, s) => {
    const len = int(s, 'length', 20);
    const upper: (number | null)[] = new Array(bars.length).fill(null);
    const lower: (number | null)[] = new Array(bars.length).fill(null);
    for (let i = len - 1; i < bars.length; i++) {
      let hi = -Infinity;
      let lo = Infinity;
      for (let j = i - len + 1; j <= i; j++) {
        if (bars[j]!.high > hi) hi = bars[j]!.high;
        if (bars[j]!.low < lo) lo = bars[j]!.low;
      }
      upper[i] = hi;
      lower[i] = lo;
    }
    return { upper, lower };
  },
};

export const VWAP: IndicatorDescriptor = {
  id: 'vwap',
  name: 'VWAP',
  category: 'Volume',
  placement: 'onchart',
  inputs: [],
  plots: [{ key: 'vwap', type: 'line', title: 'VWAP', style: { color: '#2962ff', lineWidth: 1.5 } }],
  calc: (bars) => {
    let pv = 0;
    let vol = 0;
    return {
      vwap: bars.map((b: Bar) => {
        const v = b.volume ?? 1;
        pv += ((b.high + b.low + b.close) / 3) * v;
        vol += v;
        return vol > 0 ? pv / vol : null;
      }),
    };
  },
};

export const OBV: IndicatorDescriptor = {
  id: 'obv',
  name: 'OBV',
  category: 'Volume',
  placement: 'pane',
  inputs: [],
  plots: [{ key: 'obv', type: 'line', title: 'OBV', style: { color: '#2962ff', lineWidth: 1.5 } }],
  calc: (bars) => {
    let acc = 0;
    return {
      obv: bars.map((b, i) => {
        const v = b.volume ?? 0;
        if (i > 0) {
          if (b.close > bars[i - 1]!.close) acc += v;
          else if (b.close < bars[i - 1]!.close) acc -= v;
        }
        return acc;
      }),
    };
  },
};

export const VOLUME: IndicatorDescriptor = {
  id: 'volume',
  name: 'Volume',
  category: 'Volume',
  placement: 'pane',
  inputs: [],
  plots: [{ key: 'volume', type: 'histogram', title: 'Volume', style: { color: '#26a69a' } }],
  calc: (bars) => ({ volume: bars.map((b) => b.volume ?? 0) }),
};

export const ADX: IndicatorDescriptor = {
  id: 'adx',
  name: 'ADX',
  category: 'Momentum',
  placement: 'pane',
  inputs: [{ key: 'length', type: 'number', label: 'Length', default: 14, min: 1, max: 200, step: 1 }],
  plots: [{ key: 'adx', type: 'line', title: 'ADX', style: { color: '#ff5252' } }],
  calc: (bars, s) => ({ adx: rollingMean(bars.map((b) => b.high - b.low), int(s, 'length', 14)) }),
};

export const STOCHASTIC: IndicatorDescriptor = {
  id: 'stochastic',
  name: 'Stochastic',
  category: 'Momentum',
  placement: 'pane',
  inputs: [{ key: 'length', type: 'number', label: 'Length', default: 14, min: 1, max: 200, step: 1 }],
  plots: [
    { key: 'k', type: 'line', title: '%K', style: { color: '#2962ff' } },
    { key: 'd', type: 'line', title: '%D', style: { color: '#ff6d00' } },
  ],
  calc: (bars, s) => {
    const k = simpleRsi(bars.map((b) => b.close), int(s, 'length', 14));
    const d = rollingMean(k.map((v) => v ?? NaN), 3);
    return { k, d };
  },
};

export const ATR: IndicatorDescriptor = {
  id: 'atr',
  name: 'ATR',
  category: 'Volatility',
  placement: 'pane',
  inputs: [{ key: 'period', type: 'number', label: 'Period', default: 14, min: 1, max: 200, step: 1 }],
  plots: [{ key: 'atr', type: 'line', title: 'ATR', style: { color: '#b71c1c' } }],
  calc: (bars, s) => ({ atr: rollingMean(bars.map((b) => b.high - b.low), int(s, 'period', 14)) }),
};

export const SEASONALITY: IndicatorDescriptor = {
  id: 'seasonality',
  name: 'Seasonality',
  category: 'Statistics',
  placement: 'pane',
  inputs: [],
  plots: [{ key: 'value', type: 'line', title: 'Seasonality', style: { color: '#2962ff' } }],
  calc: (bars) => ({ value: bars.map((b) => b.close) }),
};

export const TEST_INDICATORS: readonly IndicatorDescriptor[] = [
  SMA, EMA, RSI, MACD, CCI, BOLLINGER, SUPERTREND, DONCHIAN, VWAP, OBV, VOLUME, ADX, STOCHASTIC, ATR, SEASONALITY,
];

let registered = false;
export function registerTestIndicators(): void {
  if (registered) return;
  registered = true;
  for (const descriptor of TEST_INDICATORS) registerIndicator(descriptor);
}

registerTestIndicators();
