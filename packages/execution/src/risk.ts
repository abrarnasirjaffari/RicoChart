import type { AccountSnapshot, OrderRequest, RiskConfig } from './types';

export interface RiskDecision {
  readonly allowed: boolean;
  readonly reason?: string;
}

/**
 * Pure-code deterministic position sizing: computes quantity from account equity,
 * risk percent, entry price, and stop-loss price. Never calls AI or external state.
 */
export function calculatePositionSize(
  equity: number,
  riskPct: number,
  entryPrice: number,
  stopLossPrice: number,
): number {
  if (!Number.isFinite(equity) || equity <= 0) return 0;
  if (!Number.isFinite(riskPct) || riskPct <= 0) return 0;
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
  if (!Number.isFinite(riskPerUnit) || riskPerUnit <= 0) return 0;
  const riskDollars = equity * (riskPct / 100);
  return riskDollars / riskPerUnit;
}

/** Pure-code pre-trade risk gate enforced on every non-reduce-only order. */
export class RiskGuard {
  private readonly _cfg: RiskConfig;

  public constructor(config: RiskConfig = {}) {
    this._cfg = config;
  }

  public check(req: OrderRequest, account: AccountSnapshot, nowSec: number): RiskDecision {
    if (!Number.isFinite(req.quantity) || req.quantity <= 0) {
      return { allowed: false, reason: 'Order quantity must be positive' };
    }
    if (req.type === 'limit' && (req.limitPrice === undefined || !Number.isFinite(req.limitPrice) || req.limitPrice <= 0)) {
      return { allowed: false, reason: 'Limit order requires a positive limitPrice' };
    }
    if (req.type === 'stop' && (req.stopPrice === undefined || !Number.isFinite(req.stopPrice) || req.stopPrice <= 0)) {
      return { allowed: false, reason: 'Stop order requires a positive stopPrice' };
    }

    // Protective/exit orders are always permitted so open risk can be closed.
    if (req.reduceOnly) return { allowed: true };

    if (this._cfg.maxDrawdownPct !== undefined && account.drawdownPct >= this._cfg.maxDrawdownPct) {
      return {
        allowed: false,
        reason: `Drawdown kill-switch active (${account.drawdownPct.toFixed(2)}% >= ${this._cfg.maxDrawdownPct}%)`,
      };
    }

    if (this._cfg.isBlackout && this._cfg.isBlackout(req.symbol, nowSec)) {
      return {
        allowed: false,
        reason: `Trading blackout active for ${req.symbol}`,
      };
    }

    if (this._cfg.maxOpenPositions !== undefined) {
      const sym = req.symbol.toUpperCase();
      const hasPos = account.openPositions.some((p) => p.symbol.toUpperCase() === sym && p.quantity !== 0);
      if (!hasPos && account.openPositions.length >= this._cfg.maxOpenPositions) {
        return {
          allowed: false,
          reason: `Max open positions reached (${this._cfg.maxOpenPositions})`,
        };
      }
    }

    return { allowed: true };
  }
}
