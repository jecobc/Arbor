import { describe, expect, it } from 'vitest';
import { stroopsToXlm, xlmToStroops } from './format';

describe('stroopsToXlm', () => {
  it('converts whole XLM amounts', () => {
    expect(stroopsToXlm(10_000_000n)).toBe('1.00');
    expect(stroopsToXlm(60_000_000n)).toBe('6.00');
  });

  it('converts fractional stroop amounts and rounds to 2dp', () => {
    expect(stroopsToXlm(1_234_567n)).toBe('0.12');
  });

  it('handles zero', () => {
    expect(stroopsToXlm(0n)).toBe('0.00');
  });
});

describe('xlmToStroops', () => {
  it('converts whole XLM to stroops', () => {
    expect(xlmToStroops(1)).toBe(10_000_000n);
    expect(xlmToStroops(6)).toBe(60_000_000n);
  });

  it('round-trips with stroopsToXlm for 2dp-safe values', () => {
    const stroops = xlmToStroops(12.34);
    expect(stroopsToXlm(stroops)).toBe('12.34');
  });
});
