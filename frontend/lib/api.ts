'use client';

import { ARBITER_CONTRACT_ADDRESS, ESCROW_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from './env';
import {
  addrArg,
  i128Arg,
  milestonesArg,
  readContract,
  strArg,
  u32Arg,
  u64Arg,
  writeContract,
} from './contract';
import { Dispute, EscrowData, Milestone, MilestoneStatus, Ruling } from './types';

function statusFromNative(raw: unknown): MilestoneStatus {
  if (typeof raw === 'string') return raw as MilestoneStatus;
  if (raw && typeof raw === 'object') {
    const key = Object.keys(raw as object)[0];
    if (key) return key as MilestoneStatus;
  }
  return 'Funded';
}

function rulingFromNative(raw: unknown): Ruling {
  if (typeof raw === 'string') return raw as Ruling;
  if (raw && typeof raw === 'object') {
    const key = Object.keys(raw as object)[0];
    if (key) return key as Ruling;
  }
  return 'Pending';
}

function parseEscrow(id: number, raw: any): EscrowData {
  const milestones: Milestone[] = raw.milestones.map((m: any) => ({
    title: m.title,
    amount: BigInt(m.amount),
    status: statusFromNative(m.status),
  }));
  return {
    id,
    client: raw.client,
    freelancer: raw.freelancer,
    token: raw.token,
    arbiterContract: raw.arbiter_contract,
    milestones,
    createdAt: Number(raw.created_at),
  };
}

export async function getEscrowCount(): Promise<number> {
  const raw = await readContract(ESCROW_CONTRACT_ADDRESS, 'get_escrow_count');
  return Number(raw);
}

export async function getEscrow(id: number): Promise<EscrowData> {
  const raw = await readContract(ESCROW_CONTRACT_ADDRESS, 'get_escrow', [u64Arg(id)]);
  return parseEscrow(id, raw);
}

export async function getProgress(id: number): Promise<{ released: bigint; locked: bigint }> {
  const raw = await readContract(ESCROW_CONTRACT_ADDRESS, 'get_progress', [u64Arg(id)]);
  return { released: BigInt(raw[0]), locked: BigInt(raw[1]) };
}

export async function listEscrowsForAddress(address: string): Promise<EscrowData[]> {
  const count = await getEscrowCount();
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  const escrows = await Promise.all(ids.map((id) => getEscrow(id).catch(() => null)));
  return escrows
    .filter((e): e is EscrowData => e !== null)
    .filter((e) => e.client === address || e.freelancer === address);
}

export async function createEscrow(
  source: string,
  freelancer: string,
  milestones: { title: string; amount: bigint }[],
): Promise<string> {
  const { hash } = await writeContract(
    ESCROW_CONTRACT_ADDRESS,
    'create_escrow',
    [
      addrArg(source),
      addrArg(freelancer),
      addrArg(TOKEN_CONTRACT_ADDRESS),
      addrArg(ARBITER_CONTRACT_ADDRESS),
      milestonesArg(milestones),
    ],
    source,
  );
  return hash;
}

export async function startMilestone(source: string, id: number, index: number): Promise<string> {
  const { hash } = await writeContract(
    ESCROW_CONTRACT_ADDRESS,
    'start_milestone',
    [u64Arg(id), u32Arg(index)],
    source,
  );
  return hash;
}

export async function approveAndRelease(source: string, id: number, index: number): Promise<string> {
  const { hash } = await writeContract(
    ESCROW_CONTRACT_ADDRESS,
    'approve_and_release',
    [u64Arg(id), u32Arg(index)],
    source,
  );
  return hash;
}

export async function raiseDispute(
  source: string,
  id: number,
  index: number,
  reason: string,
): Promise<string> {
  const { hash } = await writeContract(
    ESCROW_CONTRACT_ADDRESS,
    'raise_dispute',
    [u64Arg(id), u32Arg(index), addrArg(source), strArg(reason)],
    source,
  );
  return hash;
}

export async function resolveDispute(source: string, id: number, index: number): Promise<string> {
  const { hash } = await writeContract(
    ESCROW_CONTRACT_ADDRESS,
    'resolve_dispute',
    [u64Arg(id), u32Arg(index)],
    source,
  );
  return hash;
}

export async function getRuling(escrowId: number, index: number): Promise<Ruling> {
  try {
    const raw = await readContract(ARBITER_CONTRACT_ADDRESS, 'get_ruling', [
      u64Arg(escrowId),
      u32Arg(index),
    ]);
    return rulingFromNative(raw);
  } catch {
    return 'Pending';
  }
}

export async function getDispute(disputeId: number): Promise<Dispute | null> {
  try {
    const raw = await readContract(ARBITER_CONTRACT_ADDRESS, 'get_dispute', [u64Arg(disputeId)]);
    return {
      disputeId,
      escrowId: Number(raw.escrow_id),
      milestoneIndex: Number(raw.milestone_index),
      raisedBy: raw.raised_by,
      reason: raw.reason,
      ruling: rulingFromNative(raw.ruling),
    };
  } catch {
    return null;
  }
}

export async function listAllDisputes(maxProbe = 50): Promise<Dispute[]> {
  const disputes: Dispute[] = [];
  let consecutiveMisses = 0;
  for (let id = 1; id <= maxProbe && consecutiveMisses < 3; id++) {
    const d = await getDispute(id);
    if (d) {
      disputes.push(d);
      consecutiveMisses = 0;
    } else {
      consecutiveMisses++;
    }
  }
  return disputes;
}

export async function ruleDispute(
  arbiterSource: string,
  disputeId: number,
  ruling: 'FavorFreelancer' | 'FavorClient',
): Promise<string> {
  const { xdr } = await import('@stellar/stellar-sdk');
  const rulingScVal = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(ruling)]);
  const { hash } = await writeContract(
    ARBITER_CONTRACT_ADDRESS,
    'rule',
    [u64Arg(disputeId), rulingScVal],
    arbiterSource,
  );
  return hash;
}

export async function getXlmBalance(address: string): Promise<string> {
  const raw = await readContract(TOKEN_CONTRACT_ADDRESS, 'balance', [addrArg(address)]);
  const stroops = BigInt(raw);
  return (Number(stroops) / 10_000_000).toFixed(2);
}
