import { describe, expect, it } from 'vitest';
import { rulingFromNative, statusFromNative } from './decode';

// Regression coverage for a real production bug: @stellar/stellar-sdk's
// scValToNative decodes Soroban unit enum variants (e.g. MilestoneStatus::Funded)
// as a single-element array like ["Funded"], not a plain string or a
// { Funded: [] } object. The decoder originally only handled the latter two
// shapes and silently fell through to a wrong default, which broke every
// role-gated action button in production until this was caught and fixed.
describe('statusFromNative', () => {
  it('decodes the real on-chain array shape returned by scValToNative', () => {
    expect(statusFromNative(['Funded'])).toBe('Funded');
    expect(statusFromNative(['Disputed'])).toBe('Disputed');
    expect(statusFromNative(['Released'])).toBe('Released');
  });

  it('decodes a plain string', () => {
    expect(statusFromNative('InProgress')).toBe('InProgress');
  });

  it('decodes an object-keyed shape', () => {
    expect(statusFromNative({ Refunded: [] })).toBe('Refunded');
  });

  it('falls back to Funded for unrecognized shapes', () => {
    expect(statusFromNative(undefined)).toBe('Funded');
    expect(statusFromNative(null)).toBe('Funded');
    expect(statusFromNative(42)).toBe('Funded');
  });
});

describe('rulingFromNative', () => {
  it('decodes the real on-chain array shape returned by scValToNative', () => {
    expect(rulingFromNative(['FavorFreelancer'])).toBe('FavorFreelancer');
    expect(rulingFromNative(['FavorClient'])).toBe('FavorClient');
  });

  it('falls back to Pending for unrecognized shapes', () => {
    expect(rulingFromNative(undefined)).toBe('Pending');
    expect(rulingFromNative({})).toBe('Pending');
  });
});
