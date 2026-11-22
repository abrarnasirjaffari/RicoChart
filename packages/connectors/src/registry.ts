import type { ConnectorBar, HistoryQuery, InstrumentDescriptor, MarketConnector } from './types';

/** Registry mapping exchange codes (e.g. PSX, KRX, SPOT, FX) to plug-in MarketConnector instances. */
export class ConnectorRegistry {
  private readonly _byId = new Map<string, MarketConnector>();
  private readonly _byExchange = new Map<string, MarketConnector>();

  public register(connector: MarketConnector): void {
    this._byId.set(connector.id, connector);
    for (const ex of connector.exchanges) {
      this._byExchange.set(ex.toUpperCase(), connector);
    }
  }

  public unregister(id: string): boolean {
    const existing = this._byId.get(id);
    if (!existing) return false;
    this._byId.delete(id);
    for (const [ex, conn] of this._byExchange.entries()) {
      if (conn.id === id) this._byExchange.delete(ex);
    }
    return true;
  }

  public get(id: string): MarketConnector | undefined {
    return this._byId.get(id);
  }

  public resolveExchange(exchange: string): MarketConnector | undefined {
    return this._byExchange.get(exchange.toUpperCase());
  }

  public list(): MarketConnector[] {
    return [...this._byId.values()];
  }
}

/** Deterministic offline connector useful for development, demos, and integration tests. */
export class SyntheticConnector implements MarketConnector {
  public readonly id = 'synthetic';
  public readonly name = 'RicoChart Synthetic Feed';
  public readonly market = 'crypto' as const;
  public readonly exchanges = ['DEMO', 'SPOT', 'PSX', 'KRX'] as const;

  public async getBars(query: HistoryQuery): Promise<readonly ConnectorBar[]> {
    const count = Math.max(1, Math.min(query.limit ?? 200, 5000));
    const step = 300;
    const start = query.from ?? 1_760_000_000;
    let seed = 0x9e3779b9 >>> 0;
    for (let i = 0; i < query.symbol.length; i++) {
      seed = ((seed << 5) - seed + query.symbol.charCodeAt(i)) >>> 0;
    }
    const rnd = (): number => {
      seed ^= seed << 13; seed >>>= 0;
      seed ^= seed >> 17;
      seed ^= seed << 5; seed >>>= 0;
      return seed / 0xffffffff;
    };

    const bars: ConnectorBar[] = [];
    let price = 100;
    for (let i = 0; i < count; i++) {
      const open = price;
      const close = Math.max(1, open + (rnd() - 0.5) * 2);
      const high = Math.max(open, close) + rnd();
      const low = Math.max(0.01, Math.min(open, close) - rnd());
      bars.push({
        time: start + i * step,
        open: +open.toFixed(4),
        high: +high.toFixed(4),
        low: +low.toFixed(4),
        close: +close.toFixed(4),
        volume: Math.round(500 + rnd() * 5000),
      });
      price = close;
    }
    return bars;
  }

  public async searchSymbols(text: string): Promise<readonly InstrumentDescriptor[]> {
    const q = text.trim().toUpperCase();
    const catalog: InstrumentDescriptor[] = [
      { symbol: 'BTCUSDT', exchange: 'SPOT', market: 'crypto', description: 'Bitcoin / Tether' },
      { symbol: 'OGDC', exchange: 'PSX', market: 'regional', description: 'Oil & Gas Development Co.', currency: 'PKR' },
      { symbol: '005930', exchange: 'KRX', market: 'regional', description: 'Samsung Electronics', currency: 'KRW' },
    ];
    return q ? catalog.filter((c) => c.symbol.includes(q) || c.exchange.includes(q)) : catalog;
  }
}
