'use client';

import { AlertTriangle, ShieldOff, XCircle, Clock, Download } from 'lucide-react';
import { AppError } from '@/lib/types';

export function ErrorBanner({ error, onRetry, onDismiss }: { error: AppError; onRetry?: () => void; onDismiss?: () => void }) {
  const config = {
    'wallet-missing': {
      icon: Download,
      title: 'No wallet found',
      body: 'Install a Stellar wallet extension (Freighter recommended) to continue.',
      accent: 'border-seal text-seal',
      action: (
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noreferrer"
          className="text-sm underline"
        >
          Install Freighter
        </a>
      ),
    },
    rejected: {
      icon: XCircle,
      title: 'Transaction declined',
      body: 'You declined the request in your wallet. No funds were moved.',
      accent: 'border-hairline text-ink',
      action: onRetry && (
        <button onClick={onRetry} className="text-sm underline">
          Try again
        </button>
      ),
    },
    unauthorized: {
      icon: ShieldOff,
      title: "You don't have permission for this action",
      body: 'This action is restricted to a specific role on this escrow.',
      accent: 'border-red-700 text-red-800',
      action: null,
    },
    'awaiting-ruling': {
      icon: Clock,
      title: 'Awaiting arbiter ruling',
      body: 'The neutral arbiter has not ruled on this dispute yet. Check back shortly.',
      accent: 'border-forest text-forest',
      action: null,
    },
    generic: {
      icon: AlertTriangle,
      title: 'Something went wrong',
      body: error.message,
      accent: 'border-red-700 text-red-800',
      action: onRetry && (
        <button onClick={onRetry} className="text-sm underline">
          Try again
        </button>
      ),
    },
  }[error.kind];

  const Icon = config.icon;

  return (
    <div className={`ledger-card rounded-md border-l-4 p-4 flex items-start gap-3 ${config.accent}`}>
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{config.title}</p>
        <p className="text-sm text-ink/70 mt-0.5">{config.body}</p>
        {config.action && <div className="mt-2">{config.action}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-ink/40 hover:text-ink">
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
}
