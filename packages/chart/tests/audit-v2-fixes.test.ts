import { describe, it, expect } from 'vitest';
import { Pane } from '../src/core/pane';
import { PriceLine } from '../src/primitives/price-line';
import { fakeDocument } from './helpers/fake-dom';

describe('V2-M3: destroy detaches primitives', () => {
  it('Pane.destroy calls detached() on every attached primitive', () => {
    const pane = new Pane(fakeDocument());
    let detached = 0;
    const line = new PriceLine({ price: 100, color: '#fff', lineWidth: 1, dashed: false, id: 'x' });
    const origDetached = line.detached.bind(line);
    line.detached = () => { detached++; origDetached(); };
    pane.addPrimitive(line, { requestUpdate: () => {} });
    pane.destroy();
    expect(detached).toBe(1);
  });
});
