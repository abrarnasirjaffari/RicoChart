import { RiskGuard } from './risk';
import type {
  AccountSnapshot,
  ExecutionBar,
  ExecutionConfig,
  Fill,
  Order,
  OrderRequest,
  Position,
} from './types';

/**
 * Pure-code, deterministic Execution Engine (zero AI).
 * Shared identically by the No-Look-Ahead Backtester and Live Paper Trading so
 * order mechanics, bracket SL/TP OCO exits, fees, slippage, and risk limits
 * behave 1:1 across historical tests and live simulation.
 */
export class ExecutionEngine {
  private _cash: number;
  private _peakEquity: number;
  private _realizedPnl = 0;
  private _totalFees = 0;
  private _seq = 0;
  private readonly _feeRate: number;
  private readonly _slipRate: number;
  private readonly _maxDrawdownPct: number | undefined;
  private readonly _risk: RiskGuard;
  private readonly _orders = new Map<string, Order>();
  private readonly _positions = new Map<string, Position>();
  private readonly _fills: Fill[] = [];

  public constructor(config: ExecutionConfig) {
    if (!Number.isFinite(config.initialCash) || config.initialCash <= 0) {
      throw new RangeError('initialCash must be a positive number');
    }
    this._cash = config.initialCash;
    this._peakEquity = config.initialCash;
    this._feeRate = (config.feeBps ?? 0) / 10_000;
    this._slipRate = (config.slippageBps ?? 0) / 10_000;
    this._maxDrawdownPct = config.risk?.maxDrawdownPct;
    this._risk = new RiskGuard(config.risk);
  }

  /** Submit an order at `nowSec`. Does NOT fill until a subsequent bar/price arrives (prevents look-ahead). */
  public submitOrder(req: OrderRequest, nowSec: number): Order {
    const id = `ord_${++this._seq}`;
    const snap = this.snapshot();
    const check = this._risk.check(req, snap, nowSec);

    const order: Order = {
      id,
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      quantity: req.quantity,
      ...(req.limitPrice !== undefined ? { limitPrice: req.limitPrice } : {}),
      ...(req.stopPrice !== undefined ? { stopPrice: req.stopPrice } : {}),
      ...(req.stopLoss !== undefined ? { stopLoss: req.stopLoss } : {}),
      ...(req.takeProfit !== undefined ? { takeProfit: req.takeProfit } : {}),
      reduceOnly: req.reduceOnly ?? false,
      ...(req.tag !== undefined ? { tag: req.tag } : {}),
      createdAt: nowSec,
      status: check.allowed ? 'working' : 'rejected',
      ...(check.reason !== undefined ? { rejectReason: check.reason } : {}),
    };

    this._orders.set(id, order);
    return { ...order };
  }

  public cancelOrder(orderId: string): boolean {
    const order = this._orders.get(orderId);
    if (!order || order.status !== 'working') return false;
    order.status = 'cancelled';
    return true;
  }

  public cancelAll(symbol?: string): number {
    const target = symbol?.toUpperCase();
    let count = 0;
    for (const order of this._orders.values()) {
      if (order.status !== 'working') continue;
      if (target && order.symbol.toUpperCase() !== target) continue;
      order.status = 'cancelled';
      count++;
    }
    return count;
  }

  /**
   * Process an incoming market bar deterministically:
   * 1. Fill eligible working orders (conservative ordering: stop-loss checked before take-profit on same bar).
   * 2. Mark all open positions to `bar.close` and update peak equity.
   */
  public processBar(bar: ExecutionBar): Fill[] {
    const sym = bar.symbol.toUpperCase();
    const barFills: Fill[] = [];

    // Collect working orders for this symbol in deterministic creation order;
    // within an OCO pair, evaluate stop (SL) before limit (TP) conservatively.
    const working = [...this._orders.values()]
      .filter((o) => o.status === 'working' && o.symbol.toUpperCase() === sym)
      .sort((a, b) => {
        if (a.ocoGroupId && a.ocoGroupId === b.ocoGroupId) {
          if (a.type === 'stop' && b.type !== 'stop') return -1;
          if (b.type === 'stop' && a.type !== 'stop') return 1;
        }
        return a.createdAt - b.createdAt || a.id.localeCompare(b.id);
      });

    for (const order of working) {
      if (order.status !== 'working') continue; // may have been cancelled by OCO sibling
      const rawPrice = this._matchBar(order, bar);
      if (rawPrice === null) continue;

      const fillPrice = this._applySlippage(rawPrice, order.side, order.type);
      const fill = this._executeFill(order, fillPrice, bar.time);
      barFills.push(fill);

      // Cancel any OCO siblings
      if (order.ocoGroupId) {
        for (const sibling of this._orders.values()) {
          if (sibling.id !== order.id && sibling.ocoGroupId === order.ocoGroupId && sibling.status === 'working') {
            sibling.status = 'cancelled';
          }
        }
      }

      // Spawn bracket SL/TP child orders (active from the next bar/tick onward)
      this._spawnBracketChildren(order, bar.time);
    }

    // Mark open position to market at bar close
    const pos = this._positions.get(sym);
    if (pos) {
      pos.lastPrice = bar.close;
      pos.unrealizedPnl = (bar.close - pos.avgEntryPrice) * pos.quantity;
    }

    const eq = this._equity();
    if (eq > this._peakEquity) this._peakEquity = eq;

    return barFills;
  }

  public fills(): readonly Fill[] {
    return this._fills;
  }

  public snapshot(): AccountSnapshot {
    const openPositions: Position[] = [];
    let unrealizedPnl = 0;
    for (const p of this._positions.values()) {
      if (p.quantity === 0) continue;
      openPositions.push({ ...p });
      unrealizedPnl += p.unrealizedPnl;
    }

    const workingOrders: Order[] = [];
    for (const o of this._orders.values()) {
      if (o.status === 'working') workingOrders.push({ ...o });
    }

    const equity = this._cash + this._positionsMarketValue();
    const drawdownPct = this._peakEquity > 0 ? Math.max(0, ((this._peakEquity - equity) / this._peakEquity) * 100) : 0;

    return {
      cash: this._cash,
      equity,
      peakEquity: this._peakEquity,
      drawdownPct,
      realizedPnl: this._realizedPnl,
      unrealizedPnl,
      totalFees: this._totalFees,
      killSwitchActive: this._maxDrawdownPct !== undefined && drawdownPct >= this._maxDrawdownPct,
      openPositions,
      workingOrders,
    };
  }

  private _matchBar(order: Order, bar: ExecutionBar): number | null {
    if (order.type === 'market') {
      return bar.open;
    }
    if (order.type === 'limit') {
      const lp = order.limitPrice!;
      if (order.side === 'buy' && bar.low <= lp) return Math.min(bar.open, lp);
      if (order.side === 'sell' && bar.high >= lp) return Math.max(bar.open, lp);
      return null;
    }
    // stop order
    const sp = order.stopPrice!;
    if (order.side === 'buy' && bar.high >= sp) return Math.max(bar.open, sp);
    if (order.side === 'sell' && bar.low <= sp) return Math.min(bar.open, sp);
    return null;
  }

  private _applySlippage(price: number, side: 'buy' | 'sell', type: Order['type']): number {
    if (type === 'limit' || this._slipRate === 0) return price;
    return side === 'buy' ? price * (1 + this._slipRate) : price * (1 - this._slipRate);
  }

  private _executeFill(order: Order, price: number, time: number): Fill {
    order.status = 'filled';
    const sym = order.symbol.toUpperCase();
    const signedQty = order.side === 'buy' ? order.quantity : -order.quantity;
    const notional = order.quantity * price;
    const fee = notional * this._feeRate;

    // Cash settles notional minus fees (buy spends cash, sell receives cash)
    this._cash += order.side === 'buy' ? -(notional + fee) : notional - fee;
    this._totalFees += fee;

    let pos = this._positions.get(sym);
    let realizedPnl = 0;

    if (!pos || pos.quantity === 0) {
      pos = {
        symbol: order.symbol,
        quantity: signedQty,
        avgEntryPrice: price,
        realizedPnl: 0,
        unrealizedPnl: 0,
        lastPrice: price,
      };
      this._positions.set(sym, pos);
    } else if (Math.sign(pos.quantity) === Math.sign(signedQty)) {
      const totalQty = pos.quantity + signedQty;
      pos.avgEntryPrice = (Math.abs(pos.quantity) * pos.avgEntryPrice + Math.abs(signedQty) * price) / Math.abs(totalQty);
      pos.quantity = totalQty;
      pos.lastPrice = price;
    } else {
      const closingQty = Math.min(Math.abs(pos.quantity), Math.abs(signedQty));
      const direction = Math.sign(pos.quantity);
      realizedPnl = (price - pos.avgEntryPrice) * closingQty * direction;
      pos.realizedPnl += realizedPnl;
      this._realizedPnl += realizedPnl;

      const remaining = pos.quantity + signedQty;
      if (Math.abs(remaining) < 1e-12) {
        this._positions.delete(sym);
      } else {
        if (Math.sign(remaining) !== Math.sign(pos.quantity)) {
          pos.avgEntryPrice = price;
        }
        pos.quantity = remaining;
        pos.lastPrice = price;
      }
    }

    const fill: Fill = {
      id: `fill_${++this._seq}`,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price,
      fee,
      time,
      realizedPnl,
      ...(order.tag !== undefined ? { tag: order.tag } : {}),
    };
    this._fills.push(fill);
    return fill;
  }

  private _spawnBracketChildren(parent: Order, nowSec: number): void {
    if (parent.stopLoss === undefined && parent.takeProfit === undefined) return;
    const exitSide = parent.side === 'buy' ? 'sell' : 'buy';
    const ocoGroupId = `oco_${parent.id}`;

    if (parent.stopLoss !== undefined) {
      const id = `ord_${++this._seq}`;
      this._orders.set(id, {
        id,
        symbol: parent.symbol,
        side: exitSide,
        type: 'stop',
        quantity: parent.quantity,
        stopPrice: parent.stopLoss,
        reduceOnly: true,
        ocoGroupId,
        tag: parent.tag ? `${parent.tag}:sl` : 'sl',
        createdAt: nowSec,
        status: 'working',
      });
    }

    if (parent.takeProfit !== undefined) {
      const id = `ord_${++this._seq}`;
      this._orders.set(id, {
        id,
        symbol: parent.symbol,
        side: exitSide,
        type: 'limit',
        quantity: parent.quantity,
        limitPrice: parent.takeProfit,
        reduceOnly: true,
        ocoGroupId,
        tag: parent.tag ? `${parent.tag}:tp` : 'tp',
        createdAt: nowSec,
        status: 'working',
      });
    }
  }

  private _positionsMarketValue(): number {
    let val = 0;
    for (const p of this._positions.values()) {
      val += p.quantity * p.lastPrice;
    }
    return val;
  }

  private _equity(): number {
    return this._cash + this._positionsMarketValue();
  }
}
