import { MilestoneStatus, Ruling } from './types';

// Soroban unit enum variants (e.g. MilestoneStatus::Funded) come back from
// @stellar/stellar-sdk's scValToNative as a single-element array like
// ["Funded"], not a plain string or a { Funded: [] } object. Handle all
// three shapes defensively — decoding this wrong broke every role-gated
// action button in production until it was caught and fixed.

export function statusFromNative(raw: unknown): MilestoneStatus {
  if (typeof raw === 'string') return raw as MilestoneStatus;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0] as MilestoneStatus;
  if (raw && typeof raw === 'object') {
    const key = Object.keys(raw as object)[0];
    if (key) return key as MilestoneStatus;
  }
  return 'Funded';
}

export function rulingFromNative(raw: unknown): Ruling {
  if (typeof raw === 'string') return raw as Ruling;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0] as Ruling;
  if (raw && typeof raw === 'object') {
    const key = Object.keys(raw as object)[0];
    if (key) return key as Ruling;
  }
  return 'Pending';
}
