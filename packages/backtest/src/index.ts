export { SimulatedClock, type ReadonlyClock } from './clock';
export { PointInTimeFeed, type PointInTimeView } from './feed';
export { computeMetrics, type EquityPoint, type BacktestMetrics } from './metrics';
export {
  runBacktest,
  type StrategyContext,
  type BacktestStrategy,
  type BacktestResult,
} from './runner';
