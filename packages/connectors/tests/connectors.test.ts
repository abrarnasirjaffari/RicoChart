import { describe, expect, it } from 'vitest';
import { ConnectorRegistry, SyntheticConnector } from '../src/index';

describe('ConnectorRegistry', () => {
  it('registers connectors, resolves regional exchanges (PSX/KRX), and returns deterministic bars', async () => {
    const reg = new ConnectorRegistry();
    reg.register(new SyntheticConnector());

    const psx = reg.resolveExchange('PSX');
    expect(psx?.id).toBe('synthetic');

    const barsA = await psx!.getBars({ symbol: 'OGDC', exchange: 'PSX', interval: '5m', limit: 25 });
    const barsB = await psx!.getBars({ symbol: 'OGDC', exchange: 'PSX', interval: '5m', limit: 25 });
    expect(barsA).toHaveLength(25);
    expect(barsA).toEqual(barsB);

    const results = await psx!.searchSymbols!('KRX');
    expect(results.map((r) => r.exchange)).toEqual(['KRX']);
  });
});
