'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { EscrowData } from '@/lib/types';
import { getProgress } from '@/lib/api';

export default function EscrowCard({ escrow, address }: { escrow: EscrowData; address: string }) {
  const { data: progress } = useSWR(['progress', escrow.id], () => getProgress(escrow.id), {
    refreshInterval: 5000,
  });

  const role = escrow.client === address ? 'Client' : escrow.freelancer === address ? 'Freelancer' : 'Observer';
  const disputed = escrow.milestones.some((m) => m.status === 'Disputed');
  const allSettled = escrow.milestones.every((m) => m.status === 'Released' || m.status === 'Refunded');
  const releasedXlm = progress ? (Number(progress.released) / 10_000_000).toFixed(2) : '…';
  const lockedXlm = progress ? (Number(progress.locked) / 10_000_000).toFixed(2) : '…';

  return (
    <Link href={`/escrow?id=${escrow.id}`} className="ledger-card rounded-lg p-5 block hover:-translate-y-0.5 transition-transform">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-ink/50">Escrow #{escrow.id}</p>
        <span className="text-xs font-mono border border-hairline rounded px-2 py-0.5">{role}</span>
      </div>
      <p className="font-display text-lg mt-1">
        {escrow.milestones.length} milestone{escrow.milestones.length > 1 ? 's' : ''}
      </p>
      <div className="mt-3 flex justify-between text-sm font-mono">
        <span className="text-forest">{releasedXlm} released</span>
        <span className="text-ink/60">{lockedXlm} locked</span>
      </div>
      {disputed && <p className="mt-2 text-xs text-seal font-semibold">Dispute in progress</p>}
      {allSettled && <p className="mt-2 text-xs text-forest font-semibold">Complete</p>}
    </Link>
  );
}
