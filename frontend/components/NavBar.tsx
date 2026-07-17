'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { Scroll, Wallet, Gavel } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import { getXlmBalance } from '@/lib/api';
import { ARBITER_ADDRESS } from '@/lib/env';

export default function NavBar() {
  const { address, connecting, connect, disconnect } = useWallet();
  const { data: balance } = useSWR(address ? ['balance', address] : null, () => getXlmBalance(address!), {
    refreshInterval: 8000,
  });

  const isArbiter = address && ARBITER_ADDRESS && address === ARBITER_ADDRESS;

  return (
    <header className="border-b border-hairline bg-parchment/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-display text-xl sm:text-2xl text-ink">
          <Scroll size={24} className="text-seal" />
          Arbor
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          {isArbiter && (
            <Link
              href="/arbiter"
              className="hidden sm:flex items-center gap-1 text-sm text-forest hover:underline"
            >
              <Gavel size={16} /> Arbiter View
            </Link>
          )}
          {address ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline text-sm text-ink/70 font-mono">
                {balance ?? '…'} XLM
              </span>
              <button
                onClick={disconnect}
                className="text-xs sm:text-sm font-mono border border-hairline rounded px-2.5 py-1.5 bg-white hover:bg-parchmentDark transition-colors"
                title={address}
              >
                {address.slice(0, 4)}…{address.slice(-4)}
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="flex items-center gap-1.5 text-sm bg-seal text-parchment rounded px-3 py-1.5 hover:bg-sealDark transition-colors disabled:opacity-60"
            >
              <Wallet size={15} />
              {connecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
