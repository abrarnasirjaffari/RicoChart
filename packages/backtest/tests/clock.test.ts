import { describe, expect, it } from 'vitest';
import { SimulatedClock } from '../src/clock';

describe('SimulatedClock strict timestamps', () => {
  it('allows strictly increasing advances by default', () => {
    const clock = new SimulatedClock(0);
    clock.advanceTo(10);
    clock.advanceTo(11);
    expect(clock.now()).toBe(11);
  });

  it('allows equal timestamps by default (backwards compatibility)', () => {
    const clock = new SimulatedClock(10);
    clock.advanceTo(10);
    expect(clock.now()).toBe(10);
  });

  it('allows equal timestamps when strict: false is passed explicitly', () => {
    const clock = new SimulatedClock(10, { strict: false });
    clock.advanceTo(10);
    expect(clock.now()).toBe(10);
  });

  it('rejects equal timestamps in strict mode', () => {
    const clock = new SimulatedClock(10, { strict: true });
    expect(() => clock.advanceTo(10)).toThrow(RangeError);
    expect(() => clock.advanceTo(10)).toThrow('non-increasing');
  });

  it('rejects decreasing timestamps in strict mode', () => {
    const clock = new SimulatedClock(10, { strict: true });
    expect(() => clock.advanceTo(9)).toThrow(RangeError);
  });

  it('rejects decreasing timestamps in non-strict mode (existing behaviour)', () => {
    const clock = new SimulatedClock(10);
    expect(() => clock.advanceTo(9)).toThrow(RangeError);
  });

  it('rejects advancing to the initial time in strict mode', () => {
    const clock = new SimulatedClock(100, { strict: true });
    expect(() => clock.advanceTo(100)).toThrow(RangeError);
  });

  it('accepts time just above now in strict mode', () => {
    const clock = new SimulatedClock(10, { strict: true });
    clock.advanceTo(11);
    expect(clock.now()).toBe(11);
  });

  it('rejects non-finite times in strict mode', () => {
    const clock = new SimulatedClock(10, { strict: true });
    expect(() => clock.advanceTo(Number.NaN)).toThrow(RangeError);
    expect(() => clock.advanceTo(Infinity)).toThrow(RangeError);
  });

  it('allows repeated strictly-increasing advances in strict mode, then rejects an equal advance', () => {
    const clock = new SimulatedClock(0, { strict: true });
    clock.advanceTo(1);
    clock.advanceTo(2);
    clock.advanceTo(3);
    expect(clock.now()).toBe(3);
    expect(() => clock.advanceTo(3)).toThrow(RangeError);
  });

  it('default initial time is 0; first advanceTo(0) is allowed non-strict and rejected strict', () => {
    const defaultClock = new SimulatedClock();
    expect(defaultClock.now()).toBe(0);
    defaultClock.advanceTo(0);
    expect(defaultClock.now()).toBe(0);

    const strictClock = new SimulatedClock(0, { strict: true });
    expect(() => strictClock.advanceTo(0)).toThrow(RangeError);
  });

  it('a rejected advanceTo does not move the clock', () => {
    const clock = new SimulatedClock(10, { strict: true });
    expect(() => clock.advanceTo(10)).toThrow(RangeError);
    expect(clock.now()).toBe(10);
    expect(() => clock.advanceTo(9)).toThrow(RangeError);
    expect(clock.now()).toBe(10);
  });

  it('strict mode does not change now() / initial-time reporting', () => {
    const clock = new SimulatedClock(42, { strict: true });
    expect(clock.now()).toBe(42);
    clock.advanceTo(43);
    expect(clock.now()).toBe(43);
  });
});
