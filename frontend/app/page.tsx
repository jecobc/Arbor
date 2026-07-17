'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { PlusCircle } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import { listEscrowsForAddress } from '@/lib/api';
import EscrowCard from '@/components/EscrowCard';
import { ListSkeleton } from '@/components/Skeletons';
import { ErrorBanner } from '@/components/ErrorStates';
import { AppError } from '@/lib/types';

export default function DashboardPage() {
  const { address, connect } = useWallet();
  const { data, error, isLoading, mutate } = useSWR(
    address ? ['escrows', address] : null,
    () => listEscrowsForAddress(address!),
    { refreshInterval: 6000 },
  );

  return (
    <div className="pt-8 sm:pt-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">Dashboard</h1>
          <p className="text-ink/60 mt-1">Milestone escrows involving your address, sealed on Stellar testnet.</p>
        </div>
        {address && (
          <Link
            href="/create"
            className="flex items-center gap-2 bg-seal text-parchment rounded px-4 py-2 hover:bg-sealDark transition-colors w-fit"
          >
            <PlusCircle size={16} /> Create Escrow
          </Link>
        )}
      </div>

      {!address && (
        <div className="ledger-card rounded-lg p-8 text-center">
          <p className="text-ink/70 mb-4">Connect your wallet to view or create escrows.</p>
          <button onClick={connect} className="bg-seal text-parchment rounded px-4 py-2">
            Connect Wallet
          </button>
        </div>
      )}

      {address && isLoading && <ListSkeleton />}

      {address && error && (
        <ErrorBanner
          error={error instanceof AppError ? error : new AppError('generic', String(error))}
          onRetry={() => mutate()}
        />
      )}

      {address && data && data.length === 0 && (
        <div className="ledger-card rounded-lg p-8 text-center text-ink/60">
          No escrows yet — create one to get started.
        </div>
      )}

      {address && data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((escrow) => (
            <EscrowCard key={escrow.id} escrow={escrow} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
