'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import { createEscrow } from '@/lib/api';
import { AppError } from '@/lib/types';
import TxStatusToast, { TxState } from '@/components/TxStatus';
import { ErrorBanner } from '@/components/ErrorStates';

interface Row {
  title: string;
  amount: string;
}

export default function CreateEscrowPage() {
  const { address, connect } = useWallet();
  const router = useRouter();
  const [freelancer, setFreelancer] = useState('');
  const [rows, setRows] = useState<Row[]>([
    { title: '', amount: '' },
    { title: '', amount: '' },
  ]);
  const [tx, setTx] = useState<TxState>({ status: 'idle' });
  const [formError, setFormError] = useState<AppError | null>(null);

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    if (rows.length < 4) setRows((prev) => [...prev, { title: '', amount: '' }]);
  }

  function removeRow(i: number) {
    if (rows.length > 2) setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setFormError(null);
    setTx({ status: 'pending' });
    try {
      const milestones = rows.map((r) => ({
        title: r.title,
        amount: BigInt(Math.round(parseFloat(r.amount) * 10_000_000)),
      }));
      const hash = await createEscrow(address, freelancer, milestones);
      setTx({ status: 'success', hash });
      setTimeout(() => router.push('/'), 1800);
    } catch (err) {
      const appErr = err instanceof AppError ? err : new AppError('generic', String(err));
      setFormError(appErr);
      setTx({ status: 'error', message: appErr.message });
    }
  }

  if (!address) {
    return (
      <div className="pt-12 text-center">
        <p className="text-ink/70 mb-4">Connect your wallet to create an escrow.</p>
        <button onClick={connect} className="bg-seal text-parchment rounded px-4 py-2">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="pt-8 sm:pt-12 max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-1">Create Escrow</h1>
      <p className="text-ink/60 mb-6">Fund 2–4 milestones for a freelancer. Full amount locks now.</p>

      {formError && (
        <div className="mb-4">
          <ErrorBanner error={formError} onDismiss={() => setFormError(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="ledger-card rounded-lg p-5 sm:p-6 space-y-5">
        <div>
          <label className="text-sm text-ink/70">Freelancer Address</label>
          <input
            required
            value={freelancer}
            onChange={(e) => setFreelancer(e.target.value)}
            placeholder="G..."
            className="mt-1 w-full border border-hairline rounded px-3 py-2 bg-white font-mono text-sm"
          />
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                required
                value={row.title}
                onChange={(e) => updateRow(i, { title: e.target.value })}
                placeholder={`Milestone ${i + 1} title`}
                className="flex-1 border border-hairline rounded px-3 py-2 bg-white text-sm"
              />
              <input
                required
                type="number"
                step="0.0000001"
                min="0.0000001"
                value={row.amount}
                onChange={(e) => updateRow(i, { amount: e.target.value })}
                placeholder="XLM"
                className="w-28 border border-hairline rounded px-3 py-2 bg-white text-sm font-mono"
              />
              {rows.length > 2 && (
                <button type="button" onClick={() => removeRow(i)} className="text-ink/40 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {rows.length < 4 && (
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-sm text-forest hover:underline"
          >
            <Plus size={14} /> Add milestone
          </button>
        )}

        <div className="hairline pt-4 flex justify-between items-center">
          <span className="text-ink/70">Total</span>
          <span className="font-mono text-lg text-seal">{total.toFixed(7)} XLM</span>
        </div>

        <button
          type="submit"
          disabled={tx.status === 'pending'}
          className="w-full bg-seal text-parchment rounded px-4 py-2.5 font-medium hover:bg-sealDark transition-colors disabled:opacity-60"
        >
          {tx.status === 'pending' ? 'Submitting…' : 'Create & Fund Escrow'}
        </button>
      </form>

      <TxStatusToast state={tx} onDismiss={() => setTx({ status: 'idle' })} />
    </div>
  );
}
