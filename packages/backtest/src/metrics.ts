import type { Fill } from '@rico-chart/execution';

export interface EquityPoint {
  readonly time: number;
  readonly equity: number;
  readonly drawdownPct: number;
}

export interface BacktestMetrics {
  readonly initialCash: number;
  readonly finalEquity: number;
  readonly totalReturnPct: number;
  readonly maxDrawdownPct: number;
  readonly totalFills: number;
  readonly closedTrades: number;
  readonly winRatePct: number;
  readonly profitFactor: number;
  readonly totalFees: number;
}

export function computeMetrics(
  initialCash: number,
  equityCurve: readonly EquityPoint[],
  fills: readonly Fill[],
): BacktestMetrics {
  const finalEquity = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1]!.equity : initialCash;
  const totalReturnPct = initialCash > 0 ? ((finalEquity - initialCash) / initialCash) * 100 : 0;

  let maxDrawdownPct = 0;
  for (const pt of equityCurve) {
    if (pt.drawdownPct > maxDrawdownPct) maxDrawdownPct = pt.drawdownPct;
  }

  let closedTrades = 0;
  let wins = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalFees = 0;

  for (const f of fills) {
    totalFees += f.fee;
    if (f.realizedPnl !== 0) {
      closedTrades++;
      if (f.realizedPnl > 0) {
        wins++;
        grossProfit += f.realizedPnl;
      } else {
        grossLoss += Math.abs(f.realizedPnl);
      }
    }
  }

  const winRatePct = closedTrades > 0 ? (wins / closedTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  return {
    initialCash,
    finalEquity,
    totalReturnPct,
    maxDrawdownPct,
    totalFills: fills.length,
    closedTrades,
    winRatePct,
    profitFactor,
    totalFees,
  };
}
