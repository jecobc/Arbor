'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useWallet } from '@/lib/WalletContext';
import {
  approveAndRelease,
  getEscrow,
  getRuling,
  raiseDispute,
  resolveDispute,
  startMilestone,
} from '@/lib/api';
import MilestoneCard from '@/components/MilestoneCard';
import { ListSkeleton } from '@/components/Skeletons';
import { ErrorBanner } from '@/components/ErrorStates';
import TxStatusToast, { TxState } from '@/components/TxStatus';
import { AppError } from '@/lib/types';

function EscrowDetail() {
  const params = useSearchParams();
  const id = Number(params.get('id'));
  const { address, connect } = useWallet();

  const { data: escrow, error, isLoading, mutate } = useSWR(
    id ? ['escrow', id] : null,
    () => getEscrow(id),
    { refreshInterval: 5000 },
  );

  const [tx, setTx] = useState<TxState>({ status: 'idle' });
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [rulings, setRulings] = useState<Record<number, 'Pending' | 'FavorFreelancer' | 'FavorClient'>>({});

  useEffect(() => {
    if (!escrow) return;
    escrow.milestones.forEach((m, index) => {
      if (m.status === 'Disputed' && rulings[index] === undefined) {
        getRuling(escrow.id, index).then((r) => setRulings((prev) => ({ ...prev, [index]: r })));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrow]);

  async function run(index: number, action: () => Promise<string>) {
    setBusyIndex(index);
    setTx({ status: 'pending' });
    try {
      const hash = await action();
      setTx({ status: 'success', hash });
      await mutate();
    } catch (err) {
      const appErr = err instanceof AppError ? err : new AppError('generic', String(err));
      setTx({ status: 'error', message: appErr.message });
    } finally {
      setBusyIndex(null);
    }
  }

  if (!id) {
    return <ErrorBanner error={new AppError('generic', 'No escrow id supplied.')} />;
  }

  if (!address) {
    return (
      <div className="pt-12 text-center">
        <p className="text-ink/70 mb-4">Connect your wallet to view this escrow.</p>
        <button onClick={connect} className="bg-seal text-parchment rounded px-4 py-2">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (isLoading) return <ListSkeleton count={2} />;
  if (error || !escrow) {
    return (
      <ErrorBanner
        error={error instanceof AppError ? error : new AppError('generic', 'Escrow not found.')}
        onRetry={() => mutate()}
      />
    );
  }

  const role = escrow.client === address ? 'client' : escrow.freelancer === address ? 'freelancer' : 'observer';

  return (
    <div className="pt-8 sm:pt-12">
      <p className="text-xs uppercase tracking-wide text-ink/50">Escrow #{escrow.id}</p>
      <h1 className="font-display text-3xl text-ink mb-1">Milestone Status Feed</h1>
      <p className="text-ink/60 mb-8 font-mono text-sm">
        Client {escrow.client.slice(0, 6)}… → Freelancer {escrow.freelancer.slice(0, 6)}…
      </p>

      <div className="space-y-4">
        {escrow.milestones.map((m, index) => {
          return (
            <MilestoneCard
              key={index}
              milestone={m}
              index={index}
              role={role}
              ruling={rulings[index] ?? null}
              busy={busyIndex === index}
              onStart={() => run(index, () => startMilestone(address, escrow.id, index))}
              onApprove={() => run(index, () => approveAndRelease(address, escrow.id, index))}
              onDispute={(reason) => run(index, () => raiseDispute(address, escrow.id, index, reason))}
              onResolve={() => run(index, () => resolveDispute(address, escrow.id, index))}
            />
          );
        })}
      </div>

      <TxStatusToast state={tx} onDismiss={() => setTx({ status: 'idle' })} />
    </div>
  );
}

export default function EscrowPage() {
  return (
    <Suspense fallback={<ListSkeleton count={2} />}>
      <EscrowDetail />
    </Suspense>
  );
}
