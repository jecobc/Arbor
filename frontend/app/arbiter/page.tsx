'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Gavel } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import { ARBITER_ADDRESS } from '@/lib/env';
import { listAllDisputes, ruleDispute } from '@/lib/api';
import { ListSkeleton } from '@/components/Skeletons';
import { ErrorBanner } from '@/components/ErrorStates';
import TxStatusToast, { TxState } from '@/components/TxStatus';
import { AppError } from '@/lib/types';

export default function ArbiterPage() {
  const { address, connect } = useWallet();
  const { data: disputes, isLoading, mutate } = useSWR('all-disputes', () => listAllDisputes(), {
    refreshInterval: 8000,
  });
  const [tx, setTx] = useState<TxState>({ status: 'idle' });
  const [busyId, setBusyId] = useState<number | null>(null);

  if (!address) {
    return (
      <div className="pt-12 text-center">
        <p className="text-ink/70 mb-4">Connect your wallet to view the arbiter panel.</p>
        <button onClick={connect} className="bg-seal text-parchment rounded px-4 py-2">
          Connect Wallet
        </button>
      </div>
    );
  }

  const isArbiter = ARBITER_ADDRESS && address === ARBITER_ADDRESS;
  const pending = (disputes ?? []).filter((d) => d.ruling === 'Pending');

  async function rule(disputeId: number, ruling: 'FavorFreelancer' | 'FavorClient') {
    if (!isArbiter) {
      setTx({ status: 'error', message: "You don't have permission for this action." });
      return;
    }
    setBusyId(disputeId);
    setTx({ status: 'pending' });
    try {
      const hash = await ruleDispute(address, disputeId, ruling);
      setTx({ status: 'success', hash });
      await mutate();
    } catch (err) {
      const appErr = err instanceof AppError ? err : new AppError('generic', String(err));
      setTx({ status: 'error', message: appErr.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="pt-8 sm:pt-12">
      <div className="flex items-center gap-2 mb-1">
        <Gavel className="text-seal" size={22} />
        <h1 className="font-display text-3xl text-ink">Arbiter View</h1>
      </div>
      <p className="text-ink/60 mb-8">Pending disputes across all escrows awaiting a ruling.</p>

      {!isArbiter && (
        <div className="mb-6">
          <ErrorBanner error={new AppError('unauthorized', "You don't have permission for this action.")} />
        </div>
      )}

      {isLoading && <ListSkeleton />}

      {disputes && pending.length === 0 && (
        <div className="ledger-card rounded-lg p-8 text-center text-ink/60">No pending disputes.</div>
      )}

      <div className="space-y-4">
        {pending.map((d) => (
          <div key={d.disputeId} className="ledger-card rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-ink/50">
              Dispute #{d.disputeId} — Escrow #{d.escrowId}, Milestone {d.milestoneIndex + 1}
            </p>
            <p className="mt-1 text-ink">{d.reason}</p>
            <p className="mt-1 text-xs font-mono text-ink/50">Raised by {d.raisedBy}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => rule(d.disputeId, 'FavorFreelancer')}
                disabled={!isArbiter || busyId === d.disputeId}
                className="text-sm bg-forest text-parchment rounded px-3 py-1.5 disabled:opacity-50"
              >
                Rule for Freelancer
              </button>
              <button
                onClick={() => rule(d.disputeId, 'FavorClient')}
                disabled={!isArbiter || busyId === d.disputeId}
                className="text-sm bg-seal text-parchment rounded px-3 py-1.5 disabled:opacity-50"
              >
                Rule for Client
              </button>
            </div>
          </div>
        ))}
      </div>

      <TxStatusToast state={tx} onDismiss={() => setTx({ status: 'idle' })} />
    </div>
  );
}
