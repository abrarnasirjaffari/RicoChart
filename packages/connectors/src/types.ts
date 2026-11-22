export type MarketClass = 'crypto' | 'forex' | 'equities' | 'regional';

export interface ConnectorBar {
  /** UTC timestamp in seconds. */
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume?: number;
}

export interface HistoryQuery {
  readonly symbol: string;
  readonly exchange: string;
  readonly interval: string;
  readonly from?: number;
  readonly to?: number;
  readonly limit?: number;
}

export interface InstrumentDescriptor {
  readonly symbol: string;
  readonly exchange: string;
  readonly market: MarketClass;
  readonly description?: string;
  readonly currency?: string;
  readonly tickSize?: number;
}

/** Unified plug-in market connector contract shared across Crypto, Forex, Stocks, PSX, and KRX. */
export interface MarketConnector {
  readonly id: string;
  readonly name: string;
  readonly market: MarketClass;
  readonly exchanges: readonly string[];
  getBars(query: HistoryQuery): Promise<readonly ConnectorBar[]>;
  subscribeBars?(query: HistoryQuery, onBar: (bar: ConnectorBar) => void): () => void;
  searchSymbols?(text: string): Promise<readonly InstrumentDescriptor[]>;
}
