import {
  ExecutionEngine,
  type AccountSnapshot,
  type ExecutionBar,
  type Fill,
  type Order,
  type OrderRequest,
} from '@rico-chart/execution';
import type {
  ChartOrderOverlay,
  PaperEventListener,
  PaperJournalEntry,
  PaperTradingConfig,
} from './types';

/**
 * Live Paper Trading Engine.
 * Drives the exact same pure-code `@rico-chart/execution` engine against live
 * streaming candles/ticks, maintains a virtual trade journal, and projects open
 * positions & working orders into RicoChart price-line overlays.
 */
export class PaperTradingEngine {
  public readonly accountName: string;
  private readonly _engine: ExecutionEngine;
  private readonly _journal: PaperJournalEntry[] = [];
  private readonly _listeners = new Set<PaperEventListener>();
  private readonly _notes = new Map<string, string>();

  public constructor(config: PaperTradingConfig) {
    this.accountName = config.accountName ?? 'RicoChart Paper';
    this._engine = new ExecutionEngine(config);
  }

  public subscribe(listener: PaperEventListener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  public submitOrder(req: OrderRequest, nowSec: number, note?: string): Order {
    const order = this._engine.submitOrder(req, nowSec);
    if (note) this._notes.set(order.id, note);
    return order;
  }

  public cancelOrder(orderId: string): boolean {
    return this._engine.cancelOrder(orderId);
  }

  public cancelAll(symbol?: string): number {
    return this._engine.cancelAll(symbol);
  }

  /** Feed a live market bar/tick into the paper account and broadcast fills + chart overlays. */
  public onLiveBar(bar: ExecutionBar): readonly Fill[] {
    const fills = this._engine.processBar(bar);
    const account = this._engine.snapshot();

    for (const fill of fills) {
      const note = this._notes.get(fill.orderId);
      this._journal.push({
        fill,
        equityAfter: account.equity,
        ...(note !== undefined ? { note } : {}),
      });
    }

    const overlays = this.chartOverlays(bar.symbol);
    for (const fn of this._listeners) {
      fn({ fills, account, overlays });
    }
    return fills;
  }

  public snapshot(): AccountSnapshot {
    return this._engine.snapshot();
  }

  public journal(): readonly PaperJournalEntry[] {
    return this._journal;
  }

  /** Project active positions and working orders into RicoChart overlay lines. */
  public chartOverlays(symbol?: string): ChartOrderOverlay[] {
    const filter = symbol?.toUpperCase();
    const snap = this._engine.snapshot();
    const out: ChartOrderOverlay[] = [];

    for (const pos of snap.openPositions) {
      if (filter && pos.symbol.toUpperCase() !== filter) continue;
      const side = pos.quantity > 0 ? 'LONG' : 'SHORT';
      const pnlSign = pos.unrealizedPnl >= 0 ? '+' : '';
      out.push({
        id: `pos:${pos.symbol}`,
        symbol: pos.symbol,
        kind: 'position',
        price: pos.avgEntryPrice,
        label: `${side} ${Math.abs(pos.quantity)} (${pnlSign}${pos.unrealizedPnl.toFixed(2)})`,
        color: pos.unrealizedPnl >= 0 ? '#26a69a' : '#ef5350',
      });
    }

    for (const ord of snap.workingOrders) {
      if (filter && ord.symbol.toUpperCase() !== filter) continue;
      const price = ord.type === 'limit' ? ord.limitPrice : ord.stopPrice;
      if (price === undefined) continue;
      out.push({
        id: `ord:${ord.id}`,
        symbol: ord.symbol,
        kind: ord.type === 'limit' ? 'limit-order' : 'stop-order',
        price,
        label: `${ord.side.toUpperCase()} ${ord.type.toUpperCase()} ${ord.quantity}`,
        color: ord.side === 'buy' ? '#38bdf8' : '#f59e0b',
      });
    }

    return out;
  }
}
